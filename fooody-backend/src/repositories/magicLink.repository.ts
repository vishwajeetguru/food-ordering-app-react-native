import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';
import { MagicLinkRecord } from '../types/auth.types';

const memoryLinks = new Map<string, MagicLinkRecord>(); // keyed by tokenHash
// Also index by id
function shouldUseMemory(): boolean {
  return !isFirebaseConfigured() || process.env.NODE_ENV === 'test';
}

export const magicLinkRepository = {
  _clearMemory() {
    memoryLinks.clear();
  },
  _getMemoryMap() {
    return memoryLinks;
  },

  async getByHash(tokenHash: string): Promise<MagicLinkRecord | null> {
    if (shouldUseMemory()) {
      return memoryLinks.get(tokenHash) || null;
    }
    try {
      const snap = await getFirestore()
        .collection(COLLECTIONS.MAGIC_LINKS)
        .doc(tokenHash)
        .get();
      if (!snap.exists) return null;
      return snap.data() as MagicLinkRecord;
    } catch (e: any) {
      logger.warn('magicLinkRepository.getByHash error', { error: e.message });
      return memoryLinks.get(tokenHash) || null;
    }
  },

  async create(record: MagicLinkRecord): Promise<void> {
    if (shouldUseMemory()) {
      memoryLinks.set(record.tokenHash, record);
      return;
    }
    try {
      await getFirestore().collection(COLLECTIONS.MAGIC_LINKS).doc(record.tokenHash).set(record);
      memoryLinks.set(record.tokenHash, record);
    } catch (e: any) {
      logger.warn('magicLinkRepository.create error', { error: e.message });
      memoryLinks.set(record.tokenHash, record);
    }
  },

  async markUsed(tokenHash: string): Promise<void> {
    const rec = await this.getByHash(tokenHash);
    if (!rec) return;
    rec.used = true;
    rec.usedAt = new Date().toISOString();
    if (shouldUseMemory()) {
      memoryLinks.set(tokenHash, rec);
      return;
    }
    try {
      await getFirestore().collection(COLLECTIONS.MAGIC_LINKS).doc(tokenHash).update({
        used: true,
        usedAt: rec.usedAt,
      });
      memoryLinks.set(tokenHash, rec);
    } catch (e: any) {
      logger.warn('magicLinkRepository.markUsed error', { error: e.message });
      memoryLinks.set(tokenHash, rec);
    }
  },

  // Optional cleanup helper
  async delete(tokenHash: string): Promise<void> {
    if (shouldUseMemory()) {
      memoryLinks.delete(tokenHash);
      return;
    }
    try {
      await getFirestore().collection(COLLECTIONS.MAGIC_LINKS).doc(tokenHash).delete();
      memoryLinks.delete(tokenHash);
    } catch {
      memoryLinks.delete(tokenHash);
    }
  },
};
