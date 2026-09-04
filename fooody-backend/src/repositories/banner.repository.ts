import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  couponCode?: string;
  image: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const COLLECTION = 'banners';
const memoryBanners = new Map<string, Banner>();

function shouldUseMemory(): boolean { return !isFirebaseConfigured() || process.env.NODE_ENV === 'test'; }
function nowISO() { return new Date().toISOString(); }

export const bannerRepository = {
  _clearMemory() { memoryBanners.clear(); },
  _getMemory() { return memoryBanners; },
  async list(): Promise<Banner[]> {
    if (shouldUseMemory()) return Array.from(memoryBanners.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    try {
      const snap = await getFirestore().collection(COLLECTION).orderBy('order').get();
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner));
      // merge memory fallback
      for (const m of memoryBanners.values()) if (!docs.find((d) => d.id === m.id)) docs.push(m);
      return docs.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    } catch (e: any) {
      logger.warn('bannerRepository.list fallback memory', { error: e.message });
      return Array.from(memoryBanners.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    }
  },
  async getById(id: string): Promise<Banner | null> {
    if (memoryBanners.has(id)) return memoryBanners.get(id)!;
    if (shouldUseMemory()) return null;
    try {
      const snap = await getFirestore().collection(COLLECTION).doc(id).get();
      if (!snap.exists) return null;
      const data = { id: snap.id, ...snap.data() } as Banner;
      memoryBanners.set(id, data);
      return data;
    } catch (e: any) {
      logger.warn('bannerRepository.getById fallback', { error: e.message });
      return memoryBanners.get(id) || null;
    }
  },
  async create(data: Omit<Banner, 'createdAt'|'updatedAt'>): Promise<Banner> {
    const now = nowISO();
    const banner: Banner = { ...data, createdAt: now, updatedAt: now };
    if (shouldUseMemory()) { memoryBanners.set(banner.id, banner); return banner; }
    try {
      await getFirestore().collection(COLLECTION).doc(banner.id).set(banner);
      memoryBanners.set(banner.id, banner);
      return banner;
    } catch (e: any) {
      logger.warn('bannerRepository.create fallback', { error: e.message });
      memoryBanners.set(banner.id, banner);
      return banner;
    }
  },
  async update(id: string, patch: Partial<Banner>): Promise<Banner | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: nowISO() } as Banner;
    if (shouldUseMemory()) { memoryBanners.set(id, updated); return updated; }
    try {
      await getFirestore().collection(COLLECTION).doc(id).set(updated, { merge: true });
      memoryBanners.set(id, updated);
      return updated;
    } catch (e: any) {
      logger.warn('bannerRepository.update fallback', { error: e.message });
      memoryBanners.set(id, updated);
      return updated;
    }
  },
  async delete(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;
    if (shouldUseMemory()) { memoryBanners.delete(id); return true; }
    try {
      await getFirestore().collection(COLLECTION).doc(id).delete();
      memoryBanners.delete(id);
      return true;
    } catch (e: any) {
      logger.warn('bannerRepository.delete fallback', { error: e.message });
      memoryBanners.delete(id);
      return true;
    }
  },
};
