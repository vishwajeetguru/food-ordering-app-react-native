import * as React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors } from '@/theme/colors';
import { spacing, radius, hitSlop } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import type { Product } from '@/types';
import { formatPrice } from '@/utils/helpers';
import { useCartStore } from '@/store/cartStore';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useWishlistStore } from '@/store/wishlistStore';
import { useToggleWishlist } from '@/hooks/useWishlist';

export function FoodCard({ product, onPress }: { product: Product; onPress?: () => void }) {
  const cart = useCartStore();
  const qty = cart.items.find((i) => i.product.id === product.id)?.quantity ?? 0;
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const wishlistIds = useWishlistStore((s) => s.ids as Set<string>);
  const isWishlisted = wishlistIds.has(product.id);
  const toggleWishlist = useToggleWishlist();
  const handleWishlist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
    toggleWishlist.mutate(product.id);
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => (scale.value = withSpring(0.98))}
      onPressOut={() => (scale.value = withSpring(1))}
      style={{ flex: 1 }}
    >
      <Animated.View style={[styles.card, aStyle, shadows.sm as any]}>
        <Image source={{ uri: product.image }} style={styles.image} contentFit="cover" transition={200} />
        {/* Veg indicator */}
        <View style={[styles.vegBox, { borderColor: product.isVeg ? colors.veg : colors.nonVeg }]}>
          <View style={[styles.vegDot, { backgroundColor: product.isVeg ? colors.veg : colors.nonVeg }]} />
        </View>
        {/* Wishlist heart - with real toggle */}
        <Pressable
          hitSlop={hitSlop}
          onPress={handleWishlist}
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: isWishlisted ? 'rgba(255,90,61,0.92)' : 'rgba(0,0,0,0.42)',
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1,
            borderColor: isWishlisted ? colors.primary : 'rgba(255,255,255,0.15)',
          }}
          accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Ionicons name={isWishlisted ? 'heart' : 'heart-outline'} size={16} color="#fff" />
        </Pressable>
        <View style={{ padding: spacing.md, gap: 6 }}>
          <Text numberOfLines={1} style={{ ...typography.h4, color: colors.textPrimary }}>{product.name}</Text>
          <Text numberOfLines={2} style={{ ...typography.bodySmall, color: colors.textSecondary }}>{product.description}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
            <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>⭐ {product.rating}</Text>
            <Text style={{ ...typography.caption, color: colors.textTertiary }}>({product.ratingCount}) • {product.prepTime}</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <View>
              <Text style={{ ...typography.price, color: colors.textPrimary }}>{formatPrice(product.price)}</Text>
              {product.originalPrice ? <Text style={{ ...typography.caption, color: colors.textTertiary, textDecorationLine: 'line-through' }}>{formatPrice(product.originalPrice)}</Text> : null}
            </View>
            {qty === 0 ? (
              <Pressable
                hitSlop={hitSlop}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(()=>{}); cart.add(product, 1); }}
                style={styles.addBtn}
                accessibilityLabel={`Add ${product.name} to cart`}
              >
                <Text style={{ color: colors.textInverse, ...typography.label, fontWeight: '700' }}>+ Add</Text>
              </Pressable>
            ) : (
              <View style={styles.qtyBox}>
                <Pressable hitSlop={hitSlop} onPress={() => cart.dec(product.id)} style={styles.qtyBtn}><Text style={styles.qtyText}>−</Text></Pressable>
                <Text style={{ ...typography.label, color: colors.textPrimary, minWidth: 20, textAlign: 'center' }}>{qty}</Text>
                <Pressable hitSlop={hitSlop} onPress={() => cart.inc(product.id)} style={styles.qtyBtn}><Text style={styles.qtyText}>+</Text></Pressable>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  image: { width: '100%', height: 140, backgroundColor: colors.shimmer },
  vegBox: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 18,
    height: 18,
    borderWidth: 1.5,
    borderRadius: 3,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: { width: 8, height: 8, borderRadius: 999 },
  addBtn: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
    ...{ shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 2 } as any,
  },
  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  qtyText: { color: colors.textInverse, fontWeight: '700', fontSize: 16 },
});
