import * as React from 'react';
import { View, Text, ScrollView, Pressable, FlatList } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { FoodCard } from '@/components/FoodCard';
import { TopBar } from '@/components/TopBar';
import { useProducts, useCategories, useRestaurant } from '@/hooks/useCatalog';

export function RestaurantMenu({ headerMode = 'fixed' }: { headerMode?: 'fixed' | 'overlay' }) {
  const router = useRouter();
  const { data: restaurant } = useRestaurant();
  const { data: categories } = useCategories();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const { data: products, isPending } = useProducts(activeId ? { categoryId: activeId } : { limit: 50 });

  const chips = React.useMemo(() => {
    if (!categories?.length) return [];
    return [{ id: 'all', name: 'All' }, ...categories.map(c => ({ id: c.id, name: c.name }))];
  }, [categories]);

  if (!restaurant && headerMode === 'fixed') {
    // TopBar still visible while restaurant loads
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {headerMode === 'fixed' ? <TopBar /> : null}
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ height: 200, backgroundColor: colors.shimmer }}>
          {restaurant ? <Image source={{ uri: restaurant.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : null}
          {headerMode === 'overlay' ? (
            <View style={{ position: 'absolute', top: spacing.md, left: spacing.md, right: spacing.md, flexDirection: 'row', justifyContent: 'space-between' }}>
              <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
              </Pressable>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="heart-outline" size={18} color={colors.textPrimary} />
                </View>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.textPrimary} />
                </View>
              </View>
            </View>
          ) : null}
        </View>

        {/* Info Card */}
        {restaurant ? (
        <Animated.View entering={FadeInUp.delay(80).duration(500)} style={{ marginHorizontal: spacing.xl, marginTop: -30, backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight, ...shadows.md as any, gap: 8 }}>
          <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'center' }}>
            <Image source={{ uri: restaurant.logo }} style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.shimmer }} />
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.h1, color: colors.textPrimary }}>{restaurant.name}</Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>{restaurant.cuisines.join(' • ')}</Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.md, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.sm }}>
              <Text style={{ ...typography.captionBold, color: colors.success }}>⭐ {restaurant.rating}</Text>
              <Text style={{ ...typography.caption, color: colors.success }}>({restaurant.ratingCount})</Text>
            </View>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>{restaurant.deliveryTime}</Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>₹{restaurant.priceForTwo} for two</Text>
          </View>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary, marginTop: 4 }}>{restaurant.about}</Text>
        </Animated.View>
        ) : (
          <View style={{ marginHorizontal: spacing.xl, marginTop: -30, height: 120, borderRadius: radius.xl, backgroundColor: colors.surface, borderWidth:1, borderColor: colors.borderLight }} />
        )}

        {/* Categories chips */}
        <Animated.View entering={FadeInUp.delay(160).duration(500)} style={{ marginTop: spacing.lg }}>
          <FlatList
            horizontal
            data={chips}
            keyExtractor={(i) => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.sm }}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => setActiveId(item.id === 'all' ? null : item.id)}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: (activeId ?? 'all') === item.id ? colors.primary : colors.surface, borderWidth: 1, borderColor: (activeId ?? 'all') === item.id ? colors.primary : colors.border }}
              >
                <Text style={{ ...typography.label, color: (activeId ?? 'all') === item.id ? colors.textInverse : colors.textPrimary }}>{item.name}</Text>
              </Pressable>
            )}
          />
        </Animated.View>

        {/* Products grid */}
        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg, flexDirection:'row', flexWrap:'wrap', gap: spacing.md, paddingBottom: 120 }}>
          {isPending ? (
            <Text style={{ ...typography.bodySmall, color: colors.textTertiary, padding: spacing.lg }}>Loading menu...</Text>
          ) : (products?.length ? products : []).map((p, i) => (
            <Animated.View key={p.id} entering={FadeInUp.delay(200 + (i % 2) * 70 + Math.floor(i / 2) * 40).duration(420)} style={{ width: '48%' }}>
              <FoodCard product={p} onPress={() => router.push(`/product/${p.id}`)} />
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
