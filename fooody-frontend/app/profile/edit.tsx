import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { useAuthStore } from '@/store/authStore';
import { userApi } from '@/api/auth.api';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ ...typography.label, color: '#1E293B', fontWeight: '700' }}>
        {label} {required ? <Text style={{ color: '#EF4444' }}>*</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function InputRow({ icon, children, editable = true }: { icon: string; children: React.ReactNode; editable?: boolean }) {
  return (
    <View
      style={{
        height: 48,
        borderRadius: 12,
        borderWidth: 1.2,
        borderColor: editable ? '#E2E8F0' : '#E2E8F0',
        backgroundColor: editable ? '#FFFFFF' : '#F1F5F9',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        gap: 10,
      }}
    >
      <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: editable ? '#F1F5F9' : '#E2E8F0', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={icon as any} size={16} color={editable ? '#64748B' : '#94A3B8'} />
      </View>
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}

export default function EditProfile() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const refreshUser = useAuthStore((s) => s.refreshUser);
  const [name, setName] = React.useState(user?.name || '');
  const [phone, setPhone] = React.useState(user?.phone || '');
  const [profileImage, setProfileImage] = React.useState(user?.profileImage || '');
  const [loading, setLoading] = React.useState(false);

  const onSave = async () => {
    if (name.trim().length < 2) {
      Alert.alert('Validation', 'Name at least 2 chars');
      return;
    }
    if (phone && !/^\+?[1-9]\d{7,14}$/.test(phone.trim())) {
      Alert.alert('Validation', 'Invalid phone (E.164)');
      return;
    }
    setLoading(true);
    try {
      await userApi.updateMe({ name: name.trim() || null, phone: phone.trim() || null, profileImage: profileImage.trim() || null });
      await refreshUser();
      Alert.alert('Saved', 'Profile updated', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not update');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(350)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.md, gap: spacing.md }}>
          <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadows.xs as any, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' }}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A' }}>Edit Profile</Text>
            <Text style={{ ...typography.caption, color: '#64748B' }}>Update your personal information</Text>
          </View>
          <View style={{ width: 40 }} />
        </Animated.View>

        {/* Avatar card */}
        <Animated.View entering={FadeInUp.delay(80).duration(450)} style={{ marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 20, paddingVertical: 24, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.sm as any, overflow: 'hidden' }}>
          {/* soft blobs */}
          <View style={{ position: 'absolute', top: -30, left: -30, width: 120, height: 120, borderRadius: 60, backgroundColor: '#FFF0E8', opacity: 0.6 }} />
          <View style={{ position: 'absolute', top: 20, right: -20, width: 100, height: 100, borderRadius: 50, backgroundColor: '#FFE9E8', opacity: 0.4 }} />
          <Pressable onPress={() => Alert.alert('Change photo', 'Paste image URL below or use camera (coming soon)')} style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#fff', padding: 3, ...shadows.xs as any }}>
            <Image source={{ uri: profileImage || user?.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200' }} style={{ width: '100%', height: '100%', borderRadius: 45 }} contentFit="cover" />
            <View style={{ position: 'absolute', bottom: -2, right: -2, width: 32, height: 32, borderRadius: 16, backgroundColor: '#FF5A3D', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="camera" size={16} color="#fff" />
            </View>
          </Pressable>
          <View style={{ alignItems: 'center', gap: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>Change Profile Photo</Text>
            <Text style={{ ...typography.caption, color: '#64748B' }}>Tap to upload a new photo</Text>
          </View>
        </Animated.View>

        {/* Form */}
        <Animated.View entering={FadeInUp.delay(160).duration(450)} style={{ marginHorizontal: 16, marginTop: 14, backgroundColor: '#fff', borderRadius: 20, padding: 16, gap: 16, borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)', ...shadows.xs as any }}>
          <Field label="Full name" required>
            <InputRow icon="person">
              <TextInput value={name} onChangeText={setName} placeholder="Vishwajeet Guru" placeholderTextColor="#94A3B8" autoCapitalize="words" maxLength={50} style={{ flex: 1, ...typography.bodySmall, color: colors.textPrimary, paddingVertical: 0 }} />
            </InputRow>
          </Field>

          <Field label="Email (read-only)">
            <InputRow icon="mail" editable={false}>
              <TextInput value={user?.email || ''} editable={false} style={{ flex: 1, ...typography.bodySmall, color: '#64748B', paddingVertical: 0 }} />
            </InputRow>
          </Field>

          <Field label="Phone">
            <InputRow icon="call">
              <TextInput value={phone} onChangeText={(v) => setPhone(v.replace(/[^\d+]/g, ''))} placeholder="9850939148" placeholderTextColor="#94A3B8" keyboardType="phone-pad" style={{ flex: 1, ...typography.bodySmall, color: colors.textPrimary, paddingVertical: 0 }} />
            </InputRow>
          </Field>

          <Field label="Profile image URL">
            <InputRow icon="link">
              <TextInput value={profileImage} onChangeText={setProfileImage} placeholder="https://..." placeholderTextColor="#94A3B8" autoCapitalize="none" keyboardType="url" style={{ flex: 1, ...typography.bodySmall, color: colors.textPrimary, paddingVertical: 0 }} />
            </InputRow>
          </Field>

          <Text style={{ ...typography.caption, color: '#94A3B8', lineHeight: 16 }}>Phone and avatar sync to your Foody account and help delivery partner contact you.</Text>
        </Animated.View>

        {/* Safety card */}
        <Animated.View entering={FadeInUp.delay(240).duration(450)} style={{ marginHorizontal: 16, marginTop: 14, flexDirection: 'row', gap: 12, backgroundColor: '#FFF2E8', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#FFD8B8', alignItems: 'flex-start' }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FFDDC2', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="shield-checkmark" size={18} color="#EA580C" />
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ ...typography.label, color: '#9A3412', fontWeight: '800' }}>Your information is safe with us</Text>
            <Text style={{ ...typography.caption, color: '#9A3412', lineHeight: 16, opacity: 0.85 }}>We never share your details. Only you and admin can see this information.</Text>
          </View>
        </Animated.View>

        {/* Buttons */}
        <View style={{ paddingHorizontal: 16, marginTop: 14, gap: 12 }}>
          <Pressable onPress={onSave} disabled={loading} style={{ height: 52, borderRadius: 14, overflow: 'hidden', opacity: loading ? 0.7 : 1 }}>
            <LinearGradient colors={['#FF5A3D', '#E94A2E']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ ...typography.labelLarge, color: '#fff', fontWeight: '800' }}>{loading ? 'Saving...' : 'Save Changes'}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable onPress={() => router.back()} style={{ height: 52, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#FF5A3D', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ ...typography.labelLarge, color: '#FF5A3D', fontWeight: '700' }}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
