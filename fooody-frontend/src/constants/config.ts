// Central config - never hardcode URLs elsewhere
import Constants from 'expo-constants';

const extra = Constants.expoConfig?.extra ?? {};

export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:5000/api/v1',
  // fallback for web testing; for physical device replace with your LAN IP: http://192.168.1.x:5000/api/v1
  appScheme: 'foody',
  magicLinkRedirect: process.env.EXPO_PUBLIC_MAGIC_LINK_REDIRECT ?? 'foody://auth/magic-link',
};

export const isDev = __DEV__;
