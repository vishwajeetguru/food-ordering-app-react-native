import * as React from 'react';
import { View, Text, FlatList, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { useOrders } from '@/hooks/useCatalog';
import { useAuthStore } from '@/store/authStore';

function StatusBadge({ status }: { status: string }) {
  const label = status === 'pending' ? 'Pending' : status.replace('_', ' ');
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF2E8', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 }}>
      <Ionicons name="time-outline" size={14} color="#EA580C" />
      <Text style={{ ...typography.captionBold, color: '#EA580C', textTransform: 'capitalize' }}>{label}</Text>
    </View>
  );
}

function OrderTracker({ status }: { status: string }) {
  const order = ['placed', 'preparing', 'out_for_delivery', 'delivered'];
  const idx = status === 'pending' ? 0 : order.indexOf(status);
  const activeIdx = idx < 0 ? 0 : idx;
  const icons: any[] = ['receipt', 'restaurant', 'bicycle', 'home'];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
      {order.map((key, i) => {
        const active = i <= activeIdx;
        const isCurrent = i === activeIdx;
        return (
          <React.Fragment key={key}>
            <View style={{ alignItems: 'center', gap: 6, flex: 1 }}>
              <View
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: active ? '#EA580C' : '#E5E7EB',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: isCurrent ? 3 : 0,
                  borderColor: isCurrent ? '#FFD8C2' : 'transparent',
                }}
              >
                <Ionicons name={icons[i]} size={16} color={active ? '#fff' : '#9CA3AF'} />
              </View>
              <Text style={{ ...typography.caption, color: active ? '#EA580C' : '#9CA3AF', fontWeight: active ? '700' : '500', fontSize: 11, textAlign: 'center' }}>
                {key === 'out_for_delivery' ? 'Out for delivery' : key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
            </View>
            {i < order.length - 1 && (
              <View style={{ flex: 1, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: -4, marginBottom: 22, borderRadius: 1 }}>
                <View style={{ width: i < activeIdx ? '100%' : isCurrent ? '50%' : '0%', height: '100%', backgroundColor: '#EA580C', borderRadius: 1 }} />
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

export default function Orders() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const ordersQ = useOrders();
  const [tab, setTab] = React.useState<'active' | 'past'>('active');
  const [search, setSearch] = React.useState('');
  const orders = ordersQ.data ?? [];
  const activeOrders = orders.filter((o) => ['pending', 'placed', 'preparing', 'out_for_delivery'].includes(o.status));
  const pastOrders = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status));
  const base = tab === 'active' ? activeOrders : pastOrders;
  const filtered = base.filter((o) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return o.orderNumber?.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || (o.items as any[])?.some((it: any) => it.name.toLowerCase().includes(q));
  });
  const initial = (user?.name || user?.email || 'V').charAt(0).toUpperCase();

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFDF8', alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
        <Ionicons name="receipt-outline" size={48} color={colors.textTertiary} />
        <Text style={{ ...typography.h3, color: colors.textPrimary }}>Sign in to view orders</Text>
        <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Your orders will appear here</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5' }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: 2 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <Text style={{ fontSize: 32, fontWeight: '900', color: '#0F172A', letterSpacing: -0.8 }}>Orders</Text>
            <Text style={{ ...typography.bodySmall, color: '#64748B' }}>Track and manage your food orders</Text>
          </View>
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#FF5A3D', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '800' }}>{initial}</Text>
          </View>
        </View>
      </View>

      {/* Search */}
      <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, height: 48, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.xs as any }}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            placeholder="Search for dishes or order ID..."
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
            style={{ flex: 1, ...typography.bodySmall, color: colors.textPrimary, paddingVertical: 0 }}
          />
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: spacing.xl, marginTop: spacing.md, backgroundColor: '#F3F4F6', marginHorizontal: spacing.xl, borderRadius: 999, padding: 4 }}>
        {(['active', 'past'] as const).map((t) => {
          const active = tab === t;
          const count = t === 'active' ? activeOrders.length : pastOrders.length;
          return (
            <Pressable
              key={t}
              onPress={() => setTab(t)}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: active ? '#FFF2E8' : 'transparent',
                borderWidth: active ? 1 : 0,
                borderColor: active ? '#FFD8B8' : 'transparent',
                ...shadows.xs as any,
              }}
            >
              <Ionicons name={t === 'active' ? 'time' : 'archive-outline'} size={16} color={active ? '#EA580C' : '#6B7280'} />
              <Text style={{ ...typography.label, color: active ? '#EA580C' : '#6B7280', fontWeight: '700', textTransform: 'capitalize' }}>
                {t} • {count}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Content */}
      {ordersQ.isPending ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl }}>
          <Text style={{ ...typography.bodySmall, color: colors.textTertiary }}>Loading orders...</Text>
        </View>
      ) : ordersQ.isError ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl }}>
          <Text style={{ ...typography.bodySmall, color: colors.error }}>Failed to load orders</Text>
          <Pressable onPress={() => ordersQ.refetch()} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: radius.md, backgroundColor: colors.primary }}>
            <Text style={{ ...typography.label, color: colors.textInverse }}>Retry</Text>
          </Pressable>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl }}>
          <Text style={{ fontSize: 48 }}>📦</Text>
          <Text style={{ ...typography.h3, color: colors.textPrimary }}>No {tab} orders</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Your orders will appear here</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: 120 }}
          renderItem={({ item, index }) => {
            const it = (item.items as any[])?.[0];
            return (
              <Animated.View entering={FadeInUp.delay(index * 60).duration(400)}>
                <Pressable
                  onPress={() => router.push(`/order/${item.id}`)}
                  style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.sm as any, gap: 12 }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ gap: 2 }}>
                      <Text style={{ ...typography.label, color: '#0F172A', fontWeight: '800' }}>Order {item.orderNumber || `ORD-${item.id.slice(0, 8).toUpperCase()}`}</Text>
                      <Text style={{ ...typography.caption, color: '#64748B' }}>{item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : ''}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <StatusBadge status={item.status} />
                      <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                    <View style={{ width: 56, height: 56, borderRadius: 12, backgroundColor: '#FFF7ED', overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' }}>
                      {it?.image ? <Image source={{ uri: it.image }} style={{ width: '100%', height: '100%' }} contentFit="cover" /> : null}
                      <View style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: 11, backgroundColor: '#FFE9E8', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '800', color: '#EA580C' }}>{item.items?.length ?? 1}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ ...typography.label, color: '#0F172A', fontWeight: '700' }} numberOfLines={1}>{it?.name || 'Order items'}</Text>
                      <Text style={{ ...typography.caption, color: '#64748B' }}>{item.items?.length ?? 0} item</Text>
                    </View>
                    <Text style={{ ...typography.label, color: '#0F172A', fontWeight: '800' }}>₹{item.total ?? 0}</Text>
                  </View>

                  <View style={{ height: 1, backgroundColor: '#F1F5F9' }} />
                  <OrderTracker status={item.status} />
                </Pressable>
              </Animated.View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
