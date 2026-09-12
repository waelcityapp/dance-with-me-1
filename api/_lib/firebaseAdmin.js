import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const admin = require('firebase-admin');

export function normalizeServiceAccountField(input, fieldName) {
  let value = String(input || '').trim();
  if (!value) return '';

  if (value.startsWith('{')) {
    try {
      value = String(JSON.parse(value)?.[fieldName] || '').trim();
    } catch {
      return value;
    }
  }

  const escapedFieldName = fieldName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const jsonLine = value.match(new RegExp(`^["']?${escapedFieldName}["']?\\s*:\\s*["']([^"']+)["']\\s*,?$`));
  if (jsonLine) return jsonLine[1].trim();

  const jsonString = value.replace(/,\s*$/, '');
  if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
    try {
      return String(JSON.parse(jsonString)).trim();
    } catch {
      return jsonString.slice(1, -1).trim();
    }
  }

  return value;
}

export function normalizePrivateKey(input) {
  let value = String(input || '').trim();
  if (!value) return '';

  // Accept either a complete service-account JSON object or its private_key value.
  if (value.startsWith('{')) {
    try {
      const serviceAccount = JSON.parse(value);
      value = String(serviceAccount.private_key || '').trim();
    } catch {
      throw new Error('FIREBASE_PRIVATE_KEY_INVALID_FORMAT');
    }
  } else {
    // Values copied directly from JSON often include surrounding quotes and a comma.
    const jsonString = value.replace(/,\s*$/, '');
    if (jsonString.startsWith('"') && jsonString.endsWith('"')) {
      try {
        value = JSON.parse(jsonString);
      } catch {
        value = jsonString.slice(1, -1);
      }
    }
  }

  value = String(value).replace(/\\r/g, '').replace(/\\n/g, '\n').trim();
  if (!value.startsWith('-----BEGIN PRIVATE KEY-----') || !value.endsWith('-----END PRIVATE KEY-----')) {
    throw new Error('FIREBASE_PRIVATE_KEY_INVALID_FORMAT');
  }
  return value;
}

export function getAdminApp() {
  if (admin.apps.length) return admin.app();
  const projectId = normalizeServiceAccountField(process.env.FIREBASE_PROJECT_ID, 'project_id');
  const clientEmail = normalizeServiceAccountField(process.env.FIREBASE_CLIENT_EMAIL, 'client_email');
  const privateKeyInput = process.env.FIREBASE_PRIVATE_KEY;
  if (!projectId) throw new Error('FIREBASE_PROJECT_ID_MISSING');
  if (!clientEmail) throw new Error('FIREBASE_CLIENT_EMAIL_MISSING');
  if (!privateKeyInput) throw new Error('FIREBASE_PRIVATE_KEY_MISSING');
  const privateKey = normalizePrivateKey(privateKeyInput);
  return admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
}

export function getAdminDb() {
  const databaseId = process.env.FIREBASE_DATABASE_ID;
  return admin.firestore(getAdminApp(), databaseId && databaseId !== '(default)' ? databaseId : undefined);
}

export async function verifyRequestUser(req) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) throw new Error('UNAUTHENTICATED');
  return admin.auth(getAdminApp()).verifyIdToken(token);
}

export { admin };
