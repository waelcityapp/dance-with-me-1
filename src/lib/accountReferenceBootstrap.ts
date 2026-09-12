import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

const LOCAL_USER_KEY = 'dwm_user_v1';
const OWNER_ACCOUNT_REFERENCE = 'CE1000';
const ADMIN_EMAIL = (((import.meta as any).env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase()) || 'waelvts@gmail.com';

const completedUserIds = new Set<string>();
const inFlightUserIds = new Set<string>();
let legacyBackfillStarted = false;
let liveUserId: string | null = null;
let stopLiveUserSync: (() => void) | null = null;

const isNumberedReference = (value?: string) => /^CE\d{5,}$/.test(String(value || '').trim());
const getLegacyNumber = (value?: string) => {
  const match = String(value || '').trim().match(/^CE-(\d{5,})$/);
  return match ? Number(match[1]) : null;
};
const isOwner = (email?: string) => String(email || '').trim().toLowerCase() === ADMIN_EMAIL;

export async function ensureAccountReference(userId: string, email?: string): Promise<string | null> {
  const cleanUserId = String(userId || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();
  if (!cleanUserId) return null;

  if (inFlightUserIds.has(cleanUserId)) return null;
  inFlightUserIds.add(cleanUserId);

  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;
    const token = await currentUser.getIdToken();
    const response = await fetch('/api/account-reference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ userId: cleanUserId }),
    });
    if (!response.ok) throw new Error(`ACCOUNT_REFERENCE_${response.status}`);
    const result = await response.json();
    const accountReference = String(result.accountReference || '').trim() || null;

    completedUserIds.add(cleanUserId);
    syncCachedReference(cleanUserId, accountReference);
    scheduleProfileBadgeRender();
    return accountReference;
  } catch (error) {
    console.warn('Unable to assign CityEve account reference:', error);
    return null;
  } finally {
    inFlightUserIds.delete(cleanUserId);
  }
}

function readCachedUser(): any | null {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedUser(nextUser: any) {
  try {
    localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(nextUser));
  } catch {
    // Firestore remains the source of truth.
  }
}

function syncCachedReference(userId: string, accountReference: string | null) {
  if (!accountReference) return;
  const cachedUser = readCachedUser();
  if (cachedUser?.id === userId && cachedUser.accountReference !== accountReference) {
    writeCachedUser({ ...cachedUser, accountReference });
  }
}

function ensureLiveUserSync(userId: string) {
  const cleanUserId = String(userId || '').trim();
  if (!cleanUserId || liveUserId === cleanUserId) return;

  if (stopLiveUserSync) stopLiveUserSync();
  liveUserId = cleanUserId;

  stopLiveUserSync = onSnapshot(
    doc(db, 'users', cleanUserId),
    (snapshot) => {
      if (!snapshot.exists()) return;
      const firestoreUser = snapshot.data();
      const cachedUser = readCachedUser();
      if (!cachedUser || cachedUser.id !== cleanUserId) return;

      const nextUser = {
        ...cachedUser,
        accountReference: firestoreUser.accountReference ?? cachedUser.accountReference,
        isMarketer: firestoreUser.isMarketer === true,
        marketerStatus: firestoreUser.marketerStatus || 'inactive',
        marketerCode: firestoreUser.marketerCode ?? cachedUser.marketerCode,
        marketerActivatedAt: firestoreUser.marketerActivatedAt ?? cachedUser.marketerActivatedAt,
        marketerUpdatedAt: firestoreUser.marketerUpdatedAt ?? cachedUser.marketerUpdatedAt,
        marketerStatusReason: firestoreUser.marketerStatusReason ?? cachedUser.marketerStatusReason,
        marketerStatusMessage: firestoreUser.marketerStatusMessage ?? cachedUser.marketerStatusMessage,
        marketerStatusChangedAt: firestoreUser.marketerStatusChangedAt ?? cachedUser.marketerStatusChangedAt,
        marketerWalletStatus: firestoreUser.marketerWalletStatus ?? cachedUser.marketerWalletStatus,
        marketerWalletReason: firestoreUser.marketerWalletReason ?? cachedUser.marketerWalletReason,
        marketerWalletUpdatedAt: firestoreUser.marketerWalletUpdatedAt ?? cachedUser.marketerWalletUpdatedAt,
      };

      const changed =
        nextUser.accountReference !== cachedUser.accountReference ||
        nextUser.isMarketer !== cachedUser.isMarketer ||
        nextUser.marketerStatus !== cachedUser.marketerStatus ||
        nextUser.marketerCode !== cachedUser.marketerCode ||
        nextUser.marketerStatusReason !== cachedUser.marketerStatusReason ||
        nextUser.marketerStatusMessage !== cachedUser.marketerStatusMessage ||
        nextUser.marketerWalletStatus !== cachedUser.marketerWalletStatus ||
        nextUser.marketerWalletReason !== cachedUser.marketerWalletReason ||
        nextUser.marketerUpdatedAt !== cachedUser.marketerUpdatedAt;

      if (changed) writeCachedUser(nextUser);
      scheduleProfileBadgeRender();
    },
    (error) => console.warn('Unable to sync current CityEve user status:', error)
  );
}

