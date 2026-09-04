import * as React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { useAuthStore } from '@/store/authStore';
import { useWishlist } from '@/hooks/useWishlist';
import { usePushRegistration } from '@/hooks/useNotifications';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false,
});

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
});

function GlobalWishlistLoader() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useWishlist();
  // wishlist hook will internally no-op if not authenticated (query will 401 but cached), we keep enabled gating inside hook soon
  void isAuthenticated;
  return null;
}

function PushBootstrap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { register } = usePushRegistration();
  React.useEffect(() => {
    if (isAuthenticated) register().catch(() => {});
  }, [isAuthenticated, register]);
  return null;
}

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, restore } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => { restore(); }, []);

  React.useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!isAuthenticated && !inAuth) {
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuth) {
      router.replace('/(tabs)/home');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) return null;
  return (
    <>
      <GlobalWishlistLoader />
      <PushBootstrap />
      {children}
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({});

  React.useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="dark" />
          <AuthGate>
            <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="search" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
              <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="profile/edit" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="restaurant/index" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="product/[id]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
              <Stack.Screen name="cart/index" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="checkout/index" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="addresses/index" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="addresses/add" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="favourites" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="wishlist" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="support/index" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="support/new" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="support/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="about" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="admin/index" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="index" />
            </Stack>
          </AuthGate>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
