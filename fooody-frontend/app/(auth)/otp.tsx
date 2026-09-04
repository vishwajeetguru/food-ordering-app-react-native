import * as React from 'react';
import { View, Text, Pressable, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, ZoomIn } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { OTPInput } from '@/components/OTPInput';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

export default function OTP() {
  const { email, name } = useLocalSearchParams<{ email: string; name?: string }>();
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const [otp, setOtp] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [countdown, setCountdown] = React.useState(60);
  const [canResend, setCanResend] = React.useState(false);

  React.useEffect(() => {
    if (canResend) return;
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { setCanResend(true); clearInterval(id); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [canResend]);

  const handleVerify = async () => {
    if (otp.length < 6) { setError('Enter 6-digit code'); return; }
    setLoading(true); setError(null);
    try {
      await authService.verifyOtp(email as string, otp);
      await refreshUser();
      // If signup with name, we could update profile (optional)
      // Go to set-password
      router.replace({ pathname: '/(auth)/set-password', params: { email: email as string } });
    } catch (e: any) {
      const code = e.code;
      if (code === 'OTP_EXPIRED') setError('Code expired. Please resend.');
      else if (code === 'OTP_MAX_ATTEMPTS_EXCEEDED') setError('Too many attempts. Request a new code.');
      else if (code === 'INVALID_OTP') setError(e.message || 'Invalid code');
      else setError(e.message || 'Verification failed');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    try {
      setError(null);
      await authService.sendOtp(email as string);
      setCountdown(60); setCanResend(false); setOtp('');
      Alert.alert('Code sent', `New code sent to ${email}`);
    } catch (e: any) {
      Alert.alert('Resend failed', e.message || 'Try again later');
    }
  };

  React.useEffect(() => {
    if (otp.length === 6) handleVerify();
  }, [otp]);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6, marginTop: spacing.lg }}>
          <Text style={{ ...typography.displayMedium, color: colors.textPrimary }}>Enter verification code</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>
            We sent a 6-digit code to <Text style={{ color: colors.textPrimary, fontWeight:'700' }}>{email}</Text>
          </Text>
        </View>

        <Animated.View entering={FadeIn.delay(200)} style={{ gap: spacing.lg }}>
          <OTPInput value={otp} onChange={(v)=>{ setError(null); setOtp(v); }} length={6} />

          {error ? (
            <Animated.View entering={ZoomIn} style={{ backgroundColor: colors.errorLight, padding: spacing.md, borderRadius: radius.md, borderWidth:1, borderColor: colors.error }}>
              <Text style={{ ...typography.bodySmall, color: colors.error, textAlign:'center' }}>{error}</Text>
            </Animated.View>
          ) : null}

          <Button title="Verify & Continue" onPress={handleVerify} loading={loading} disabled={otp.length!==6} />

          <View style={{ flexDirection:'row', justifyContent:'center', gap: 6 }}>
            <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Didn't receive code?</Text>
            {canResend ? (
              <Pressable onPress={handleResend}><Text style={{ ...typography.label, color: colors.primary }}>Resend</Text></Pressable>
            ) : (
              <Text style={{ ...typography.bodySmall, color: colors.textTertiary }}>Resend in {countdown}s</Text>
            )}
          </View>

          <View style={{ backgroundColor: colors.surfaceMuted, padding: spacing.md, borderRadius: radius.md, gap: 4 }}>
            <Text style={{ ...typography.captionBold, color: colors.textSecondary }}>Mock mode tip</Text>
            <Text style={{ ...typography.caption, color: colors.textTertiary }}>OTP is printed in backend console: [DEV] Email OTP for {email}: 123456 — or check Postman collection.</Text>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
