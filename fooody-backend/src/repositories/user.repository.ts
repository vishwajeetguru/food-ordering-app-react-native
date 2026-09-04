import { COLLECTIONS } from '../config/constants';
import { getFirestore } from '../config/firebase';
import { logger } from '../utils/logger';
import { CreateUserInput, UpdateUserInput, User } from '../types/user.types';
import { USER_ROLES, USER_STATUS } from '../config/constants';
import { shouldUseMemory, nowISO } from '../utils/repository.helper';

// In-memory fallback for dev/test when Firestore unavailable
const memoryUsers = new Map<string, User>();

export const userRepository = {
  // For testing: clear memory
  _clearMemory() {
    memoryUsers.clear();
  },
  _getMemoryMap() {
    return memoryUsers;
  },

  async findById(uid: string): Promise<User | null> {
    if (shouldUseMemory()) {
      return memoryUsers.get(uid) || null;
    }
    try {
      const snap = await getFirestore().collection(COLLECTIONS.USERS).doc(uid).get();
      if (!snap.exists) return null;
      return snap.data() as User;
    } catch (e: any) {
      logger.warn('userRepository.findById firestore error, fallback to memory', { error: e.message });
      return memoryUsers.get(uid) || null;
    }
  },

  async findByEmail(email: string): Promise<User | null> {
    const normalized = email.toLowerCase().trim();
    if (shouldUseMemory()) {
      for (const u of memoryUsers.values()) {
        if (u.email.toLowerCase() === normalized) return u;
      }
      return null;
    }
    try {
      const qs = await getFirestore()
        .collection(COLLECTIONS.USERS)
        .where('email', '==', normalized)
        .limit(1)
        .get();
      if (qs.empty) return null;
      return qs.docs[0].data() as User;
    } catch (e: any) {
      logger.warn('userRepository.findByEmail firestore error, fallback to memory', { error: e.message });
      for (const u of memoryUsers.values()) {
        if (u.email.toLowerCase() === normalized) return u;
      }
      return null;
    }
  },

  async create(input: CreateUserInput): Promise<User> {
    const ts = nowISO();
    const user: User = {
      id: input.id,
      email: input.email.toLowerCase().trim(),
      phone: input.phone ?? null,
      name: input.name ?? null,
      profileImage: null,
      providers: input.providers ?? ['email'],
      emailVerified: input.emailVerified ?? false,
      phoneVerified: false,
      hasPassword: input.hasPassword ?? false,
      role: input.role ?? USER_ROLES.CUSTOMER,
      status: USER_STATUS.ACTIVE,
      createdAt: ts,
      updatedAt: ts,
    };

    if (shouldUseMemory()) {
      memoryUsers.set(user.id, user);
      return user;
    }

    try {
      await getFirestore().collection(COLLECTIONS.USERS).doc(user.id).set(user);
      return user;
    } catch (e: any) {
      logger.warn('userRepository.create firestore error, using memory', { error: e.message });
      memoryUsers.set(user.id, user);
      return user;
    }
  },

  async upsert(input: CreateUserInput): Promise<User> {
    const existing = await this.findById(input.id);
    if (existing) {
      const providers = Array.from(new Set([...existing.providers, ...(input.providers ?? [])]));
      const patch: Partial<User> = {};
      if (providers.length !== existing.providers.length) (patch as any).providers = providers;
      if (input.emailVerified && !existing.emailVerified) (patch as any).emailVerified = true;
      if (input.hasPassword && !existing.hasPassword) (patch as any).hasPassword = true;
      if (input.phone && !existing.phone) (patch as any).phone = input.phone;
      if (input.name && !existing.name) (patch as any).name = input.name;
      if (Object.keys(patch).length === 0) return existing;
      return this.update(input.id, patch as any);
    }
    return this.create(input);
  },

  async update(uid: string, data: Partial<User> & UpdateUserInput): Promise<User> {
    const existing = await this.findById(uid);
    if (!existing) throw new Error('User not found');

    const updated: User = {
      ...existing,
      ...data,
      // protect immutable
      id: existing.id,
      email: (data as any).email ? (data as any).email.toLowerCase().trim() : existing.email,
      updatedAt: nowISO(),
    } as User;

    if (shouldUseMemory()) {
      memoryUsers.set(uid, updated);
      return updated;
    }

    try {
      await getFirestore().collection(COLLECTIONS.USERS).doc(uid).set(updated, { merge: true });
      return updated;
    } catch (e: any) {
      logger.warn('userRepository.update firestore error, using memory', { error: e.message });
      memoryUsers.set(uid, updated);
      return updated;
    }
  },

  async delete(uid: string): Promise<void> {
    if (shouldUseMemory()) {
      const u = memoryUsers.get(uid);
      if (u) {
        u.status = USER_STATUS.DELETED;
        u.updatedAt = nowISO();
        memoryUsers.set(uid, u);
      }
      return;
    }
    try {
      await getFirestore().collection(COLLECTIONS.USERS).doc(uid).update({
        status: USER_STATUS.DELETED,
        updatedAt: nowISO(),
      });
    } catch (e: any) {
      logger.warn('userRepository.delete firestore error', { error: e.message });
      const u = memoryUsers.get(uid);
      if (u) {
        u.status = USER_STATUS.DELETED;
        u.updatedAt = nowISO();
        memoryUsers.set(uid, u);
      }
    }
  },

  async list(limit = 20): Promise<User[]> {
    if (shouldUseMemory()) {
      return Array.from(memoryUsers.values()).slice(0, limit);
    }
    try {
      const snap = await getFirestore().collection(COLLECTIONS.USERS).limit(limit).get();
      return snap.docs.map((d) => d.data() as User);
    } catch {
      return Array.from(memoryUsers.values()).slice(0, limit);
    }
  },
};
