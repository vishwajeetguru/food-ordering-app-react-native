import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';
import { offerSeeds } from '../utils/seed-data';

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  code: string;
  colors: string[];
  emoji: string;
  tag: string;
  active: boolean;
  createdAt: string;
}

const memoryOffers = new Map<string, Offer>();
function shouldUseMemory(): boolean { return !isFirebaseConfigured() || process.env.NODE_ENV === 'test'; }
function nowISO(){ return new Date().toISOString(); }

function ensureMemorySeed() {
  if (memoryOffers.size > 0) return;
  for (const s of offerSeeds) {
    const o = { ...s, createdAt: nowISO() } as Offer;
    memoryOffers.set(o.id, o);
  }
}

export const offerRepository = {
  _clearMemory(){ memoryOffers.clear(); },
  _getSeed(){ return offerSeeds; },
  async list(activeOnly = true): Promise<Offer[]> {
    if (shouldUseMemory()) {
      ensureMemorySeed();
      const all = Array.from(memoryOffers.values());
      return (activeOnly ? all.filter(o => o.active) : all);
    }
    try {
      let q: FirebaseFirestore.Query = getFirestore().collection(COLLECTIONS.OFFERS);
      if (activeOnly) q = q.where('active', '==', true);
      const snap = await q.get();
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Offer));
    } catch (e: any) {
      logger.warn('offerRepository.list fallback memory', { error: e.message });
      const all = Array.from(memoryOffers.values());
      return activeOnly ? all.filter(o => o.active) : all;
    }
  },
  async getById(id: string): Promise<Offer | null> {
    if (shouldUseMemory()) return memoryOffers.get(id) || null;
    try {
      const snap = await getFirestore().collection(COLLECTIONS.OFFERS).doc(id).get();
      if (!snap.exists) return memoryOffers.get(id) || null;
      return { id: snap.id, ...snap.data() } as Offer;
    } catch (e: any) {
      logger.warn('offerRepository.getById fallback memory', { error: e.message });
      return memoryOffers.get(id) || null;
    }
  },
  async create(data: Omit<Offer, 'createdAt'>): Promise<Offer> {
    const o: Offer = { ...data, createdAt: nowISO() };
    if (shouldUseMemory()) { memoryOffers.set(o.id, o); return o; }
    try {
      await getFirestore().collection(COLLECTIONS.OFFERS).doc(o.id).set(o);
      return o;
    } catch (e: any) {
      logger.warn('offerRepository.create fallback memory', { error: e.message });
      memoryOffers.set(o.id, o);
      return o;
    }
  },
};
