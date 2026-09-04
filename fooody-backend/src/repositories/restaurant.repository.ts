import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';
import { restaurantSeed } from '../utils/seed-data';

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  logo: string;
  rating: number;
  ratingCount: number;
  deliveryTime: string;
  priceForTwo: number;
  cuisines: string[];
  about: string;
  createdAt: string;
  updatedAt?: string;
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  closingHours?: string;
  isOpen?: boolean;
  deliveryCharge?: number;
  minOrderAmount?: number;
  taxRate?: number;
}

const DEFAULT_ID = 'default';

const memoryRestaurant: Restaurant = {
  ...restaurantSeed,
  createdAt: new Date().toISOString(),
};

function shouldUseMemory(): boolean { return !isFirebaseConfigured() || process.env.NODE_ENV === 'test'; }

export const restaurantRepository = {
  _getSeed(){ return [restaurantSeed]; },
  async getDefault(): Promise<Restaurant> {
    return (await this.getById(DEFAULT_ID)) ?? memoryRestaurant;
  },
  async list(): Promise<Restaurant[]> {
    if (shouldUseMemory()) return [memoryRestaurant];
    try {
      const snap = await getFirestore().collection(COLLECTIONS.RESTAURANTS).limit(10).get();
      if (snap.empty) return [memoryRestaurant];
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as Restaurant));
    } catch (e: any) {
      logger.warn('restaurantRepository.list fallback memory', { error: e.message });
      return [memoryRestaurant];
    }
  },
  async getById(id: string): Promise<Restaurant | null> {
    if (shouldUseMemory()) return memoryRestaurant.id === id ? memoryRestaurant : null;
    try {
      const snap = await getFirestore().collection(COLLECTIONS.RESTAURANTS).doc(id).get();
      if (!snap.exists) return memoryRestaurant.id === id ? memoryRestaurant : null;
      return { id: snap.id, ...snap.data() } as Restaurant;
    } catch (e: any) {
      logger.warn('restaurantRepository.getById fallback memory', { error: e.message });
      return memoryRestaurant.id === id ? memoryRestaurant : null;
    }
  },
  async create(data: Omit<Restaurant, 'createdAt'>): Promise<Restaurant> {
    const r: Restaurant = { ...data, createdAt: new Date().toISOString() } as Restaurant;
    if (shouldUseMemory()) {
      Object.assign(memoryRestaurant, r);
      return r;
    }
    try {
      await getFirestore().collection(COLLECTIONS.RESTAURANTS).doc(r.id).set(r);
      Object.assign(memoryRestaurant, r);
      return r;
    } catch (e: any) {
      logger.warn('restaurantRepository.create fallback memory', { error: e.message });
      Object.assign(memoryRestaurant, r);
      return r;
    }
  },
  async update(id: string, patch: Partial<Restaurant>): Promise<Restaurant | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const updated = { ...existing, ...patch, updatedAt: new Date().toISOString() } as Restaurant;
    if (shouldUseMemory()) {
      if (id === DEFAULT_ID) Object.assign(memoryRestaurant, updated);
      return updated;
    }
    try {
      await getFirestore().collection(COLLECTIONS.RESTAURANTS).doc(id).set(updated, { merge: true });
      if (id === DEFAULT_ID) Object.assign(memoryRestaurant, updated);
      return updated;
    } catch (e: any) {
      logger.warn('restaurantRepository.update fallback', { error: e.message });
      if (id === DEFAULT_ID) Object.assign(memoryRestaurant, updated);
      return updated;
    }
  },
};
