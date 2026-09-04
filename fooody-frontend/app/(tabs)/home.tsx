import * as React from 'react';
import { View, Text, ScrollView, Pressable, FlatList, RefreshControl, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { FoodCard } from '@/components/FoodCard';
import { TopBar } from '@/components/TopBar';
import { useAuthStore } from '@/store/authStore';
import { useHome } from '@/hooks/useCatalog';

function Greeting() {
  const hour = new Date().getHours();
  const g = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const name = useAuthStore((s)=>s.user?.name) || 'Vishwa';
  return <Text style={{ ...typography.body, color: colors.textSecondary }}>{g}, <Text style={{ fontWeight:'700', color: colors.textPrimary }}>{name} 👋</Text></Text>;
}

export default function Home() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const homeQ = useHome();
  const categories = homeQ.data?.categories ?? [];
  const offersList = homeQ.data?.offers ?? [];
  const restaurant = homeQ.data?.restaurant;
  const popular = homeQ.data?.products.popular ?? [];
  const recommended = homeQ.data?.products.recommended ?? [];

  const onRefresh = React.useCallback(async () => {
    await homeQ.refetch();
  }, [homeQ.refetch]);

  const cardWidth = (width - spacing.xl*2 - spacing.md) / 2;

  if (homeQ.isPending) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: colors.background, alignItems:'center', justifyContent:'center', padding: spacing.xl }}>
        <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Loading menu...</Text>
      </SafeAreaView>
    );
  }
  if (homeQ.isError) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: colors.background, alignItems:'center', justifyContent:'center', padding: spacing.xl, gap: spacing.md }}>
        <Text style={{ ...typography.bodySmall, color: colors.error, textAlign:'center' }}>Failed to load home data. Check backend at {process.env.EXPO_PUBLIC_API_URL}</Text>
        <Pressable onPress={() => homeQ.refetch()} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary }}>
          <Text style={{ ...typography.label, color: colors.textInverse }}>Retry</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={homeQ.isFetching} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: search + avatar */}
        <TopBar />

        {/* Greeting + location */}
        <Animated.View entering={FadeInDown.delay(60).duration(450)} style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.sm }}>
          <Greeting />
          <Pressable style={{ flexDirection:'row', alignItems:'center', gap: 6 }}>
            <Text style={{ ...typography.captionBold, color: colors.textSecondary }}>Delivering to</Text>
            <Text style={{ ...typography.label, color: colors.textPrimary }}>Home ▼</Text>
          </Pressable>
        </Animated.View>

        {/* Banner */}
        <Animated.View entering={FadeInUp.delay(120).duration(500)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md }}>
          <View style={{ height: 140, borderRadius: radius.xl, overflow:'hidden', backgroundColor: colors.primary, flexDirection:'row' }}>
            <View style={{ flex:1, padding: spacing.lg, gap: 6, justifyContent:'center' }}>
              <Text style={{ ...typography.h2, color: colors.textInverse }}>FLAT 20% OFF</Text>
              <Text style={{ ...typography.bodySmall, color: 'rgba(255,255,255,0.9)' }}>on orders above ₹499</Text>
              <View style={{ backgroundColor: colors.surface, alignSelf:'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius.sm, marginTop: 6 }}>
                <Text style={{ ...typography.captionBold, color: colors.primary }}>Use FOODY20</Text>
              </View>
            </View>
            <Image source={{ uri:'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400' }} style={{ width: 140, height: '100%' }} contentFit="cover" />
          </View>
        </Animated.View>

        {/* Categories */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={{ marginTop: spacing.xl }}>
          <View style={{ paddingHorizontal: spacing.xl, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <Text style={{ ...typography.h2, color: colors.textPrimary }}>Categories</Text>
            <Pressable onPress={()=>router.push('/restaurant')}><Text style={{ ...typography.label, color: colors.primary }}>See all</Text></Pressable>
          </View>
          <FlatList
            horizontal
            data={categories}
            keyExtractor={(i)=>i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: spacing.xl, gap: spacing.md, paddingTop: spacing.md }}
            renderItem={({ item, index })=>(
              <Animated.View entering={FadeInUp.delay(240 + index*50).duration(400)}>
                <Pressable onPress={()=>router.push('/restaurant')} style={{ alignItems:'center', gap: 8 }}>
                  <View style={{ width: 72, height: 72, borderRadius: 36, overflow:'hidden', backgroundColor: colors.surface, borderWidth:1, borderColor: colors.borderLight }}>
                    <Image source={{ uri: item.image }} style={{ width:'100%', height:'100%' }} contentFit="cover" />
                  </View>
                  <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>{item.name}</Text>
                </Pressable>
              </Animated.View>
            )}
          />
        </Animated.View>

        {/* Popular Today */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ marginTop: spacing.xl, gap: spacing.md }}>
          <View style={{ paddingHorizontal: spacing.xl, flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <Text style={{ ...typography.h2, color: colors.textPrimary }}>Popular Today</Text>
            <Pressable onPress={()=>router.push('/restaurant')}><Text style={{ ...typography.label, color: colors.primary }}>View all</Text></Pressable>
          </View>
          <View style={{ paddingHorizontal: spacing.xl, flexDirection:'row', flexWrap:'wrap', gap: spacing.md }}>
            {popular.length ? popular.slice(0,4).map((p, i)=>(
              <Animated.View key={p.id} entering={FadeInUp.delay(340 + i*70).duration(420)} style={{ width: cardWidth }}>
                <FoodCard product={p} onPress={()=>router.push(`/product/${p.id}`)} />
              </Animated.View>
            )) : <Text style={{ ...typography.caption, color: colors.textTertiary }}>No popular items</Text>}
          </View>
        </Animated.View>

        {/* Recommended */}
        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={{ marginTop: spacing.xl, gap: spacing.md, paddingHorizontal: spacing.xl }}>
          <Text style={{ ...typography.h2, color: colors.textPrimary }}>Recommended for You</Text>
          <View style={{ gap: spacing.md }}>
            {recommended.length ? recommended.map((p, i)=>(
              <Animated.View key={p.id} entering={FadeInUp.delay(440 + i*80).duration(420)}>
                <Pressable onPress={()=>router.push(`/product/${p.id}`)} style={{ flexDirection:'row', backgroundColor: colors.surface, borderRadius: radius.lg, overflow:'hidden', borderWidth:1, borderColor: colors.borderLight, ...shadows.xs as any }}>
                  <Image source={{ uri: p.image }} style={{ width: 110, height: 110 }} contentFit="cover" />
                  <View style={{ flex:1, padding: spacing.md, gap: 4 }}>
                    <Text style={{ ...typography.h4, color: colors.textPrimary }} numberOfLines={1}>{p.name}</Text>
                    <Text style={{ ...typography.caption, color: colors.textSecondary }} numberOfLines={2}>{p.description}</Text>
                    <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop: 6 }}>
                      <Text style={{ ...typography.priceSmall, color: colors.textPrimary }}>₹{p.price}</Text>
                      <Text style={{ ...typography.captionBold, color: colors.primary }}>+ Add</Text>
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            )) : <Text style={{ ...typography.caption, color: colors.textTertiary }}>No recommendations</Text>}
          </View>
        </Animated.View>

        {/* Offers */}
        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={{ marginTop: spacing.xl, paddingHorizontal: spacing.xl, gap: spacing.md }}>
          <Text style={{ ...typography.h2, color: colors.textPrimary }}>Today's Offers</Text>
          <FlatList
            horizontal
            data={offersList}
            keyExtractor={(i)=>i.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.md }}
            renderItem={({ item, index })=>(
              <Animated.View entering={FadeInUp.delay(540 + index*80).duration(400)}>
                <View style={{ width: 260, height: 100, borderRadius: radius.lg, backgroundColor: (item.colors?.[0] || colors.primary) as string, padding: spacing.lg, justifyContent:'center' }}>
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
          <Pressable onPress={()=>router.push('/restaurant')} style={{ flexDirection:'row', alignItems:'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth:1, borderColor: colors.borderLight, ...shadows.sm as any }}>
            <Image source={{ uri: restaurant.logo }} style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: colors.shimmer }} />
            <View style={{ flex:1 }}>
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
