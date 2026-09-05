import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { wishlistApi } from '@/api/wishlist.api';
import { useWishlistStore } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import * as Haptics from 'expo-haptics';

export function useWishlist() {
  const setItems = useWishlistStore(s => s.setItems);
  const isAuthenticated = useAuthStore(s => s.isAuthenticated);
  return useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await wishlistApi.list();
      const items = res.data ?? [];
      setItems(items as any);
      return items;
    },
    enabled: isAuthenticated,
    staleTime: 10000,
    refetchInterval: 8000,
  });
}

export function useToggleWishlist() {
  const qc = useQueryClient();
  const store = useWishlistStore();
  return useMutation({
    mutationFn: (productId: string) => wishlistApi.toggle(productId).then(r=> r.data as any),
    onMutate: async (productId) => {
      // optimistic
      const isWishlisted = store.isWishlisted(productId);
      if(isWishlisted) store.remove(productId);
      // else we will add after success with placeholder
    },
    onSuccess: (data, productId) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
      // data.added indicates
      qc.invalidateQueries({ queryKey: ['wishlist'] });
    },
    onError: () => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
    }
  });
}

export function useWishlistCheck(productId: string) {
  return useQuery({
    queryKey: ['wishlist', 'check', productId],
    queryFn: () => wishlistApi.check(productId).then(r=> (r.data as any).wishlisted as boolean),
    enabled: !!productId,
  });
}
