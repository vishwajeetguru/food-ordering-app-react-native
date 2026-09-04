// Typography scale - premium, clean

export const typography = {
  // Display / Hero
  displayLarge: { fontSize: 32, lineHeight: 36, fontWeight: '800' as const, letterSpacing: -0.5 },
  displayMedium: { fontSize: 28, lineHeight: 32, fontWeight: '800' as const, letterSpacing: -0.5 },

  // Headings
  h1: { fontSize: 24, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.3 },
  h2: { fontSize: 20, lineHeight: 24, fontWeight: '700' as const, letterSpacing: -0.2 },
  h3: { fontSize: 18, lineHeight: 22, fontWeight: '700' as const },
  h4: { fontSize: 16, lineHeight: 20, fontWeight: '700' as const },

  // Body
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '500' as const },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  bodySmall: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  bodyXS: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },

  // Labels / UI
  labelLarge: { fontSize: 16, lineHeight: 20, fontWeight: '600' as const, letterSpacing: 0.1 },
  label: { fontSize: 14, lineHeight: 18, fontWeight: '600' as const, letterSpacing: 0.2 },
  labelSmall: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const, letterSpacing: 0.5, textTransform: 'uppercase' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const },
  captionBold: { fontSize: 12, lineHeight: 16, fontWeight: '600' as const },

  // Price / Numeric
  priceLarge: { fontSize: 20, lineHeight: 24, fontWeight: '800' as const },
  price: { fontSize: 16, lineHeight: 20, fontWeight: '700' as const },
  priceSmall: { fontSize: 14, lineHeight: 18, fontWeight: '700' as const },
} as const;

export type TypographyKey = keyof typeof typography;
