import * as React from 'react';
import { View, Text, ScrollView, Alert, Platform, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { z } from 'zod';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OTPInput } from '@/components/OTPInput';
import { CountryPicker } from '@/components/CountryPicker';
import { RecaptchaWebView, RecaptchaHandle } from '@/components/RecaptchaWebView';
import { DEFAULT_COUNTRY, Country } from '@/constants/countries';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';
import { ConfirmationResult } from 'firebase/auth';

const localPhoneSchema = z.object({
  local: z
    .string()
    .min(5, 'Phone number too short')
    .max(12, 'Phone number too long')
    .regex(/^\d+$/, 'Numbers only, no spaces or dashes'),
});

export default function PhoneAuth() {
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const [step, setStep] = React.useState<'phone' | 'code'>('phone');
  const [loading, setLoading] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState<ConfirmationResult | null>(null);
  const [fullPhone, setFullPhone] = React.useState('');
  const [local, setLocal] = React.useState('');
  const [code, setCode] = React.useState('');
  const [country, setCountry] = React.useState<Country>(DEFAULT_COUNTRY);
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | undefined>(undefined);
  const recaptchaRef = React.useRef<RecaptchaHandle>(null);

  const sendCode = async () => {
    const parsed = localPhoneSchema.safeParse({ local: local.trim() });
    if (!parsed.success) {
      setLocalError(parsed.error.issues[0]?.message || 'Invalid phone number');
      return;
    }
    setLocalError(undefined);
    setLoading(true);
    const full = `+${country.dial}${local.trim()}`;
    setFullPhone(full);
    try {
      let confirmationResult: ConfirmationResult;
      if (Platform.OS === 'web') {
        // Web: SDK RecaptchaVerifier with hidden container
        confirmationResult = await authService.sendPhoneVerification(full);
      } else {
        // Native (Expo Go): hidden WebView reCAPTCHA enterprise token
        const token = await recaptchaRef.current!.getToken();
        confirmationResult = await authService.sendPhoneVerificationWithToken(full, token);
      }
      setConfirmation(confirmationResult);
      setStep('code');
    } catch (e: any) {
      let msg = e?.message || 'Failed to send code';
      if (msg.includes('OPERATION_NOT_ALLOWED') || msg.includes('region')) {
        msg = 'SMS region policy not enabled. Firebase Console → Authentication → Settings → SMS region policy → allow your region.';
      } else if (msg.includes('recaptcha') || msg.includes('reCAPTCHA')) {
        msg = 'reCAPTCHA failed, please try again. ' + msg;
      } else if (msg.includes('quota') || msg.includes('TOO_MANY')) {
        msg = 'Too many attempts for this number. Try again later.';
      } else if (msg.includes('auth/invalid-phone-number')) {
        msg = 'This number looks invalid for the selected country.';
      }
      Alert.alert('Failed to send code', msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!confirmation) return Alert.alert('No verification session', 'Please resend code');
    if (code.length !== 6) return Alert.alert('Enter 6-digit code');
    setLoading(true);
    try {
      await authService.confirmPhoneCode(confirmation, code);
      await refreshUser();
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Invalid code', e?.message || 'Code incorrect or expired');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setStep('phone');
    setCode('');
    setConfirmation(null);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Hidden reCAPTCHA webview (native only) */}
      <RecaptchaWebView ref={recaptchaRef} />

      {/* Required for web RecaptchaVerifier */}
      {Platform.OS === 'web' ? <div id="recaptcha-container" style={{ display: 'none' }} /> as any : null}

      <CountryPicker
        visible={pickerOpen}
        selected={country}
        onSelect={setCountry}
        onClose={() => setPickerOpen(false)}
      />

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6, marginTop: spacing.lg }}>
          <Text style={{ ...typography.displayMedium, color: colors.textPrimary }}>
            {step === 'phone' ? 'Phone sign-in' : 'Enter code'}
          </Text>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>
            {step === 'phone'
              ? 'Select your country and enter your phone number. We will send a 6-digit code.'
              : `Code sent to ${fullPhone}. Enter the 6-digit code.`}
          </Text>
        </View>

        {step === 'phone' ? (
          <View style={{ gap: spacing.lg }}>
            <View style={{ gap: spacing.sm }}>
              <Text style={{ ...typography.label, color: colors.textPrimary }}>Phone number</Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                <Pressable
                  onPress={() => setPickerOpen(true)}
                  style={{
                    height: 52,
                    borderRadius: radius.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: colors.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: spacing.md,
                    gap: 6,
                    minWidth: 92,
                  }}
                  accessibilityLabel="Select country code"
                >
                  <Text style={{ fontSize: 22 }}>{country.flag}</Text>
                  <Text style={{ ...typography.label, color: colors.textPrimary }}>+{country.dial}</Text>
                  <Text style={{ ...typography.caption, color: colors.textTertiary }}>▾</Text>
                </Pressable>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder="98765 43210"
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                    value={local}
                    onChangeText={(v) => { setLocal(v.replace(/[^\d]/g, '')); setLocalError(undefined); }}
                    error={localError}
                    style={{ marginBottom: 0 }}
                  />
                </View>
              </View>
            </View>

            <Text style={{ ...typography.caption, color: colors.textTertiary }}>
              Test number (Firebase): +919850939148 with code 789456. Phone provider and test numbers are configured in Firebase Console → Authentication.
            </Text>

            <Button title="Send Code" onPress={sendCode} loading={loading} />

            <View style={{ backgroundColor: colors.surfaceMuted, padding: spacing.md, borderRadius: radius.md, gap: 4 }}>
              <Text style={{ ...typography.captionBold, color: colors.textSecondary }}>Expo Go note</Text>
              <Text style={{ ...typography.caption, color: colors.textTertiary }}>
                Phone sign-in uses an invisible reCAPTCHA (hidden WebView) on native, and the SDK reCAPTCHA on web. Production apps should use react-native-firebase with a development build.
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ gap: spacing.lg }}>
            <OTPInput value={code} onChange={setCode} length={6} />
            <Button title="Verify & Continue" onPress={verifyCode} loading={loading} disabled={code.length !== 6} />
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 12 }}>
              <Text onPress={resend} style={{ ...typography.label, color: colors.primary }}>
                Change number
              </Text>
              <Text onPress={sendCode} style={{ ...typography.label, color: colors.primary }}>
                Resend code
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
