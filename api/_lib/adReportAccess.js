const GRANT_LIFETIME_MS = 15 * 60 * 1000;

export function matchesConfiguredAdReportOwner(actor) {
  const email = (actor.email || '').trim().toLowerCase();
  const owners = [process.env.ADMIN_EMAIL, process.env.VITE_ADMIN_EMAIL]
    .map(value => (value || '').trim().toLowerCase())
    .filter(Boolean);
  if (owners.length === 0) owners.push('waelvts@gmail.com');
  return owners.includes(email);
}

function grantReference(db, uid) {
  const collection = process.env.VERCEL_ENV === 'production'
    ? 'admin_ad_report_access'
    : 'admin_ad_report_preview_access';
  return db.collection(collection).doc(uid);
}

export async function grantAdReportAccess(db, actor, now = Date.now()) {
  if (!actor.uid || !Number.isSafeInteger(actor.auth_time)) return false;
  await grantReference(db, actor.uid).set({
    signInTime: actor.auth_time,
    expiresAt: now + GRANT_LIFETIME_MS,
  });
  return true;
}

export async function hasAdReportAccess(db, actor, now = Date.now()) {
  if (actor.admin === true || (actor.email_verified === true && matchesConfiguredAdReportOwner(actor))) return true;
  if (!actor.uid || !Number.isSafeInteger(actor.auth_time)) return false;
  const grant = (await grantReference(db, actor.uid).get()).data();
  return grant?.signInTime === actor.auth_time && grant.expiresAt > now;
}
