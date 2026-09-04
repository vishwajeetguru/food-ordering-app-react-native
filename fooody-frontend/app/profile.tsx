import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { useAuthStore } from '@/store/authStore';
import { useOrders } from '@/hooks/useCatalog';
import { useWishlist } from '@/hooks/useWishlist';
import { useAddresses } from '@/hooks/useCatalog';

export default function Profile() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const ordersQ = useOrders();
  const wishlistQ = useWishlist();
  const addressesQ = useAddresses();

  const totalOrders = ordersQ.data?.length ?? 12;
  const favCount = wishlistQ.data?.length ?? 8;
  const addrCount = addressesQ.data?.length ?? 3;

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/welcome'); } },
    ]);
  };

  const items = [
    { icon: 'cube' as const, bg: '#FFF2E0', color: '#FF8C00', label: 'My Orders', sub: 'Track and reorder your food', onPress: () => router.push('/(tabs)/orders') },
    { icon: 'location' as const, bg: '#FFE9E8', color: '#EF4444', label: 'Saved Addresses', sub: 'Home, Work and more', onPress: () => router.push('/addresses' as any) },
    { icon: 'heart' as const, bg: '#FFE9F0', color: '#EC4899', label: 'Favorites', sub: 'Your beloved dishes', onPress: () => router.push('/favourites' as any) },
    { icon: 'notifications' as const, bg: '#F3E8FF', color: '#8B5CF6', label: 'Notifications', sub: 'Offers and updates', onPress: () => router.push('/notifications' as any) },
    { icon: 'headset' as const, bg: '#E6F7ED', color: '#10B981', label: 'Help & Support', sub: 'FAQs and contact us', onPress: () => router.push('/support' as any) },
    { icon: 'information-circle' as const, bg: '#E0F2FE', color: '#0284C7', label: 'About', sub: 'Foody v1.0.0 • Single kitchen', onPress: () => router.push('/about' as any) },
    ...(user?.role === 'admin' ? [{ icon: 'shield-checkmark' as const, bg: '#FEF2F2', color: '#DC2626', label: 'Admin Panel', sub: 'Manage users, orders, tickets', onPress: () => router.push('/admin' as any) } as any] : []),
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(350)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.md }}>
          <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.xs as any, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' }}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>Profile</Text>
            <Text style={{ ...typography.caption, color: '#64748B' }}>Manage your account and preferences</Text>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* User card */}
        <Animated.View entering={FadeInUp.delay(80).duration(450)} style={{ marginHorizontal: 16, backgroundColor: '#FFF5EB', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,90,61,0.08)', ...shadows.sm as any }}>
          <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', padding: 3, ...shadows.xs as any }}>
              <Image source={{ uri: user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }} style={{ width: '100%', height: '100%', borderRadius: 33, backgroundColor: colors.shimmer }} contentFit="cover" />
              <View style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF5A3D', borderWidth: 2, borderColor: '#FFF5EB', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="camera" size={14} color="#fff" />
              </View>
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }}>{user?.name || 'Vishwajeet Guru'}</Text>
              <Text style={{ ...typography.caption, color: '#64748B' }}>{user?.email || 'test@gmail.com'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#E6F7ED', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, marginTop: 4 }}>
                <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#16A34A', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
                <Text style={{ ...typography.captionBold, color: '#15803D', fontSize: 11 }}>Verified Customer</Text>
              </View>
            </View>
            <Pressable onPress={() => router.push('/profile/edit' as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', ...shadows.xs as any }}>
              <Ionicons name="pencil" size={14} color="#9A3412" />
              <Text style={{ ...typography.captionBold, color: '#9A3412' }}>Edit</Text>
            </Pressable>
          </View>

          {/* Stats */}
          <View style={{ flexDirection: 'row', marginTop: 16, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)' }}>
            {[
              { icon: 'bag', count: totalOrders, label: 'Total Orders' },
              { icon: 'heart', count: favCount, label: 'Favorites' },
              { icon: 'location', count: addrCount, label: 'Saved Address' },
            ].map((s, i) => (
              <View key={s.label} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'center', borderLeftWidth: i === 0 ? 0 : 1, borderLeftColor: 'rgba(0,0,0,0.06)', paddingLeft: i === 0 ? 0 : 14 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,90,61,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={s.icon as any} size={16} color="#FF5A3D" />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>{s.count}</Text>
                  <Text style={{ ...typography.caption, color: '#64748B', fontSize: 11 }}>{s.label}</Text>
                </View>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Menu items */}
        <View style={{ paddingHorizontal: 16, marginTop: 14, gap: 10 }}>
          {items.map((it, i) => (
            <Animated.View key={it.label} entering={FadeInUp.delay(140 + i * 50).duration(400)}>
              <Pressable onPress={it.onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.xs as any }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: it.bg, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={it.icon} size={20} color={it.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0F172A' }}>{it.label}</Text>
                  <Text style={{ ...typography.caption, color: '#64748B' }}>{it.sub}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </Pressable>
            </Animated.View>
          ))}
        </View>

        {/* Logout */}
        <Animated.View entering={FadeInUp.delay(500).duration(400)} style={{ paddingHorizontal: 16, marginTop: 14 }}>
          <Pressable onPress={handleLogout} style={{ backgroundColor: '#FF4D2E', borderRadius: 14, paddingVertical: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, ...shadows.sm as any }}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
            <Text style={{ ...typography.labelLarge, color: '#fff', fontWeight: '700' }}>Logout</Text>
          </Pressable>
        </Animated.View>

        {/* Footer */}
        <View style={{ alignItems: 'center', marginTop: 20, gap: 6, opacity: 0.7 }}>
          <Text style={{ ...typography.caption, color: '#94A3B8' }}>Good food. Delivered simply.</Text>
          <View style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: '#FF5A3D' }} />
          {/* faint food icons decoration */}
          <View style={{ position: 'absolute', bottom: -20, left: -10, opacity: 0.04 }}>
            <Text style={{ fontSize: 80 }}>🍽️</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
