import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { useCartStore } from '@/store/cartStore';

export function FloatingCart() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const items = useCartStore((s) => s.items);
  const count = items.reduce((a, b) => a + b.quantity, 0);
  const subtotal = items.reduce((a, b) => a + b.product.price * b.quantity, 0);
  const pressed = useSharedValue(1);
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressed.value }] }));

  if (count === 0) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(180)}
      style={{ position: 'absolute', left: spacing.lg, right: spacing.lg, bottom: insets.bottom + 74, zIndex: 50 }}
    >
      <Animated.View style={[{ borderRadius: radius.md, ...shadows.floating as any, overflow: 'hidden' }, pressStyle]}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              router.push('/cart');
            }}
            onPressIn={() => { pressed.value = withTiming(0.98, { duration: 100 }); }}
            onPressOut={() => { pressed.value = withTiming(1, { duration: 150 }); }}
            accessibilityLabel={`${count} items in cart, view cart`}
            style={{
              backgroundColor: colors.primary,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: spacing.lg,
              height: 56,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="cart" size={16} color="#fff" />
              </View>
              <Text style={{ ...typography.labelLarge, color: colors.textInverse }}>
                {count} item{count > 1 ? 's' : ''} • ₹{subtotal}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={{ ...typography.labelLarge, color: colors.textInverse }}>View Cart</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </View>
          </Pressable>
      </Animated.View>
    </Animated.View>
  );
}
