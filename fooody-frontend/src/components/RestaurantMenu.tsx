import * as React from 'react';
import { View, Text, ScrollView, Pressable, FlatList, TextInput } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { FoodCard } from '@/components/FoodCard';
import { useProducts, useCategories, useRestaurant } from '@/hooks/useCatalog';
import { useAuthStore } from '@/store/authStore';

const categoryIcons: Record<string, string> = {
  Beverages: 'cafe',
  Biryani: 'restaurant',
  Burgers: 'fast-food',
  Chinese: 'bowl',
  Pizza: 'pizza',
  Desserts: 'ice-cream',
};

export function RestaurantMenu({ headerMode = 'fixed' }: { headerMode?: 'fixed' | 'overlay' }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const initial = (user?.name || user?.email || 'V').charAt(0).toUpperCase();
  const { data: restaurant } = useRestaurant();
  const { data: categories } = useCategories();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const { data: products, isPending } = useProducts(activeId ? { categoryId: activeId } : { limit: 50 });

  // Build chips: All + categories sorted as API returns
  const chips = React.useMemo(() => {
    if (!categories?.length) return [{ id: 'all', name: 'All', icon: 'apps' as const }];
    return [
      { id: 'all', name: 'All', icon: 'apps' as const },
      ...categories.map((c) => ({ id: c.id, name: c.name, icon: (categoryIcons[c.name] as any) || 'restaurant' as const })),
    ];
  }, [categories]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFFBF5' }}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        {/* Hero with search over image */}
        <View style={{ height: 240, backgroundColor: '#1A1A1A' }}>
          <Image source={{ uri: restaurant?.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80' }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          {/* dark gradient top for status bar readability */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: 'rgba(0,0,0,0.22)' }} />

          {/* Top bar over hero */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingTop: 8 }}>
            <Pressable
              onPress={() => (headerMode === 'overlay' ? router.back() : router.push('/(tabs)/home' as any))}
              style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.96)', alignItems: 'center', justifyContent: 'center', ...shadows.xs as any }}
            >
              <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
            </Pressable>

            <Pressable
              onPress={() => router.push('/search' as any)}
              style={{ flex: 1, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.97)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 8, ...shadows.sm as any }}
            >
              <Ionicons name="search" size={18} color="#9CA3AF" />
              <Text style={{ ...typography.bodySmall, color: '#9CA3AF', flex: 1 }} numberOfLines={1}>
                Search for dishes, cuisines...
              </Text>
              <View style={{ width: 1, height: 20, backgroundColor: '#E5E7EB' }} />
              <Ionicons name="options-outline" size={18} color="#FF5A3D" />
            </Pressable>

            <Pressable onPress={() => router.push('/profile' as any)} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF5A3D', alignItems: 'center', justifyContent: 'center', ...shadows.xs as any }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>{initial}</Text>
            </Pressable>
          </View>

          {/* 8 Photos pill */}
          <Pressable style={{ position: 'absolute', bottom: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.55)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 }}>
            <Ionicons name="image-outline" size={14} color="#fff" />
            <Text style={{ ...typography.captionBold, color: '#fff' }}>8 Photos</Text>
          </Pressable>
        </View>

        {/* Info Card */}
        <View style={{ marginHorizontal: 16, marginTop: -32, backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.md as any, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Image source={{ uri: restaurant?.logo || 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=300' }} style={{ width: 72, height: 72, borderRadius: 12, backgroundColor: colors.shimmer }} contentFit="cover" />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>{restaurant?.name || 'Foody House'}</Text>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFF2E8', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="heart-outline" size={18} color="#EA580C" />
                </View>
              </View>
              <Text style={{ ...typography.caption, color: '#64748B' }}>{restaurant?.cuisines?.join('  •  ') || 'Italian  •  North Indian  •  Chinese'}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                  <Text style={{ color: '#F59E0B' }}>⭐</Text>
                  <Text style={{ ...typography.captionBold, color: '#065F46' }}>{restaurant?.rating || 4.8} ({restaurant?.ratingCount || 1240})</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="time-outline" size={14} color="#64748B" />
                  <Text style={{ ...typography.caption, color: '#334155' }}>{restaurant?.deliveryTime || '25-35 min'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="bicycle" size={14} color="#64748B" />
                  <Text style={{ ...typography.caption, color: '#334155' }}>₹{restaurant?.priceForTwo || 600} for two</Text>
                </View>
              </View>
            </View>
          </View>

          <Text style={{ ...typography.caption, color: '#64748B', lineHeight: 18 }}>{restaurant?.about || 'Foody House serves wood-fired pizzas, authentic biryanis and comforting classics with premium ingredients and warm hospitality.'}</Text>

          <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {[
              { icon: 'restaurant' as const, title: 'Hygienic', sub: 'Food preparation' },
              { icon: 'leaf' as const, title: 'Fresh Ingredients', sub: 'Premium quality' },
              { icon: 'bicycle' as const, title: 'Fast Delivery', sub: '25–35 mins' },
              { icon: 'star' as const, title: 'Top Rated', sub: `4.8 (1.2K+)` },
            ].map((f) => (
              <View key={f.title} style={{ flex: 1, alignItems: 'center', gap: 6, paddingHorizontal: 4 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#FFF7ED', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name={f.icon} size={18} color="#EA580C" />
                </View>
                <Text style={{ ...typography.captionBold, color: '#0F172A', fontSize: 11, textAlign: 'center' }}>{f.title}</Text>
                <Text style={{ ...typography.caption, color: '#64748B', fontSize: 10, textAlign: 'center' }}>{f.sub}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category chips */}
        <View style={{ marginTop: 16 }}>
          <FlatList
            horizontal
            data={chips}
            keyExtractor={(i) => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
            renderItem={({ item }) => {
              const active = (activeId ?? 'all') === item.id;
              return (
                <Pressable
                  onPress={() => setActiveId(item.id === 'all' ? null : item.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 8,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    borderRadius: 999,
                    backgroundColor: active ? '#FF5A3D' : '#fff',
                    borderWidth: 1,
                    borderColor: active ? '#FF5A3D' : '#F1F5F9',
                    ...shadows.xs as any,
                  }}
                >
                  <Ionicons name={item.icon as any} size={16} color={active ? '#fff' : '#64748B'} />
                  <Text style={{ ...typography.label, color: active ? '#fff' : '#0F172A', fontWeight: '700' }}>{item.name}</Text>
                </Pressable>
              );
            }}
          />
        </View>

        {/* Recommended */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Recommended for you</Text>
          <Pressable onPress={() => {}} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
            <Text style={{ ...typography.label, color: '#EA580C', fontWeight: '700' }}>See all</Text>
            <Ionicons name="chevron-forward" size={14} color="#EA580C" />
          </Pressable>
        </View>

        {/* Products grid */}
        <View style={{ paddingHorizontal: 12, marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingBottom: 120 }}>
          {isPending ? (
            <Text style={{ ...typography.bodySmall, color: colors.textTertiary, padding: spacing.lg }}>Loading menu...</Text>
          ) : (products?.length ? products : []).map((p, i) => (
            <Animated.View key={p.id} entering={FadeInUp.delay(80 + (i % 2) * 40).duration(400)} style={{ width: '48%' }}>
              <Pressable
                onPress={() => router.push(`/product/${p.id}`)}
                style={{ backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.xs as any }}
              >
                <View style={{ height: 140, backgroundColor: colors.shimmer }}>
                  <Image source={{ uri: p.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  <View style={{ position: 'absolute', top: 8, left: 8, width: 18, height: 18, borderRadius: 3, backgroundColor: '#fff', borderWidth: 1.5, borderColor: p.isVeg ? '#16A34A' : '#DC2626', alignItems: 'center', justifyContent: 'center' }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: p.isVeg ? '#16A34A' : '#DC2626' }} />
                  </View>
                  <Pressable style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="heart-outline" size={14} color="#fff" />
                  </Pressable>
                </View>
                <View style={{ padding: 10, gap: 4 }}>
                  <Text style={{ ...typography.label, color: '#0F172A', fontWeight: '700' }} numberOfLines={1}>
                    {p.name}
                  </Text>
                  <Text style={{ ...typography.caption, color: '#64748B', lineHeight: 14 }} numberOfLines={2}>
                    {p.description}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Text style={{ color: '#F59E0B' }}>⭐</Text>
                    <Text style={{ ...typography.captionBold, color: '#0F172A' }}>{p.rating}</Text>
                    <Text style={{ ...typography.caption, color: '#64748B' }}>({p.ratingCount})</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 2 }}>
                      <Ionicons name="time-outline" size={12} color="#64748B" />
                      <Text style={{ ...typography.caption, color: '#64748B', fontSize: 11 }}>{p.prepTime}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>₹{p.price}</Text>
                    <Pressable
                      onPress={() => router.push(`/product/${p.id}`)}
                      style={{ backgroundColor: '#FF5A3D', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 }}
                    >
                      <Text style={{ ...typography.label, color: '#fff', fontWeight: '800', fontSize: 13 }}>+ Add</Text>
                    </Pressable>
                  </View>
                </View>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
