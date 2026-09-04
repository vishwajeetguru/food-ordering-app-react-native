import * as React from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { useOffers } from '@/hooks/useCatalog';
import { useAuthStore } from '@/store/authStore';
import * as Haptics from 'expo-haptics';

// Map offer codes to right-side illustrations (3D style placeholders via Unsplash)
const offerImages: Record<string, string> = {
  FREESHIP: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&q=80',
  CASH100: 'https://images.unsplash.com/photo-1513885535751-8b9238bd345a?w=300&q=80',
  SWEETBOGO: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=300&q=80',
  BIRYANI30: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=300&q=80',
  FOODY20: 'https://images.unsplash.com/photo-1568909344668?w=300&q=80',
};

export default function Offers() {
  const router = useRouter();
  const { data: offers, isPending } = useOffers();
  const user = useAuthStore((s) => s.user);
  const initial = (user?.name || user?.email || 'V').charAt(0).toUpperCase();
  const [copied, setCopied] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    if (!search.trim()) return offers ?? [];
    const q = search.toLowerCase();
    return (offers ?? []).filter((o) => o.title.toLowerCase().includes(q) || o.subtitle.toLowerCase().includes(q) || o.code.toLowerCase().includes(q));
  }, [offers, search]);

  const copy = (code: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  };

  if (isPending) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ ...typography.bodySmall, color: colors.textTertiary }}>Loading offers...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Search + avatar */}
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.xs as any }}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              placeholder="Search for dishes, restaurants or offers..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              style={{ flex: 1, ...typography.bodySmall, color: colors.textPrimary, paddingVertical: 0 }}
            />
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF5A3D', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>{initial}</Text>
          </View>
        </View>

        {/* Title row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: 26, fontWeight: '900', color: '#0F172A', letterSpacing: -0.5 }}>Offers for you</Text>
            <Text style={{ ...typography.bodySmall, color: '#64748B' }}>Save more on your favourite food</Text>
          </View>
          <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF2E8', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 }}>
            <Ionicons name="gift" size={16} color="#EA580C" />
            <Text style={{ ...typography.captionBold, color: '#EA580C' }}>View all</Text>
          </Pressable>
        </View>

        {/* Cards */}
        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg, gap: 14 }}>
          {(filtered ?? []).map((o, i) => {
            const isCopied = copied === o.code;
            const img = offerImages[o.code] || 'https://images.unsplash.com/photo-1504674900247?w=300';
            return (
              <Animated.View key={o.id} entering={FadeInUp.delay(120 + i * 90).duration(500)}>
                <LinearGradient
                  colors={[(o.colors?.[0] as string) || colors.primary, (o.colors?.[1] as string) || colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 20, padding: 16, overflow: 'hidden', ...shadows.md as any }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start', flex: 1 }}>
                      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 18 }}>{o.emoji}</Text>
                      </View>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 }}>{o.title}</Text>
                        <Text style={{ ...typography.caption, color: 'rgba(255,255,255,0.9)' }}>{o.subtitle}</Text>
                      </View>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, marginLeft: 8 }}>
                      <Text style={{ ...typography.captionBold, color: '#fff', fontSize: 11 }}>{o.tag}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, gap: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.8)', borderStyle: 'dashed', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)' }}>
                        <Text style={{ ...typography.label, color: '#fff', fontWeight: '800', letterSpacing: 0.5 }}>{o.code}</Text>
                      </View>
                      <Text style={{ ...typography.caption, color: 'rgba(255,255,255,0.85)', fontSize: 11 }}>Min. order applies</Text>
                    </View>
                    <Pressable onPress={() => copy(o.code)} style={{ backgroundColor: '#fff', paddingHorizontal: 18, paddingVertical: 8, borderRadius: 12, ...shadows.xs as any }}>
                      <Text style={{ ...typography.label, color: (o.colors?.[0] as string) || colors.primary, fontWeight: '800' }}>{isCopied ? '✓ Copied' : 'Apply'}</Text>
                    </Pressable>
                  </View>

                  {/* Right image */}
                  <Image source={{ uri: img }} style={{ position: 'absolute', right: 6, top: 12, width: 92, height: 92, opacity: 0.92 }} contentFit="contain" pointerEvents="none" />
                </LinearGradient>
              </Animated.View>
            );
          })}
          {filtered.length === 0 && (
            <View style={{ alignItems: 'center', padding: spacing.xl }}>
              <Text style={{ ...typography.bodySmall, color: colors.textTertiary }}>No offers found</Text>
            </View>
          )}
        </View>

        <Animated.View entering={FadeInUp.delay(600).duration(500)} style={{ marginHorizontal: spacing.xl, marginTop: spacing.lg, backgroundColor: '#FFFBEB', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' }}>
          <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 22 }}>🎁</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ ...typography.label, color: '#0F172A', fontWeight: '800' }}>Refer a friend, earn ₹200</Text>
            <Text style={{ ...typography.caption, color: '#64748B' }}>Share your code and both of you save on next order.</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#92400E" />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
