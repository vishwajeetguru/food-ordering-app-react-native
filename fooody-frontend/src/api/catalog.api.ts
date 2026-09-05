import { api } from './client';
import type { ApiResponse, Product, Category, Restaurant, Offer, HomeData } from '@/types';

export const productApi = {
  list: (
    params?: {
      categoryId?: string;
      limit?: number;
      search?: string;
      isPopular?: boolean;
      isRecommended?: boolean;
      isVeg?: boolean;
    },
    opts?: any
  ) => {
    const qs = new URLSearchParams();
    if (params?.categoryId) qs.set('categoryId', params.categoryId);
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.isPopular !== undefined) qs.set('isPopular', String(params.isPopular));
    if (params?.isRecommended !== undefined) qs.set('isRecommended', String(params.isRecommended));
    if (params?.isVeg !== undefined) qs.set('isVeg', String(params.isVeg));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return api.get<ApiResponse<Product[]>>(`/products${suffix}`, opts);
  },
  get: (id: string) => api.get<ApiResponse<Product>>(`/products/${id}`),
  create: (data: any) => api.post<ApiResponse<Product>>('/products', data),
  update: (id: string, data: any) => api.patch<ApiResponse<Product>>(`/products/${id}`, data),
};

export const categoryApi = {
  list: () => api.get<ApiResponse<Category[]>>('/categories'),
  get: (id: string) => api.get<ApiResponse<Category>>(`/categories/${id}`),
};

export const restaurantApi = {
  getDefault: () => api.get<ApiResponse<Restaurant>>('/restaurant/default'),
  list: () => api.get<ApiResponse<Restaurant[]>>('/restaurants'),
  get: (id: string) => api.get<ApiResponse<Restaurant>>(`/restaurants/${id}`),
};

export const offerApi = {
  list: (activeOnly = true) => api.get<ApiResponse<Offer[]>>(activeOnly ? '/offers' : '/offers?active=false'),
  get: (id: string) => api.get<ApiResponse<Offer>>(`/offers/${id}`),
};

export const homeApi = {
  get: () => api.get<ApiResponse<HomeData>>('/home'),
};

export const settingsApi = {
  get: () => api.get<ApiResponse<{ maintenanceMode: boolean; maintenanceMessage: string; home: any; bannersEnabled: boolean }>>('/settings'),
};
