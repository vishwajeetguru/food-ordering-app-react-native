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
  getDefault: () => api.get<ApiResponse<Address>>('/addresses/default'),
  create: (data: any) => api.post<ApiResponse<Address>>('/addresses', data),
  update: (id: string, data: any) => api.patch<ApiResponse<Address>>(`/addresses/${id}`, data),
  setDefault: (id: string) => api.patch<ApiResponse<Address>>(`/addresses/${id}/default`, {}),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/addresses/${id}`),
  reverseGeocode: (lat: number, lng: number) =>
    api.post<ApiResponse<import('@/types').ReverseGeocodeResult>>('/addresses/reverse-geocode', { lat, lng }),
  geocodeSearch: (q: string) =>
    api.get<ApiResponse<import('@/types').GeocodeSearchResult[]>>(`/addresses/geocode/search?q=${encodeURIComponent(q)}`),
};
