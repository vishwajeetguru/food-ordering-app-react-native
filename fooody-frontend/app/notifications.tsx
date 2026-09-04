import * as React from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { Button } from '@/components/ui/Button';
import { useNotifications, useMarkNotificationRead, useMarkAllRead, usePushRegistration } from '@/hooks/useNotifications';
import * as Haptics from 'expo-haptics';

function TypeIcon({ type }: { type: string }){
  const map:any = { promo: 'pricetag', order: 'receipt', system: 'settings', support: 'chatbubble-ellipses', general: 'notifications' };
  return <Ionicons name={map[type]||'notifications-outline'} size={20} color={colors.primary} />;
}

export default function NotificationsScreen(){
  const router = useRouter();
  const q = useNotifications(50);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllRead();
  const { register } = usePushRegistration();

  React.useEffect(()=>{ register().catch(()=>{}); }, []);

  const list = q.data?.notifications ?? [];
  const unread = q.data?.unreadCount ?? list.filter(n=>!n.read).length;

  const onMarkAll = async()=>{
    try{ await markAll.mutateAsync(); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(()=>{});}catch(e:any){ Alert.alert('Failed', e?.message); }
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth:1, borderBottomColor: colors.borderLight }}>
        <Pressable onPress={()=>router.back()} style={{ width:40, height:40, borderRadius:20, backgroundColor: colors.surfaceMuted, alignItems:'center', justifyContent:'center' }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex:1 }}>
          <Text style={{ ...typography.h2, color: colors.textPrimary }}>Notifications</Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>{unread ? `${unread} unread • All types` : 'All caught up • Push + in-app'}</Text>
        </View>
        {unread ? <Pressable onPress={onMarkAll}><Text style={{ ...typography.label, color: colors.primary }}>Mark all read</Text></Pressable> : null}
      </View>

      {q.isPending ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}><Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Loading...</Text></View>
      ) : !list.length ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding: spacing.xl, gap: spacing.md }}>
          <View style={{ width:72, height:72, borderRadius:36, backgroundColor: colors.primaryMuted, alignItems:'center', justifyContent:'center' }}><Ionicons name="notifications-outline" size={32} color={colors.primary} /></View>
          <Text style={{ ...typography.h3, color: colors.textPrimary }}>No notifications</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary, textAlign:'center' }}>Order updates, promos, support replies and system alerts will appear here. Push enabled on this device.</Text>
          <Button title="Explore offers" onPress={()=>router.push('/(tabs)/offers' as any)} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={i=>i.id}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={()=>q.refetch()} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: 100 }}
          renderItem={({item})=>(
            <Pressable onPress={()=>{ if(!item.read) markRead.mutate(item.id); if(item.data?.orderId) router.push(`/order/${item.data.orderId}` as any); if(item.data?.ticketId) router.push(`/support/${item.data.ticketId}` as any); }} style={{ backgroundColor: item.read ? colors.surface : colors.primaryMuted, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: item.read ? colors.borderLight : colors.primaryLight, flexDirection:'row', gap: spacing.md, ...shadows.xs as any }}>
              <View style={{ width:40, height:40, borderRadius:20, backgroundColor: item.read ? colors.surfaceMuted : colors.surface, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor: colors.borderLight }}>
                <TypeIcon type={item.type} />
              </View>
              <View style={{ flex:1, gap: 4 }}>
                <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.sm }}>
                  <Text style={{ ...typography.label, color: colors.textPrimary, flex:1 }} numberOfLines={1}>{item.title}</Text>
                  {!item.read ? <View style={{ width:8, height:8, borderRadius:4, backgroundColor: colors.primary }} /> : null}
                </View>
                <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>{item.body}</Text>
                <View style={{ flexDirection:'row', gap: spacing.sm, marginTop:4 }}>
                  <Text style={{ ...typography.caption, color: colors.textTertiary }}>{new Date(item.createdAt).toLocaleString()}</Text>
                  <Text style={{ ...typography.caption, color: colors.primary, textTransform:'capitalize' }}>{item.type}</Text>
                </View>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
