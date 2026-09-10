import { onAuthStateChanged } from 'firebase/auth';
import { collection, doc, getDocs, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';

const COUNTER_COLLECTION = 'system_counters';
const COUNTER_DOCUMENT = 'user_account_reference';
const FIRST_ACCOUNT_NUMBER = 10001;
const LOCAL_USER_KEY = 'dwm_user_v1';
const OWNER_ACCOUNT_REFERENCE = '0000';
const ADMIN_EMAIL = (((import.meta as any).env.VITE_ADMIN_EMAIL as string | undefined)?.trim().toLowerCase()) || 'waelvts@gmail.com';

const completedUserIds = new Set<string>();
const inFlightUserIds = new Set<string>();
let legacyBackfillStarted = false;

const isNumberedReference = (value?: string) => /^CE-\d{5,}$/.test(String(value || '').trim());
const isOwner = (email?: string) => String(email || '').trim().toLowerCase() === ADMIN_EMAIL;

/**
 * Creates one permanent human-friendly account number per user:
 * CE-10001, CE-10002, CE-10003 ...
 * The platform owner keeps the reserved test number 0000.
 *
 * Firestore transaction on a single counter document prevents duplicates
 * even when more than one registration happens at the same time.
 */
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

      // Owner/admin account always uses the reserved number 0000.
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

      // Never replace a valid numbered reference already assigned to a normal account.
      if (isNumberedReference(currentReference)) {
        return currentReference;
      }

      const counterSnapshot = await transaction.get(counterRef);
      const storedLastNumber = counterSnapshot.exists()
        ? Number(counterSnapshot.data()?.lastNumber)
        : FIRST_ACCOUNT_NUMBER - 1;

      const safeLastNumber = Number.isFinite(storedLastNumber)
        ? Math.max(storedLastNumber, FIRST_ACCOUNT_NUMBER - 1)
        : FIRST_ACCOUNT_NUMBER - 1;

      const nextNumber = safeLastNumber + 1;
      const nextReference = `CE-${nextNumber}`;
      const now = new Date().toISOString();

      transaction.set(counterRef, {
        lastNumber: nextNumber,
        updatedAt: now,
      }, { merge: true });

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

function syncCachedReference(userId: string, accountReference: string | null) {
  if (!accountReference) return;
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return;
    const cachedUser = JSON.parse(raw);
    if (cachedUser?.id === userId && cachedUser.accountReference !== accountReference) {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify({
        ...cachedUser,
        accountReference,
      }));
    }
  } catch {
    // Firestore remains the source of truth; local cache failure must not block assignment.
  }
}

const ensureCachedUserReference = () => {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return;
    const cachedUser = JSON.parse(raw);
    const id = String(cachedUser?.id || '').trim();
    const email = String(cachedUser?.email || '').trim().toLowerCase();
    const current = String(cachedUser?.accountReference || '').trim();
    const alreadyCorrect = isOwner(email)
      ? current === OWNER_ACCOUNT_REFERENCE
      : isNumberedReference(current);

    if (!id || completedUserIds.has(id) || alreadyCorrect) {
      scheduleProfileBadgeRender();
      return;
    }

    void ensureAccountReference(id, email);
  } catch {
    // Ignore malformed/absent local cache.
  }
};

/**
 * Backfill all legacy users once when the platform owner/admin opens the app.
 * Old users therefore receive a permanent number without needing to register again.
 */
async function backfillLegacyUsers() {
  if (legacyBackfillStarted) return;
  legacyBackfillStarted = true;

  try {
    const snapshot = await getDocs(collection(db, 'users'));
    const users = snapshot.docs.map((userDoc) => ({
      id: userDoc.id,
      ...userDoc.data(),
    })) as Array<{ id: string; email?: string; accountReference?: string }>;

    // Oldest accounts first keeps the numbering predictable for existing members.
    users.sort((a: any, b: any) => {
      const aDate = new Date(a.createdAt || 0).getTime();
      const bDate = new Date(b.createdAt || 0).getTime();
      return aDate - bDate;
    });

    for (const user of users) {
      const current = String(user.accountReference || '').trim();
      const email = String(user.email || '').trim().toLowerCase();
      const needsReference = isOwner(email)
        ? current !== OWNER_ACCOUNT_REFERENCE
        : !isNumberedReference(current);

      if (needsReference) {
        await ensureAccountReference(user.id, email);
      }
    }
  } catch (error) {
    console.warn('Unable to backfill legacy CityEve account references:', error);
    legacyBackfillStarted = false;
  }
}

/**
 * Keeps the account number visible directly under the profile name without
 * changing any other profile behavior. The badge reads the number from the
 * current cached profile, while Firestore remains the source of truth.
 */
function renderProfileBadge() {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return;
    const cachedUser = JSON.parse(raw);
    const name = String(cachedUser?.name || '').trim();
    const reference = String(cachedUser?.accountReference || '').trim();
    if (!name || !reference) return;

    const headings = Array.from(document.querySelectorAll('main h2')) as HTMLHeadingElement[];
    const nameHeading = headings.find((heading) => heading.textContent?.trim() === name);
    if (!nameHeading || !nameHeading.parentElement) return;

    const nameRow = nameHeading.parentElement;
    const existingBadge = nameRow.parentElement?.querySelector('[data-cityeve-account-reference]') as HTMLElement | null;
    const lang = document.documentElement.lang === 'en' ? 'en' : 'ar';
    const label = lang === 'ar' ? 'رقم حسابك' : 'Your account number';

    if (existingBadge) {
      existingBadge.textContent = `${label}: ${reference}`;
      return;
    }

    const badge = document.createElement('div');
    badge.setAttribute('data-cityeve-account-reference', 'true');
    badge.textContent = `${label}: ${reference}`;
    badge.setAttribute('dir', 'ltr');
    badge.style.display = 'inline-flex';
    badge.style.alignItems = 'center';
    badge.style.justifyContent = 'center';
    badge.style.width = 'fit-content';
    badge.style.marginBottom = '10px';
    badge.style.padding = '6px 12px';
    badge.style.borderRadius = '10px';
    badge.style.border = '1px solid rgba(245, 158, 11, 0.35)';
    badge.style.background = 'rgba(245, 158, 11, 0.10)';
    badge.style.color = '#fbbf24';
    badge.style.fontSize = '13px';
    badge.style.fontWeight = '800';
    badge.style.letterSpacing = '0.02em';
    badge.style.fontFamily = 'monospace';

    nameRow.insertAdjacentElement('afterend', badge);
  } catch {
    // UI enhancement only; never block the profile if the DOM is not ready yet.
  }
}

let badgeTimer: number | null = null;
function scheduleProfileBadgeRender() {
  if (badgeTimer) window.clearTimeout(badgeTimer);
  badgeTimer = window.setTimeout(renderProfileBadge, 80);
}

// Firebase/Google/email authentication path.
onAuthStateChanged(auth, (firebaseUser) => {
  if (!firebaseUser?.uid) return;

  const email = String(firebaseUser.email || '').trim().toLowerCase();
  void ensureAccountReference(firebaseUser.uid, email);

  if (isOwner(email)) {
    void backfillLegacyUsers();
  }
});

// Covers the app's local fallback session as well as users who sign in later
// without changing the existing authentication flow.
ensureCachedUserReference();
window.setInterval(ensureCachedUserReference, 5000);

// Re-render the small badge when navigating into Profile or switching language.
const observer = new MutationObserver(scheduleProfileBadgeRender);
observer.observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener('click', () => scheduleProfileBadgeRender());
