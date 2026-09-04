import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useOrder } from '@/hooks/useCatalog';
import { Button } from '@/components/ui/Button';

const steps = ['Placed', 'Preparing', 'Out for delivery', 'Delivered'];
const statusIndex: Record<string, number> = { pending: 0, preparing: 1, out_for_delivery: 2, delivered: 3 };

export default function OrderDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isPending, isError } = useOrder(id as string);
  const statusIdx = order ? (order.status === 'cancelled' ? -1 : (statusIndex[order.status] ?? 0)) : 1;

  if (isPending) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: colors.background, alignItems:'center', justifyContent:'center', padding: spacing.xl }}>
        <Text style={{ ...typography.bodySmall, color: colors.textTertiary }}>Loading order...</Text>
      </SafeAreaView>
    );
  }
  if (isError || !order) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: colors.background, alignItems:'center', justifyContent:'center', padding: spacing.xl, gap: spacing.md }}>
        <Text style={{ ...typography.bodySmall, color: colors.error }}>Order not found</Text>
        <Button title="Go back" onPress={() => router.back()} variant="outline" />
      </SafeAreaView>
    );
  }

  const isCancelled = order.status === 'cancelled';

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection:'row', alignItems:'center', gap: spacing.md }}>
        <Pressable onPress={()=>router.back()}><Text style={{ fontSize:22, fontWeight:'700' }}>‹</Text></Pressable>
        <Text style={{ ...typography.h2, color: colors.textPrimary }}>Order {order.orderNumber || `#${order.id.slice(0,6)}`}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, gap: spacing.md }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }}>Tracking</Text>
          {isCancelled ? (
            <View style={{ backgroundColor: colors.errorLight, borderRadius: radius.md, padding: spacing.md, alignItems:'center' }}>
              <Text style={{ ...typography.label, color: colors.error }}>Order cancelled</Text>
            </View>
          ) : (
          <>
          <View style={{ flexDirection:'row', gap: spacing.md }}>
            {steps.map((s, i)=>(
              <View key={s} style={{ flex:1, alignItems:'center', gap: 8 }}>
                <View style={{ width: 32, height:32, borderRadius:16, backgroundColor: i<=statusIdx? colors.primary: colors.borderLight, alignItems:'center', justifyContent:'center' }}>
                  <Text style={{ color: i<=statusIdx? colors.textInverse: colors.textTertiary, fontWeight:'700' }}>{i < statusIdx ? '✓' : i+1}</Text>
                </View>
                <Text style={{ ...typography.captionBold, color: i<=statusIdx? colors.primary: colors.textTertiary, textAlign:'center', fontSize:10 }}>{s}</Text>
              </View>
            ))}
          </View>
          <View style={{ height:4, backgroundColor: colors.borderLight, borderRadius:999, overflow:'hidden', marginTop: 4 }}>
            <View style={{ width: `${((statusIdx+1)/steps.length)*100}%`, height:'100%', backgroundColor: colors.primary, borderRadius:999 }} />
          </View>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Status: {order.status} • {order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}</Text>
          </>
          )}
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth:1, borderColor: colors.borderLight }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }}>Items</Text>
          {(order.items ?? []).map((it: any, idx: number) => (
            <View key={idx} style={{ flexDirection:'row', justifyContent:'space-between' }}>
              <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>{it.name} x{it.quantity}</Text>
              <Text style={{ ...typography.bodySmall, color: colors.textPrimary }}>₹{it.price * it.quantity}</Text>
            </View>
          ))}
          <View style={{ height:1, backgroundColor: colors.divider, marginVertical:6 }} />
          <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
            <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Subtotal</Text>
            <Text style={{ ...typography.bodySmall, color: colors.textPrimary }}>₹{order.subtotal ?? 0}</Text>
          </View>
          <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
            <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Delivery</Text>
            <Text style={{ ...typography.bodySmall, color: colors.textPrimary }}>₹{order.deliveryFee ?? 0}</Text>
          </View>
          <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
            <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Tax</Text>
            <Text style={{ ...typography.bodySmall, color: colors.textPrimary }}>₹{order.tax ?? 0}</Text>
          </View>
          <View style={{ height:1, backgroundColor: colors.divider, marginVertical:6 }} />
          <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
            <Text style={{ ...typography.h4, color: colors.textPrimary }}>Total</Text>
            <Text style={{ ...typography.h4, color: colors.textPrimary }}>₹{order.total ?? 0}</Text>
          </View>
        </View>

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth:1, borderColor: colors.borderLight }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }}>Delivery Address</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>{order.address ? JSON.stringify(order.address) : 'No address (default)'}</Text>
          <Text style={{ ...typography.caption, color: colors.textTertiary }}>Payment: {order.paymentMethod}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
