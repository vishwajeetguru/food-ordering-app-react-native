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
      // try fetch user
      try {
        const res = await userApi.me();
        set({ user: res.data as User, isAuthenticated: true, idToken: token });
      } catch {
        // token might be mock expired; keep token but no user
        set({ isAuthenticated: false, user: null });
      }
    } finally {
      set({ isLoading: false });
    }
  },
  refreshUser: async () => {
    try {
      const res = await userApi.me();
      set({ user: res.data as User, isAuthenticated: true });
    } catch { set({ user: null, isAuthenticated: false }); }
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