const ensureCachedUserReference = () => {
  const cachedUser = readCachedUser();
  if (!cachedUser) return;

  const id = String(cachedUser?.id || '').trim();
  const email = String(cachedUser?.email || '').trim().toLowerCase();
  const current = String(cachedUser?.accountReference || '').trim();
  if (!id) return;

  ensureLiveUserSync(id);

  if (isOwner(email)) void backfillLegacyUsers();

  const alreadyCorrect = isOwner(email)
    ? current === OWNER_ACCOUNT_REFERENCE
    : isNumberedReference(current);

  if (completedUserIds.has(id) || alreadyCorrect) {
    scheduleProfileBadgeRender();
    return;
  }

  void ensureAccountReference(id, email);
};

async function backfillLegacyUsers() {
  // Full legacy backfill must be initiated by a protected Backend administration action.
  legacyBackfillStarted = true;
}

function ensureWalletTab(hasMarketerHistory: boolean, lang: 'ar' | 'en') {
  const existing = document.querySelector('[data-cityeve-wallet-tab]') as HTMLButtonElement | null;
  if (!hasMarketerHistory) {
    if (existing) existing.remove();
    return;
  }

  if (existing) {
    const label = existing.querySelector('[data-cityeve-wallet-label]');
    if (label) label.textContent = lang === 'ar' ? 'محفظتي' : 'My Wallet';
    return;
  }

  const buttons = Array.from(document.querySelectorAll('button')) as HTMLButtonElement[];
  const adsButton = buttons.find((button) => {
    const text = button.textContent || '';
    return text.includes('إعلاناتي VIP') || text.includes('My Ads');
  });
  const tabsRow = adsButton?.parentElement;
  if (!tabsRow) return;

  const walletButton = document.createElement('button');
  walletButton.type = 'button';
  walletButton.setAttribute('data-cityeve-wallet-tab', 'true');
  walletButton.className = 'shrink-0 snap-start flex items-center gap-2 px-4 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-neutral-950';
  walletButton.innerHTML = `<span aria-hidden="true">💰</span><span data-cityeve-wallet-label>${lang === 'ar' ? 'محفظتي' : 'My Wallet'}</span>`;
  walletButton.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('OPEN_MARKETER_WALLET'));
  });

  adsButton.insertAdjacentElement('afterend', walletButton);
}

