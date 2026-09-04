import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { Button } from '@/components/ui/Button';
import { useTicket, useTicketReply } from '@/hooks/useTickets';
import { useAuthStore } from '@/store/authStore';

export default function TicketDetail(){
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useTicket(id);
  const replyM = useTicketReply();
  const user = useAuthStore(s=>s.user);
  const [msg, setMsg] = React.useState('');

  const ticket = q.data;

  const onSend = async()=>{
    if(!msg.trim()) return;
    try{
      await replyM.mutateAsync({ id: id as string, message: msg.trim() });
      setMsg('');
    }catch(e:any){ Alert.alert('Failed', e?.message); }
  };

  if(q.isPending) return <SafeAreaView style={{ flex:1, alignItems:'center', justifyContent:'center' }}><Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Loading...</Text></SafeAreaView>;
  if(q.isError || !ticket) return <SafeAreaView style={{ flex:1, alignItems:'center', justifyContent:'center', gap: spacing.md }}><Text style={{ ...typography.bodySmall, color: colors.error }}>Ticket not found</Text><Button title="Back" onPress={()=>router.back()} /></SafeAreaView>;

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth:1, borderBottomColor: colors.borderLight }}>
        <Pressable onPress={()=>router.back()} style={{ width:40, height:40, borderRadius:20, backgroundColor: colors.surfaceMuted, alignItems:'center', justifyContent:'center' }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex:1 }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }} numberOfLines={1}>{ticket.subject}</Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary, textTransform:'capitalize' }}>{ticket.category} • {ticket.status.replace('_',' ')}</Text>
        </View>
        <View style={{ paddingHorizontal:8, paddingVertical:4, borderRadius:999, backgroundColor: ticket.status==='open'? colors.warningLight : ticket.status==='resolved'? colors.successLight : colors.surfaceMuted }}>
          <Text style={{ ...typography.captionBold, color: ticket.status==='resolved'? colors.success : colors.textSecondary, fontSize:10 }}>{ticket.priority}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: 120 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth:1, borderColor: colors.borderLight, ...shadows.xs as any }}>
          <Text style={{ ...typography.label, color: colors.textPrimary }}>{ticket.subject}</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>{ticket.description}</Text>
          <Text style={{ ...typography.caption, color: colors.textTertiary }}>{new Date(ticket.createdAt).toLocaleString()} • {ticket.userEmail}</Text>
        </View>

        <Text style={{ ...typography.h4, color: colors.textPrimary }}>Conversation ({ticket.messages?.length || 0})</Text>
        {(ticket.messages || []).length ? ticket.messages.map((m,i)=>(
          <View key={i} style={{ alignSelf: m.by==='user' ? 'flex-end' : 'flex-start', maxWidth:'84%', backgroundColor: m.by==='user' ? colors.primary : colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth:1, borderColor: m.by==='user' ? colors.primary : colors.borderLight }}>
            <Text style={{ ...typography.captionBold, color: m.by==='user' ? colors.textInverse : colors.primary, fontSize:10 }}>{m.by==='user' ? 'You' : 'Admin'} • {m.byName}</Text>
            <Text style={{ ...typography.bodySmall, color: m.by==='user' ? colors.textInverse : colors.textPrimary, marginTop:4 }}>{m.message}</Text>
            <Text style={{ ...typography.caption, color: m.by==='user' ? 'rgba(255,255,255,0.8)' : colors.textTertiary, marginTop:4, fontSize:10 }}>{new Date(m.at).toLocaleString()}</Text>
          </View>
        )) : <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.lg, borderWidth:1, borderColor: colors.borderLight }}><Text style={{ ...typography.caption, color: colors.textSecondary, textAlign:'center' }}>No replies yet. Admin will respond soon.</Text></View>}

        {ticket.status==='closed' || ticket.status==='resolved' ? (
          <View style={{ backgroundColor: colors.successLight, borderRadius: radius.md, padding: spacing.md, borderWidth:1, borderColor: colors.success }}>
            <Text style={{ ...typography.captionBold, color: colors.success, textAlign:'center' }}>This ticket is {ticket.status}. Reply will reopen if needed.</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ position:'absolute', bottom:0, left:0, right:0, backgroundColor: colors.surface, padding: spacing.md, borderTopWidth:1, borderTopColor: colors.borderLight, flexDirection:'row', gap: spacing.sm, alignItems:'center' }}>
        <TextInput value={msg} onChangeText={setMsg} placeholder="Write a reply..." placeholderTextColor={colors.textTertiary} style={{ flex:1, minHeight:44, maxHeight:100, borderRadius: radius.md, borderWidth:1, borderColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 10, color: colors.textPrimary }} multiline />
        <Pressable onPress={onSend} disabled={!msg.trim() || replyM.isPending} style={{ width:44, height:44, borderRadius:22, backgroundColor: msg.trim() ? colors.primary : colors.surfaceMuted, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor: msg.trim() ? colors.primary : colors.border }}>
          {replyM.isPending ? <Text style={{ color: colors.primary }}>...</Text> : <Ionicons name="send" size={18} color={msg.trim() ? colors.textInverse : colors.textTertiary} />}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
