import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function Cart() {
  const router = useRouter();
  const { items, inc, dec, subtotal, clear } = useCartStore();
  const sub = subtotal();
  const delivery = items.length ? 40 : 0;
  const tax = Math.round(sub * 0.05);
  const discount = sub > 500 ? 50 : 0;
  const total = sub + delivery + tax - discount;

  if (items.length===0) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: colors.background, alignItems:'center', justifyContent:'center', padding: spacing.xl, gap: spacing.md }}>
        <Text style={{ fontSize: 48 }}>🛒</Text>
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>Your cart is empty</Text>
        <Text style={{ ...typography.body, color: colors.textSecondary, textAlign:'center' }}>Add some delicious food to get started.</Text>
        <Button title="Browse Menu" onPress={()=>router.replace('/(tabs)/home')} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection:'row', alignItems:'center', gap: spacing.md }}>
        <Pressable onPress={()=>router.back()}><Text style={{ fontSize:22, fontWeight:'700' }}>‹</Text></Pressable>
        <Text style={{ ...typography.h2, color: colors.textPrimary }}>Your Cart</Text>
        <View style={{ flex:1 }} />
        <Pressable onPress={clear}><Text style={{ ...typography.label, color: colors.error }}>Clear</Text></Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }} showsVerticalScrollIndicator={false}>
        {items.map((it, idx)=>(
          <Animated.View key={it.product.id} entering={FadeInUp.delay(idx*60)} style={{ flexDirection:'row', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth:1, borderColor: colors.borderLight }}>
            <Image source={{ uri: it.product.image }} style={{ width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.shimmer }} />
            <View style={{ flex:1, gap: 4 }}>
              <Text style={{ ...typography.label, color: colors.textPrimary }} numberOfLines={1}>{it.product.name}</Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>₹{it.product.price}</Text>
              <View style={{ flexDirection:'row', alignItems:'center', gap: 8, marginTop: 6, backgroundColor: colors.surfaceMuted, alignSelf:'flex-start', borderRadius: radius.sm, borderWidth:1, borderColor: colors.border }}>
                <Pressable onPress={()=>dec(it.product.id)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ fontWeight:'800' }}>−</Text></Pressable>
                <Text style={{ ...typography.label, minWidth: 20, textAlign:'center' }}>{it.quantity}</Text>
                <Pressable onPress={()=>inc(it.product.id)} style={{ paddingHorizontal: 10, paddingVertical: 6 }}><Text style={{ fontWeight:'800' }}>+</Text></Pressable>
              </View>
            </View>
            <Text style={{ ...typography.label, color: colors.textPrimary }}>₹{it.product.price * it.quantity}</Text>
          </Animated.View>
        ))}

        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth:1, borderColor: colors.borderLight, marginTop: spacing.md }}>
          <Row label="Subtotal" value={`₹${sub}`} />
          <Row label="Delivery Fee" value={`₹${delivery}`} />
          <Row label="Tax (5%)" value={`₹${tax}`} />
          {discount? <Row label="Discount" value={`-₹${discount}`} valueStyle={{ color: colors.success }} /> : null}
          <View style={{ height:1, backgroundColor: colors.divider, marginVertical: 6 }} />
          <Row label="Total" value={`₹${total}`} labelStyle={{ ...typography.h3, color: colors.textPrimary }} valueStyle={{ ...typography.h3, color: colors.textPrimary }} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={{ position:'absolute', bottom:0, left:0, right:0, backgroundColor: colors.surface, padding: spacing.lg, borderTopWidth:1, borderTopColor: colors.borderLight }}>
        <Button title={`Proceed to Checkout • ₹${total}`} onPress={()=>router.push('/checkout')} />
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value, labelStyle, valueStyle }: any) {
  return (
    <View style={{ flexDirection:'row', justifyContent:'space-between' }}>
      <Text style={{ ...typography.bodySmall, color: colors.textSecondary, ...labelStyle }}>{label}</Text>
      <Text style={{ ...typography.bodySmall, color: colors.textPrimary, ...valueStyle }}>{value}</Text>
    </View>
  );
}
