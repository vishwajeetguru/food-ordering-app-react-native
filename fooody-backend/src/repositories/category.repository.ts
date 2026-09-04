import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';
import { categorySeeds } from '../utils/seed-data';

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  count?: number;
  description?: string;
  displayOrder?: number;
  active?: boolean;
  createdAt: string;
  updatedAt?: string;
}

const memoryCategories = new Map<string, Category>();
function shouldUseMemory(): boolean { return !isFirebaseConfigured() || process.env.NODE_ENV === 'test'; }
function nowISO(){ return new Date().toISOString(); }

function ensureMemorySeed() {
  if (memoryCategories.size > 0) return;
  for (const s of categorySeeds) {
    const c = { ...s, createdAt: nowISO() } as Category;
    memoryCategories.set(c.id, c);
  }
}

export const categoryRepository = {
  _clearMemory(){ memoryCategories.clear(); },
  _getSeed(){ return categorySeeds; },
  async list(): Promise<Category[]> {
    if (shouldUseMemory()) { ensureMemorySeed(); return Array.from(memoryCategories.values()); }
    try {
      const snap = await getFirestore().collection(COLLECTIONS.CATEGORIES).orderBy('name').get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Category));
    } catch (e: any) {
      logger.warn('categoryRepository.list fallback memory', { error: e.message });
      return Array.from(memoryCategories.values());
    }
  },
  async getById(id: string): Promise<Category | null> {
    if (shouldUseMemory()) return memoryCategories.get(id) || null;
    try {
      const snap = await getFirestore().collection(COLLECTIONS.CATEGORIES).doc(id).get();
      if (!snap.exists) return null;
      return { id: snap.id, ...snap.data() } as Category;
    } catch (e: any) {
      logger.warn('categoryRepository.getById fallback memory', { error: e.message });
      return memoryCategories.get(id) || null;
    }
  },
  async create(data: Omit<Category, 'createdAt'>): Promise<Category> {
    const cat: Category = { ...data, createdAt: nowISO() } as Category;
    if (shouldUseMemory()) { memoryCategories.set(cat.id, cat); return cat; }
    try {
      await getFirestore().collection(COLLECTIONS.CATEGORIES).doc(cat.id).set(cat);
      return cat;
    } catch (e: any) {
      logger.warn('categoryRepository.create fallback memory', { error: e.message });
      memoryCategories.set(cat.id, cat);
      return cat;
    }
  },
  async update(id: string, patch: Partial<Category>): Promise<Category | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: nowISO() } as Category;
    if (shouldUseMemory()) { memoryCategories.set(id, updated); return updated; }
    try {
      await getFirestore().collection(COLLECTIONS.CATEGORIES).doc(id).set(updated, { merge: true });
      return updated;
    } catch (e: any) {
      logger.warn('categoryRepository.update fallback', { error: e.message });
      memoryCategories.set(id, updated);
      return updated;
    }
  },
  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;
    if (shouldUseMemory()) { memoryCategories.delete(id); return true; }
    try {
      await getFirestore().collection(COLLECTIONS.CATEGORIES).doc(id).delete();
      memoryCategories.delete(id);
      return true;
    } catch (e: any) {
      logger.warn('categoryRepository.delete fallback', { error: e.message });
      memoryCategories.delete(id);
      return true;
    }
  },
};
