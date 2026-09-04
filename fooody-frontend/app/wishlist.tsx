import * as React from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { Button } from '@/components/ui/Button';
import { useWishlist } from '@/hooks/useWishlist';
import { useWishlistStore } from '@/store/wishlistStore';
import { wishlistApi } from '@/api/wishlist.api';
import { useCartStore } from '@/store/cartStore';
import * as Haptics from 'expo-haptics';

export default function Favourites() {
  const router = useRouter();
  const q = useWishlist();
  const items = q.data ?? [];
  const addToCart = useCartStore(s=>s.add);

  const onRemove = async (productId: string) => {
    try{
      await wishlistApi.remove(productId);
      q.refetch();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});
    }catch(e:any){ Alert.alert('Failed', e?.message); }
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth:1, borderBottomColor: colors.borderLight }}>
        <Pressable onPress={()=>router.back()} style={{ width:40, height:40, borderRadius:20, backgroundColor: colors.surfaceMuted, alignItems:'center', justifyContent:'center' }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex:1 }}>
          <Text style={{ ...typography.h2, color: colors.textPrimary }}>Favourites</Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>{items.length ? `${items.length} saved • Wishlist` : 'Your beloved dishes'}</Text>
        </View>
        {items.length ? <Pressable onPress={()=> { Alert.alert('Clear wishlist','Remove all?',[{text:'Cancel',style:'cancel'},{text:'Clear',style:'destructive',onPress: async()=>{ for(const i of items) await wishlistApi.remove(i.productId); q.refetch();}}])}}><Text style={{ ...typography.label, color: colors.error }}>Clear</Text></Pressable> : null}
      </View>

      {q.isPending ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding: spacing.xl }}><Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Loading wishlist...</Text></View>
      ) : q.isError ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding: spacing.xl, gap: spacing.md }}><Text style={{ ...typography.bodySmall, color: colors.error }}>Failed to load</Text><Button title="Retry" onPress={()=>q.refetch()} /></View>
      ) : !items.length ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding: spacing.xl, gap: spacing.md }}>
          <View style={{ width:72, height:72, borderRadius:36, backgroundColor: colors.primaryMuted, alignItems:'center', justifyContent:'center' }}><Ionicons name="heart-outline" size={32} color={colors.primary} /></View>
          <Text style={{ ...typography.h3, color: colors.textPrimary }}>No favourites yet</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary, textAlign:'center' }}>Tap ♡ on any dish to add to wishlist. Access offline via memory cache.</Text>
          <Button title="Explore menu" onPress={()=>router.push('/(tabs)/home')} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={i=>i.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: 100 }}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={()=>q.refetch()} tintColor={colors.primary} />}
          renderItem={({item})=> {
            const p = (item as any).product;
            if(!p) return (
              <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight }}>
                <Text style={{ ...typography.label, color: colors.textPrimary }}>Product {item.productId} (unavailable)</Text>
                <Pressable onPress={()=>onRemove(item.productId)} style={{ marginTop:8 }}><Text style={{ ...typography.captionBold, color: colors.error }}>Remove</Text></Pressable>
              </View>
            );
            return (
              <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, overflow:'hidden', borderWidth:1, borderColor: colors.borderLight, flexDirection:'row', ...shadows.xs as any }}>
                <Image source={{ uri: p.image }} style={{ width:110, height:110 }} contentFit="cover" />
                <View style={{ flex:1, padding: spacing.md, gap: 4 }}>
                  <Text style={{ ...typography.h4, color: colors.textPrimary }} numberOfLines={1}>{p.name}</Text>
                  <Text style={{ ...typography.caption, color: colors.textSecondary }} numberOfLines={2}>{p.description}</Text>
                  <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                    <Text style={{ ...typography.priceSmall, color: colors.textPrimary }}>₹{p.price}</Text>
                    <View style={{ flexDirection:'row', gap: spacing.sm }}>
                      <Pressable onPress={()=>{ addToCart(p,1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(()=>{}); }} style={{ paddingHorizontal:14, paddingVertical:7, borderRadius: radius.sm, backgroundColor: colors.primary }}><Text style={{ ...typography.captionBold, color: colors.textInverse }}>+ Add</Text></Pressable>
                      <Pressable onPress={()=>onRemove(p.id)} style={{ width:32, height:32, borderRadius:16, backgroundColor: colors.errorLight, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor: colors.error }}><Ionicons name="trash-outline" size={14} color={colors.error} /></Pressable>
                    </View>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
