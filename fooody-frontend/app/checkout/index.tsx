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
import { useCreateOrder, useAddresses, useSetDefaultAddress } from '@/hooks/useCatalog';
import { useAddressStore } from '@/store/addressStore';
import { useLocation } from '@/hooks/useLocation';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function Checkout() {
  const router = useRouter();
  const { items, subtotal, clear } = useCartStore();
  const user = useAuthStore((s)=>s.user);
  const addressesQ = useAddresses();
  const createOrderM = useCreateOrder();
  const setDefaultM = useSetDefaultAddress();
  const loc = useLocation();
  const selectedId = useAddressStore((s)=>s.selectedId);
  const selectedAddress = useAddressStore((s)=>s.selectedAddress);
  const setSelectedId = useAddressStore((s)=>s.setSelectedId);
  // Hydrate store on load
  React.useEffect(()=>{ if(addressesQ.data) useAddressStore.getState().hydrateFromApi(addressesQ.data); }, [addressesQ.data]);
  const [payment, setPayment] = React.useState<'cod'|'online'>('cod');
  const sub = subtotal();
  const delivery = 40; const tax = Math.round(sub*0.05); const total = sub+delivery+tax;

  const effectiveAddress = selectedAddress || addressesQ.data?.find(a=>a.isDefault) || addressesQ.data?.[0] || null;

  const onUseCurrentInCheckout = async () => {
    const res = await loc.fetchCurrent();
    if(res.coords && res.displayAddress){
      router.push({
        pathname: '/addresses/add',
        params: {
          lat: String(res.coords.lat),
          lng: String(res.coords.lng),
          autoAddress: res.displayAddress,
          city: res.address?.city || '',
          pincode: res.address?.postcode || '',
          state: res.address?.state || '',
          area: res.address?.road || res.address?.neighbourhood || '',
        }
      } as any);
    }
  };

  const placeOrder = async () => {
    if (!items.length) return;
    if (!effectiveAddress) {
      Alert.alert('Add address', 'Please add a delivery address first. We can autofill with your current location.', [
        { text: 'Use current location', onPress: onUseCurrentInCheckout },
        { text: 'Add manually', onPress: ()=> router.push('/addresses/add') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (createOrderM.isPending) return;
    const addr = effectiveAddress;
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
        {/* Address — REAL, Zomato style */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, gap: spacing.md }}>
          <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
            <Text style={{ ...typography.h4, color: colors.textPrimary }}>Delivery Address</Text>
            <Pressable onPress={()=>router.push('/addresses')}><Text style={{ ...typography.label, color: colors.primary }}>Change</Text></Pressable>
          </View>

          {addressesQ.isPending ? (
            <View style={{ paddingVertical: 16, alignItems:'center' }}><Text style={{ ...typography.caption, color: colors.textSecondary }}>Loading addresses…</Text></View>
          ) : effectiveAddress ? (
            <>
              {/* Selected/default card */}
              <View style={{ borderWidth:1.5, borderColor: colors.primary, backgroundColor: colors.primaryMuted, borderRadius: radius.md, padding: spacing.md, gap: 6 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap: 8 }}>
                  <Ionicons name={effectiveAddress.label==='Home'?'home':effectiveAddress.label==='Work'?'briefcase':'location'} size={16} color={colors.primary} />
                  <Text style={{ ...typography.label, color: colors.textPrimary }}>{effectiveAddress.label==='Other'&&effectiveAddress.customLabel?effectiveAddress.customLabel:effectiveAddress.label} {effectiveAddress.isDefault? '• Default' : ''} • {user?.name || 'You'}</Text>
                  <View style={{ flex:1 }} />
                  <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:999, backgroundColor: colors.primary }}><Text style={{ ...typography.captionBold, color: colors.textInverse, fontSize:10 }}>SELECTED</Text></View>
                </View>
                <Text style={{ ...typography.bodySmall, color: colors.textPrimary }}>{[effectiveAddress.houseFlat, effectiveAddress.area, effectiveAddress.landmark, effectiveAddress.city, effectiveAddress.state, effectiveAddress.pincode].filter(Boolean).join(', ') || effectiveAddress.fullAddress || effectiveAddress.address}</Text>
                {effectiveAddress.lat && effectiveAddress.lng ? <Text style={{ ...typography.caption, color: colors.textTertiary }}><Ionicons name="navigate" size={10}/> {effectiveAddress.lat.toFixed(5)}, {effectiveAddress.lng.toFixed(5)}</Text> : null}
                {effectiveAddress.receiverPhone ? <Text style={{ ...typography.caption, color: colors.textSecondary }}>Receiver: {effectiveAddress.receiverName || user?.name} • {effectiveAddress.receiverPhone}</Text> : null}
              </View>

              {/* Other addresses quick-switch */}
              {addressesQ.data && addressesQ.data.length>1 ? (
                <View style={{ gap: spacing.sm }}>
                  <Text style={{ ...typography.captionBold, color: colors.textSecondary }}>Other saved addresses</Text>
                  {addressesQ.data.filter(a=>a.id!==effectiveAddress.id).slice(0,3).map(a=>(
                    <Pressable key={a.id} onPress={async ()=>{ setSelectedId(a.id); try{ await setDefaultM.mutateAsync(a.id); }catch{} }} style={{ flexDirection:'row', alignItems:'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, borderWidth:1, borderColor: colors.borderLight, backgroundColor: colors.surfaceMuted }}>
                      <Ionicons name={a.label==='Home'?'home':a.label==='Work'?'briefcase':'location-outline'} size={16} color={colors.textSecondary} />
                      <View style={{ flex:1, gap:2 }}>
                        <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>{a.label==='Other'&&a.customLabel?a.customLabel:a.label} {a.isDefault? '• Default':''}</Text>
                        <Text style={{ ...typography.caption, color: colors.textSecondary }} numberOfLines={1}>{[a.houseFlat,a.area,a.city].filter(Boolean).join(', ')||a.address}</Text>
                      </View>
                      <Text style={{ ...typography.captionBold, color: colors.primary }}>Deliver here</Text>
                    </Pressable>
                  ))}
                  <Pressable onPress={()=>router.push('/addresses')}><Text style={{ ...typography.captionBold, color: colors.primary, textAlign:'center' }}>View all {addressesQ.data.length} addresses →</Text></Pressable>
                </View>
              ) : null}

              <View style={{ flexDirection:'row', gap: spacing.sm, flexWrap:'wrap' }}>
                <Pressable onPress={()=>router.push('/addresses/add')} style={{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:8, borderRadius:999, borderWidth:1, borderColor: colors.border }}>
                  <Ionicons name="add" size={14} color={colors.textPrimary} /><Text style={{ ...typography.captionBold, color: colors.textPrimary }}>Add new address</Text>
                </Pressable>
                <Pressable onPress={onUseCurrentInCheckout} style={{ flexDirection:'row', alignItems:'center', gap:6, paddingHorizontal:12, paddingVertical:8, borderRadius:999, backgroundColor: colors.primaryMuted, borderWidth:1, borderColor: colors.primaryLight }}>
                  <Ionicons name="locate" size={14} color={colors.primary} /><Text style={{ ...typography.captionBold, color: colors.primary }}>{loc.isLoading?'Locating…':'Use current location'}</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <View style={{ borderWidth:1, borderColor: colors.border, borderStyle:'dashed' as any, borderRadius: radius.md, padding: spacing.lg, gap: spacing.md, alignItems:'center' }}>
              <Ionicons name="location-outline" size={28} color={colors.primary} />
              <Text style={{ ...typography.label, color: colors.textPrimary, textAlign:'center' }}>No delivery address yet</Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary, textAlign:'center' }}>Add your location — we’ll ask for permission once and autofill your building, street & pincode like Zomato.</Text>
              <Button title={loc.isLoading? 'Detecting…':'Use my current location'} onPress={onUseCurrentInCheckout} loading={loc.isLoading} style={{ width:'100%' }} />
              <Pressable onPress={()=>router.push('/addresses/add')} style={{ paddingVertical: 6 }}><Text style={{ ...typography.label, color: colors.primary }}>Add address manually →</Text></Pressable>
            </View>
          )}
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
