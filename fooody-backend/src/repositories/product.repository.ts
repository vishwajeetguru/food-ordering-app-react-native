import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';
import { productSeeds } from '../utils/seed-data';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  ratingCount: number;
  isVeg: boolean;
  categoryId: string;
  categoryName?: string;
  prepTime?: string;
  tags?: string[];
  isPopular?: boolean;
  isRecommended?: boolean;
  createdAt: string;
  updatedAt: string;
}

const memoryProducts = new Map<string, Product>();

function shouldUseMemory(): boolean {
  return !isFirebaseConfigured() || process.env.NODE_ENV === 'test';
}

function nowISO() { return new Date().toISOString(); }

function ensureMemorySeed() {
  if (memoryProducts.size > 0) return;
  for (const s of productSeeds) {
    const p = { ...s, createdAt: nowISO(), updatedAt: nowISO() } as Product;
    memoryProducts.set(p.id, p);
  }
}

export const productRepository = {
  _clearMemory() { memoryProducts.clear(); },
  _getSeed() { return productSeeds; },

  async list(opts: { categoryId?: string; limit?: number; search?: string; isPopular?: boolean; isRecommended?: boolean; isVeg?: boolean } = {}): Promise<Product[]> {
    const limit = Math.min(opts.limit || 20, 100);
    const filter = (arr: Product[]) => {
      let out = arr;
      if (opts.categoryId) out = out.filter(p => p.categoryId === opts.categoryId);
      if (opts.isPopular !== undefined) out = out.filter(p => !!p.isPopular === opts.isPopular);
      if (opts.isRecommended !== undefined) out = out.filter(p => !!p.isRecommended === opts.isRecommended);
      if (opts.isVeg !== undefined) out = out.filter(p => !!p.isVeg === opts.isVeg);
      if (opts.search) {
        const s = opts.search.toLowerCase();
        out = out.filter(p =>
          p.name.toLowerCase().includes(s) ||
          p.description.toLowerCase().includes(s) ||
          (p.categoryName || '').toLowerCase().includes(s)
        );
      }
      return out.sort((a, b) => b.rating - a.rating).slice(0, limit);
    };

    if (shouldUseMemory()) { ensureMemorySeed(); return filter(Array.from(memoryProducts.values())); }

    try {
      let q: FirebaseFirestore.Query = getFirestore().collection(COLLECTIONS.PRODUCTS);
      if (opts.categoryId) q = q.where('categoryId', '==', opts.categoryId);
      if (opts.isPopular !== undefined) q = q.where('isPopular', '==', opts.isPopular);
      if (opts.isRecommended !== undefined) q = q.where('isRecommended', '==', opts.isRecommended);
      if (opts.isVeg !== undefined) q = q.where('isVeg', '==', opts.isVeg);
      const snap = await q.get();
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as Product));
      return filter(docs);
    } catch (e: any) {
      logger.warn('productRepository.list firestore error, fallback memory', { error: e.message });
      return filter(Array.from(memoryProducts.values()));
    }
  },

  async getById(id: string): Promise<Product | null> {
    if (shouldUseMemory()) return memoryProducts.get(id) || null;
    try {
      const snap = await getFirestore().collection(COLLECTIONS.PRODUCTS).doc(id).get();
      if (!snap.exists) return null;
      return { id: snap.id, ...snap.data() } as Product;
    } catch (e: any) {
      logger.warn('productRepository.getById error, fallback memory', { error: e.message });
      return memoryProducts.get(id) || null;
    }
  },

  async create(data: Omit<Product, 'createdAt'|'updatedAt'>): Promise<Product> {
    const now = nowISO();
    const prod: Product = { ...data, createdAt: now, updatedAt: now };
    if (shouldUseMemory()) { memoryProducts.set(prod.id, prod); return prod; }
    try {
      await getFirestore().collection(COLLECTIONS.PRODUCTS).doc(prod.id).set(prod);
      return prod;
    } catch (e: any) {
      logger.warn('productRepository.create fallback memory', { error: e.message });
      memoryProducts.set(prod.id, prod);
      return prod;
    }
  },

  async update(id: string, patch: Partial<Product>): Promise<Product | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: nowISO() } as Product;
    if (shouldUseMemory()) { memoryProducts.set(id, updated); return updated; }
    try {
      await getFirestore().collection(COLLECTIONS.PRODUCTS).doc(id).set(updated, { merge: true });
      return updated;
    } catch (e: any) {
      logger.warn('productRepository.update fallback memory', { error: e.message });
      memoryProducts.set(id, updated);
      return updated;
    }
  },
};
