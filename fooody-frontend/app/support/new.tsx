import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateTicket } from '@/hooks/useTickets';

const CATS = ['general','order','payment','delivery','account','other'] as const;

export default function NewTicket(){
  const router = useRouter();
  const create = useCreateTicket();
  const [subject, setSubject] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [category, setCategory] = React.useState<typeof CATS[number]>('general');
  const [priority, setPriority] = React.useState<'low'|'medium'|'high'>('medium');

  const onSubmit = async()=>{
    if(subject.trim().length <5){ Alert.alert('Validation','Subject min 5 chars'); return; }
    if(description.trim().length <10){ Alert.alert('Validation','Description min 10 chars'); return; }
    try{
      await create.mutateAsync({ subject: subject.trim(), description: description.trim(), category, priority });
      Alert.alert('Raised','Ticket created. Admin will reply soon.',[{text:'OK',onPress:()=>router.replace('/support' as any)}]);
    }catch(e:any){ Alert.alert('Failed', e?.message || 'Could not create'); }
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth:1, borderBottomColor: colors.borderLight }}>
        <Pressable onPress={()=>router.back()} style={{ width:40, height:40, borderRadius:20, backgroundColor: colors.surfaceMuted, alignItems:'center', justifyContent:'center' }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ ...typography.h2, color: colors.textPrimary }}>New ticket</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: 120 }} keyboardShouldPersistTaps="handled">
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth:1, borderColor: colors.borderLight }}>
          <Input label="Subject *" placeholder="E.g. Order not delivered" value={subject} onChangeText={setSubject} maxLength={150} />
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.label, color: colors.textPrimary }}>Category</Text>
            <View style={{ flexDirection:'row', flexWrap:'wrap', gap: spacing.sm }}>
              {CATS.map(c=>(
                <Pressable key={c} onPress={()=>setCategory(c)} style={{ paddingHorizontal:12, paddingVertical:8, borderRadius:999, backgroundColor: category===c ? colors.primary : colors.surfaceMuted, borderWidth:1, borderColor: category===c ? colors.primary : colors.border }}>
                  <Text style={{ ...typography.captionBold, color: category===c ? colors.textInverse : colors.textSecondary, textTransform:'capitalize' }}>{c}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={{ gap: spacing.sm }}>
            <Text style={{ ...typography.label, color: colors.textPrimary }}>Priority</Text>
            <View style={{ flexDirection:'row', gap: spacing.sm }}>
              {(['low','medium','high'] as const).map(p=>(
                <Pressable key={p} onPress={()=>setPriority(p)} style={{ flex:1, paddingVertical:10, borderRadius: radius.md, backgroundColor: priority===p ? colors.primaryMuted : colors.surface, borderWidth:1, borderColor: priority===p ? colors.primary : colors.border, alignItems:'center' }}>
                  <Text style={{ ...typography.captionBold, color: priority===p ? colors.primary : colors.textSecondary, textTransform:'capitalize' }}>{p}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Input label="Description *" placeholder="Describe issue in detail..." value={description} onChangeText={setDescription} multiline numberOfLines={5} style={{ minHeight: 110, textAlignVertical:'top', paddingTop: 12 }} maxLength={2000} />
        </View>
        <View style={{ backgroundColor: colors.primaryMuted, borderRadius: radius.md, padding: spacing.md, flexDirection:'row', gap: spacing.sm, borderWidth:1, borderColor: colors.primaryLight }}>
          <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
          <Text style={{ ...typography.caption, color: colors.textSecondary, flex:1 }}>Admin can view, reply, and change status (open → in_progress → resolved). You’ll get a notification on reply.</Text>
        </View>
      </ScrollView>
      <View style={{ position:'absolute', bottom:0, left:0, right:0, padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth:1, borderTopColor: colors.borderLight }}>
        <Button title={create.isPending ? 'Submitting...' : 'Submit ticket'} onPress={onSubmit} loading={create.isPending} disabled={create.isPending} />
      </View>
    </SafeAreaView>
  );
}
