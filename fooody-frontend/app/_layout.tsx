import * as React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '@/store/authStore';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 1000 * 60 } },
});

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
  return <>{children}</>;
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
              <Stack.Screen name="restaurant/index" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="product/[id]" options={{ animation: 'slide_from_bottom', presentation: 'modal' }} />
              <Stack.Screen name="cart/index" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="checkout/index" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="order/[id]" options={{ animation: 'slide_from_right' }} />
              <Stack.Screen name="index" />
            </Stack>
          </AuthGate>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
