import * as React from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
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

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});

export default function Login() {
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const { control, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await authService.loginWithPassword(data.email, data.password);
      await refreshUser();
      router.replace('/(tabs)/home');
    } catch (e: any) {
      const msg =
        e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password'
          ? 'Invalid email or password'
          : e.code === 'auth/operation-not-allowed'
            ? 'Email/Password sign-in is disabled in Firebase. Enable it: Firebase Console → Authentication → Sign-in method → Email/Password → Enable.'
            : e.message;
      Alert.alert('Login failed', msg || 'Try OTP or Magic Link.');
    } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6, marginTop: spacing.lg }}>
          <Text style={{ ...typography.displayMedium, color: colors.textPrimary }}>Welcome back</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>Login with Email/Password, Google, Phone, OTP or Magic Link</Text>
        </View>

        <View style={{ gap: spacing.lg }}>
          <Controller control={control} name="email" render={({ field }) => (
            <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={field.value} onChangeText={field.onChange} error={errors.email?.message as string} />
          )} />
          <Controller control={control} name="password" render={({ field }) => (
            <Input label="Password" placeholder="••••••••" secureTextEntry value={field.value} onChangeText={field.onChange} error={errors.password?.message as string} />
          )} />

          <Pressable onPress={() => router.push('/(auth)/magic-link')} style={{ alignSelf: 'flex-end' }}>
            <Text style={{ ...typography.label, color: colors.primary }}>Forgot Password?</Text>
          </Pressable>

          <Button title="Login with Email" onPress={handleSubmit(onSubmit)} loading={loading} />

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
            <Text style={{ ...typography.caption, color: colors.textTertiary }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.divider }} />
          </View>

          <GoogleSignInButton />

          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <Pressable onPress={() => router.push({ pathname: '/(auth)/otp', params: { email: '' } })} style={{ flex: 1, height: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
              <Text style={{ ...typography.label, color: colors.textPrimary }}>Use Email OTP</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/(auth)/magic-link')} style={{ flex: 1, height: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface }}>
              <Text style={{ ...typography.label, color: colors.textPrimary }}>Magic Link</Text>
            </Pressable>
          </View>

          <Pressable onPress={() => (router as any).push('/(auth)/phone')} style={{ height: 52, borderRadius: 12, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 }}>
            <Text style={{ fontSize: 16 }}>📱</Text>
            <Text style={{ ...typography.label, color: colors.primary }}>Continue with Phone</Text>
          </Pressable>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Don't have an account?</Text>
            <Link href="/(auth)/signup" asChild><Pressable><Text style={{ ...typography.label, color: colors.primary }}>Sign up</Text></Pressable></Link>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
