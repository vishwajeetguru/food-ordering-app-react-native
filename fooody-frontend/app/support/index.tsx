import * as React from 'react';
import { View, Text, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { useMyTickets } from '@/hooks/useTickets';

function StatusPill({ status }: { status: string }) {
  const isOpen = status === 'open';
  return (
    <View style={{ paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: isOpen ? '#FFF2E8' : '#F3F4F6', borderWidth: 1, borderColor: isOpen ? '#FFD8B8' : '#E5E7EB' }}>
      <Text style={{ ...typography.captionBold, color: isOpen ? '#EA580C' : '#6B7280', fontSize: 12 }}>{isOpen ? 'Open' : status.replace('_', ' ')}</Text>
    </View>
  );
}

export default function SupportList() {
  const router = useRouter();
  const q = useMyTickets();
  const list = q.data ?? [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.xs as any, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>Help & Support</Text>
          <Text style={{ ...typography.caption, color: '#64748B' }}>{list.length ? `${list.length} ticket • Admin replies here` : 'Admin replies here'}</Text>
        </View>
        <Pressable onPress={() => router.push('/support/new' as any)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FF5A3D', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, ...shadows.xs as any }}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={{ ...typography.label, color: '#fff', fontWeight: '700' }}>New</Text>
        </Pressable>
      </View>

      {q.isPending ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Loading tickets...</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={() => q.refetch()} tintColor={colors.primary} />}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 16, paddingBottom: 32, paddingTop: 8 }}
          ListHeaderComponent={
            list.length ? (
              <Animated.View entering={FadeInUp.duration(400)}>
                <Pressable
                  onPress={() => router.push(`/support/${list[0].id}` as any)}
                  style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(255,90,61,0.08)', ...shadows.sm as any, gap: 12 }}
                >
                  <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                    <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFF2E8', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="cube" size={22} color="#EA580C" />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ ...typography.captionBold, color: '#EA580C', fontSize: 11, letterSpacing: 0.5 }}>GENERAL</Text>
                        <StatusPill status={list[0].status} />
                      </View>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
                        {list[0].subject}
                      </Text>
                      <Text style={{ ...typography.bodySmall, color: '#64748B' }} numberOfLines={1}>
                        {list[0].description}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="calendar-outline" size={16} color="#64748B" />
                      <Text style={{ ...typography.caption, color: '#64748B' }}>{new Date(list[0].createdAt).toLocaleDateString()}</Text>
                    </View>
                    <View style={{ width: 1, height: 14, backgroundColor: '#E2E8F0' }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="chatbubble-outline" size={16} color="#64748B" />
                      <Text style={{ ...typography.caption, color: '#64748B' }}>{list[0].messages?.length || 0} replies</Text>
                    </View>
                    <View style={{ flex: 1 }} />
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF2E8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 }}>
                      <Text style={{ ...typography.label, color: '#EA580C', fontWeight: '700' }}>View ticket</Text>
                      <Ionicons name="chevron-forward" size={16} color="#EA580C" />
                    </View>
                  </View>
                </Pressable>
              </Animated.View>
            ) : null
          }
          ListEmptyComponent={
            <Animated.View entering={FadeInDown.delay(100).duration(500)} style={{ alignItems: 'center', paddingTop: 24 }}>
              <Text style={{ ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' }}>No tickets yet</Text>
            </Animated.View>
          }
          renderItem={({ item, index }) => {
            if (index === 0) return null; // already rendered as header
            return (
              <Pressable onPress={() => router.push(`/support/${item.id}` as any)} style={{ backgroundColor: '#fff', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.xs as any, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ ...typography.captionBold, color: colors.primary, fontSize: 10 }}>{item.category.toUpperCase()}</Text>
                  <StatusPill status={item.status} />
                </View>
                <Text style={{ ...typography.label, color: colors.textPrimary }}>{item.subject}</Text>
                <Text style={{ ...typography.caption, color: colors.textTertiary }} numberOfLines={1}>
                  {new Date(item.createdAt).toLocaleDateString()} • {item.messages?.length || 0} replies
                </Text>
              </Pressable>
            );
          }}
          ListFooterComponent={
            <View style={{ gap: 20, marginTop: list.length ? 8 : 24, alignItems: 'center', paddingBottom: 24 }}>
              {/* Illustration */}
              <Animated.View entering={FadeInUp.delay(200).duration(600)} style={{ alignItems: 'center' }}>
                <View style={{ width: 140, height: 140, borderRadius: 70, backgroundColor: '#FFF2E8', alignItems: 'center', justifyContent: 'center' }}>
                  <View style={{ width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFD8B8', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name="headset" size={48} color="#EA580C" />
                  </View>
                  <View style={{ position: 'absolute', top: 10, right: 10, width: 36, height: 28, borderRadius: 14, backgroundColor: '#FF9A76', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 3 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
                  </View>
                </View>
                <View style={{ position: 'absolute', top: 8, left: 20, transform: [{ rotate: '-12deg' }] }}>
                  <Text style={{ color: '#FFB86A', fontSize: 18 }}>✦</Text>
                </View>
                <View style={{ position: 'absolute', bottom: 20, right: 10 }}>
                  <Text style={{ color: '#FFB86A', fontSize: 14 }}>✦</Text>
                </View>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(300).duration(500)} style={{ alignItems: 'center', gap: 6, paddingHorizontal: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center' }}>Need help with something else?</Text>
                <Text style={{ ...typography.bodySmall, color: '#64748B', textAlign: 'center', lineHeight: 20 }}>We’re here to help! Create a new ticket and our team will get back to you soon.</Text>
              </Animated.View>

              <Animated.View entering={FadeInUp.delay(400).duration(500)}>
                <Pressable onPress={() => router.push('/support/new' as any)} style={{ backgroundColor: '#FF5A3D', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 999, flexDirection: 'row', alignItems: 'center', gap: 8, ...shadows.sm as any }}>
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={{ ...typography.labelLarge, color: '#fff', fontWeight: '700' }}>Create a new ticket</Text>
                </Pressable>
              </Animated.View>

              <View style={{ flexDirection: 'row', gap: 16, marginTop: 8, paddingHorizontal: 16 }}>
                {[
                  { icon: 'time-outline', bg: '#FFF2E8', color: '#EA580C', title: 'Quick Response', sub: 'We usually reply\nwithin 24 hours' },
                  { icon: 'shield-checkmark-outline', bg: '#E6F7ED', color: '#16A34A', title: 'Secure & Safe', sub: 'Your information\nis always protected' },
                  { icon: 'heart', bg: '#FFF7ED', color: '#F59E0B', title: 'Here for You', sub: "We're always happy\nto help" },
                ].map((f, i) => (
                  <Animated.View key={f.title} entering={FadeInUp.delay(500 + i * 80).duration(400)} style={{ flex: 1, alignItems: 'center', gap: 8 }}>
                    <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: f.bg, alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name={f.icon as any} size={20} color={f.color} />
                    </View>
                    <Text style={{ ...typography.captionBold, color: '#0F172A', fontSize: 12, textAlign: 'center' }}>{f.title}</Text>
                    <Text style={{ ...typography.caption, color: '#64748B', fontSize: 11, textAlign: 'center', lineHeight: 14 }}>{f.sub}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}
