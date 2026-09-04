import { api, unwrap } from './client';
import type { Product, Category, Offer, Order, User, Restaurant, Analytics, Banner, HomeSettings, ApiResponse } from '@/types';

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', { email, password }).then((r) => r.data.data),
  me: () => api.get<ApiResponse<User>>('/auth/me').then((r) => r.data.data),
};

// Products — uses existing backend product routes (some admin-only)
export const productApi = {
  list: (params?: Record<string, string | number | boolean>) => {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}` : '';
    return api.get<ApiResponse<Product[]>>(`/products${qs}`).then((r) => r.data.data);
  },
  get: (id: string) => api.get<ApiResponse<Product>>(`/products/${id}`).then((r) => r.data.data),
  create: (data: Partial<Product>) => api.post<ApiResponse<Product>>('/products', data).then((r) => r.data.data),
  update: (id: string, data: Partial<Product>) => api.patch<ApiResponse<Product>>(`/products/${id}`, data).then((r) => r.data.data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/products/${id}`).then((r) => r.data),
  duplicate: (id: string) => api.post<ApiResponse<Product>>(`/products/${id}/duplicate`).then((r) => r.data.data),
};

// Categories
export const categoryApi = {
  list: () => api.get<ApiResponse<Category[]>>('/categories').then((r) => r.data.data),
  get: (id: string) => api.get<ApiResponse<Category>>(`/categories/${id}`).then((r) => r.data.data),
  create: (data: Partial<Category>) => api.post<ApiResponse<Category>>('/categories', data).then((r) => r.data.data),
  update: (id: string, data: Partial<Category>) => api.patch<ApiResponse<Category>>(`/categories/${id}`, data).then((r) => r.data.data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/categories/${id}`).then((r) => r.data),
};

// Offers
export const offerApi = {
  list: (activeOnly = false) => api.get<ApiResponse<Offer[]>>(activeOnly ? '/offers?active=true' : '/offers?active=false').then((r) => r.data.data),
  get: (id: string) => api.get<ApiResponse<Offer>>(`/offers/${id}`).then((r) => r.data.data),
  create: (data: Partial<Offer>) => api.post<ApiResponse<Offer>>('/offers', data).then((r) => r.data.data),
  update: (id: string, data: Partial<Offer>) => api.patch<ApiResponse<Offer>>(`/offers/${id}`, data).then((r) => r.data.data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/offers/${id}`).then((r) => r.data),
};

// Orders — admin sees all
export const orderApi = {
  list: (params?: Record<string, string | number>) => {
    const qs = params ? `?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)])).toString()}` : '';
    return api.get<ApiResponse<Order[]>>(`/orders${qs}`).then((r) => r.data.data);
  },
  listAll: () => api.get<ApiResponse<Order[]>>('/admin/orders').then((r) => r.data.data).catch(() => api.get<ApiResponse<Order[]>>('/orders?limit=100').then((r) => r.data.data)),
  get: (id: string) => api.get<ApiResponse<Order>>(`/orders/${id}`).then((r) => r.data.data),
  updateStatus: (id: string, status: Order['status']) => api.patch<ApiResponse<Order>>(`/orders/${id}/status`, { status }).then((r) => r.data.data),
};

// Users / Customers
export const userApi = {
  list: () => api.get<ApiResponse<User[]>>('/admin/users').then((r) => r.data.data).catch(() => api.get<ApiResponse<User[]>>('/users').then((r) => r.data.data).catch(() => [] as User[])),
  get: (id: string) => api.get<ApiResponse<User>>(`/admin/users/${id}`).then((r) => r.data.data),
  update: (id: string, data: Partial<User>) => api.patch<ApiResponse<User>>(`/admin/users/${id}`, data).then((r) => r.data.data),
};

// Restaurant
export const restaurantApi = {
  get: () => api.get<ApiResponse<Restaurant>>('/restaurant/default').then((r) => r.data.data),
  update: (data: Partial<Restaurant>) => api.patch<ApiResponse<Restaurant>>('/admin/restaurant', data).then((r) => r.data.data).catch(() => api.patch<ApiResponse<Restaurant>>('/restaurants/default', data).then((r) => r.data.data)),
};

// Analytics
export const analyticsApi = {
  get: () => api.get<ApiResponse<Analytics>>('/admin/analytics').then((r) => r.data.data),
};

// Banners / Home
export const bannerApi = {
  list: () => api.get<ApiResponse<Banner[]>>('/admin/banners').then((r) => r.data.data).catch(() => [] as Banner[]),
  create: (data: Partial<Banner>) => api.post<ApiResponse<Banner>>('/admin/banners', data).then((r) => r.data.data),
  update: (id: string, data: Partial<Banner>) => api.patch<ApiResponse<Banner>>(`/admin/banners/${id}`, data).then((r) => r.data.data),
  delete: (id: string) => api.delete<ApiResponse<null>>(`/admin/banners/${id}`).then((r) => r.data),
  settings: () => api.get<ApiResponse<HomeSettings>>('/admin/home-settings').then((r) => r.data.data).catch(() => null as unknown as HomeSettings),
  updateSettings: (data: Partial<HomeSettings>) => api.patch<ApiResponse<HomeSettings>>('/admin/home-settings', data).then((r) => r.data.data),
};

// Settings
export const settingsApi = {
  get: () => api.get<ApiResponse<Restaurant>>('/admin/settings').then((r) => r.data.data).catch(() => restaurantApi.get()),
  update: (data: any) => api.patch<ApiResponse<Restaurant>>('/admin/settings', data).then((r) => r.data.data).catch(() => restaurantApi.update(data)),
};
