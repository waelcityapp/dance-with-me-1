import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDocs, onSnapshot, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';

const COUNTER_COLLECTION = 'system_counters';
const COUNTER_DOCUMENT = 'user_account_reference';
const FIRST_ACCOUNT_NUMBER = 10001;
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
    const userRef = doc(db, 'users', cleanUserId);
    const counterRef = doc(db, COUNTER_COLLECTION, COUNTER_DOCUMENT);

    const accountReference = await runTransaction(db, async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      const storedEmail = userSnapshot.exists()
        ? String(userSnapshot.data()?.email || '').trim().toLowerCase()
        : '';
      const effectiveEmail = cleanEmail || storedEmail;
      const currentReference = userSnapshot.exists()
        ? String(userSnapshot.data()?.accountReference || '').trim()
        : '';

      if (isOwner(effectiveEmail)) {
        if (currentReference !== OWNER_ACCOUNT_REFERENCE) {
          transaction.set(userRef, {
            id: cleanUserId,
            accountReference: OWNER_ACCOUNT_REFERENCE,
            accountReferenceCreatedAt: userSnapshot.data()?.accountReferenceCreatedAt || new Date().toISOString(),
            accountReferenceUpdatedAt: new Date().toISOString(),
          }, { merge: true });
        }
        return OWNER_ACCOUNT_REFERENCE;
      }

      if (isNumberedReference(currentReference)) return currentReference;

      const legacyNumber = getLegacyNumber(currentReference);
      if (legacyNumber !== null) {
        const migratedReference = `CE${legacyNumber}`;
        transaction.set(userRef, {
          accountReference: migratedReference,
          accountReferenceUpdatedAt: new Date().toISOString(),
        }, { merge: true });
        return migratedReference;
      }

      const counterSnapshot = await transaction.get(counterRef);
      const storedLastNumber = counterSnapshot.exists()
        ? Number(counterSnapshot.data()?.lastNumber)
        : FIRST_ACCOUNT_NUMBER - 1;
      const safeLastNumber = Number.isFinite(storedLastNumber)
        ? Math.max(storedLastNumber, FIRST_ACCOUNT_NUMBER - 1)
        : FIRST_ACCOUNT_NUMBER - 1;
      const nextNumber = safeLastNumber + 1;
      const nextReference = `CE${nextNumber}`;
      const now = new Date().toISOString();

      transaction.set(counterRef, { lastNumber: nextNumber, updatedAt: now }, { merge: true });
      transaction.set(userRef, {
        id: cleanUserId,
        accountReference: nextReference,
        accountReferenceCreatedAt: now,
      }, { merge: true });

      return nextReference;
    });

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
      };

      const changed =
        nextUser.accountReference !== cachedUser.accountReference ||
        nextUser.isMarketer !== cachedUser.isMarketer ||
        nextUser.marketerStatus !== cachedUser.marketerStatus ||
        nextUser.marketerCode !== cachedUser.marketerCode ||
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
  if (legacyBackfillStarted) return;
  legacyBackfillStarted = true;

  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map((userDoc) => ({
      id: userDoc.id,
      ...userDoc.data(),
    })) as Array<{ id: string; email?: string; accountReference?: string; createdAt?: string }>;

    users.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

    for (const user of users) {
      const current = String(user.accountReference || '').trim();
      const email = String(user.email || '').trim().toLowerCase();
      const needsReference = isOwner(email)
        ? current !== OWNER_ACCOUNT_REFERENCE
        : !isNumberedReference(current);
      if (needsReference) await ensureAccountReference(user.id, email);
    }
  } catch (error) {
    console.warn('Unable to backfill legacy CityEve account references:', error);
    legacyBackfillStarted = false;
  }
}

function renderProfileBadge() {
  try {
    const cachedUser = readCachedUser();
    if (!cachedUser) return;
    const name = String(cachedUser?.name || '').trim();
    const reference = String(cachedUser?.accountReference || '').trim();
    if (!name || !reference) return;

    const headings = Array.from(document.querySelectorAll('main h2')) as HTMLHeadingElement[];
    const nameHeading = headings.find((heading) => heading.textContent?.trim() === name);
    if (!nameHeading || !nameHeading.parentElement) return;

    const nameRow = nameHeading.parentElement;
    const container = nameRow.parentElement;
    if (!container) return;

    const lang = document.documentElement.lang === 'en' ? 'en' : 'ar';
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

    const isActiveMarketer = cachedUser?.isMarketer === true && cachedUser?.marketerStatus === 'active';
    let marketerBadge = container.querySelector('[data-cityeve-marketer-status]') as HTMLElement | null;

    if (isActiveMarketer) {
      if (!marketerBadge) {
        marketerBadge = document.createElement('div');
        marketerBadge.setAttribute('data-cityeve-marketer-status', 'true');
        marketerBadge.style.display = 'inline-flex';
        marketerBadge.style.alignItems = 'center';
        marketerBadge.style.gap = '7px';
        marketerBadge.style.width = 'fit-content';
        marketerBadge.style.marginBottom = '10px';
        marketerBadge.style.padding = '7px 12px';
        marketerBadge.style.borderRadius = '11px';
        marketerBadge.style.border = '1px solid rgba(16, 185, 129, 0.35)';
        marketerBadge.style.background = 'rgba(16, 185, 129, 0.12)';
        marketerBadge.style.color = '#6ee7b7';
        marketerBadge.style.fontSize = '13px';
        marketerBadge.style.fontWeight = '800';
        marketerBadge.style.lineHeight = '1.35';
        accountBadge.insertAdjacentElement('afterend', marketerBadge);
      }
      marketerBadge.textContent = lang === 'ar'
        ? '✓ أنت الآن مسوّق معتمد في CityEve'
        : '✓ You’re now a verified CityEve marketer';
      marketerBadge.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    } else if (marketerBadge) {
      marketerBadge.remove();
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
