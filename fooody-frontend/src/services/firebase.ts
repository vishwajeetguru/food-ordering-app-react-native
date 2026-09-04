// Firebase initialization for foody-61bab — AUTH ONLY in API-only architecture
// Implements Firebase Agent Skills: firebase-auth-basics (Email/Password, Google, Phone)
// NOTE 2026-09 SECURITY: Firestore direct access is DISABLED on frontend.
// All product/order/address data must go via backend API (src/api/*).
// This file retains Firestore stub only for legacy; do not use getFirebaseFirestore() in new code.

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  initializeAuth,
  connectAuthEmulator,
} from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { Platform } from 'react-native';

// Use AsyncStorage for React Native persistence (expo-secure-store alternative)
// Firebase JS SDK recommended for Expo: getReactNativePersistence
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID!,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function ensureConfig() {
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn(
      '[Firebase] Missing EXPO_PUBLIC_FIREBASE_* config. Running in mock mode. Check .env — foody-61bab config required.'
    );
    return false;
  }
  return true;
}

export function getFirebaseApp(): FirebaseApp | null {
  if (app) return app;
  if (!ensureConfig()) return null;
  if (getApps().length) {
    app = getApp();
  } else {
    app = initializeApp(firebaseConfig);
    // Analytics only on web (requires measurementId)
    if (Platform.OS === 'web' && firebaseConfig.measurementId) {
      import('firebase/analytics')
        .then(({ getAnalytics, isSupported }) =>
          isSupported().then((yes) => {
            if (yes) getAnalytics(app!);
          })
        )
        .catch(() => {});
    }
  }
  return app;
}

export function getFirebaseAuth(): Auth | null {
  if (auth) return auth;
  const a = getFirebaseApp();
  if (!a) return null;

  try {
    // Try to get existing Auth instance
    auth = getAuth(a);
  } catch {
    // Initialize with RN persistence when possible
    try {
      // Dynamically import persistence to avoid breaking web
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getReactNativePersistence } = require('firebase/auth');
      const ReactNativeAsyncStorage =
        require('@react-native-async-storage/async-storage').default;
      auth = initializeAuth(a, {
        persistence: getReactNativePersistence(ReactNativeAsyncStorage),
      });
    } catch {
      auth = getAuth(a);
    }
  }

  // Connect to Auth emulator in local dev if explicitly enabled
  if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    try {
      connectAuthEmulator(auth, 'http://localhost:9099', {
        disableWarnings: true,
      });
    } catch {}
  }

  return auth;
}

export function getFirebaseFirestore(): Firestore | null {
  if (db) return db;
  const a = getFirebaseApp();
  if (!a) return null;
  db = getFirestore(a);
  if (__DEV__ && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
    try {
      connectFirestoreEmulator(db, 'localhost', 8080);
    } catch {}
  }
  return db;
}

export const isFirebaseConfigured = !!(
  firebaseConfig.apiKey && firebaseConfig.projectId
);

export { firebaseConfig };
