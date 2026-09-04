import { isFirebaseConfigured } from '../config/firebase';

// Shared helpers to reduce duplication across 10 repositories
export function shouldUseMemory(): boolean {
  return !isFirebaseConfigured() || process.env.NODE_ENV === 'test';
}
export function nowISO(): string { return new Date().toISOString(); }
export function isValidId(id: string): boolean { return typeof id === 'string' && id.length >= 1 && id.length <= 128; }
