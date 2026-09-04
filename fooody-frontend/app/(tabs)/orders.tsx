import * as React from 'react';
import { View, Text, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { TopBar } from '@/components/TopBar';
import { useOrders } from '@/hooks/useCatalog';
import { useAuthStore } from '@/store/authStore';
import Ionicons from '@expo/vector-icons/Ionicons';

function StatusBadge({ status }: { status:string }) {
  const map: any = {
    pending: { bg: colors.warningLight, color: colors.warning, label:'Pending' },
    preparing:{ bg: colors.warningLight, color: colors.warning, label:'Preparing' },
    out_for_delivery:{ bg: colors.warningLight, color: colors.warning, label:'On the way' },
    delivered:{ bg: colors.successLight, color: colors.success, label:'Delivered' },
    cancelled:{ bg: colors.errorLight, color: colors.error, label:'Cancelled' },
  };
  const s = map[status] || map.pending;
  return <View style={{ backgroundColor: s.bg, paddingHorizontal:8, paddingVertical:4, borderRadius:999 }}><Text style={{ ...typography.captionBold, color: s.color }}>{s.label}</Text></View>;
}

export default function Orders() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const ordersQ = useOrders();
  const [tab, setTab] = React.useState<'active'|'past'>('active');
  const orders = ordersQ.data ?? [];
  const active = orders.filter(o => ['pending','preparing','out_for_delivery'].includes(o.status));
  const past = orders.filter(o => ['delivered','cancelled'].includes(o.status));
  const data = tab==='active'? active: past;

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
        <TopBar />
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap: spacing.md, padding: spacing.xl }}>
          <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
          <Text style={{ ...typography.h3, color: colors.textPrimary }}>Sign in to view orders</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Your orders will appear here</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (ordersQ.isPending) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
        <TopBar />
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding: spacing.xl }}>
          <Text style={{ ...typography.bodySmall, color: colors.textTertiary }}>Loading orders...</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (ordersQ.isError) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
        <TopBar />
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap: spacing.md, padding: spacing.xl }}>
          <Text style={{ ...typography.bodySmall, color: colors.error }}>Failed to load orders</Text>
          <Pressable onPress={() => ordersQ.refetch()} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary }}>
            <Text style={{ ...typography.label, color: colors.textInverse }}>Retry</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <TopBar />
      <Animated.View entering={FadeInDown.delay(80).duration(450)} style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.md }}>
        <Text style={{ ...typography.h1, color: colors.textPrimary }}>Orders</Text>
        <View style={{ flexDirection:'row', backgroundColor: colors.surfaceMuted, borderRadius: radius.full, padding: 4, gap: 4 }}>
          {(['active','past'] as const).map((t)=>(
            <Pressable key={t} onPress={()=>setTab(t)} style={{ flex:1, paddingVertical: 8, borderRadius: 999, backgroundColor: tab===t? colors.surface: 'transparent', alignItems:'center', borderWidth: tab===t?1:0, borderColor: colors.borderLight }}>
              <Text style={{ ...typography.label, color: tab===t? colors.textPrimary: colors.textSecondary }}>{t==='active'?'Active':'Past'} • {(t==='active'?active:past).length}</Text>
            </Pressable>
          ))}
        </View>
      </Animated.View>

      {data.length===0 ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', gap: spacing.md, padding: spacing.xl }}>
          <Text style={{ fontSize:48 }}>📦</Text>
          <Text style={{ ...typography.h3, color: colors.textPrimary }}>No {tab} orders</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Your orders will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(i)=>i.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: 120 }}
          renderItem={({ item, index })=>(
            <Animated.View entering={FadeInUp.delay(140 + index*80).duration(400)}>
              <Pressable onPress={()=>router.push(`/order/${item.id}`)} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, gap: spacing.sm }}>
                <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                  <Text style={{ ...typography.h4, color: colors.textPrimary }}>Order {item.orderNumber || `#${item.id.slice(0,6)}`}</Text>
                  <StatusBadge status={item.status} />
                </View>
                <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>{item.items?.length ?? 0} items • ₹{item.total ?? 0} • {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</Text>
                {item.items ? (
                  <View style={{ flexDirection:'row', gap: 8, marginTop: 4 }}>
                    {item.items.slice(0,3).map((it: any, j: number) => (
                      <View key={j} style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: colors.shimmer, alignItems:'center', justifyContent:'center' }}>
                        <Text style={{ fontSize:10, color: colors.textTertiary }}>{String(it.name || '?')[0]}</Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </Pressable>
            </Animated.View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
