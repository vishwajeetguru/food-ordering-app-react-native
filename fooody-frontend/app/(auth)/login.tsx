import * as React from 'react';
import { View, Text, Pressable, ScrollView, Alert, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

WebBrowser.maybeCompleteAuthSession();

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'At least 8 characters'),
});

export default function Login() {
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const { control, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });
  const [loading, setLoading] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [googleLoading, setGoogleLoading] = React.useState(false);

  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleWebClientId || undefined,
    iosClientId: googleIosClientId || undefined,
    androidClientId: googleAndroidClientId || undefined,
    webClientId: googleWebClientId || undefined,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const idToken = (response.authentication as any)?.idToken || (response.params as any)?.id_token;
      if (idToken) {
        setGoogleLoading(true);
        authService.signInWithGoogleCredential(idToken).then(async () => {
          await refreshUser(); router.replace('/(tabs)/home');
        }).catch((e: any) => Alert.alert('Google sign-in failed', e.message)).finally(() => setGoogleLoading(false));
      }
    }
  }, [response]);

  const handleGoogle = async () => {
    if (!googleWebClientId && !googleIosClientId && !googleAndroidClientId) {
      Alert.alert('Google not configured', 'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env');
      return;
    }
    if (!request) return;
    await promptAsync();
  };

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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 12 }} showsVerticalScrollIndicator={false} bounces={false} keyboardShouldPersistTaps="handled">
        {/* Top hero - burger background */}
        <View style={{ height: 220, overflow: 'hidden' }}>
          <Image
            source={require('../../assets/burger-bg.webp')}
            style={{ position: 'absolute', top: -20, left: 0, right: 0, height: 280 }}
            contentFit="cover"
            contentPosition="top"
            transition={0}
            cachePolicy="memory-disk"
          />
          {/* soft overlay for text readability if needed */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 220, backgroundColor: 'rgba(255,251,245,0.18)' }} />
        </View>

        {/* Card with notch */}
        <View style={{ marginHorizontal: 14, marginTop: -48, zIndex: 2 }}>
          {/* notch tab */}
          <View style={{ position: 'absolute', top: -14, right: 28, width: 72, height: 22, backgroundColor: '#FFFBF5', borderBottomLeftRadius: 14, borderBottomRightRadius: 14, zIndex: 3 }} />
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: spacing.xl,
              gap: spacing.md,
              ...shadows.md as any,
              shadowColor: 'rgba(0,0,0,0.08)',
              borderWidth: 1,
              borderColor: 'rgba(0,0,0,0.04)',
            }}
          >
            <View style={{ gap: 6 }}>
              <Text style={{ fontSize: 26, lineHeight: 30, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 }}>Welcome back</Text>
              <Text style={{ ...typography.bodySmall, color: '#64748B', lineHeight: 20 }}>Login with Email/Password, Google, Phone, OTP or Magic Link</Text>
            </View>

            {/* Email */}
            <View style={{ gap: 6 }}>
              <Text style={{ ...typography.label, color: '#1E293B', fontWeight: '700' }}>Email</Text>
              <Controller
                control={control}
                name="email"
                render={({ field }) => (
                  <View style={{ height: 48, borderRadius: 12, borderWidth: 1.2, borderColor: errors.email ? colors.error : '#E2E8F0', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}>
                    <Ionicons name="mail-outline" size={18} color="#64748B" />
                    <TextInput
                      placeholder="you@example.com"
                      placeholderTextColor="#94A3B8"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={field.value}
                      onChangeText={field.onChange}
                      style={{ flex: 1, ...typography.bodySmall, color: colors.textPrimary, paddingVertical: 0 }}
                    />
                  </View>
                )}
              />
              {errors.email?.message ? <Text style={{ ...typography.caption, color: colors.error }}>{errors.email.message as string}</Text> : null}
            </View>

            {/* Password */}
            <View style={{ gap: 6 }}>
              <Text style={{ ...typography.label, color: '#1E293B', fontWeight: '700' }}>Password</Text>
              <Controller
                control={control}
                name="password"
                render={({ field }) => (
                  <View style={{ height: 48, borderRadius: 12, borderWidth: 1.2, borderColor: errors.password ? colors.error : '#E2E8F0', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}>
                    <Ionicons name="lock-closed-outline" size={18} color="#64748B" />
                    <TextInput
                      placeholder="Enter your password"
                      placeholderTextColor="#94A3B8"
                      secureTextEntry={!showPassword}
                      value={field.value}
                      onChangeText={field.onChange}
                      style={{ flex: 1, ...typography.bodySmall, color: colors.textPrimary, paddingVertical: 0 }}
                    />
                    <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                      <Ionicons name={showPassword ? 'eye-outline' : 'eye-off-outline'} size={20} color="#64748B" />
                    </Pressable>
                  </View>
                )}
              />
              {errors.password?.message ? <Text style={{ ...typography.caption, color: colors.error }}>{errors.password.message as string}</Text> : null}
            </View>

            <Pressable onPress={() => router.push('/(auth)/magic-link')} style={{ alignSelf: 'flex-end', marginTop: -4 }}>
              <Text style={{ ...typography.label, color: '#EA580C', fontWeight: '600' }}>Forgot Password?</Text>
            </Pressable>

            {/* Login with Email */}
            <Pressable onPress={handleSubmit(onSubmit)} disabled={loading} style={{ height: 52, borderRadius: 14, overflow: 'hidden', opacity: loading ? 0.7 : 1, marginTop: 2 }}>
              <LinearGradient colors={['#FF5A3D', '#FF7A3D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 16 }}>
                <Text style={{ ...typography.labelLarge, color: '#FFF', fontWeight: '700' }}>{loading ? 'Signing in…' : 'Login with Email'}</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
              </LinearGradient>
            </Pressable>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
              <Text style={{ ...typography.captionBold, color: '#94A3B8', letterSpacing: 0.6 }}>OR</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            </View>

            {/* Continue with Google */}
            <Pressable
              onPress={handleGoogle}
              disabled={googleLoading}
              style={{ height: 52, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1.2, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, opacity: googleLoading ? 0.6 : 1 }}
            >
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#4285F4' }}>G</Text>
              </View>
              <Text style={{ flex: 1, ...typography.labelLarge, color: '#0F172A', fontWeight: '600' }}>{googleLoading ? 'Signing in…' : 'Continue with Google'}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            {/* Email OTP + Magic Link */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Pressable onPress={() => router.push({ pathname: '/(auth)/otp', params: { email: '' } })} style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1.2, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="mail" size={16} color="#0F172A" />
                <Text style={{ ...typography.label, color: '#0F172A', fontWeight: '600' }}>Use Email OTP</Text>
              </Pressable>
              <Pressable onPress={() => router.push('/(auth)/magic-link')} style={{ flex: 1, height: 48, borderRadius: 12, borderWidth: 1.2, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Ionicons name="link" size={16} color="#0F172A" />
                <Text style={{ ...typography.label, color: '#0F172A', fontWeight: '600' }}>Magic Link</Text>
              </Pressable>
            </View>

            {/* Continue with Phone */}
            <Pressable onPress={() => (router as any).push('/(auth)/phone')} style={{ height: 52, borderRadius: 14, backgroundColor: '#FFF0EC', borderWidth: 1.2, borderColor: '#FFD8CC', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 }}>
              <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="call" size={14} color="#EA580C" />
              </View>
              <Text style={{ flex: 1, ...typography.labelLarge, color: '#EA580C', fontWeight: '600' }}>Continue with Phone</Text>
              <Ionicons name="chevron-forward" size={18} color="#EA580C" />
            </Pressable>

            <View style={{ height: 1, backgroundColor: '#E2E8F0', marginTop: 4 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center' }}>
              <Text style={{ ...typography.bodySmall, color: '#64748B' }}>Don't have an account?</Text>
              <Link href="/(auth)/signup" asChild>
                <Pressable><Text style={{ ...typography.label, color: '#EA580C', fontWeight: '700' }}>Sign up</Text></Pressable>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
