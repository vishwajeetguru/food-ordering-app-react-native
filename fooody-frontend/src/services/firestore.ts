// Firestore service — DEPRECATED direct access, now API-only (backend owns Firebase Admin)
// SECURITY FIX 2026-09: Frontend must NOT talk to Firestore directly per architecture "Firebase in backend, frontend via API only".
// This file is kept for backward-compat but all methods now proxy to backend API via src/api/client.
// Direct Firestore code is commented as fallback for legacy but disabled by default.
// If you need realtime, add backend SSE/WebSocket or poll; don't re-enable direct reads without security review.

import { api } from '@/api/client';
import type { User, Product, Category, Order, Address } from '@/types';
import type { ApiResponse } from '@/types';

// Users — via /auth/me or /users/me (single source)
export const userFirestore = {
  async get(_uid: string): Promise<User | null> {
    try {
      const res = await api.get<ApiResponse<User>>('/users/me');
      return res.data as User;
    } catch { return null; }
  },
  async set(_uid: string, _data: Partial<User>) {
    console.warn('[firestore] userFirestore.set is deprecated — use userApi.updateMe via API');
    // proxy to API
    await api.patch<ApiResponse<User>>('/users/me', _data);
  },
  async update(_uid: string, data: Partial<User>) {
    console.warn('[firestore] userFirestore.update deprecated — use API');
    await api.patch<ApiResponse<User>>('/users/me', data);
  },
  listen(_uid: string, _cb: (user: User | null) => void) {
    console.warn('[firestore] realtime listen disabled in API-only mode — polling once');
    // one-shot poll
    this.get(_uid).then(_cb);
    return () => {};
  },
};

// Products — via /products (public)
export const productFirestore = {
  async listByCategory(categoryId?: string): Promise<Product[]> {
    const qs = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : '';
    const res = await api.get<ApiResponse<Product[]>>(`/products${qs}`);
    return (res.data as Product[]) || [];
  },
  async get(id: string): Promise<Product | null> {
    try {
      const res = await api.get<ApiResponse<Product>>(`/products/${id}`);
      return res.data as Product;
    } catch { return null; }
  },
  listenAll(cb: (products: Product[]) => void) {
    this.listByCategory().then(cb);
    return () => {};
  },
};

// Categories — via /categories
export const categoryFirestore = {
  async list(): Promise<Category[]> {
    const res = await api.get<ApiResponse<Category[]>>('/categories');
    return (res.data as Category[]) || [];
  },
};

// Orders — user-scoped via /orders (requires Bearer token)
export const orderFirestore = {
  async listForUser(_uid: string): Promise<Order[]> {
    const res = await api.get<ApiResponse<Order[]>>('/orders');
    return (res.data as Order[]) || [];
  },
  async get(orderId: string): Promise<Order | null> {
    try {
      const res = await api.get<ApiResponse<Order>>(`/orders/${orderId}`);
      return res.data as Order;
    } catch { return null; }
  },
  listenForUser(_uid: string, cb: (orders: Order[]) => void) {
    this.listForUser(_uid).then(cb);
    return () => {};
  },
};

// Addresses — via /addresses (requires Bearer)
export const addressFirestore = {
  async listForUser(_uid: string): Promise<Address[]> {
    const res = await api.get<ApiResponse<Address[]>>('/addresses');
    return (res.data as Address[]) || [];
  },
};
