import { api } from './client';
import type { ApiResponse } from '@/types';

export const authApi = {
  sendOtp: (email: string, channel: 'email'|'sms'='email') =>
    api.post<ApiResponse<{expiresAt:string}>>('/auth/send-otp', { email, channel }),

  verifyOtp: (email: string, otp: string, channel='email') =>
    api.post<ApiResponse<{uid:string; email:string; customToken:string; isNewUser:boolean}>>('/auth/verify-otp', { email, otp, channel }),

  sendMagicLink: (email: string) =>
    api.post<ApiResponse<{expiresAt:string; link?:string}>>('/auth/send-magic-link', { email }),

  verifyMagicLink: (token: string) =>
    api.post<ApiResponse<{uid:string; email:string; customToken:string}>>('/auth/verify-magic-link', { token }),

  verifyMagicLinkGet: (token: string) =>
    api.get<ApiResponse<{uid:string; email:string; customToken:string}>>(`/auth/verify-magic-link?token=${encodeURIComponent(token)}`),

  setPassword: (password: string) =>
    api.post<ApiResponse<null>>('/auth/set-password', { password }),

  changePassword: (newPassword: string) =>
    api.post<ApiResponse<null>>('/auth/change-password', { newPassword }),

  forgotPassword: (email: string) =>
    api.post<ApiResponse<{link?:string}|null>>('/auth/forgot-password', { email }),

  resetPassword: (oobCode: string, newPassword: string) =>
    api.post<ApiResponse<null>>('/auth/reset-password', { oobCode, newPassword }),

  me: () => api.get<ApiResponse<any>>('/auth/me'),
  google: (idToken: string) => api.post<ApiResponse<any>>('/auth/google', { idToken }),
};

export const userApi = {
  me: () => api.get<ApiResponse<any>>('/users/me'),
  updateMe: (data: any) => api.patch<ApiResponse<any>>('/users/me', data),
  deleteMe: () => api.delete<ApiResponse<null>>('/users/me'),
};

export const cartApi = {
  // Cart is local-first (Zustand+AsyncStorage); server sync not required
  get: async () => ({ data: null }),
  sync: async () => ({}),
};

// Catalog / order / address have moved to catalog.api.ts and order.api.ts.
// Re-export for callers that still import from here (avoids breakage during migration).
export { productApi, categoryApi, restaurantApi, offerApi, homeApi } from './catalog.api';
export { orderApi, addressApi } from './order.api';
