import { COLLECTIONS } from '../config/constants';
import { getFirestore, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';
import { OtpRecord } from '../types/auth.types';

const memoryOtps = new Map<string, OtpRecord>();

function shouldUseMemory(): boolean {
  return !isFirebaseConfigured() || process.env.NODE_ENV === 'test';
}

function docId(email: string, channel: string): string {
  return `${channel}:${email.toLowerCase().trim()}`;
}

export const otpRepository = {
  _clearMemory() {
    memoryOtps.clear();
  },
  _getMemoryMap() {
    return memoryOtps;
  },
  _docId: docId,

  async get(email: string, channel = 'email'): Promise<OtpRecord | null> {
    const id = docId(email, channel);
    if (shouldUseMemory()) {
      return memoryOtps.get(id) || null;
    }
    try {
      const snap = await getFirestore().collection(COLLECTIONS.OTPS).doc(id).get();
      if (!snap.exists) return null;
      return snap.data() as OtpRecord;
    } catch (e: any) {
      logger.warn('otpRepository.get error', { error: e.message });
      return memoryOtps.get(id) || null;
    }
  },

  async set(record: OtpRecord): Promise<void> {
    const id = docId(record.email, record.channel);
    if (shouldUseMemory()) {
      memoryOtps.set(id, record);
      return;
    }
    try {
      await getFirestore().collection(COLLECTIONS.OTPS).doc(id).set(record);
      // also keep memory for fallback consistency
      memoryOtps.set(id, record);
    } catch (e: any) {
      logger.warn('otpRepository.set error', { error: e.message });
      memoryOtps.set(id, record);
    }
  },

  async delete(email: string, channel = 'email'): Promise<void> {
    const id = docId(email, channel);
    if (shouldUseMemory()) {
      memoryOtps.delete(id);
      return;
    }
    try {
      await getFirestore().collection(COLLECTIONS.OTPS).doc(id).delete();
      memoryOtps.delete(id);
    } catch (e: any) {
      logger.warn('otpRepository.delete error', { error: e.message });
      memoryOtps.delete(id);
    }
  },

  async incrementAttempts(email: string, channel = 'email'): Promise<OtpRecord | null> {
    const rec = await this.get(email, channel);
    if (!rec) return null;
    rec.attempts += 1;
    await this.set(rec);
    return rec;
  },
};
