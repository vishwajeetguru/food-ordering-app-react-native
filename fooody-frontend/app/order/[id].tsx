import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { useOrder } from '@/hooks/useCatalog';
import { useRealtimeOrder } from '@/hooks/useRealtime';
import { Button } from '@/components/ui/Button';

const steps = [
  { key: 'placed', label: 'Placed', icon: 'receipt' as const },
  { key: 'preparing', label: 'Preparing', icon: 'restaurant' as const },
  { key: 'out_for_delivery', label: 'Out for delivery', icon: 'bicycle' as const },
  { key: 'delivered', label: 'Delivered', icon: 'home' as const },
];
const statusIndex: Record<string, number> = { pending: 0, placed: 0, preparing: 1, out_for_delivery: 2, delivered: 3 };

function formatHeaderDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
}
function formatTime(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
}

function PulsingCircle({ active, icon, delay }: { active: boolean; icon: string; delay: number }) {
  const scale = useSharedValue(1);
  const ring = useSharedValue(0);

  React.useEffect(() => {
    if (active) {
      scale.value = withRepeat(withSequence(withTiming(1.08, { duration: 700, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 700 })), -1, true);
      ring.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }), -1, false);
    }
  }, [active]);

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: active ? 0.35 * (1 - ring.value) : 0,
    transform: [{ scale: 1 + ring.value * 0.6 }],
  }));

  return (
    <Animated.View entering={FadeIn.delay(delay).duration(400)} style={{ alignItems: 'center', justifyContent: 'center', width: 56, height: 56 }}>
      {active && <Animated.View style={[{ position: 'absolute', width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, opacity: 0.2 }, ringStyle]} />}
      <Animated.View style={[{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? colors.primary : '#E5E7EB', borderWidth: active ? 0 : 1, borderColor: '#E5E7EB', ...shadows.sm as any }, pulseStyle]}>
        <Ionicons name={icon as any} size={20} color={active ? '#fff' : '#9CA3AF'} />
      </Animated.View>
    </Animated.View>
  );
}

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isPending, isError } = useOrder(id as string);
  useRealtimeOrder(id as string, !!id);
  const statusIdx = order ? (order.status === 'cancelled' ? -1 : (statusIndex[order.status] ?? 0)) : 0;
  const progress = useSharedValue(0);

  React.useEffect(() => {
    if (order) progress.value = withTiming(((statusIdx + 1) / steps.length) * 100, { duration: 900, easing: Easing.out(Easing.cubic) });
  }, [statusIdx, order]);

  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));
  const isCancelled = order?.status === 'cancelled';

  if (isPending) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5', alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
        <Text style={{ ...typography.bodySmall, color: colors.textTertiary }}>Loading order...</Text>
      </SafeAreaView>
    );
  }
  if (isError || !order) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5', alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <Text style={{ ...typography.bodySmall, color: colors.error }}>Order not found</Text>
        <Button title="Go back" onPress={() => router.back()} variant="outline" />
      </SafeAreaView>
    );
  }

  const item = (order.items as any[])?.[0];
  const banner = (() => {
    if (isCancelled) return { title: 'Order cancelled', sub: 'Your order was cancelled. Refund will be processed if paid.' };
    if (statusIdx === 0) return { title: 'Your order has been placed successfully.', sub: "We'll start preparing it soon." };
    if (statusIdx === 1) return { title: 'Your food is being prepared', sub: 'Our chef is crafting your meal with love.' };
    if (statusIdx === 2) return { title: 'Your order is on the way!', sub: 'Our delivery partner is bringing it to you.' };
    return { title: 'Delivered — enjoy your meal!', sub: 'We hope you loved it. Rate your order.' };
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, backgroundColor: '#FFFBF5' }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.xs as any }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary, fontWeight: '800' }} numberOfLines={1}>Order {order.orderNumber || `ORD-${order.id.slice(0, 8).toUpperCase()}`}</Text>
          <Text style={{ ...typography.caption, color: '#64748B' }}>Placed on {formatHeaderDate(order.createdAt)}</Text>
        </View>
        <Pressable onPress={() => router.push('/support' as any)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.xs as any }}>
          <Ionicons name="headset" size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {/* Order Tracking */}
        <Animated.View entering={FadeInUp.duration(500)} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.sm as any, gap: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ gap: 2 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>Order Tracking</Text>
              <Text style={{ ...typography.caption, color: '#64748B' }}>Your food journey is on its way</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF2E8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
              <Ionicons name="time-outline" size={16} color="#EA580C" />
              <Text style={{ ...typography.captionBold, color: '#EA580C', textTransform: 'capitalize' }}>{order.status === 'pending' ? 'Pending' : order.status.replace('_', ' ')}</Text>
            </View>
          </View>

          {isCancelled ? (
            <View style={{ backgroundColor: colors.errorLight, borderRadius: 12, padding: 14, alignItems: 'center' }}>
              <Text style={{ ...typography.label, color: colors.error }}>Order cancelled</Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 4 }}>Refund will be processed if paid.</Text>
            </View>
          ) : (
            <>
              {/* Steps */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 4 }}>
                {steps.map((s, i) => {
                  const active = i <= statusIdx;
                  const isCurrent = i === statusIdx;
                  return (
                    <View key={s.key} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                      <View style={{ width: '100%', alignItems: 'center', justifyContent: 'center', height: 56 }}>
                        {/* line */}
                        {i < steps.length - 1 && (
                          <View style={{ position: 'absolute', top: 24, left: '60%', right: '-40%', height: 3, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' }}>
                            <Animated.View style={[{ height: '100%', backgroundColor: '#EA580C', borderRadius: 2 }, i < statusIdx ? { width: '100%' } : isCurrent ? progressStyle : { width: '0%' }]} />
                          </View>
                        )}
                        <PulsingCircle active={active} icon={s.icon} delay={120 + i * 90} />
                      </View>
                      <Text style={{ ...typography.captionBold, color: active ? '#EA580C' : '#6B7280', fontSize: 12, textAlign: 'center' }}>{s.label}</Text>
                      {i === 0 && order.createdAt ? <Text style={{ ...typography.caption, color: '#9CA3AF', fontSize: 11, marginTop: -4 }}>{formatTime(order.createdAt)}</Text> : null}
                    </View>
                  );
                })}
              </View>

              {/* Banner */}
              <Animated.View entering={FadeIn.delay(500).duration(400)} style={{ flexDirection: 'row', gap: 12, backgroundColor: '#FFF2E8', borderRadius: 14, padding: 12, alignItems: 'center', marginTop: 2 }}>
                <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: '#FF8C42', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="time-outline" size={22} color="#fff" />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ ...typography.captionBold, color: '#0F172A', fontSize: 13 }}>{banner.title}</Text>
                  <Text style={{ ...typography.caption, color: '#64748B', lineHeight: 16 }}>{banner.sub}</Text>
                </View>
              </Animated.View>
            </>
          )}
        </Animated.View>

        {/* Order Items */}
        <Animated.View entering={FadeInUp.delay(150).duration(450)} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.xs as any, gap: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Order Items ({order.items?.length ?? 0})</Text>
          {(order.items as any[])?.map((it: any, idx: number) => (
            <Animated.View key={idx} entering={FadeInUp.delay(200 + idx * 60).duration(400)} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <Image source={{ uri: it.image || 'https://images.unsplash.com/photo-1568909344668?w=200' }} style={{ width: 64, height: 64, borderRadius: 12, backgroundColor: colors.shimmer }} contentFit="cover" />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ ...typography.label, color: '#0F172A', fontWeight: '700' }} numberOfLines={1}>{it.name}</Text>
                <Text style={{ ...typography.caption, color: '#9CA3AF' }}>x{it.quantity}</Text>
              </View>
              <Text style={{ ...typography.label, color: '#0F172A', fontWeight: '800' }}>₹{it.price * it.quantity}</Text>
            </Animated.View>
          )) ?? null}
          <View style={{ height: 1, backgroundColor: '#F1F5F9', marginTop: 4 }} />
          <View style={{ gap: 8, marginTop: 2 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ ...typography.caption, color: '#64748B' }}>Subtotal</Text><Text style={{ ...typography.captionBold, color: '#0F172A' }}>₹{order.subtotal ?? 0}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ ...typography.caption, color: '#64748B' }}>Delivery</Text><Text style={{ ...typography.captionBold, color: '#0F172A' }}>₹{order.deliveryFee ?? 0}</Text></View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ ...typography.caption, color: '#64748B' }}>Tax</Text><Text style={{ ...typography.captionBold, color: '#0F172A' }}>₹{order.tax ?? 0}</Text></View>
            <View style={{ height: 1, backgroundColor: '#0F172A', opacity: 0.08, marginTop: 4 }} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}><Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Total</Text><Text style={{ fontSize: 18, fontWeight: '900', color: '#0F172A' }}>₹{order.total ?? 0}</Text></View>
          </View>
        </Animated.View>

        {/* Delivery Address */}
        <Animated.View entering={FadeInUp.delay(250).duration(450)} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.xs as any, gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FF5A3D', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="location" size={14} color="#fff" />
              </View>
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Delivery Address</Text>
            </View>
            <Pressable onPress={() => router.push('/addresses' as any)} style={{ paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, backgroundColor: '#FFF2E8' }}>
              <Text style={{ ...typography.captionBold, color: '#EA580C' }}>Edit</Text>
            </Pressable>
          </View>
          <View style={{ gap: 4 }}>
            <Text style={{ ...typography.label, color: '#0F172A', fontWeight: '700' }}>
              {(order.address as any)?.address || (order.address as any)?.area || 'Shegaon, Maharashtra, 444203'}
            </Text>
            <Text style={{ ...typography.caption, color: '#94A3B8' }}>
              {(order.address as any)?.details || (order.address as any)?.houseFlat ? `${(order.address as any).houseFlat}, ${(order.address as any).area || ''}` : 'Near Main Road, Shegaon, Maharashtra 444203'}
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
          <Pressable onPress={() => {}} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="card-outline" size={18} color="#64748B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.label, color: '#0F172A', fontWeight: '600' }}>Payment Method</Text>
              <Text style={{ ...typography.caption, color: '#64748B', textTransform: 'capitalize' }}>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </Pressable>
        </Animated.View>

        {/* Need help */}
        <Animated.View entering={FadeInUp.delay(350).duration(450)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#E6F4EA', borderRadius: 20, padding: 14, borderWidth: 1, borderColor: '#C8E6C9' }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#A5D6A7', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="headset" size={22} color="#1B5E20" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...typography.label, color: '#0F172A', fontWeight: '800' }}>Need help with your order?</Text>
            <Text style={{ ...typography.caption, color: '#64748B' }}>Our support team is here for you.</Text>
          </View>
          <Pressable onPress={() => router.push('/support' as any)} style={{ backgroundColor: '#C8E6C9', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 }}>
            <Text style={{ ...typography.captionBold, color: '#1B5E20' }}>Contact Support</Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
