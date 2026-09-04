import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/api/auth.api';

export default function EditProfile() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const refreshUser = useAuthStore(s => s.refreshUser);
  const [name, setName] = React.useState(user?.name || '');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [profileImage, setProfileImage] = React.useState(user?.profileImage || '');
  const [loading, setLoading] = React.useState(false);

  const onSave = async () => {
    if(name.trim().length < 2){ Alert.alert('Validation','Name at least 2 chars'); return; }
    if(phone && !/^\+?[1-9]\d{7,14}$/.test(phone.trim())){ Alert.alert('Validation','Invalid phone (E.164)'); return; }
    setLoading(true);
    try{
      await userApi.updateMe({ name: name.trim() || null, phone: phone.trim() || null, profileImage: profileImage.trim() || null });
      await refreshUser();
      Alert.alert('Saved','Profile updated', [{ text:'OK', onPress:()=> router.back() }]);
    }catch(e:any){
      Alert.alert('Failed', e?.message || 'Could not update');
    }finally{ setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth:1, borderBottomColor: colors.borderLight }}>
        <Pressable onPress={()=>router.back()} style={{ width:40, height:40, borderRadius:20, backgroundColor: colors.surfaceMuted, alignItems:'center', justifyContent:'center' }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ ...typography.h2, color: colors.textPrimary }}>Edit profile</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems:'center', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, borderWidth:1, borderColor: colors.borderLight, ...shadows.xs as any }}>
          <Image source={{ uri: profileImage || user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }} style={{ width:96, height:96, borderRadius:48, backgroundColor: colors.shimmer }} />
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>Avatar via URL (upload soon)</Text>
        </View>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth:1, borderColor: colors.borderLight }}>
          <Input label="Full name *" placeholder="Vishwa Patel" value={name} onChangeText={setName} autoCapitalize="words" maxLength={50} />
          <Input label="Email (read-only)" value={user?.email || ''} editable={false} />
          <Input label="Phone" placeholder="+919876543210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <Input label="Profile image URL" placeholder="https://..." value={profileImage} onChangeText={setProfileImage} autoCapitalize="none" />
          <Text style={{ ...typography.caption, color: colors.textTertiary }}>Phone and avatar sync to your Foody account and help delivery partner contact you.</Text>
        </View>
        <View style={{ backgroundColor: colors.accentLight, borderRadius: radius.md, padding: spacing.md, flexDirection:'row', gap: spacing.sm, borderWidth:1, borderColor: colors.accent }}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.accentDark} />
          <Text style={{ ...typography.caption, color: colors.accentDark, flex:1 }}>We never share your details. Only you and admin can see this.</Text>
        </View>
      </ScrollView>
      <View style={{ padding: spacing.lg, backgroundColor: colors.surface, borderTopWidth:1, borderTopColor: colors.borderLight }}>
        <Button title={loading ? 'Saving...' : 'Save changes'} onPress={onSave} loading={loading} disabled={loading} />
        <Pressable onPress={()=>router.back()} style={{ paddingVertical: spacing.md, alignItems:'center' }}>
          <Text style={{ ...typography.label, color: colors.textSecondary }}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
