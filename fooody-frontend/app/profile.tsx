import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useAuthStore } from '@/store/authStore';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/welcome'); } },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <Animated.View entering={FadeInDown.duration(350)} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>Profile</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(80).duration(450)} style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight }}>
          <Image source={{ uri: user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }} style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.shimmer }} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...typography.h3, color: colors.textPrimary }}>{user?.name || 'Vishwa Patel'}</Text>
            <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>{user?.email || 'test@example.com'}</Text>
            <Text style={{ ...typography.caption, color: colors.success }}>✓ Verified • {user?.role || 'customer'}</Text>
          </View>
          <Pressable onPress={() => router.push('/profile/edit' as any)} style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: colors.border }}>
            <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>Edit</Text>
          </Pressable>
        </Animated.View>

        {[
          { icon: '📦', label: 'My Orders', sub: 'Track and reorder', onPress: () => router.push('/(tabs)/orders') },
          { icon: '📍', label: 'Saved Addresses', sub: 'Home, Work and more', onPress: () => router.push('/addresses') },
          { icon: '♡', label: 'Favorites', sub: 'Your beloved dishes', onPress: () => router.push('/favourites' as any) },
          { icon: '🔔', label: 'Notifications', sub: 'Offers and updates', onPress: () => router.push('/notifications' as any) },
          { icon: '❓', label: 'Help & Support', sub: 'FAQs and contact', onPress: () => router.push('/support' as any) },
          { icon: 'ℹ️', label: 'About', sub: 'Foody v1.0.0 • Single kitchen', onPress: () => router.push('/about' as any) },
          ...(user?.role==='admin' ? [{ icon: '🛡️', label: 'Admin Panel', sub: 'Manage users, orders, tickets', onPress: () => router.push('/admin' as any) } as any] : []),
        ].map((it, i) => (
          <Animated.View key={it.label} entering={FadeInUp.delay(140 + i * 60).duration(400)}>
            <Pressable onPress={it.onPress || (() => Alert.alert('Coming soon', `${it.label} will be available soon`))} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}><Text>{it.icon}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.label, color: colors.textPrimary }}>{it.label}</Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>{it.sub}</Text>
              </View>
              <Text style={{ color: colors.textTertiary }}>›</Text>
            </Pressable>
          </Animated.View>
        ))}

        <Animated.View entering={FadeInUp.delay(520).duration(400)}>
          <Pressable onPress={handleLogout} style={{ backgroundColor: colors.errorLight, borderRadius: radius.lg, padding: spacing.lg, alignItems: 'center', borderWidth: 1, borderColor: colors.error }}>
            <Text style={{ ...typography.label, color: colors.error }}>Logout</Text>
          </Pressable>
        </Animated.View>

        <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign: 'center' }}>Foody • Good food. Delivered simply.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
