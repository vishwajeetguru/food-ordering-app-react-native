import * as React from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { useTicket, useTicketReply } from '@/hooks/useTickets';
import { useAuthStore } from '@/store/authStore';

export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const q = useTicket(id as string);
  const replyM = useTicketReply();
  const user = useAuthStore((s) => s.user);
  const [msg, setMsg] = React.useState('');

  const ticket = q.data as any;

  const onSend = async () => {
    if (!msg.trim()) return;
    try {
      await replyM.mutateAsync({ id: id as string, message: msg.trim() });
      setMsg('');
    } catch (e: any) {
      alert(e?.message);
    }
  };

  if (q.isPending)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Loading...</Text>
      </SafeAreaView>
    );
  if (q.isError || !ticket)
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5', alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl }}>
        <Text style={{ ...typography.bodySmall, color: colors.error }}>Ticket not found</Text>
        <Pressable onPress={() => router.back()} style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, backgroundColor: colors.primary }}>
          <Text style={{ ...typography.label, color: '#fff' }}>Back</Text>
        </Pressable>
      </SafeAreaView>
    );

  const msgs: any[] = ticket.messages || [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#FFFBF5' }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.xs as any, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 17, fontWeight: '800', color: '#0F172A' }} numberOfLines={1}>
            {ticket.subject}
          </Text>
          <Text style={{ ...typography.caption, color: '#64748B' }}>{`Ticket #${String(ticket.id).slice(0, 4)} • ${ticket.category.charAt(0).toUpperCase() + ticket.category.slice(1)}`}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFF2E8', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FF5A3D' }} />
          <Text style={{ ...typography.captionBold, color: '#EA580C', textTransform: 'capitalize' }}>{ticket.status}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Ticket card */}
        <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.xs as any, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#FFF2E8', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="cube" size={22} color="#EA580C" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', flex: 1 }} numberOfLines={1}>
                  {ticket.subject}
                </Text>
                <View style={{ backgroundColor: '#FFF7ED', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, borderWidth: 1, borderColor: '#FDE68A', marginLeft: 8 }}>
                  <Text style={{ ...typography.captionBold, color: '#D97706', fontSize: 11, textTransform: 'capitalize' }}>{ticket.priority}</Text>
                </View>
              </View>
              <Text style={{ ...typography.bodySmall, color: '#475569' }} numberOfLines={2}>
                {ticket.description}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="calendar-outline" size={14} color="#64748B" />
              <Text style={{ ...typography.caption, color: '#64748B', fontSize: 11 }}>{new Date(ticket.createdAt).toLocaleString()}</Text>
            </View>
            <View style={{ width: 1, height: 14, backgroundColor: '#E2E8F0' }} />
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="mail-outline" size={14} color="#64748B" />
              <Text style={{ ...typography.caption, color: '#64748B', fontSize: 11 }} numberOfLines={1}>{ticket.userEmail || user?.email || 'test@gmail.com'}</Text>
            </View>
          </View>
        </View>

        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 4 }}>Conversation ({msgs.length})</Text>

        {msgs.length ? (
          <View style={{ gap: 12 }}>
            {msgs.map((m: any, i: number) => (
              <Animated.View
                key={i}
                entering={FadeInUp.delay(i * 60).duration(400)}
                style={{
                  alignSelf: m.by === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '84%',
                  backgroundColor: m.by === 'user' ? '#FF5A3D' : '#fff',
                  borderRadius: 16,
                  borderBottomRightRadius: m.by === 'user' ? 4 : 16,
                  borderBottomLeftRadius: m.by === 'user' ? 16 : 4,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: m.by === 'user' ? '#FF5A3D' : 'rgba(0,0,0,0.06)',
                  ...shadows.xs as any,
                }}
              >
                <Text style={{ ...typography.captionBold, color: m.by === 'user' ? 'rgba(255,255,255,0.9)' : '#EA580C', fontSize: 10 }}>
                  {m.by === 'user' ? 'You' : 'Admin'} • {m.byName}
                </Text>
                <Text style={{ ...typography.bodySmall, color: m.by === 'user' ? '#fff' : '#0F172A', marginTop: 4 }}>{m.message}</Text>
                <Text style={{ ...typography.caption, color: m.by === 'user' ? 'rgba(255,255,255,0.7)' : '#94A3B8', marginTop: 6, fontSize: 10 }}>{new Date(m.at).toLocaleString()}</Text>
              </Animated.View>
            ))}
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 24, gap: 16 }}>
            {/* Illustration */}
            <View style={{ width: 160, height: 120, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 110, height: 80, borderRadius: 24, backgroundColor: '#FFD8B8', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16 }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#FF5A3D' }} />
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#FF5A3D' }} />
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#FF5A3D' }} />
              </View>
              <View style={{ position: 'absolute', bottom: 12, left: 10, width: 70, height: 50, borderRadius: 20, backgroundColor: '#FFF2E8', opacity: 0.9 }} />
              {/* sparkles */}
              <View style={{ position: 'absolute', top: -6, right: 10 }}><Text style={{ color: '#FF8C42', fontSize: 16 }}>✦</Text></View>
              <View style={{ position: 'absolute', bottom: 0, left: -4 }}><Text style={{ color: '#FF8C42', fontSize: 12 }}>✦</Text></View>
            </View>
            <View style={{ alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>No replies yet</Text>
              <Text style={{ ...typography.bodySmall, color: '#64748B', textAlign: 'center', lineHeight: 18 }}>
                Your ticket has been sent to our support team.{'\n'}We’ll get back to you soon.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Input bar */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', paddingHorizontal: 12, paddingTop: 10, paddingBottom: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.06)', flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Pressable style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="attach" size={18} color="#64748B" style={{ transform: [{ rotate: '45deg' }] }} />
        </Pressable>
        <View style={{ flex: 1, minHeight: 40, maxHeight: 80, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 999, paddingHorizontal: 16, justifyContent: 'center', backgroundColor: '#fff' }}>
          <TextInput
            value={msg}
            onChangeText={setMsg}
            placeholder="Write a reply..."
            placeholderTextColor="#94A3B8"
            style={{ ...typography.bodySmall, color: colors.textPrimary, paddingVertical: 8 }}
            multiline
          />
        </View>
        <Pressable onPress={onSend} disabled={!msg.trim() || replyM.isPending} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: msg.trim() ? '#FF5A3D' : '#E2E8F0', alignItems: 'center', justifyContent: 'center', ...shadows.xs as any }}>
          <Ionicons name="paper-plane" size={16} color={msg.trim() ? '#fff' : '#94A3B8'} style={{ marginLeft: 2 }} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
