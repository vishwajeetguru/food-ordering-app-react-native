import { api } from './client';
import type { ApiResponse } from '@/types';

export interface AppNotification {
  id: string;
  userId: string | null;
  title: string;
  body: string;
  type: 'promo' | 'order' | 'system' | 'support' | 'general';
  data?: Record<string, any>;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

export const notificationApi = {
  list: (limit = 50) => api.get<ApiResponse<{ notifications: AppNotification[]; unreadCount: number }>>(`/notifications?limit=${limit}`),
  unreadCount: () => api.get<ApiResponse<{ count: number }>>('/notifications/unread-count'),
  markRead: (id: string) => api.patch<ApiResponse<AppNotification>>(`/notifications/${id}/read`, {}),
  markAllRead: () => api.patch<ApiResponse<{ count: number }>>('/notifications/read-all', {}),
  registerToken: (token: string, platform?: string) => api.post<ApiResponse<any>>('/notifications/fcm-token', { token, platform }),
  // legacy alias via /users
  registerTokenAlt: (token: string) => api.post<ApiResponse<any>>('/users/me/fcm-token', { token }),
};
