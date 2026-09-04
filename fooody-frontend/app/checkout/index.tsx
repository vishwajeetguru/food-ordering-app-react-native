import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { useCreateOrder, useAddresses } from '@/hooks/useCatalog';

export default function Checkout() {
  const router = useRouter();
  const { items, subtotal, clear } = useCartStore();
  const user = useAuthStore((s)=>s.user);
  const addressesQ = useAddresses();
  const createOrderM = useCreateOrder();
  const [payment, setPayment] = React.useState<'cod'|'online'>('cod');
  const sub = subtotal();
  const delivery = 40; const tax = Math.round(sub*0.05); const total = sub+delivery+tax;

  const placeOrder = async () => {
    if (!items.length) return;
    if (createOrderM.isPending) return;
    const addr = addressesQ.data?.[0] || null;
    try {
      const order = await createOrderM.mutateAsync({
        items: items.map(i => ({ productId: i.product.id, name: i.product.name, price: i.product.price, quantity: i.quantity, image: i.product.image })),
        subtotal: sub,
        deliveryFee: delivery,
        tax,
        discount: 0,
        total,
        paymentMethod: payment,
        address: addr,
      });
      Alert.alert('Order Placed!', `Your order ${order?.orderNumber || ''} for ₹${total} is confirmed.`, [
        { text:'View Orders', onPress:()=>{ clear(); router.replace('/(tabs)/orders'); } },
        { text:'OK', onPress:()=>{ clear(); router.replace('/(tabs)/home'); } },
      ]);
    } catch (e: any) {
      Alert.alert('Order failed', e?.message || 'Please try again');
    }
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection:'row', alignItems:'center', gap: spacing.md }}>
        <Pressable onPress={()=>router.back()}><Text style={{ fontSize:22, fontWeight:'700' }}>‹</Text></Pressable>
        <Text style={{ ...typography.h2, color: colors.textPrimary }}>Checkout</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }} showsVerticalScrollIndicator={false}>
        {/* Address */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, gap: spacing.sm }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }}>Delivery Address</Text>
          <View style={{ borderWidth:1, borderColor: colors.primary, backgroundColor: colors.primaryMuted, borderRadius: radius.md, padding: spacing.md, gap: 4 }}>
            <Text style={{ ...typography.label, color: colors.textPrimary }}>Home • {user?.name || 'Vishwa'}</Text>
            <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>123, Green Park, New Delhi • +91 {user?.phone || '9876543210'}</Text>
          </View>
          <Pressable><Text style={{ ...typography.label, color: colors.primary }}>+ Add new address</Text></Pressable>
        </View>

        {/* Contact */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, gap: spacing.sm }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }}>Contact</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>{user?.email || 'test@example.com'} • Verified</Text>
        </View>

        {/* Order summary */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, gap: spacing.sm }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }}>Order Summary ({items.length} items)</Text>
          {items.map((i)=>(
            <View key={i.product.id} style={{ flexDirection:'row', justifyContent:'space-between' }}>
              <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>{i.product.name} x {i.quantity}</Text>
              <Text style={{ ...typography.bodySmall, color: colors.textPrimary }}>₹{i.product.price * i.quantity}</Text>
            </View>
          ))}
          <Pressable style={{ borderWidth:1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md, flexDirection:'row', justifyContent:'space-between', marginTop: spacing.sm }}>
            <Text style={{ ...typography.label, color: colors.textSecondary }}>Apply Coupon</Text>
            <Text style={{ ...typography.label, color: colors.primary }}>View offers</Text>
          </Pressable>
        </View>

        {/* Payment */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, gap: spacing.md }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }}>Payment Method</Text>
          <Pressable onPress={()=>setPayment('cod')} style={{ flexDirection:'row', alignItems:'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth:1.5, borderColor: payment==='cod'? colors.primary: colors.border, backgroundColor: payment==='cod'? colors.primaryMuted: colors.surface }}>
            <View style={{ width:20, height:20, borderRadius:10, borderWidth:2, borderColor: payment==='cod'? colors.primary: colors.border, alignItems:'center', justifyContent:'center' }}>
              {payment==='cod'? <View style={{ width:10, height:10, borderRadius:5, backgroundColor: colors.primary }} /> : null}
            </View>
            <Text style={{ ...typography.label, color: colors.textPrimary }}>Cash on Delivery</Text>
            <View style={{ flex:1 }} />
            <Text>💵</Text>
          </Pressable>
          <Pressable onPress={()=>Alert.alert('Coming soon','Online payment will be available soon.')} style={{ flexDirection:'row', alignItems:'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth:1, borderColor: colors.border, opacity:0.6 }}>
            <View style={{ width:20, height:20, borderRadius:10, borderWidth:2, borderColor: colors.border }} />
            <Text style={{ ...typography.label, color: colors.textSecondary }}>Online Payment</Text>
            <View style={{ backgroundColor: colors.accentLight, paddingHorizontal:8, paddingVertical:3, borderRadius:999 }}><Text style={{ ...typography.captionBold, color: colors.accentDark }}>Soon</Text></View>
          </Pressable>
        </View>

        {/* Total */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: 8, borderWidth:1, borderColor: colors.borderLight, ...shadows.sm as any }}>
          <Row label="Subtotal" value={`₹${sub}`} />
          <Row label="Delivery" value={`₹${delivery}`} />
          <Row label="Tax" value={`₹${tax}`} />
          <View style={{ height:1, backgroundColor: colors.divider, marginVertical: 6 }} />
          <Row label="Total" value={`₹${total}`} strong />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={{ position:'absolute', bottom:0, left:0, right:0, backgroundColor: colors.surface, padding: spacing.lg, borderTopWidth:1, borderTopColor: colors.borderLight }}>
        <Button title={createOrderM.isPending ? 'Placing...' : `Place Order • ₹${total}`} onPress={placeOrder} loading={createOrderM.isPending} disabled={createOrderM.isPending} />
        <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign:'center', marginTop: spacing.sm }}>By placing order you agree to T&C</Text>
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, strong }: any) {
  return (
    <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
      <Text style={{ ...(strong? typography.h4: typography.bodySmall), color: strong? colors.textPrimary: colors.textSecondary }}>{label}</Text>
      <Text style={{ ...(strong? typography.h4: typography.bodySmall), color: colors.textPrimary }}>{value}</Text>
    </View>
  );
}
