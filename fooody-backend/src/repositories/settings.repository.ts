import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';

export interface AppSettings {
  id: string;
  restaurant: any;
  home: {
    popularLimit: number;
    popularEnabled: boolean;
    categoriesEnabled: boolean;
    featuredIds?: string[];
  };
  bannersEnabled?: boolean;
  updatedAt: string;
}

const COLLECTION = 'settings';
const DOC_ID = 'app';

const defaultSettings: AppSettings = {
  id: DOC_ID,
  restaurant: null,
  home: { popularLimit: 6, popularEnabled: true, categoriesEnabled: true, featuredIds: [] },
  bannersEnabled: true,
  updatedAt: new Date().toISOString(),
};

let memorySettings: AppSettings = { ...defaultSettings };

function shouldUseMemory(): boolean { return !isFirebaseConfigured() || process.env.NODE_ENV === 'test'; }
function nowISO() { return new Date().toISOString(); }

export const settingsRepository = {
  _resetMemory() { memorySettings = { ...defaultSettings, updatedAt: nowISO() }; },
  async get(): Promise<AppSettings> {
    if (shouldUseMemory()) return memorySettings;
    try {
      const snap = await getFirestore().collection(COLLECTION).doc(DOC_ID).get();
      if (!snap.exists) return memorySettings;
      const data = snap.data() as AppSettings;
      memorySettings = data;
      return data;
    } catch (e: any) {
      logger.warn('settingsRepository.get fallback', { error: e.message });
      return memorySettings;
    }
  },
  async update(patch: Partial<AppSettings>): Promise<AppSettings> {
    const existing = await this.get();
    const updated: AppSettings = { ...existing, ...patch, id: DOC_ID, updatedAt: nowISO() } as AppSettings;
    // deep merge home
    if (patch.home) updated.home = { ...existing.home, ...patch.home };
    if (shouldUseMemory()) { memorySettings = updated; return updated; }
    try {
      await getFirestore().collection(COLLECTION).doc(DOC_ID).set(updated, { merge: true });
      memorySettings = updated;
      return updated;
    } catch (e: any) {
      logger.warn('settingsRepository.update fallback', { error: e.message });
      memorySettings = updated;
      return updated;
    }
  },
  async updateHome(homePatch: Partial<AppSettings['home']>): Promise<AppSettings> {
    return this.update({ home: { ...(await this.get()).home, ...homePatch } } as any);
  },
};
