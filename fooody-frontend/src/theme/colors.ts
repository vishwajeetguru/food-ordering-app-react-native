// Foody Design System - Colors
// Warm food-inspired palette, premium & accessible (WCAG AA)

export const colors = {
  // Brand
  primary: '#FF5A3D', // coral-orange primary CTA
  primaryDark: '#E94A2E',
  primaryLight: '#FFE9E3',
  primaryMuted: '#FFF2EF',

  // Secondary / accent
  accent: '#FFB020', // warm amber for highlights/offers
  accentDark: '#E89E0A',
  accentLight: '#FFF5D6',

  // Neutrals
  background: '#FFFDFB', // warm off-white
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceMuted: '#F8F5F3',
  border: '#F0E6E2',
  borderLight: '#F5EEEA',
  divider: '#EDE9E6',

  // Text
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6B6B',
  textTertiary: '#9A9A9A',
  textInverse: '#FFFFFF',
  textOnPrimary: '#FFFFFF',

  // Status
  success: '#16A34A',
  successLight: '#E8F5E8',
  warning: '#EA580C',
  warningLight: '#FFF7ED',
  error: '#DC2626',
  errorLight: '#FEF2F2',
  info: '#0284C7',

  // Veg/NonVeg
  veg: '#16A34A',
  nonVeg: '#DC2626',

  // Overlays
  overlay: 'rgba(26,26,26,0.6)',
  overlayLight: 'rgba(26,26,26,0.3)',
  shimmer: '#F3F0EE',
  shimmerHighlight: '#FFFFFF',

  // Cards
  cardShadow: 'rgba(26,26,26,0.08)',

  // Tab
  tabActive: '#FF5A3D',
  tabInactive: '#9A9A9A',
} as const;

export type ColorKey = keyof typeof colors;
