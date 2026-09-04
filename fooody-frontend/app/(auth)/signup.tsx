import * as React from 'react';
import { View, Text, ScrollView, Alert, Pressable } from 'react-native';
import { useRouter, Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

const otpSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(50),
  email: z.string().email('Valid email required'),
});

const emailPassSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8, 'Min 8 chars').regex(/[A-Z]/, 'Need uppercase').regex(/[a-z]/, 'Need lowercase').regex(/[0-9]/, 'Need number'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, { message: 'Passwords do not match', path: ['confirm'] });

export default function Signup() {
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const [mode, setMode] = React.useState<'otp' | 'password'>('otp');
  const [loading, setLoading] = React.useState(false);

  const otpForm = useForm({ resolver: zodResolver(otpSchema), defaultValues: { name: '', email: '' } });
  const passForm = useForm({ resolver: zodResolver(emailPassSchema), defaultValues: { name: '', email: '', password: '', confirm: '' } });

  const onOtpSubmit = async (data: any) => {
    setLoading(true);
    try {
      await authService.sendOtp(data.email.trim().toLowerCase());
      router.push({ pathname: '/(auth)/otp', params: { email: data.email.trim().toLowerCase(), name: data.name } });
    } catch (e: any) {
      Alert.alert(e.status === 429 ? 'Too many requests' : 'Error', e.message || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  const onPasswordSubmit = async (data: any) => {
    setLoading(true);
    try {
      await authService.signUpWithEmail(data.email.trim().toLowerCase(), data.password, data.name);
      await refreshUser();
      router.replace('/(tabs)/home');
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        Alert.alert('Signup failed', 'Email already in use');
      } else if (e.code === 'auth/operation-not-allowed') {
        Alert.alert(
          'Signup failed',
          'Email/Password sign-in is disabled in Firebase. Enable it: Firebase Console → Authentication → Sign-in method → Email/Password → Enable.'
        );
      } else {
        Alert.alert('Signup failed', e.message);
      }
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6, marginTop: spacing.lg }}>
          <Text style={{ ...typography.displayMedium, color: colors.textPrimary }}>Create account</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>Choose Email OTP (backend) or Email/Password (Firebase)</Text>
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: 999, padding: 4, gap: 4 }}>
          {(['otp','password'] as const).map((m) => (
            <Pressable key={m} onPress={() => setMode(m)} style={{ flex: 1, paddingVertical: 10, borderRadius: 999, backgroundColor: mode===m ? colors.surface : 'transparent', alignItems: 'center', borderWidth: mode===m?1:0, borderColor: colors.borderLight }}>
              <Text style={{ ...typography.label, color: mode===m ? colors.textPrimary : colors.textSecondary }}>{m==='otp' ? 'Email OTP' : 'Email + Password'}</Text>
            </Pressable>
          ))}
        </View>

        {mode === 'otp' ? (
          <View style={{ gap: spacing.lg }}>
            <Controller control={otpForm.control} name="name" render={({ field }) => (
              <Input label="Name" placeholder="Vishwa Patel" value={field.value} onChangeText={field.onChange} error={otpForm.formState.errors.name?.message as string} />
            )} />
            <Controller control={otpForm.control} name="email" render={({ field }) => (
              <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={field.value} onChangeText={field.onChange} error={otpForm.formState.errors.email?.message as string} />
            )} />
            <Button title="Send OTP" onPress={otpForm.handleSubmit(onOtpSubmit)} loading={loading} />
            <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign: 'center' }}>6-digit code expires in 5 min • Backend OTP provider (works even without Firebase)</Text>
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            <Controller control={passForm.control} name="name" render={({ field }) => (
              <Input label="Name" placeholder="Vishwa Patel" value={field.value} onChangeText={field.onChange} error={passForm.formState.errors.name?.message as string} />
            )} />
            <Controller control={passForm.control} name="email" render={({ field }) => (
              <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={field.value} onChangeText={field.onChange} error={passForm.formState.errors.email?.message as string} />
            )} />
            <Controller control={passForm.control} name="password" render={({ field }) => (
              <Input label="Password" placeholder="StrongPass1" secureTextEntry value={field.value} onChangeText={field.onChange} error={passForm.formState.errors.password?.message as string} />
            )} />
            <Controller control={passForm.control} name="confirm" render={({ field }) => (
              <Input label="Confirm Password" placeholder="Repeat" secureTextEntry value={field.value} onChangeText={field.onChange} error={passForm.formState.errors.confirm?.message as string} />
            )} />
            <Button title="Create with Password" onPress={passForm.handleSubmit(onPasswordSubmit)} loading={loading} />
          </View>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
          <Text style={{ ...typography.caption, color: colors.textTertiary }}>OR</Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
        </View>

        <GoogleSignInButton />

        <Pressable onPress={() => (router as any).push('/(auth)/phone')} style={{ height: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
          <Text>📱</Text><Text style={{ ...typography.label, color: colors.primary }}>Continue with Phone</Text>
        </Pressable>

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Already have an account?</Text>
          <Link href="/(auth)/login" asChild><Pressable><Text style={{ ...typography.label, color: colors.primary }}>Login</Text></Pressable></Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
