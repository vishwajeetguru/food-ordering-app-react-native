import admin from 'firebase-admin';
import fs from 'fs';
import { env, isDevelopment } from './env';
import { logger } from '../utils/logger';

let initialized = false;
let firestoreInstance: admin.firestore.Firestore | null = null;
let authInstance: admin.auth.Auth | null = null;

function initializeFirebase(): void {
  if (initialized) return;

  try {
    if (admin.apps.length > 0) {
      initialized = true;
      firestoreInstance = admin.firestore();
      authInstance = admin.auth();
      return;
    }

    // Option 1: Service account JSON file path (recommended for local dev)
    if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const path = env.FIREBASE_SERVICE_ACCOUNT_PATH;
      if (fs.existsSync(path)) {
        const serviceAccount = JSON.parse(fs.readFileSync(path, 'utf8'));
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        logger.info('Firebase initialized via service account file');
      } else {
        logger.warn(`Firebase service account file not found at: ${path}`);
      }
    }
    // Option 2: Individual env vars
    else if (env.FIREBASE_PROJECT_ID && env.FIREBASE_CLIENT_EMAIL && env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey: env.FIREBASE_PRIVATE_KEY,
        }),
      });
      logger.info('Firebase initialized via environment variables');
    } else {
      // No credentials - run in mock/offline mode
      if (isDevelopment || process.env.NODE_ENV === 'test') {
        logger.warn(
          'Firebase credentials not configured. Running in MOCK mode. Firestore/Auth operations will use in-memory fallback where possible.'
        );
        // Initialize with dummy projectId to allow admin SDK to not crash on import
        // but Firestore/Auth calls will fail gracefully and we handle fallback
        try {
          admin.initializeApp({ projectId: env.FIREBASE_PROJECT_ID || 'foody-dev' });
        } catch {
          // ignore if already initialized
        }
      } else {
        logger.error('Firebase credentials missing in production environment');
        // Still init with dummy to avoid crash; ops will error explicitly
        try {
          admin.initializeApp({ projectId: 'missing-project' });
        } catch {}
      }
    }

    initialized = true;
    firestoreInstance = admin.firestore();
    authInstance = admin.auth();
  } catch (error) {
    logger.error('Failed to initialize Firebase', { error: (error as Error).message });
    // Don't throw - allow server to start for health checks
  }
}

export function getFirestore(): admin.firestore.Firestore {
  if (!firestoreInstance) {
    initializeFirebase();
  }
  if (!firestoreInstance) {
    throw new Error('Firestore not initialized. Check Firebase configuration.');
  }
  return firestoreInstance;
}

export function getAuth(): admin.auth.Auth {
  if (!authInstance) {
    initializeFirebase();
  }
  if (!authInstance) {
    throw new Error('Firebase Auth not initialized. Check Firebase configuration.');
  }
  return authInstance;
}

let cachedConfigured: boolean | null = null;
export function isFirebaseConfigured(): boolean {
  // Cached — avoids fs.existsSync on every request (was hot path in 10 repos + auth middleware)
  if (cachedConfigured !== null && process.env.NODE_ENV !== 'test') return cachedConfigured;
  // In test, force mock mode so tests don't hit real Firebase (avoids "no configuration" errors)
  if (process.env.NODE_ENV === 'test') {
    if (process.env.NODE_ENV !== 'test' || cachedConfigured === null) {
      // don't cache test=true permanently if later running prod? but test is isolated
    }
    return false;
  }
  let result = false;
  if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      if (!fs.existsSync(env.FIREBASE_SERVICE_ACCOUNT_PATH)) result = false;
      else result = true;
    } catch { result = false; }
  } else {
    result = !!(
      env.FIREBASE_PROJECT_ID &&
      env.FIREBASE_CLIENT_EMAIL &&
      env.FIREBASE_PRIVATE_KEY
    );
  }
  if (process.env.NODE_ENV !== 'test') cachedConfigured = result;
  return result;
}
// For tests to reset cache
export function _resetFirebaseConfiguredCache() { cachedConfigured = null; }

export { admin, initializeFirebase };
