import { userRepository } from '../repositories/user.repository';
import { getAuth, isFirebaseConfigured } from '../config/firebase';
import { logger } from '../utils/logger';
import { AppError, NotFoundError } from '../utils/errors';
import { ERROR_CODES } from '../config/constants';
import { UpdateUserInput, User } from '../types/user.types';

export const userService = {
  async getById(uid: string): Promise<User> {
    const user = await userRepository.findById(uid);
    if (!user || user.status === 'deleted') {
      throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
    }
    return user;
  },

  async getByEmail(email: string): Promise<User | null> {
    return userRepository.findByEmail(email);
  },

  async updateProfile(uid: string, input: UpdateUserInput): Promise<User> {
    const user = await userRepository.findById(uid);
    if (!user) throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);

    // Validate phone etc. is done in validator layer; here just sanitize
    const sanitized: UpdateUserInput = {};
    if (input.name !== undefined) sanitized.name = input.name?.trim() || null;
    if (input.phone !== undefined) sanitized.phone = input.phone?.trim() || null;
    if (input.profileImage !== undefined) sanitized.profileImage = input.profileImage;
    if (input.preferences !== undefined) sanitized.preferences = input.preferences;

    // Sync with Firebase Auth if phone updated? For now firestore only
    const updated = await userRepository.update(uid, sanitized as any);
    logger.info('User profile updated', { uid });
    return updated;
  },

  async deleteAccount(uid: string): Promise<void> {
    const user = await userRepository.findById(uid);
    if (!user) throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);

    await userRepository.delete(uid);

    // Also disable/delete Firebase Auth user if configured
    if (isFirebaseConfigured()) {
      try {
        await getAuth().updateUser(uid, { disabled: true });
        logger.info('Firebase user disabled', { uid });
      } catch (e: any) {
        logger.warn('Failed to disable Firebase user', { error: e.message, uid });
        // Not fatal
      }
    }
  },

  async ensureUserExists(uid: string, email: string, additional?: Partial<User>): Promise<User> {
    let user = await userRepository.findById(uid);
    if (user) {
      // Update providers/emailVerified if needed
      const patch: any = {};
      if (additional?.providers) {
        const merged = Array.from(new Set([...user.providers, ...additional.providers]));
        if (merged.length !== user.providers.length) patch.providers = merged;
      }
      if (additional?.emailVerified && !user.emailVerified) patch.emailVerified = true;
      if (additional?.hasPassword !== undefined && additional.hasPassword !== user.hasPassword) {
        patch.hasPassword = additional.hasPassword;
      }
      if (Object.keys(patch).length) {
        user = await userRepository.update(uid, patch);
      }
      return user;
    }

    // Check by email to avoid duplicate docs for same email with different uid (edge case)
    const byEmail = await userRepository.findByEmail(email);
    if (byEmail && byEmail.id !== uid) {
      // This can happen when Firebase creates a new UID for same email; we treat as separate but warn
      logger.warn('Email already has different UID', { email, existingUid: byEmail.id, newUid: uid });
    }

    return userRepository.create({
      id: uid,
      email,
      name: additional?.name ?? null,
      phone: additional?.phone ?? null,
      providers: additional?.providers ?? ['email'],
      emailVerified: additional?.emailVerified ?? false,
      hasPassword: additional?.hasPassword ?? false,
    });
  },

  async syncFromFirebase(uid: string): Promise<User> {
    if (!isFirebaseConfigured()) {
      // Return firestore doc as-is
      const local = await userRepository.findById(uid);
      if (!local) throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
      return local;
    }

    try {
      const fbUser = await getAuth().getUser(uid);
      let local = await userRepository.findById(uid);
      if (!local) {
        // Auto-create firestore doc from firebase user
        local = await userRepository.create({
          id: fbUser.uid,
          email: fbUser.email || '',
          name: fbUser.displayName ?? null,
          phone: fbUser.phoneNumber ?? null,
          providers: fbUser.providerData.map((p) => p.providerId),
          emailVerified: fbUser.emailVerified,
          hasPassword: !!fbUser.providerData.find((p) => p.providerId === 'password'),
        });
      } else {
        // Sync emailVerified etc.
        const patch: any = {};
        if (fbUser.emailVerified && !local.emailVerified) patch.emailVerified = true;
        if (fbUser.email && fbUser.email.toLowerCase() !== local.email.toLowerCase()) patch.email = fbUser.email;
        if (fbUser.displayName && fbUser.displayName !== local.name) patch.name = fbUser.displayName;
        if (fbUser.phoneNumber && fbUser.phoneNumber !== local.phone) patch.phone = fbUser.phoneNumber;
        if (Object.keys(patch).length) {
          local = await userRepository.update(uid, patch);
        }
      }
      return local;
    } catch (e: any) {
      logger.warn('syncFromFirebase failed', { error: e.message, uid });
      const local = await userRepository.findById(uid);
      if (!local) throw new NotFoundError('User not found', ERROR_CODES.USER_NOT_FOUND);
      return local;
    }
  },
};
