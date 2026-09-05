import { create } from 'zustand';
import type { User } from '@/types';
import { authService } from '@/services/auth.service';
import { userApi } from '@/api/auth.api';
import { setAuthToken } from '@/api/client';

type AuthState = {
  user: User | null;
  idToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  restore: () => Promise<void>;
  setUser: (u: User | null) => void;
  setToken: (t: string | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  idToken: null,
  isLoading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setToken: (idToken) => { set({ idToken }); setAuthToken(idToken); },
  restore: async () => {
    set({ isLoading: true });
    try {
      const token = await authService.restoreSession();
      if (!token) { set({ isLoading: false, isAuthenticated: false }); return; }
      setAuthToken(token);
      set({ idToken: token });
      // Try to fetch user profile, but don't block longer than 4s — keep Firebase session on network failure
      const withTimeout = <T,>(p: Promise<T>, ms: number) => Promise.race([p, new Promise<never>((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);
      try {
        const res = await withTimeout(userApi.me(), 4000);
        set({ user: (res as any).data as User, isAuthenticated: true, idToken: token });
      } catch (e) {
        console.warn('[auth] restore: userApi.me failed or timed out, keeping session', e);
        try {
          const fbUser = (await import('@/services/firebase')).getFirebaseAuth()?.currentUser;
          if (fbUser) {
            set({ user: { id: fbUser.uid, email: fbUser.email || '', name: fbUser.displayName, phone: fbUser.phoneNumber } as unknown as User, isAuthenticated: true, idToken: token });
          } else {
            set({ isAuthenticated: true, user: null });
          }
        } catch {
          set({ isAuthenticated: true, user: null });
        }
      }
    } finally {
      set({ isLoading: false });
    }
  },
  refreshUser: async () => {
    try {
      const res = await userApi.me();
      set({ user: res.data as User, isAuthenticated: true });
    } catch (e) {
      console.warn('[auth] refreshUser: userApi.me failed', e);
      // Don't log out on network/backend failure — keep Firebase session
      const fbUser = (await import('@/services/firebase')).getFirebaseAuth()?.currentUser;
      if (fbUser) {
        const prev = get().user;
        set({ user: (prev as User) ?? ({ id: fbUser.uid, email: fbUser.email || '', name: fbUser.displayName, phone: fbUser.phoneNumber } as unknown as User), isAuthenticated: true });
        return;
      }
      const token = get().idToken || (await authService.getStoredToken());
      if (token) {
        setAuthToken(token);
        set({ isAuthenticated: true });
        return;
      }
      set({ user: null, isAuthenticated: false });
    }
  },
  logout: async () => {
    await authService.logout();
    set({ user: null, idToken: null, isAuthenticated: false });
    // clear persisted address selection (privacy + avoid cross-user leak)
    try {
      const { useAddressStore } = await import('./addressStore');
      useAddressStore.getState().clear();
    } catch {}
    setAuthToken(null);
  },
}));
