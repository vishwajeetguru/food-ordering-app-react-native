/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: '#FF5A3D', dark: '#E94A2E', light: '#FFE9E3', muted: '#FFF2EF' },
        accent: { DEFAULT: '#FFB020', dark: '#E89E0A', light: '#FFF5D6' },
        surface: { DEFAULT: '#FFFFFF', muted: '#F8F5F3', elevated: '#FFFFFF' },
        border: { DEFAULT: '#F0E6E2', light: '#F5EEEA', strong: '#EDE9E6' },
        text: { primary: '#1A1A1A', secondary: '#6B6B6B', tertiary: '#9A9A9A', inverse: '#FFFFFF' },
        success: { DEFAULT: '#16A34A', light: '#E8F5E8' },
        warning: { DEFAULT: '#EA580C', light: '#FFF7ED' },
        error: { DEFAULT: '#DC2626', light: '#FEF2F2' },
        'bg-warm': '#FFFDFB',
        'bg-muted': '#F8F5F3',
      },
      fontFamily: { sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'] },
      borderRadius: { xl: '16px', '2xl': '20px', '3xl': '24px' },
      boxShadow: {
        card: '0 1px 3px rgba(26,26,26,0.06), 0 1px 2px rgba(26,26,26,0.04)',
        'card-hover': '0 4px 12px rgba(26,26,26,0.08), 0 2px 4px rgba(26,26,26,0.06)',
        soft: '0 2px 8px rgba(26,26,26,0.06)',
      },
    },
  },
  plugins: [],
};
