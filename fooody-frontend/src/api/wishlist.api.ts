import { api } from './client';
import type { ApiResponse, Product } from '@/types';

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product?: Product | null;
}

export const wishlistApi = {
  list: () => api.get<ApiResponse<WishlistItem[]>>('/wishlist'),
  add: (productId: string) => api.post<ApiResponse<WishlistItem>>('/wishlist', { productId }),
  toggle: (productId: string) => api.post<ApiResponse<{ added: boolean }>>('/wishlist/toggle', { productId }),
  remove: (productId: string) => api.delete<ApiResponse<null>>(`/wishlist/${productId}`),
  check: (productId: string) => api.get<ApiResponse<{ productId: string; wishlisted: boolean }>>(`/wishlist/check/${productId}`),
};
