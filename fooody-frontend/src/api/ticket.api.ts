import { api } from './client';
import type { ApiResponse } from '@/types';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'order' | 'payment' | 'delivery' | 'general' | 'account' | 'other';

export interface TicketMessage {
  by: 'user' | 'admin';
  byId: string;
  byName: string | null;
  message: string;
  at: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  subject: string;
  description: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  messages: TicketMessage[];
  orderId?: string | null;
}

export const ticketApi = {
  create: (data: { subject: string; description: string; category?: TicketCategory; priority?: string; orderId?: string }) =>
    api.post<ApiResponse<SupportTicket>>('/support', data),
  listMine: () => api.get<ApiResponse<SupportTicket[]>>('/support'),
  get: (id: string) => api.get<ApiResponse<SupportTicket>>(`/support/${id}`),
  addMessage: (id: string, message: string) => api.post<ApiResponse<SupportTicket>>(`/support/${id}/messages`, { message }),
  // admin via same routes but handled in admin.api
};
