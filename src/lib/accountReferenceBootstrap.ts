import { onAuthStateChanged } from 'firebase/auth';
import { doc, runTransaction } from 'firebase/firestore';
import { auth, db } from './firebase';

const COUNTER_COLLECTION = 'system_counters';
const COUNTER_DOCUMENT = 'user_account_reference';
const FIRST_ACCOUNT_NUMBER = 10001;
const LOCAL_USER_KEY = 'dwm_user_v1';

const completedUserIds = new Set<string>();
const inFlightUserIds = new Set<string>();

const isOfficialReference = (value?: string) => /^CE-\d{5,}$/.test(String(value || '').trim());

/**
 * Creates one permanent human-friendly account number per user:
 * CE-10001, CE-10002, CE-10003 ...
 *
 * Firestore transaction on a single counter document prevents duplicates
 * even when more than one registration happens at the same time.
 */
export async function ensureAccountReference(userId: string): Promise<string | null> {
  const cleanUserId = String(userId || '').trim();
  if (!cleanUserId) return null;

  if (inFlightUserIds.has(cleanUserId)) return null;
  inFlightUserIds.add(cleanUserId);

  try {
    const userRef = doc(db, 'users', cleanUserId);
    const counterRef = doc(db, COUNTER_COLLECTION, COUNTER_DOCUMENT);

    const accountReference = await runTransaction(db, async (transaction) => {
      const userSnapshot = await transaction.get(userRef);
      const currentReference = userSnapshot.exists()
        ? String(userSnapshot.data()?.accountReference || '').trim()
        : '';

      // Keep a valid official reference forever.
      if (isOfficialReference(currentReference)) {
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

    // Keep the current browser session in sync when this is the logged-in user.
    try {
      const raw = localStorage.getItem(LOCAL_USER_KEY);
      if (raw) {
        const cachedUser = JSON.parse(raw);
        if (cachedUser?.id === cleanUserId && cachedUser.accountReference !== accountReference) {
          localStorage.setItem(LOCAL_USER_KEY, JSON.stringify({
            ...cachedUser,
            accountReference,
          }));
        }
      }
    } catch {
      // Firestore remains the source of truth; local cache failure must not block assignment.
    }

    return accountReference;
  } catch (error) {
    console.warn('Unable to assign CityEve account reference:', error);
    return null;
  } finally {
    inFlightUserIds.delete(cleanUserId);
  }
}

const ensureCachedUserReference = () => {
  try {
    const raw = localStorage.getItem(LOCAL_USER_KEY);
    if (!raw) return;
    const cachedUser = JSON.parse(raw);
    const id = String(cachedUser?.id || '').trim();
    if (!id || completedUserIds.has(id) || isOfficialReference(cachedUser?.accountReference)) return;
    void ensureAccountReference(id);
  } catch {
    // Ignore malformed/absent local cache.
  }
};

// Firebase/Google/email authentication path.
onAuthStateChanged(auth, (firebaseUser) => {
  if (firebaseUser?.uid && !completedUserIds.has(firebaseUser.uid)) {
    void ensureAccountReference(firebaseUser.uid);
  }
});

// Covers the app's local fallback session as well as users who sign in later
// without changing the existing authentication flow.
ensureCachedUserReference();
window.setInterval(ensureCachedUserReference, 5000);
