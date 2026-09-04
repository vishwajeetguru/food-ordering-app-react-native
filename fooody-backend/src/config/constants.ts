export const COLLECTIONS = {
  USERS: 'users',
  OTPS: 'otps',
  MAGIC_LINKS: 'magicLinks',
  PRODUCTS: 'products',
  CATEGORIES: 'categories',
  ORDERS: 'orders',
  ADDRESSES: 'addresses',
  CARTS: 'carts',
  RESTAURANTS: 'restaurants',
  OFFERS: 'offers',
  BANNERS: 'banners',
  SETTINGS: 'settings',
  WISHLISTS: 'wishlists',
  NOTIFICATIONS: 'notifications',
  FCM_TOKENS: 'fcmTokens',
  SUPPORT_TICKETS: 'supportTickets',
} as const;

export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const USER_STATUS = {
  ACTIVE: 'active',
  DISABLED: 'disabled',
  DELETED: 'deleted',
} as const;

export type UserStatus = (typeof USER_STATUS)[keyof typeof USER_STATUS];

export const AUTH_PROVIDERS = {
  EMAIL: 'email',
  EMAIL_OTP: 'email_otp',
  MAGIC_LINK: 'magic_link',
  GOOGLE: 'google',
  PASSWORD: 'password',
} as const;

export const OTP_CHANNELS = {
  EMAIL: 'email',
  SMS: 'sms',
} as const;

export type OtpChannel = (typeof OTP_CHANNELS)[keyof typeof OTP_CHANNELS];

export const ERROR_CODES = {
  // Auth
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  // OTP
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_INVALID: 'INVALID_OTP',
  OTP_MAX_ATTEMPTS: 'OTP_MAX_ATTEMPTS_EXCEEDED',
  OTP_RESEND_COOLDOWN: 'OTP_RESEND_COOLDOWN',
  OTP_NOT_FOUND: 'OTP_NOT_FOUND',
  OTP_ALREADY_USED: 'OTP_ALREADY_USED',
  OTP_RATE_LIMITED: 'OTP_RATE_LIMITED',
  // Magic link
  MAGIC_LINK_EXPIRED: 'MAGIC_LINK_EXPIRED',
  MAGIC_LINK_INVALID: 'INVALID_MAGIC_LINK',
  MAGIC_LINK_ALREADY_USED: 'MAGIC_LINK_ALREADY_USED',
  MAGIC_LINK_NOT_FOUND: 'MAGIC_LINK_NOT_FOUND',
  // User
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  BAD_REQUEST: 'BAD_REQUEST',
  CONFLICT: 'CONFLICT',
} as const;

export const DEFAULT_PAGINATION = {
  LIMIT: 20,
  MAX_LIMIT: 100,
} as const;
