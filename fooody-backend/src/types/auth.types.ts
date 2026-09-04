import { OtpChannel } from '../config/constants';

export interface SendOtpRequest {
  email: string;
  channel?: OtpChannel; // default email
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface SendMagicLinkRequest {
  email: string;
}

export interface VerifyMagicLinkRequest {
  token: string;
}

export interface SetPasswordRequest {
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword?: string; // For Firebase, password change requires reauth via idToken; we keep field for validation
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  oobCode: string; // Firebase action code
  newPassword: string;
}

export interface AuthResult {
  uid: string;
  email: string;
  customToken?: string; // Firebase custom token for client to exchange for idToken
  isNewUser?: boolean;
}

export interface OtpRecord {
  id: string; // email or phone normalized as doc id
  email: string;
  channel: OtpChannel;
  hashedOtp: string;
  expiresAt: string; // ISO
  attempts: number;
  maxAttempts: number;
  resendCount: number;
  lastSentAt: string;
  verified: boolean;
  createdAt: string;
}

export interface MagicLinkRecord {
  id: string; // token hash or doc id
  email: string;
  tokenHash: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
  usedAt?: string;
}

// Express augmentation will be in express.d.ts
