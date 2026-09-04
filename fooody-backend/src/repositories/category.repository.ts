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
  createdAt: string;
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
    const cat: Category = { ...data, createdAt: nowISO() };
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
};
