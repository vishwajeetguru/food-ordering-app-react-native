import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { setAuthToken } from '@/api/client';
import { authApi } from '@/api/auth.api';
import { getFirebaseAuth, isFirebaseConfigured, getFirebaseApp } from './firebase';
import {
  signInWithCustomToken,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  PhoneAuthProvider,
  signInWithCredential,
  signInWithPopup,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  ConfirmationResult,
  ApplicationVerifier,
} from 'firebase/auth';

const TOKEN_KEY = 'foody_id_token';
const CUSTOM_TOKEN_KEY = 'foody_custom_token';

// ------------------------------------------------------------------
// Token persistence (expo-secure-store) + API client header
// ------------------------------------------------------------------
export const authService = {
  async persistIdToken(idToken: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, idToken);
    setAuthToken(idToken);
  },
  async getStoredToken() {
    const t = await SecureStore.getItemAsync(TOKEN_KEY);
    if (t) setAuthToken(t);
    return t;
  },
  async clearToken() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(CUSTOM_TOKEN_KEY);
    setAuthToken(null);
  },

  async restoreSession() {
    // Prefer Firebase auth-state (fresh token). If SecureStore token is expired (JWT exp < now),
    // don't return it — avoid the 401 TOKEN_EXPIRED loop; authState listener / refresh handles it.
    try {
      const auth = getFirebaseAuth();
      if (auth) {
        const user = await new Promise<any>((resolve) => {
          const unsub = auth.onAuthStateChanged((u) => { unsub(); resolve(u); });
          setTimeout(() => { unsub(); resolve(auth.currentUser ?? null); }, 2000);
        });
        if (user) {
          const token = await user.getIdToken(true);
          await this.persistIdToken(token);
          return token;
        }
      }
    } catch {}
    const stored = await SecureStore.getItemAsync(TOKEN_KEY);
    if (!stored) return null;
    try {
      const b64 = (stored.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(globalThis.atob(b64));
      if (payload?.exp && payload.exp * 1000 < Date.now()) {
        // Stored token expired — clear it so login flow starts clean
        await this.clearToken();
        return null;
      }
    } catch {}
    setAuthToken(stored);
    return stored;
  },

  async logout() {
    try {
      const auth = getFirebaseAuth();
      if (auth) await signOut(auth);
    } catch {}
    await this.clearToken();
  },

  // Helper: after any Firebase sign-in, persist ID token
  async _persistFirebaseUser(): Promise<string> {
    const auth = getFirebaseAuth();
    if (!auth?.currentUser) throw new Error('No Firebase user');
    const idToken = await auth.currentUser.getIdToken();
    await this.persistIdToken(idToken);
    return idToken;
  },

  // ----------------------------------------------------------------
  // Backend OTP / Magic Link (existing, keeps hasPassword flow)
  // ----------------------------------------------------------------
  async sendOtp(email: string) {
    return authApi.sendOtp(email, 'email');
  },
  async verifyOtp(email: string, otp: string) {
    const res = await authApi.verifyOtp(email, otp, 'email');
    const customToken = res.data.customToken;
    await SecureStore.setItemAsync(CUSTOM_TOKEN_KEY, customToken);
    if (isFirebaseConfigured && customToken) {
      try {
        const auth = getFirebaseAuth();
        if (auth) {
          const cred = await signInWithCustomToken(auth, customToken);
          const idToken = await cred.user.getIdToken();
          await this.persistIdToken(idToken);
          return { idToken, customToken, uid: res.data.uid };
        }
      } catch (e) {
        console.warn('Firebase customToken exchange failed, using mock', e);
      }
    }
    await this.persistIdToken(customToken);
    return { idToken: customToken, customToken, uid: res.data.uid };
  },

  async sendMagicLink(email: string) {
    return authApi.sendMagicLink(email);
  },
  async verifyMagicLink(token: string) {
    const res = await authApi.verifyMagicLink(token);
    const customToken = res.data.customToken;
    await SecureStore.setItemAsync(CUSTOM_TOKEN_KEY, customToken);
    if (isFirebaseConfigured && customToken) {
      try {
        const auth = getFirebaseAuth();
        if (auth) {
          const cred = await signInWithCustomToken(auth, customToken);
          const idToken = await cred.user.getIdToken();
          await this.persistIdToken(idToken);
          return { idToken, customToken, uid: res.data.uid };
        }
      } catch {}
    }
    await this.persistIdToken(customToken);
    return { idToken: customToken, customToken, uid: res.data.uid };
  },

  async setPassword(password: string) {
    return authApi.setPassword(password);
  },

  // ----------------------------------------------------------------
  // Email / Password – Firebase Native (Skill: firebase-auth-basics)
  // ----------------------------------------------------------------
  async signUpWithEmail(email: string, password: string, displayName?: string) {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured – check .env');
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');
    const cred = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    const idToken = await cred.user.getIdToken();
    await this.persistIdToken(idToken);
    return cred.user;
  },

  async loginWithPassword(email: string, password: string) {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured');
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');
    const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
    const idToken = await cred.user.getIdToken();
    await this.persistIdToken(idToken);
    return idToken;
  },

  async sendPasswordReset(email: string) {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured');
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not initialized');
    await sendPasswordResetEmail(auth, email.trim().toLowerCase());
  },

  // ----------------------------------------------------------------
  // Google Sign-In
  // ----------------------------------------------------------------
  // Web: uses signInWithPopup (requires authorized domain)
  // Native (Expo): expects caller to obtain idToken via expo-auth-session and then call signInWithGoogleCredential
  async signInWithGoogle(): Promise<string> {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured');
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');

    if (Platform.OS === 'web') {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      await this.persistIdToken(idToken);
      return idToken;
    }

    // Native: instruct to use expo-auth-session
    throw new Error(
      'GOOGLE_NATIVE_REQUIRES_EXPO_AUTH_SESSION: Use signInWithGoogleCredential(idToken) after obtaining Google ID token via expo-auth-session. See docs.'
    );
  },

  // Called after you get Google ID token via expo-auth-session (native) or One Tap
  async signInWithGoogleCredential(idToken: string) {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured');
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not initialized');
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const fbIdToken = await result.user.getIdToken();
    await this.persistIdToken(fbIdToken);
    return fbIdToken;
  },

  // Helper for expo-auth-session flow (native)
  // Usage:
  //   const [request, response, promptAsync] = Google.useAuthRequest({ clientId: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID })
  //   if (response?.type === 'success') await authService.signInWithGoogleCredential(response.authentication.idToken)
  // See: https://docs.expo.dev/guides/authentication/#google
  // Requires: EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (or androidClientId/iosClientId) from Firebase Console > Auth > Google > Web SDK config
  // And SHA-1 for Android in Firebase Console.

  // ----------------------------------------------------------------
  // Phone Authentication
  // ----------------------------------------------------------------
  // Web: uses invisible Recaptcha. Native: requires <FirebaseRecaptchaVerifierModal> from expo-firebase-recaptcha or custom ApplicationVerifier
  // For Expo JS SDK, the recommended pattern is:
  //   const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' })
  //   const confirmation = await signInWithPhoneNumber(auth, phoneNumber, verifier)
  //   const result = await confirmation.confirm(code)
  //
  // In React Native (Expo), you need to provide a DOM-less verifier. We expose a generic helper that accepts any ApplicationVerifier.
  // For simplicity, we provide sendPhoneVerification that works on web with auto Recaptcha, and for native returns instructions.

  async sendPhoneVerification(
    phoneNumber: string,
    appVerifier?: any // RecaptchaVerifier | FirebaseRecaptchaVerifierModal ref
  ): Promise<ConfirmationResult> {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured');
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');

    // Normalize phone: must be E.164 e.g. +919876543210
    const normalized = phoneNumber.trim();
    if (!normalized.startsWith('+')) {
      throw new Error('Phone number must be in E.164 format: +[country][number] (e.g. +919876543210)');
    }

    let verifier = appVerifier;
    if (!verifier && Platform.OS === 'web') {
      // Create invisible recaptcha for web if not provided
      // Requires a DOM element with id 'recaptcha-container' (hidden)
      // Caller should ensure <div id="recaptcha-container"></div> exists in DOM
      try {
        verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {},
        });
      } catch (e) {
        console.warn('RecaptchaVerifier init failed, trying without:', e);
      }
    }

    if (!verifier) {
      throw new Error(
        'Phone auth requires a Recaptcha verifier. On web, ensure <div id="recaptcha-container"></div> exists. On native, pass a FirebaseRecaptchaVerifierModal ref: <FirebaseRecaptchaVerifierModal ref={ref} firebaseConfig={firebaseConfig} />'
      );
    }

    const confirmation = await signInWithPhoneNumber(auth, normalized, verifier);
    // Store verificationId in SecureStore for later confirmation (optional)
    await SecureStore.setItemAsync('foody_phone_verification_id', confirmation.verificationId);
    return confirmation;
  },

  // Native (Expo Go): use a reCAPTCHA token obtained from the hidden WebView
  async sendPhoneVerificationWithToken(phoneNumber: string, recaptchaToken: string): Promise<ConfirmationResult> {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured');
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase Auth not initialized');

    const normalized = phoneNumber.trim();
    if (!normalized.startsWith('+')) {
      throw new Error('Phone number must be in E.164 format: +[country][number]');
    }

    const verifier: ApplicationVerifier = {
      type: 'recaptcha-enterprise',
      verify: async () => recaptchaToken,
    };

    const confirmation = await signInWithPhoneNumber(auth, normalized, verifier);
    await SecureStore.setItemAsync('foody_phone_verification_id', confirmation.verificationId);
    return confirmation;
  },

  async confirmPhoneCode(confirmation: ConfirmationResult, code: string): Promise<string> {
    const result = await confirmation.confirm(code);
    const idToken = await result.user.getIdToken();
    await this.persistIdToken(idToken);
    return idToken;
  },

  // Alternative: confirm using verificationId + code (without ConfirmationResult object, e.g. after app reload)
  async confirmPhoneCodeWithId(verificationId: string, code: string): Promise<string> {
    if (!isFirebaseConfigured) throw new Error('Firebase not configured');
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase not initialized');
    const credential = PhoneAuthProvider.credential(verificationId, code);
    const result = await signInWithCredential(auth, credential);
    const idToken = await result.user.getIdToken();
    await this.persistIdToken(idToken);
    return idToken;
  },

  async getPhoneVerificationId(): Promise<string | null> {
    return SecureStore.getItemAsync('foody_phone_verification_id');
  },

  // Legacy mock (kept for backward compat, not used for real phone)
  async signInWithGoogleMock(): Promise<never> {
    throw new Error('GOOGLE_NOT_IMPLEMENTED: Use signInWithGoogle() or signInWithGoogleCredential()');
  },
};
