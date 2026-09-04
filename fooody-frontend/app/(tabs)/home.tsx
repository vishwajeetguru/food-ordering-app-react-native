import * as React from 'react';
import { View, Text, ScrollView, Pressable, FlatList, RefreshControl, useWindowDimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { FoodCard } from '@/components/FoodCard';
import { GreetingHeader } from '@/components/GreetingHeader';
import { SearchFilterBar } from '@/components/SearchFilterBar';
import { DeliveryLocationBar } from '@/components/DeliveryLocationBar';
import { useHome, useAddresses } from '@/hooks/useCatalog';
import { useAddressStore } from '@/store/addressStore';

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const homeQ = useHome();
  const categories = homeQ.data?.categories ?? [];
  const offersList = homeQ.data?.offers ?? [];
  const restaurant = homeQ.data?.restaurant;
  const popular = homeQ.data?.products.popular ?? [];
  const recommended = homeQ.data?.products.recommended ?? [];

  // Address integration for delivery bar (real location instead of mock)
  const addressesQ = useAddresses();
  const selected = useAddressStore((s) => s.selectedAddress);
  const addrs = addressesQ.data ?? [];

  React.useEffect(() => {
    if (addressesQ.data) useAddressStore.getState().hydrateFromApi(addressesQ.data);
  }, [addressesQ.data]);

  const delivery = React.useMemo(() => {
    if (addressesQ.isPending) return { label: 'Home', sub: 'Fetching address...', hasAddress: false, isLoading: true } as const;
    const addr = selected || addrs.find((a) => a.isDefault) || addrs[0];
    if (addr) {
      const short = [addr.houseFlat, addr.area, addr.city].filter(Boolean).join(', ') || addr.fullAddress || addr.address;
      // screenshot sub is just city/area like "Shegaon"
      const subShort = addr.city || addr.area || short.slice(0, 32);
      return {
        label: (addr.label === 'Other' && addr.customLabel ? addr.customLabel : addr.label) as string,
        sub: subShort,
        hasAddress: true,
        isLoading: false,
        count: addrs.length,
      };
    }
    return { label: 'Add address', sub: 'Tap to add Home / Work', hasAddress: false, isLoading: false, count: 0 } as const;
  }, [selected, addrs, addressesQ.isPending]);

  const onRefresh = React.useCallback(async () => {
    await Promise.all([homeQ.refetch(), addressesQ.refetch()]);
  }, [homeQ.refetch, addressesQ.refetch]);

  const cardWidth = (width - spacing.xl * 2 - spacing.md) / 2;

  if (homeQ.isPending) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Loading menu...</Text>
      </SafeAreaView>
    );
  }
  if (homeQ.isError) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <Text style={{ ...typography.bodySmall, color: colors.error, textAlign: 'center' }}>Failed to load home data. Check backend at {process.env.EXPO_PUBLIC_API_URL}</Text>
        <Pressable onPress={() => homeQ.refetch()} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary }}>
          <Text style={{ ...typography.label, color: colors.textInverse }}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={homeQ.isFetching} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1 - Greeting + Notification + Avatar - reusable GreetingHeader */}
        <GreetingHeader hasNotification />

        {/* 2 - Search + Filter - reusable SearchFilterBar */}
        <Animated.View entering={FadeInDown.delay(40).duration(400)}>
          <SearchFilterBar
            placeholder="Search for dishes"
            onSearchPress={() => router.push('/search')}
            onFilterPress={() => router.push('/search' as any)}
            style={{ marginTop: spacing.sm }}
          />
        </Animated.View>

        {/* 3 - Delivering to - real address */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={{ marginTop: spacing.md }}>
          <DeliveryLocationBar
            label={delivery.label}
            sub={delivery.sub}
            hasAddress={delivery.hasAddress}
            isLoading={(delivery as any).isLoading}
            count={delivery.count}
            onPress={() => router.push('/addresses')}
          />
        </Animated.View>

        {/* Banner - matches screenshot FLAT 20% OFF */}
        <Animated.View entering={FadeInUp.delay(120).duration(500)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
          <Pressable
            onPress={() => router.push('/(tabs)/offers' as any)}
            style={{
              height: 152,
              borderRadius: radius.xl,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: 'rgba(255,90,61,0.15)',
              ...shadows.sm as any,
            }}
          >
            <LinearGradient
              colors={['#FF5A3D', '#FF7A3D', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, flexDirection: 'row' }}
            >
              <View style={{ flex: 1, padding: spacing.lg, gap: 6, justifyContent: 'center' }}>
                <Text style={{ fontSize: 26, lineHeight: 28, fontWeight: '900', color: colors.textInverse, letterSpacing: -0.5 }}>
                  FLAT <Text style={{ color: '#FFF59D' }}>20% OFF</Text>
                </Text>
                <Text style={{ ...typography.bodySmall, color: 'rgba(255,255,255,0.96)', fontWeight: '500' }}>on orders above ₹499</Text>
                <View
                  style={{
                    backgroundColor: colors.surface,
                    alignSelf: 'flex-start',
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: radius.full,
                    marginTop: 8,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    ...shadows.xs as any,
                  }}
                >
                  <View style={{ width: 18, height: 18, borderRadius: 4, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="ticket-outline" size={12} color={colors.textInverse} />
                  </View>
                  <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>
                    Use <Text style={{ color: colors.primary, fontWeight: '800' }}>FOODY20</Text>
                  </Text>
                </View>
              </View>
              <View style={{ width: 148, height: '100%', position: 'relative' }}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' }}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="cover"
                />
                {/* subtle leaf overlay via gradient? */}
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.08)']} style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} />
              </View>
            </LinearGradient>
            {/* pagination dots */}
            <View style={{ position: 'absolute', bottom: 10, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
              <View style={{ width: 10, height: 6, borderRadius: 999, backgroundColor: colors.surface }} />
              <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.5)' }} />
              <View style={{ width: 6, height: 6, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.5)' }} />
            </View>
          </Pressable>
        </Animated.View>

        {/* Categories */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ marginTop: spacing.xl }}>
          <View style={{ paddingHorizontal: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.2 }}>Categories</Text>
            <Pressable onPress={() => router.push('/restaurant')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ ...typography.label, color: colors.primary, fontWeight: '600' }}>See all</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          </View>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(i) => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.lg, paddingTop: spacing.md, paddingBottom: 4 }}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInUp.delay(240 + index * 50).duration(400)}>
                <Pressable onPress={() => router.push('/restaurant')} style={{ alignItems: 'center', gap: 8, width: 72 }}>
                  <View
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      overflow: 'hidden',
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      ...shadows.xs as any,
                    }}
                  >
                    <Image source={{ uri: item.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
                  </View>
                  <Text style={{ ...typography.captionBold, color: colors.textPrimary, fontSize: 12 }} numberOfLines={1}>
                    {item.name}
                  </Text>
                </Pressable>
              </Animated.View>
            )}
          />
        </Animated.View>

        {/* Popular Today */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <View style={{ paddingHorizontal: spacing.xl, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.2 }}>Popular Today</Text>
            <Pressable onPress={() => router.push('/restaurant')} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ ...typography.label, color: colors.primary, fontWeight: '600' }}>View all</Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </Pressable>
          </View>
          <View style={{ paddingHorizontal: spacing.xl, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
            {popular.length ? (
              popular.slice(0, 4).map((p, i) => (
                <Animated.View key={p.id} entering={FadeInUp.delay(340 + i * 70).duration(420)} style={{ width: cardWidth }}>
                  <FoodCard product={p} onPress={() => router.push(`/product/${p.id}`)} />
                </Animated.View>
              ))
            ) : (
              <Text style={{ ...typography.caption, color: colors.textTertiary }}>No popular items</Text>
            )}
          </View>
        </Animated.View>

        {/* Recommended */}
        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={{ marginTop: spacing.xl, gap: spacing.md, paddingHorizontal: spacing.xl }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.2 }}>Recommended for You</Text>
          <View style={{ gap: spacing.md }}>
            {recommended.length ? (
              recommended.map((p, i) => (
                <Animated.View key={p.id} entering={FadeInUp.delay(440 + i * 80).duration(420)}>
                  <Pressable
                    onPress={() => router.push(`/product/${p.id}`)}
                    style={{
                      flexDirection: 'row',
                      backgroundColor: colors.surface,
                      borderRadius: radius.lg,
                      overflow: 'hidden',
                      borderWidth: 1,
                      borderColor: colors.borderLight,
                      ...shadows.xs as any,
                    }}
                  >
                    <Image source={{ uri: p.image }} style={{ width: 110, height: 110 }} contentFit="cover" />
                    <View style={{ flex: 1, padding: spacing.md, gap: 4 }}>
                      <Text style={{ ...typography.h4, color: colors.textPrimary }} numberOfLines={1}>
                        {p.name}
                      </Text>
                      <Text style={{ ...typography.caption, color: colors.textSecondary }} numberOfLines={2}>
                        {p.description}
                      </Text>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                        <Text style={{ ...typography.priceSmall, color: colors.textPrimary }}>₹{p.price}</Text>
                        <Text style={{ ...typography.captionBold, color: colors.primary }}>+ Add</Text>
                      </View>
                    </View>
                  </Pressable>
                </Animated.View>
              ))
            ) : (
              <Text style={{ ...typography.caption, color: colors.textTertiary }}>No recommendations</Text>
            )}
          </View>
        </Animated.View>

        {/* Offers */}
        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={{ marginTop: spacing.xl, paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Text style={{ fontSize: 18, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.2 }}>Today's Offers</Text>
          <FlatList
            horizontal
            data={offersList}
            keyExtractor={(i) => i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.md }}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInUp.delay(540 + index * 80).duration(400)}>
                <View
                  style={{
                    width: 260,
                    height: 100,
                    borderRadius: radius.lg,
                    backgroundColor: (item.colors?.[0] || colors.primary) as string,
                    padding: spacing.lg,
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ ...typography.h3, color: colors.textInverse }}>{item.title}</Text>
                  <Text style={{ ...typography.bodySmall, color: 'rgba(255,255,255,0.9)' }}>{item.subtitle}</Text>
                  <Text style={{ ...typography.captionBold, color: colors.textInverse, marginTop: 6 }}>Code: {item.code}</Text>
                </View>
              </Animated.View>
            )}
          />
        </Animated.View>

        {/* Restaurant CTA */}
        {restaurant ? (
          <Animated.View entering={FadeInUp.delay(600).duration(500)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl }}>
            <Pressable
              onPress={() => router.push('/restaurant')}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: spacing.md,
                backgroundColor: colors.surface,
                borderRadius: radius.lg,
                padding: spacing.md,
                borderWidth: 1,
                borderColor: colors.borderLight,
                ...shadows.sm as any,
              }}
            >
              <Image source={{ uri: restaurant.logo }} style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.shimmer }} />
              <View style={{ flex: 1 }}>
                <Text style={{ ...typography.h4, color: colors.textPrimary }}>{restaurant.name}</Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>⭐ {restaurant.rating} • {restaurant.deliveryTime} • ₹{restaurant.priceForTwo} for two</Text>
              </View>
              <Text style={{ ...typography.label, color: colors.primary }}>View →</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
