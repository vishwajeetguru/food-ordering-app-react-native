import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '@/api/notification.api';

export function useNotifications(limit = 50) {
  return useQuery({
    queryKey: ['notifications', limit],
    queryFn: () => notificationApi.list(limit).then(r => r.data),
    refetchInterval: 30000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread'],
    queryFn: () => notificationApi.unreadCount().then(r=> (r.data as any).count as number),
    refetchInterval: 15000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function usePushRegistration() {
  const register = async () => {
    try{
      // Expo Go does not include PushNotificationIOS native module (RN 0.86).
      // Using expo-notifications in Expo Go triggers the invariant at startup via importAll.
      // For Expo Go, use a mock token and register it with the backend as an in-app notification token.
      // For a real push experience, create a development build: https://docs.expo.dev/development/introduction/
      const { Platform } = await import('react-native');
      const mock = 'mock-' + Date.now() + '-' + Platform.OS;
      try{ await notificationApi.registerToken(mock, Platform.OS as any); }catch{}
      return mock;

      // --- To enable real push in a dev build, uncomment and ensure expo-notifications is installed ---
      // const Notifications = await import('expo-notifications');
      // const { status: existing } = await Notifications.getPermissionsAsync();
      // let final = existing;
      // if(existing !== 'granted'){
      //   const { status } = await Notifications.requestPermissionsAsync();
      //   final = status;
      // }
      // if(final !== 'granted') return null;
      // try{
      //   const token = (await Notifications.getExpoPushTokenAsync()).data;
      //   try{ await notificationApi.registerToken(token, Platform.OS as any); }catch{}
      //   return token;
      // }catch{
      //   const mockFallback = 'mock-' + Date.now() + '-' + Platform.OS;
      //   try{ await notificationApi.registerToken(mockFallback, Platform.OS as any); }catch{}
      //   return mockFallback;
      // }
    }catch{ return null; }
  };
  return { register };
}
