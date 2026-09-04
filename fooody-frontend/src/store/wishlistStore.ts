import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WishlistItem } from '@/types';

type WishlistState = {
  items: WishlistItem[];
  ids: Set<string>; // productIds
  setItems: (items: WishlistItem[]) => void;
  isWishlisted: (productId: string) => boolean;
  add: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      ids: new Set<string>(),
      setItems: (items) => set({ items, ids: new Set(items.map(i => i.productId)) }),
      isWishlisted: (productId) => get().ids.has(productId),
      add: (item) => set((s) => {
        if(s.ids.has(item.productId)) return s;
        const items = [...s.items, item];
        return { items, ids: new Set(items.map(i=>i.productId)) };
      }),
      remove: (productId) => set((s) => {
        const items = s.items.filter(i=>i.productId!==productId);
        return { items, ids: new Set(items.map(i=>i.productId)) };
      }),
      clear: () => set({ items: [], ids: new Set() }),
    }),
    {
      name: 'foody-wishlist',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => (state) => {
        if(state) {
          state.ids = new Set(state.items.map(i=>i.productId));
        }
      }
    }
  )
);
