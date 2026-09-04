import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem, Product } from '@/types';

type CartState = {
  items: CartItem[];
  add: (product: Product, qty?: number) => void;
  remove: (productId: string) => void;
  inc: (productId: string) => void;
  dec: (productId: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (product, qty = 1) =>
        set((s) => {
          const idx = s.items.findIndex((i) => i.product.id === product.id);
          if (idx >= 0) {
            const n = [...s.items];
            n[idx] = { ...n[idx], quantity: n[idx].quantity + qty };
            return { items: n };
          }
          return { items: [...s.items, { product, quantity: qty }] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.product.id !== id) })),
      inc: (id) => set((s) => ({ items: s.items.map((i) => (i.product.id === id ? { ...i, quantity: i.quantity + 1 } : i)) })),
      dec: (id) =>
        set((s) => {
          const it = s.items.find((i) => i.product.id === id);
          if (!it) return s;
          if (it.quantity <= 1) return { items: s.items.filter((i) => i.product.id !== id) };
          return { items: s.items.map((i) => (i.product.id === id ? { ...i, quantity: i.quantity - 1 } : i)) };
        }),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((a, b) => a + b.quantity, 0),
      subtotal: () => get().items.reduce((a, b) => a + b.product.price * b.quantity, 0),
    }),
    { name: 'foody-cart', storage: createJSONStorage(() => AsyncStorage) }
  )
);
