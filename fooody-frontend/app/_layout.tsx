import * as React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { Alert, View, Text } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { useWishlist } from '@/hooks/useWishlist';
import { usePushRegistration, useNotifications } from '@/hooks/useNotifications';
import { useRealtimeOrders, useRealtimeNotifications } from '@/hooks/useRealtime';
import { MaintenanceGate } from '@/components/MaintenanceGate';

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

function RealtimeBootstrap() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  useRealtimeOrders(isAuthenticated);
  useRealtimeNotifications(isAuthenticated);
  return null;
}

function RealtimeToasts() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const notifQ = useNotifications(20);
  const seenRef = React.useRef<Set<string>>(new Set());
  const isFirstLoad = React.useRef(true);

  React.useEffect(() => {
    if (!isAuthenticated || !notifQ.data) return;
    const raw: any = notifQ.data as any;
    const list: any[] = Array.isArray(raw) ? raw : raw.notifications ?? [];
    // On first load, mark all as seen without toast
    if (isFirstLoad.current) {
      list.forEach((n: any) => seenRef.current.add(n.id));
      isFirstLoad.current = false;
      return;
    }
    // Find new unread notifications created in last 20s
    const now = Date.now();
    const newOnes = list.filter((n: any) => !seenRef.current.has(n.id) && !n.read && new Date(n.createdAt).getTime() > now - 20000);
    newOnes.forEach((n: any) => {
      seenRef.current.add(n.id);
      // Don't toast for the customer's own "Order placed" immediately after they placed it (they already saw success)
      // But do toast for status updates and for admin new orders
      const isAdmin = (user as any)?.role === 'admin';
      if (n.type === 'order') {
        if (isAdmin && n.title?.includes('New order')) {
          Alert.alert(n.title, n.body);
        } else if (!isAdmin && n.title?.includes('Order update')) {
          Alert.alert(n.title, n.body);
        } else if (!isAdmin && n.data?.status && n.data.status !== 'pending') {
          Alert.alert(n.title, n.body);
        }
      } else if (n.type === 'promo' || n.type === 'support' || n.type === 'general') {
        Alert.alert(n.title, n.body);
      }
    });
    // Mark all current as seen for next diff
    list.forEach((n: any) => seenRef.current.add(n.id));
  }, [notifQ.data, isAuthenticated, user]);

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

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFBF5' }}>
        <Text style={{ color: '#FF5A3D', fontWeight: '700' }}>Loading Foody...</Text>
      </View>
    );
  }
  return (
    <>
      <GlobalWishlistLoader />
      <PushBootstrap />
      <RealtimeBootstrap />
      <RealtimeToasts />
      <MaintenanceGate>{children}</MaintenanceGate>
    </>
  );
}

export default function RootLayout() {
  const [loaded] = useFonts({});

  React.useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
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
