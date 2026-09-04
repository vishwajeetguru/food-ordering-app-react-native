import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { useProduct } from '@/hooks/useCatalog';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@/components/ui/Button';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isPending, isError } = useProduct(id as string);
  const cart = useCartStore();
  const qty = product ? (cart.items.find((i)=>i.product.id===product.id)?.quantity ?? 0) : 0;
  const [selectedSize, setSelectedSize] = React.useState('Regular');
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(()=>({ transform:[{ scale: scale.value }] }));

  const handleAdd = () => {
    if (!product) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(()=>{});
    scale.value = withSpring(0.95, { damping:10 }, ()=> scale.value = withSpring(1));
    cart.add(product, 1);
  };

  if (isPending) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: colors.background, alignItems:'center', justifyContent:'center', padding: spacing.xl }}>
        <Text style={{ ...typography.bodySmall, color: colors.textTertiary }}>Loading product...</Text>
      </SafeAreaView>
    );
  }
  if (isError || !product) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: colors.background, alignItems:'center', justifyContent:'center', padding: spacing.xl, gap: spacing.md }}>
        <Text style={{ ...typography.bodySmall, color: colors.error }}>Product not found</Text>
        <Button title="Go back" onPress={() => router.back()} variant="outline" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ height: 300, backgroundColor: colors.shimmer }}>
          <Image source={{ uri: product.image }} style={{ width:'100%', height:'100%' }} contentFit="cover" transition={200} />
          <Pressable onPress={()=>router.back()} style={{ position:'absolute', top: spacing.lg, left: spacing.lg, width: 40, height:40, borderRadius:20, backgroundColor:'rgba(255,255,255,0.9)', alignItems:'center', justifyContent:'center' }}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ position:'absolute', bottom: -20, left: spacing.xl, right: spacing.xl, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, ...shadows.md as any }}>
            <View style={{ flexDirection:'row', gap: 8, alignItems:'center' }}>
              <View style={{ width: 16, height:16, borderWidth:1.5, borderColor: product.isVeg? colors.veg: colors.nonVeg, borderRadius:3, alignItems:'center', justifyContent:'center' }}>
                <View style={{ width:8, height:8, borderRadius:999, backgroundColor: product.isVeg? colors.veg: colors.nonVeg }} />
              </View>
              <Text style={{ ...typography.captionBold, color: product.isVeg? colors.veg: colors.nonVeg }}>{product.isVeg ? 'VEG' : 'NON-VEG'}</Text>
              <Text style={{ ...typography.caption, color: colors.textTertiary }}>• {product.prepTime}</Text>
            </View>
            <Text style={{ ...typography.h1, color: colors.textPrimary, marginTop: 6 }}>{product.name}</Text>
            <View style={{ flexDirection:'row', alignItems:'center', gap:6, marginTop: 4 }}>
              <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>⭐ {product.rating}</Text>
              <Text style={{ ...typography.caption, color: colors.textTertiary }}>({product.ratingCount} ratings)</Text>
            </View>
            <Text style={{ ...typography.bodySmall, color: colors.textSecondary, marginTop: 8 }}>{product.description}</Text>
            <Text style={{ ...typography.priceLarge, color: colors.textPrimary, marginTop: 8 }}>₹{product.price}</Text>
          </View>
        </View>

        <View style={{ marginTop: 36, paddingHorizontal: spacing.xl, gap: spacing.xl }}>
          <View style={{ gap: spacing.md }}>
            <Text style={{ ...typography.h3, color: colors.textPrimary }}>Size</Text>
            <View style={{ flexDirection:'row', gap: spacing.sm }}>
              {['Regular', 'Medium (+₹80)', 'Large (+₹150)'].map((s)=>(
                <Pressable key={s} onPress={()=>setSelectedSize(s)} style={{ flex:1, paddingVertical: 12, borderRadius: radius.md, borderWidth:1.5, borderColor: selectedSize===s? colors.primary: colors.border, backgroundColor: selectedSize===s? colors.primaryMuted : colors.surface, alignItems:'center' }}>
                  <Text style={{ ...typography.label, color: selectedSize===s? colors.primary : colors.textPrimary }}>{s}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ gap: spacing.md }}>
            <Text style={{ ...typography.h3, color: colors.textPrimary }}>Add-ons</Text>
            {[
              { name:'Extra Cheese', price:40 },
              { name:'Extra Veggies', price:30 },
              { name:'Dip', price:20 },
            ].map((a)=>(
              <View key={a.name} style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth:1, borderColor: colors.borderLight }}>
                <Text style={{ ...typography.bodySmall, color: colors.textPrimary }}>{a.name}</Text>
                <Text style={{ ...typography.captionBold, color: colors.textSecondary }}>+₹{a.price}  <Text style={{ color: colors.primary }}>Add</Text></Text>
              </View>
            ))}
          </View>

          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
            <Text style={{ ...typography.h3, color: colors.textPrimary }}>Quantity</Text>
            {qty===0 ? (
              <Text style={{ ...typography.bodySmall, color: colors.textTertiary }}>Not in cart</Text>
            ) : (
              <View style={{ flexDirection:'row', alignItems:'center', backgroundColor: colors.primary, borderRadius: radius.md, overflow:'hidden' }}>
                <Pressable onPress={()=>cart.dec(product.id)} hitSlop={8} style={{ paddingHorizontal:12, paddingVertical:10 }}>
                  <Ionicons name="remove" size={16} color="#fff" />
                </Pressable>
                <Text style={{ color:'#fff', fontWeight:'700', minWidth:24, textAlign:'center' }}>{qty}</Text>
                <Pressable onPress={()=>cart.inc(product.id)} hitSlop={8} style={{ paddingHorizontal:12, paddingVertical:10 }}>
                  <Ionicons name="add" size={16} color="#fff" />
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={{ position:'absolute', bottom:0, left:0, right:0, backgroundColor: colors.surface, padding: spacing.lg, borderTopWidth:1, borderTopColor: colors.borderLight, flexDirection:'row', gap: spacing.md, alignItems:'center' }}>
        <View style={{ flex:1 }}>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>{qty ? `${qty} in cart` : 'Add to enjoy fresh'}</Text>
          <Text style={{ ...typography.price, color: colors.textPrimary }}>₹{product.price * (qty || 1)}</Text>
        </View>
        {qty === 0 ? (
          <Animated.View style={aStyle}>
            <Button title="Add to Cart" onPress={handleAdd} style={{ minWidth: 160 }} />
          </Animated.View>
        ) : (
          <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.sm }}>
            <View style={{ flexDirection:'row', alignItems:'center', backgroundColor: colors.primaryMuted, borderRadius: radius.md, borderWidth:1, borderColor: colors.primary, overflow:'hidden' }}>
              <Pressable onPress={()=>cart.dec(product.id)} hitSlop={8} style={{ paddingHorizontal:12, paddingVertical:12 }}>
                <Ionicons name="remove" size={18} color={colors.primary} />
              </Pressable>
              <Text style={{ ...typography.labelLarge, color: colors.primary, minWidth:24, textAlign:'center' }}>{qty}</Text>
              <Pressable onPress={()=>cart.inc(product.id)} hitSlop={8} style={{ paddingHorizontal:12, paddingVertical:12 }}>
                <Ionicons name="add" size={18} color={colors.primary} />
              </Pressable>
            </View>
            <Button
              title="View Cart"
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(()=>{}); router.push('/cart'); }}
              style={{ minWidth: 120 }}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
