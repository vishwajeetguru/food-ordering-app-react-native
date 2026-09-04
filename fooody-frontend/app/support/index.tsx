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
import { useMyTickets } from '@/hooks/useTickets';

function StatusPill({ status }: { status: string }){
  const bg = status==='open' ? colors.warningLight : status==='in_progress' ? colors.info+'22' : status==='resolved' ? colors.successLight : colors.surfaceMuted;
  const col = status==='open' ? colors.warning : status==='in_progress' ? colors.info : status==='resolved' ? colors.success : colors.textSecondary;
  return <View style={{ paddingHorizontal:8, paddingVertical:3, borderRadius:999, backgroundColor: bg, borderWidth:1, borderColor: col+'30' }}><Text style={{ ...typography.captionBold, color: col, fontSize:10, textTransform:'capitalize' }}>{status.replace('_',' ')}</Text></View>;
}

export default function SupportList(){
  const router = useRouter();
  const q = useMyTickets();
  const list = q.data ?? [];
  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth:1, borderBottomColor: colors.borderLight }}>
        <Pressable onPress={()=>router.back()} style={{ width:40, height:40, borderRadius:20, backgroundColor: colors.surfaceMuted, alignItems:'center', justifyContent:'center' }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex:1 }}>
          <Text style={{ ...typography.h2, color: colors.textPrimary }}>Help & Support</Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>{list.length ? `${list.length} tickets` : 'Raise a ticket'} • Admin replies here</Text>
        </View>
        <Pressable onPress={()=>router.push('/support/new' as any)} style={{ paddingHorizontal:14, paddingVertical:8, borderRadius:999, backgroundColor: colors.primary }}>
          <Text style={{ ...typography.label, color: colors.textInverse }}>+ New</Text>
        </Pressable>
      </View>

      {q.isPending ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center' }}><Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Loading tickets...</Text></View>
      ) : !list.length ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding: spacing.xl, gap: spacing.md }}>
          <View style={{ width:72, height:72, borderRadius:36, backgroundColor: colors.primaryMuted, alignItems:'center', justifyContent:'center' }}><Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.primary} /></View>
          <Text style={{ ...typography.h3, color: colors.textPrimary }}>No tickets yet</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary, textAlign:'center' }}>Facing an issue with order, payment or delivery? Raise a ticket and admin will reply & update status.</Text>
          <Button title="Raise ticket" onPress={()=>router.push('/support/new' as any)} />
          <Pressable onPress={()=>Alert.alert('FAQs','- Orders: check Orders tab\n- Addresses: profile > Saved Addresses\n- Contact: hello@foody.app')}><Text style={{ ...typography.label, color: colors.primary }}>View FAQs →</Text></Pressable>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={i=>i.id}
          refreshControl={<RefreshControl refreshing={q.isFetching} onRefresh={()=>q.refetch()} tintColor={colors.primary} />}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: 100 }}
          renderItem={({item})=>(
            <Pressable onPress={()=>router.push(`/support/${item.id}` as any)} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight, gap: spacing.sm, ...shadows.xs as any }}>
              <View style={{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }}>
                <Text style={{ ...typography.captionBold, color: colors.primary, textTransform:'uppercase', fontSize:10 }}>{item.category}</Text>
                <StatusPill status={item.status} />
              </View>
              <Text style={{ ...typography.label, color: colors.textPrimary }} numberOfLines={1}>{item.subject}</Text>
              <Text style={{ ...typography.bodySmall, color: colors.textSecondary }} numberOfLines={2}>{item.description}</Text>
              <View style={{ flexDirection:'row', gap: spacing.sm, marginTop: spacing.sm }}>
                <Text style={{ ...typography.caption, color: colors.textTertiary }}>{new Date(item.createdAt).toLocaleDateString()} • {item.messages?.length || 0} replies</Text>
                <View style={{ flex:1 }} />
                <Text style={{ ...typography.captionBold, color: colors.primary }}>View →</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
