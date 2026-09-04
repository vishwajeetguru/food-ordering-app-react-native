import { api } from './client';
import type { ApiResponse, Order, Address } from '@/types';

export const orderApi = {
  list: (params?: { limit?: number }) => {
    const qs = params?.limit ? `?limit=${params.limit}` : '';
    return api.get<ApiResponse<Order[]>>(`/orders${qs}`);
  },
  create: (data: any) => api.post<ApiResponse<Order>>('/orders', data),
  get: (id: string) => api.get<ApiResponse<Order>>(`/orders/${id}`),
};

export const addressApi = {
  list: () => api.get<ApiResponse<Address[]>>('/addresses'),
  create: (data: any) => api.post<ApiResponse<Address>>('/addresses', data),
  update: (id: string, data: any) => api.patch<ApiResponse<Address>>(`/addresses/${id}`, data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/addresses/${id}`),
};
