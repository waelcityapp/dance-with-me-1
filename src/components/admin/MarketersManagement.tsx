import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, Ban, Copy, Search, UserCheck, Users, X } from 'lucide-react';
import { doc, setDoc } from 'firebase/firestore';
import { useApp } from '../../context/AppContext';
import { db, subscribeToAllUsers } from '../../lib/firebase';
import { ensureAccountReference } from '../../lib/accountReferenceBootstrap';
import { MarketerStatus, MarketerWalletStatus, UserProfile } from '../../types';

interface MarketersManagementProps {
  onBack: () => void;
}

const normalize = (value?: string) => (value || '').trim().toLowerCase();
const normalizeSearch = (value?: string) => normalize(value).replace(/[\s-]/g, '');
const OWNER_REFERENCE = 'CE1000';
const FIRST_ACCOUNT_NUMBER = 10001;
const isOfficialReference = (value?: string) => /^CE\d{5,}$/.test(String(value || '').trim());
const getReferenceNumber = (value?: string) => {
  const match = String(value || '').trim().match(/^CE-?(\d{5,})$/);
  return match ? Number(match[1]) : null;
};

const createMarketingCode = (users: UserProfile[]) => {
  const existing = new Set(users.map((u) => normalize(u.marketerCode)));
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

  for (let attempt = 0; attempt < 20; attempt += 1) {
    let suffix = '';
    for (let i = 0; i < 6; i += 1) {
      suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    const code = `CE-${suffix}`;
    if (!existing.has(code.toLowerCase())) return code;
  }

  return `CE-${Date.now().toString(36).slice(-7).toUpperCase()}`;
};

type StatusDecision = {
  target: UserProfile;
  marketerStatus: Exclude<MarketerStatus, 'active'>;
};

const findOwnerIndex = (items: UserProfile[], adminUser: UserProfile | null) => {
  if (!adminUser) return -1;
  const byId = items.findIndex((item) => item.id === adminUser.id);
  if (byId >= 0) return byId;

  const adminEmail = normalize(adminUser.email);
  if (adminEmail) {
    const byEmail = items.findIndex((item) => normalize(item.email) === adminEmail);
    if (byEmail >= 0) return byEmail;
  }

  const adminIndexes = items
    .map((item, index) => item.isAdmin ? index : -1)
    .filter((index) => index >= 0);
  return adminIndexes.length === 1 ? adminIndexes[0] : -1;
};

export const MarketersManagement: React.FC<MarketersManagementProps> = ({ onBack }) => {
  const { lang, user: adminUser } = useApp();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [statusDecision, setStatusDecision] = useState<StatusDecision | null>(null);
  const [walletStatus, setWalletStatus] = useState<MarketerWalletStatus>('active');
  const [statusReason, setStatusReason] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const migrationStarted = useRef(false);

  useEffect(() => {
    const unsubscribe = subscribeToAllUsers(
      (items) => {
        const nextUsers = [...(items || [])];

        if (adminUser?.isAdmin) {
          const ownerIndex = findOwnerIndex(nextUsers, adminUser);
          if (ownerIndex >= 0) {
            const storedOwner = nextUsers[ownerIndex];
            nextUsers[ownerIndex] = {
              ...storedOwner,
              name: adminUser.name || storedOwner.name,
              email: adminUser.email || storedOwner.email,
              phone: adminUser.phone || storedOwner.phone,
              avatar: adminUser.avatar || storedOwner.avatar,
              isAdmin: true,
              accountReference: OWNER_REFERENCE,
            };
          } else {
            nextUsers.unshift({
              ...adminUser,
              accountReference: OWNER_REFERENCE,
            });
          }
        }

        setUsers(nextUsers);
        setLoading(false);
      },
      () => {
        setLoading(false);
        setMessage(lang === 'ar' ? 'تعذر تحميل المستخدمين حالياً.' : 'Unable to load users right now.');
      }
    );
    return unsubscribe;
  }, [lang, adminUser?.id, adminUser?.email, adminUser?.name, adminUser?.phone, adminUser?.avatar, adminUser?.isAdmin]);

  useEffect(() => {
    if (!adminUser?.isAdmin || !adminUser.id || loading || users.length === 0 || migrationStarted.current) return;

    const ownerIndex = findOwnerIndex(users, adminUser);
    const ownerInList = ownerIndex >= 0 ? users[ownerIndex] : null;
    const ownerDocumentId = ownerInList?.id || adminUser.id;

    const needsMigration = users.some((item) => {
      if (item === ownerInList) return item.accountReference !== OWNER_REFERENCE;
      const current = String(item.accountReference || '').trim();
      return !isOfficialReference(current);
    });

    if (!needsMigration && ownerInList?.accountReference === OWNER_REFERENCE) return;
    migrationStarted.current = true;

    const migrateExistingUsers = async () => {
      setMessage(lang === 'ar'
        ? 'جاري تحديث أرقام الحسابات إلى الصيغة الجديدة بدون شرطة...'
        : 'Updating account numbers to the new dashless format...');

      let updatedCount = 0;
      const failedAccounts: string[] = [];

      try {
        await setDoc(doc(db, 'users', ownerDocumentId), {
          accountReference: OWNER_REFERENCE,
          accountReferenceCreatedAt: ownerInList?.accountReference ? (ownerInList as any).accountReferenceCreatedAt || new Date().toISOString() : new Date().toISOString(),
          accountReferenceUpdatedAt: new Date().toISOString(),
          isAdmin: true,
        }, { merge: true });
        if (ownerInList?.accountReference !== OWNER_REFERENCE) updatedCount += 1;
      } catch (error) {
        console.error('Failed to reserve owner account reference:', error);
        failedAccounts.push(adminUser.name || adminUser.email || adminUser.id);
      }

      const sortedUsers = [...users]
        .filter((item) => item !== ownerInList && item.id !== ownerDocumentId)
        .sort((a, b) => {
          const aTime = new Date(a.createdAt || 0).getTime();
          const bTime = new Date(b.createdAt || 0).getTime();
          return aTime - bTime;
        });

      const existingNumbers = sortedUsers
        .map((item) => getReferenceNumber(item.accountReference) || 0)
        .filter((value) => Number.isFinite(value) && value >= FIRST_ACCOUNT_NUMBER);

      let lastNumber = existingNumbers.length > 0
        ? Math.max(...existingNumbers)
        : FIRST_ACCOUNT_NUMBER - 1;

      for (const item of sortedUsers) {
        const current = String(item.accountReference || '').trim();
        if (isOfficialReference(current)) continue;

        const existingNumber = getReferenceNumber(current);
        const numberToUse = existingNumber ?? (lastNumber + 1);
        const accountReference = `CE${numberToUse}`;

        try {
          await setDoc(doc(db, 'users', item.id), {
            accountReference,
            accountReferenceCreatedAt: (item as any).accountReferenceCreatedAt || new Date().toISOString(),
            accountReferenceUpdatedAt: new Date().toISOString(),
          }, { merge: true });
          lastNumber = Math.max(lastNumber, numberToUse);
          updatedCount += 1;
        } catch (error) {
          console.error(`Failed to migrate account reference for ${item.id}:`, error);
          failedAccounts.push(item.name || item.email || item.id);
        }
      }

      try {
        await setDoc(doc(db, 'system_counters', 'user_account_reference'), {
          lastNumber: Math.max(lastNumber, FIRST_ACCOUNT_NUMBER - 1),
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (error) {
        console.error('Failed to update account reference counter:', error);
        failedAccounts.push(lang === 'ar' ? 'عداد الأرقام' : 'account counter');
      }

      if (failedAccounts.length === 0) {
        setMessage(lang === 'ar'
          ? `تم تحديث أرقام الحسابات بنجاح (${updatedCount} تحديث). رقم صاحب التطبيق CE1000.`
          : `Account numbers updated successfully (${updatedCount} updates). Owner number is CE1000.`);
      } else {
        setMessage(lang === 'ar'
          ? `تم تحديث معظم الحسابات (${updatedCount} تحديث)، وتعذر تحديث ${failedAccounts.length} فقط.`
          : `Most accounts were updated (${updatedCount} updates); only ${failedAccounts.length} updates failed.`);
        migrationStarted.current = false;
      }
    };

    void migrateExistingUsers();
  }, [adminUser, lang, loading, users]);

  const filteredUsers = useMemo(() => {
    const q = normalizeSearch(query);
    const sorted = [...users].sort((a, b) => {
      const aOwner = adminUser && findOwnerIndex([a], adminUser) === 0 ? 1 : 0;
      const bOwner = adminUser && findOwnerIndex([b], adminUser) === 0 ? 1 : 0;
      if (aOwner !== bOwner) return bOwner - aOwner;

      const aMarketer = a.isMarketer ? 1 : 0;
      const bMarketer = b.isMarketer ? 1 : 0;
      if (aMarketer !== bMarketer) return bMarketer - aMarketer;
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    if (!q) return sorted;
    return sorted.filter((item) => {
      const values = [
        item.id,
        item.name,
        item.email,
        item.phone,
        item.marketerCode,
        item.accountReference,
      ];
      return values.some((value) => normalizeSearch(value).includes(q));
    });
  }, [query, users, adminUser]);

  const activeMarketers = users.filter((item) => item.isMarketer && item.marketerStatus === 'active').length;
  const pausedMarketers = users.filter((item) => item.isMarketer && item.marketerStatus === 'paused').length;

  const updateMarketer = async (
    target: UserProfile,
    mode: 'activate' | 'pause' | 'remove',
    decision?: { walletStatus: MarketerWalletStatus; reason: string; message: string },
  ) => {
    if (!adminUser?.isAdmin || actionUserId) return;
    setActionUserId(target.id);
    setMessage(null);

    try {
      const ref = doc(db, 'users', target.id);
      if (mode === 'activate') {
        const marketerCode = target.marketerCode || createMarketingCode(users);
        const accountReference = target.accountReference || await ensureAccountReference(target.id, target.email);

        if (!accountReference) {
          throw new Error('Could not assign account reference');
        }

        await setDoc(ref, {
          isMarketer: true,
          marketerStatus: 'active',
          marketerCode,
          marketerActivatedAt: target.marketerActivatedAt || new Date().toISOString(),
          marketerUpdatedAt: new Date().toISOString(),
          marketerStatusReason: '',
          marketerStatusMessage: '',
          marketerStatusChangedAt: new Date().toISOString(),
          marketerWalletStatus: 'active',
          marketerWalletReason: '',
          marketerWalletUpdatedAt: new Date().toISOString(),
        }, { merge: true });
        setMessage(lang === 'ar' ? `تم تفعيل ${target.name || target.email} كمسوّق.` : `${target.name || target.email} is now an active marketer.`);
      } else if (mode === 'pause') {
        await setDoc(ref, {
          isMarketer: true,
          marketerStatus: 'paused',
          marketerUpdatedAt: new Date().toISOString(),
          marketerStatusReason: decision?.reason || '',
          marketerStatusMessage: decision?.message || '',
          marketerStatusChangedAt: new Date().toISOString(),
          marketerWalletStatus: decision?.walletStatus || 'active',
          marketerWalletReason: decision?.reason || '',
          marketerWalletUpdatedAt: new Date().toISOString(),
        }, { merge: true });
        setMessage(lang === 'ar' ? 'تم إيقاف حساب المسوّق مؤقتاً.' : 'Marketer account paused.');
      } else {
        await setDoc(ref, {
          isMarketer: false,
          marketerStatus: 'inactive',
          marketerUpdatedAt: new Date().toISOString(),
          marketerStatusReason: decision?.reason || '',
          marketerStatusMessage: decision?.message || '',
          marketerStatusChangedAt: new Date().toISOString(),
          marketerWalletStatus: decision?.walletStatus || 'closed',
          marketerWalletReason: decision?.reason || '',
          marketerWalletUpdatedAt: new Date().toISOString(),
        }, { merge: true });
        setMessage(lang === 'ar' ? 'تم إلغاء صفة المسوّق وإعادة الحساب كمستخدم عادي.' : 'Marketer access removed; account is a normal user again.');
      }
    } catch (error) {
      console.error('Failed to update marketer account:', error);
      setMessage(lang === 'ar' ? 'حدث خطأ أثناء تحديث حساب المسوّق.' : 'Failed to update marketer account.');
    } finally {
      setActionUserId(null);
    }
  };

  const openStatusDecision = (target: UserProfile, marketerStatus: Exclude<MarketerStatus, 'active'>) => {
    setStatusDecision({ target, marketerStatus });
    setWalletStatus(marketerStatus === 'paused' ? 'active' : 'closed');
    setStatusReason('');
    setStatusMessage('');
  };

  const submitStatusDecision = async () => {
    if (!statusDecision || !statusReason.trim()) return;
    const mode = statusDecision.marketerStatus === 'paused' ? 'pause' : 'remove';
    await updateMarketer(statusDecision.target, mode, {
      walletStatus,
      reason: statusReason.trim(),
      message: statusMessage.trim(),
    });
    setStatusDecision(null);
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(lang === 'ar' ? 'تم النسخ.' : 'Copied.');
    } catch {
      setMessage(lang === 'ar' ? 'تعذر النسخ تلقائياً.' : 'Could not copy automatically.');
    }
  };

  if (!adminUser?.isAdmin) return null;

  return (
    <section className="space-y-5 animate-fadeIn" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="rounded-3xl border border-amber-500/25 bg-white dark:bg-neutral-900 p-4 sm:p-6 shadow-lg">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="h-10 w-10 shrink-0 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              aria-label={lang === 'ar' ? 'رجوع' : 'Back'}
            >
              {lang === 'ar' ? <ArrowRight className="h-5 w-5" /> : <ArrowLeft className="h-5 w-5" />}
            </button>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 dark:text-white">
                {lang === 'ar' ? 'قسم المسوقين' : 'Marketers Section'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                {lang === 'ar'
                  ? 'ابحث عن أي مستخدم وحوّله إلى مسوّق أو أوقفه أو ألغِ صفة المسوّق بدون تغيير نوع اشتراكه.'
                  : 'Find any user and activate, pause, or remove marketer access without changing their subscription tier.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-center">
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{activeMarketers}</div>
              <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">{lang === 'ar' ? 'مسوّق نشط' : 'Active'}</div>
            </div>
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 px-4 py-2.5 text-center">
              <div className="text-lg font-black text-amber-600 dark:text-amber-400">{pausedMarketers}</div>
              <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">{lang === 'ar' ? 'موقوف مؤقتاً' : 'Paused'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-sm">
        <div className="relative">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 ${lang === 'ar' ? 'right-4' : 'left-4'}`} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={lang === 'ar' ? 'ابحث بالاسم، الهاتف، البريد، رقم الحساب أو كود المسوّق...' : 'Search name, phone, email, account ID or marketer code...'}
            className={`w-full h-12 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 text-sm outline-none focus:ring-2 focus:ring-amber-500/30 ${lang === 'ar' ? 'pr-11 pl-4' : 'pl-11 pr-4'}`}
          />
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-[11px] text-neutral-500 dark:text-neutral-400">
          <span>{lang === 'ar' ? `${filteredUsers.length} حساب` : `${filteredUsers.length} accounts`}</span>
          <span>{lang === 'ar' ? 'المعرّف الداخلي يظل مخفياً عن المستخدم' : 'Internal user ID remains admin-only'}</span>
        </div>
      </div>

      {message && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-700 dark:text-amber-300">
          {message}
        </div>
      )}

      {loading ? (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-10 text-center text-sm text-neutral-500">
          {lang === 'ar' ? 'جاري تحميل المستخدمين...' : 'Loading users...'}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-10 text-center">
          <Users className="mx-auto h-8 w-8 text-neutral-400" />
          <p className="mt-3 text-sm font-bold text-neutral-600 dark:text-neutral-300">{lang === 'ar' ? 'لا توجد نتائج مطابقة.' : 'No matching users.'}</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredUsers.map((item) => {
            const isActive = item.isMarketer && item.marketerStatus === 'active';
            const isPaused = item.isMarketer && item.marketerStatus === 'paused';
            const hasMarketerHistory = item.isMarketer || Boolean(item.marketerCode);
            const isInactive = hasMarketerHistory && item.marketerStatus === 'inactive';
            const busy = actionUserId === item.id;

            return (
              <article key={`${item.id}-${item.email || ''}`} className="rounded-3xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 shadow-sm">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="min-w-0 flex items-start gap-3">
                    <div className="h-11 w-11 shrink-0 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                      {item.avatar ? <img src={item.avatar} alt="" className="h-full w-full object-cover" /> : <Users className="h-5 w-5 text-neutral-400" />}
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-neutral-900 dark:text-white truncate">{item.name || (lang === 'ar' ? 'بدون اسم' : 'Unnamed')}</h3>
                        {item.isAdmin && <span className="rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 text-[10px] font-black">{lang === 'ar' ? 'صاحب التطبيق' : 'Platform owner'}</span>}
                        {isActive && <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-black">{lang === 'ar' ? 'مسوّق نشط' : 'Active marketer'}</span>}
                        {isPaused && <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 text-[10px] font-black">{lang === 'ar' ? 'مسوّق موقوف' : 'Paused marketer'}</span>}
                        {isInactive && <span className="rounded-full bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 text-[10px] font-black">{lang === 'ar' ? 'إيقاف نهائي' : 'Permanently inactive'}</span>}
                        {hasMarketerHistory && item.marketerWalletStatus && item.marketerWalletStatus !== 'active' && (
                          <span className="rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-300 px-2 py-0.5 text-[10px] font-black">
                            {item.marketerWalletStatus === 'frozen'
                              ? (lang === 'ar' ? 'الرصيد مجمّد' : 'Balance frozen')
                              : item.marketerWalletStatus === 'closed'
                                ? (lang === 'ar' ? 'المحفظة مغلقة' : 'Wallet closed')
                                : (lang === 'ar' ? 'السحب متوقف' : 'Withdrawals paused')}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 grid gap-0.5 text-xs text-neutral-500 dark:text-neutral-400 break-all">
                        <span>{item.phone || '—'} · {item.email || '—'}</span>
                        <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                          {lang === 'ar' ? 'رقم الحساب:' : 'Account ref:'} {item.accountReference || (lang === 'ar' ? 'جاري الإنشاء...' : 'Assigning...')}
                        </span>
                        <span className="font-mono text-[10px] opacity-70">ID: {item.id}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    {item.marketerCode && (
                      <button
                        type="button"
                        onClick={() => copyText(item.marketerCode || '')}
                        className="h-10 rounded-xl border border-neutral-200 dark:border-neutral-700 px-3 text-xs font-black flex items-center gap-2 bg-neutral-50 dark:bg-neutral-800"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {item.marketerCode}
                      </button>
                    )}

                    {!isActive && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => updateMarketer(item, 'activate')}
                        className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 text-xs font-black flex items-center gap-2 transition-colors"
                      >
                        <UserCheck className="h-4 w-4" />
                        {hasMarketerHistory ? (lang === 'ar' ? 'إعادة التفعيل' : 'Reactivate') : (lang === 'ar' ? 'تحويل إلى مسوّق' : 'Make marketer')}
                      </button>
                    )}

                    {isActive && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openStatusDecision(item, 'paused')}
                        className="h-10 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-neutral-950 px-3 text-xs font-black flex items-center gap-2 transition-colors"
                      >
                        <Ban className="h-4 w-4" />
                        {lang === 'ar' ? 'إيقاف مؤقت' : 'Pause'}
                      </button>
                    )}

                    {item.isMarketer && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openStatusDecision(item, 'inactive')}
                        className="h-10 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/15 disabled:opacity-50 text-red-600 dark:text-red-400 px-3 text-xs font-black flex items-center gap-2 transition-colors"
                      >
                        <BadgeCheck className="h-4 w-4" />
                        {lang === 'ar' ? 'إلغاء صفة المسوّق' : 'Remove marketer'}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {statusDecision && (
        <div className="fixed inset-0 z-[100] bg-black/65 p-4 flex items-center justify-center" role="dialog" aria-modal="true" aria-labelledby="marketer-status-title">
          <div className="w-full max-w-lg rounded-3xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 p-5 sm:p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="marketer-status-title" className="text-lg font-black text-neutral-900 dark:text-white">
                  {statusDecision.marketerStatus === 'paused'
                    ? (lang === 'ar' ? 'إيقاف المسوق مؤقتًا' : 'Pause marketer')
                    : (lang === 'ar' ? 'إيقاف المسوق نهائيًا' : 'Deactivate marketer')}
                </h2>
                <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">{statusDecision.target.name || statusDecision.target.email}</p>
              </div>
              <button type="button" onClick={() => setStatusDecision(null)} className="h-9 w-9 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-center" aria-label={lang === 'ar' ? 'إغلاق' : 'Close'}>
                <X className="h-4 w-4" />
              </button>
            </div>

            <label className="mt-5 block text-sm font-black text-neutral-800 dark:text-neutral-200">
              {lang === 'ar' ? 'حالة المحفظة والسحب' : 'Wallet and withdrawal status'}
              <select value={walletStatus} onChange={(event) => setWalletStatus(event.target.value as MarketerWalletStatus)} className="mt-2 h-12 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-3 text-sm">
                <option value="active">{lang === 'ar' ? 'المحفظة طبيعية والسحب مسموح' : 'Wallet active; withdrawals allowed'}</option>
                <option value="withdrawals_paused">{lang === 'ar' ? 'إيقاف طلبات السحب مؤقتًا' : 'Withdrawals temporarily paused'}</option>
                <option value="frozen">{lang === 'ar' ? 'تجميد الرصيد للمراجعة' : 'Balance frozen for review'}</option>
                <option value="closed">{lang === 'ar' ? 'المحفظة مغلقة نهائيًا' : 'Wallet permanently closed'}</option>
              </select>
            </label>

            <label className="mt-4 block text-sm font-black text-neutral-800 dark:text-neutral-200">
              {lang === 'ar' ? 'سبب القرار (إلزامي)' : 'Decision reason (required)'}
              <input value={statusReason} onChange={(event) => setStatusReason(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 px-3 text-sm" placeholder={lang === 'ar' ? 'مثال: مراجعة بيانات الحساب' : 'Example: account review'} />
            </label>

            <label className="mt-4 block text-sm font-black text-neutral-800 dark:text-neutral-200">
              {lang === 'ar' ? 'رسالة الإدارة للمسوق' : 'Administration message'}
              <textarea value={statusMessage} onChange={(event) => setStatusMessage(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-950 p-3 text-sm resize-none" placeholder={lang === 'ar' ? 'اكتب التعليمات أو طريقة التواصل لإعادة المراجعة...' : 'Add instructions or review contact details...'} />
            </label>

            <div className="mt-5 flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
              <button type="button" onClick={() => setStatusDecision(null)} className="h-11 rounded-xl border border-neutral-200 dark:border-neutral-700 px-5 text-sm font-black">{lang === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button type="button" disabled={!statusReason.trim() || Boolean(actionUserId)} onClick={() => void submitStatusDecision()} className="h-11 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 px-5 text-sm font-black text-neutral-950">
                {lang === 'ar' ? 'حفظ القرار' : 'Save decision'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
