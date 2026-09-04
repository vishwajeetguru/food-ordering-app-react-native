import { api } from './client';
import type { ApiResponse } from '@/types';

export const adminApi = {
  // users
  listUsers: () => api.get<ApiResponse<any[]>>('/admin/users'),
  getUser: (id: string) => api.get<ApiResponse<any>>(`/admin/users/${id}`),
  updateUser: (id: string, data: any) => api.patch<ApiResponse<any>>(`/admin/users/${id}`, data),
  deleteUser: (id: string) => api.delete<ApiResponse<null>>(`/admin/users/${id}`),

  // orders
  listOrders: (limit = 50) => api.get<ApiResponse<any[]>>(`/admin/orders?limit=${limit}`),
  getOrder: (id: string) => api.get<ApiResponse<any>>(`/admin/orders/${id}`),
  updateOrder: (id: string, data: any) => api.patch<ApiResponse<any>>(`/admin/orders/${id}`, data),
  updateOrderStatus: (id: string, status: string) => api.patch<ApiResponse<any>>(`/admin/orders/${id}/status`, { status }),

  // addresses
  listAddresses: (userId?: string) => api.get<ApiResponse<any[]>>(userId ? `/admin/addresses?userId=${userId}` : '/admin/addresses'),
  listUserAddresses: (userId: string) => api.get<ApiResponse<any[]>>(`/admin/users/${userId}/addresses`),
  createUserAddress: (userId: string, data: any) => api.post<ApiResponse<any>>(`/admin/users/${userId}/addresses`, data),
  deleteAddress: (id: string) => api.delete<ApiResponse<null>>(`/admin/addresses/${id}`),

  // wishlists
  listWishlists: (userId?: string) => api.get<ApiResponse<any[]>>(userId ? `/admin/wishlists?userId=${userId}` : '/admin/wishlists'),

  // notifications
  listNotifications: () => api.get<ApiResponse<any[]>>('/admin/notifications'),
  sendNotification: (data: { title: string; body: string; type?: string; data?: any; userId?: string; broadcast?: boolean }) =>
    api.post<ApiResponse<any[]>>('/admin/notifications/send', data),
  deleteNotification: (id: string) => api.delete<ApiResponse<null>>(`/admin/notifications/${id}`),

  // tickets
  listTickets: (status?: string) => api.get<ApiResponse<any[]>>(status ? `/admin/tickets?status=${status}` : '/admin/tickets'),
  getTicket: (id: string) => api.get<ApiResponse<any>>(`/admin/tickets/${id}`),
  updateTicketStatus: (id: string, status: string, adminNote?: string) => api.patch<ApiResponse<any>>(`/admin/tickets/${id}/status`, { status, adminNote }),
  replyToTicket: (id: string, message: string) => api.post<ApiResponse<any>>(`/admin/tickets/${id}/reply`, { message }),

  // analytics
  analytics: () => api.get<ApiResponse<any>>('/admin/analytics'),
};

export const aboutApi = {
  get: () => api.get<ApiResponse<any>>('/about'),
};
