import { create } from 'zustand';
import type { User } from '@/types';
import { api } from '@/api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithToken: (token: string, user: User) => void;
  logout: () => void;
  fetchMe: () => Promise<void>;
  setUser: (u: User | null) => void;
}

function loadInitial(): { token: string | null; user: User | null } {
  try {
    const t = localStorage.getItem('admin_token');
    const u = localStorage.getItem('admin_user');
    return { token: t, user: u ? JSON.parse(u) : null };
  } catch {
    return { token: null, user: null };
  }
}

const init = loadInitial();

export const useAuthStore = create<AuthState>((set, get) => ({
  user: init.user,
  token: init.token,
  isAuthenticated: !!init.token,
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      // Try admin login endpoint; fallback to OTP mock for dev
      const res = await api.post('/auth/login', { email, password }).catch(async () => {
        // Fallback: try send-otp + verify for dev without password
        throw new Error('Use Firebase login or set admin credentials');
      });
      const data = res.data?.data || res.data;
      const token: string = data.token || data.customToken || data.idToken;
      const user: User = data.user;
      if (!token) throw new Error('No token returned');
      localStorage.setItem('admin_token', token);
      if (user) localStorage.setItem('admin_user', JSON.stringify(user));
      set({ token, user: user || null, isAuthenticated: true });
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithToken: (token: string, user: User) => {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchMe: async () => {
    const token = get().token || localStorage.getItem('admin_token');
    if (!token) return;
    try {
      const res = await api.get('/auth/me');
      const user: User = res.data?.data || res.data;
      if (user?.role && user.role !== 'admin') {
        // allow but warn; admin guard will handle
      }
      localStorage.setItem('admin_user', JSON.stringify(user));
      set({ user });
    } catch {
      // token invalid -> logout
      get().logout();
    }
  },

  setUser: (u) => {
    if (u) localStorage.setItem('admin_user', JSON.stringify(u));
    else localStorage.removeItem('admin_user');
    set({ user: u });
  },
}));
