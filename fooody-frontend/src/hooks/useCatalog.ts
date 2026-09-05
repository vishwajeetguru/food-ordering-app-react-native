import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi, categoryApi, restaurantApi, offerApi, homeApi } from '@/api/catalog.api';
import { orderApi, addressApi } from '@/api/order.api';
import { useAuthStore } from '@/store/authStore';

// Products ------------------------------------------------------

export function useProducts(params?: { categoryId?: string; limit?: number; search?: string; isPopular?: boolean; isRecommended?: boolean; isVeg?: boolean }) {
  return useQuery({ queryKey: ['products', params], queryFn: () => productApi.list(params).then(r => r.data ?? []), refetchInterval: 8000, staleTime: 4000 });
}
export function useProduct(id: string, enabled = true) {
  return useQuery({ queryKey: ['product', id], queryFn: () => productApi.get(id).then(r => r.data), enabled: !!id && enabled, refetchInterval: 8000 });
}

// Categories ----------------------------------------------------

export function useCategories() {
  return useQuery({ queryKey: ['categories'], queryFn: () => categoryApi.list().then(r => r.data ?? []), refetchInterval: 15000 });
}

// Restaurant ----------------------------------------------------

export function useRestaurant() {
  return useQuery({ queryKey: ['restaurant'], queryFn: () => restaurantApi.getDefault().then(r => r.data), refetchInterval: 10000 });
}

// Offers --------------------------------------------------------

export function useOffers() {
  return useQuery({ queryKey: ['offers'], queryFn: () => offerApi.list().then(r => r.data ?? []), refetchInterval: 15000 });
}

// Home aggregated -----------------------------------------------

export function useHome() {
  return useQuery({ queryKey: ['home'], queryFn: () => homeApi.get().then(r => r.data), refetchInterval: 8000, staleTime: 3000 });
}

// Orders --------------------------------------------------------
// Polling fallback (7s) when Firestore realtime not available or not configured

export function useOrders() {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return useQuery({
    queryKey: ['orders'],
    queryFn: () => orderApi.list().then(r => r.data ?? []),
    enabled: isAuthenticated,
    refetchInterval: 7000,
    staleTime: 3000,
    retry: 0,
  });
}
export function useOrder(id: string, enabled = true) {
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => orderApi.get(id).then(r => r.data),
    enabled: !!id && enabled && isAuthenticated,
    refetchInterval: 5000,
    retry: 0,
  });
}
export function useCreateOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => orderApi.create(data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders'] }),
  });
}

// Addresses -----------------------------------------------------

export function useAddresses() {
  return useQuery({ queryKey: ['addresses'], queryFn: () => addressApi.list().then(r => r.data ?? []), refetchInterval: 10000 });
}
export function useDefaultAddress() {
  return useQuery({ queryKey: ['addresses', 'default'], queryFn: () => addressApi.getDefault().then(r => r.data).catch(()=> null), refetchInterval: 10000 });
}
export function useCreateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => addressApi.create(data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      qc.invalidateQueries({ queryKey: ['addresses', 'default'] });
    },
  });
}
export function useUpdateAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => addressApi.update(id, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      qc.invalidateQueries({ queryKey: ['addresses', 'default'] });
    },
  });
}
export function useDeleteAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressApi.delete(id).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      qc.invalidateQueries({ queryKey: ['addresses', 'default'] });
    },
  });
}
export function useSetDefaultAddress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => addressApi.setDefault(id).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      qc.invalidateQueries({ queryKey: ['addresses', 'default'] });
    },
  });
}