function renderProfileBadge() {
  try {
    const cachedUser = readCachedUser();
    if (!cachedUser) return;
    const name = String(cachedUser?.name || '').trim();
    const reference = String(cachedUser?.accountReference || '').trim();
    if (!name || !reference) return;

    const lang: 'ar' | 'en' = document.documentElement.lang === 'en' ? 'en' : 'ar';
    const marketerStatus = cachedUser?.marketerStatus || 'inactive';
    const hasMarketerHistory = cachedUser?.isMarketer === true || Boolean(cachedUser?.marketerCode);
    const isActiveMarketer = hasMarketerHistory && marketerStatus === 'active';
    ensureWalletTab(hasMarketerHistory, lang);

    const headings = Array.from(document.querySelectorAll('main h2')) as HTMLHeadingElement[];
    const nameHeading = headings.find((heading) => heading.textContent?.trim() === name);
    if (!nameHeading || !nameHeading.parentElement) return;

    const nameRow = nameHeading.parentElement;
    const container = nameRow.parentElement;
    if (!container) return;

    const accountLabel = lang === 'ar' ? 'رقم حسابك' : 'Your account number';

    let accountBadge = container.querySelector('[data-cityeve-account-reference]') as HTMLElement | null;
    if (!accountBadge) {
      accountBadge = document.createElement('div');
      accountBadge.setAttribute('data-cityeve-account-reference', 'true');
      accountBadge.setAttribute('dir', 'ltr');
      accountBadge.style.display = 'inline-flex';
      accountBadge.style.alignItems = 'center';
      accountBadge.style.justifyContent = 'center';
      accountBadge.style.width = 'fit-content';
      accountBadge.style.marginBottom = '10px';
      accountBadge.style.padding = '6px 12px';
      accountBadge.style.borderRadius = '10px';
      accountBadge.style.border = '1px solid rgba(245, 158, 11, 0.35)';
      accountBadge.style.background = 'rgba(245, 158, 11, 0.10)';
      accountBadge.style.color = '#fbbf24';
      accountBadge.style.fontSize = '13px';
      accountBadge.style.fontWeight = '800';
      accountBadge.style.letterSpacing = '0.02em';
      accountBadge.style.fontFamily = 'monospace';
      nameRow.insertAdjacentElement('afterend', accountBadge);
    }
    accountBadge.textContent = `${accountLabel}: ${reference}`;

    let marketerBadge = container.querySelector('[data-cityeve-marketer-status]') as HTMLElement | null;
    let marketerHint = container.querySelector('[data-cityeve-marketer-hint]') as HTMLElement | null;

    if (hasMarketerHistory) {
      if (!marketerBadge) {
        marketerBadge = document.createElement('div');
        marketerBadge.setAttribute('data-cityeve-marketer-status', 'true');
        marketerBadge.style.display = 'inline-flex';
        marketerBadge.style.alignItems = 'center';
        marketerBadge.style.gap = '7px';
        marketerBadge.style.width = 'fit-content';
        marketerBadge.style.marginBottom = '6px';
        marketerBadge.style.padding = '7px 12px';
        marketerBadge.style.borderRadius = '11px';
        marketerBadge.style.fontSize = '13px';
        marketerBadge.style.fontWeight = '800';
        marketerBadge.style.lineHeight = '1.35';
        accountBadge.insertAdjacentElement('afterend', marketerBadge);
      }
      const statusAppearance = isActiveMarketer
        ? { border: 'rgba(16, 185, 129, 0.35)', background: 'rgba(16, 185, 129, 0.12)', color: '#6ee7b7' }
        : marketerStatus === 'paused'
          ? { border: 'rgba(245, 158, 11, 0.35)', background: 'rgba(245, 158, 11, 0.12)', color: '#fbbf24' }
          : { border: 'rgba(239, 68, 68, 0.35)', background: 'rgba(239, 68, 68, 0.12)', color: '#f87171' };
      marketerBadge.style.border = `1px solid ${statusAppearance.border}`;
      marketerBadge.style.background = statusAppearance.background;
      marketerBadge.style.color = statusAppearance.color;
      marketerBadge.textContent = isActiveMarketer
        ? (lang === 'ar' ? '✓ أنت الآن مسوّق معتمد في CityEve' : '✓ You’re now a verified CityEve marketer')
        : marketerStatus === 'paused'
          ? (lang === 'ar' ? 'حساب التسويق موقوف مؤقتًا' : 'Marketing account temporarily paused')
          : (lang === 'ar' ? 'حساب التسويق موقوف نهائيًا' : 'Marketing account permanently inactive');
      marketerBadge.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');

      if (!marketerHint) {
        marketerHint = document.createElement('div');
        marketerHint.setAttribute('data-cityeve-marketer-hint', 'true');
        marketerHint.style.width = 'fit-content';
        marketerHint.style.marginBottom = '10px';
        marketerHint.style.color = '#a3a3a3';
        marketerHint.style.fontSize = '11px';
        marketerHint.style.fontWeight = '600';
        marketerBadge.insertAdjacentElement('afterend', marketerHint);
      }
      marketerHint.textContent = isActiveMarketer
        ? (lang === 'ar' ? 'يمكنك الآن استخدام كودك التسويقي ومتابعة أرباحك من قسم المحفظة.' : 'You can now use your marketing code and track earnings from My Wallet.')
        : (lang === 'ar' ? 'يمكنك فتح محفظتك لمعرفة حالة الرصيد وقرار الإدارة.' : 'Open My Wallet to review your balance status and the administration decision.');
      marketerHint.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    } else {
      if (marketerBadge) marketerBadge.remove();
      if (marketerHint) marketerHint.remove();
    }
  } catch {
    // UI enhancement only; never block the profile if the DOM is not ready yet.
  }
}

let badgeTimer: number | null = null;
function scheduleProfileBadgeRender() {
  if (badgeTimer) window.clearTimeout(badgeTimer);
  badgeTimer = window.setTimeout(renderProfileBadge, 80);
}

onAuthStateChanged(auth, (firebaseUser) => {
  if (!firebaseUser?.uid) return;
  const email = String(firebaseUser.email || '').trim().toLowerCase();
  ensureLiveUserSync(firebaseUser.uid);
  void ensureAccountReference(firebaseUser.uid, email);
  if (isOwner(email)) void backfillLegacyUsers();
});

ensureCachedUserReference();
window.setInterval(ensureCachedUserReference, 5000);

const observer = new MutationObserver(scheduleProfileBadgeRender);
observer.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('click', () => scheduleProfileBadgeRender());
