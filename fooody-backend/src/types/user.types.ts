import { UserRole, UserStatus } from '../config/constants';

export interface User {
  id: string; // Firebase UID
  email: string;
  phone: string | null;
  name: string | null;
  profileImage: string | null;
  providers: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  hasPassword: boolean;
  role: UserRole;
  status: UserStatus;
  createdAt: string; // ISO string
  updatedAt: string;
  // Optional preferences
  preferences?: {
    notifications?: boolean;
    language?: string;
  };
  fcmTokens?: string[];
}

export interface CreateUserInput {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  providers?: string[];
  emailVerified?: boolean;
  hasPassword?: boolean;
  role?: UserRole;
}

export interface UpdateUserInput {
  name?: string | null;
  phone?: string | null;
  profileImage?: string | null;
  preferences?: Record<string, any>;
}

export interface PublicUser {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  profileImage: string | null;
  providers: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  hasPassword: boolean;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}

export function toPublicUser(user: User): PublicUser {
  // Already public-safe, but ensure no internal fields leak
  return { ...user };
}
