import * as React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

WebBrowser.maybeCompleteAuthSession();

export default function Welcome() {
  const router = useRouter();
  const { refreshUser } = useAuthStore();
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
        authService
          .signInWithGoogleCredential(idToken)
          .then(async () => {
            await refreshUser();
            router.replace('/(tabs)/home');
          })
          .catch((e: any) => alert(e.message))
          .finally(() => setGoogleLoading(false));
      }
    }
  }, [response]);

  const handleGoogle = async () => {
    if (!googleWebClientId && !googleIosClientId && !googleAndroidClientId) {
      alert('Google sign-in not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to .env');
      return;
    }
    if (!request) return;
    await promptAsync();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFBF5' }}>
      {/* Bottom blobs */}
      <View style={{ position: 'absolute', bottom: -60, left: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: '#FFF0E8', opacity: 0.6 }} />
      <View style={{ position: 'absolute', bottom: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: '#FFF0E8', opacity: 0.5 }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 8 }} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Top hero with logo, headline, burger */}
        <View style={{ paddingTop: spacing.md, overflow: 'hidden' }}>
          {/* soft pink blob top right */}
          <View style={{ position: 'absolute', top: -90, right: -70, width: 260, height: 260, borderRadius: 130, backgroundColor: '#FFF0E8' }} />

          {/* burger background - optimized webp (222KB vs 2.4MB) */}
          <Image
            source={require('../../assets/burger-bg.webp')}
            style={{ position: 'absolute', right: -10, top: 0, width: 260, height: 360 }}
            contentFit="cover"
            contentPosition="right"
            transition={0}
            cachePolicy="memory-disk"
          />

          {/* Headline */}
          <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg, width: '62%' }}>
            <Text style={{ fontSize: 36, lineHeight: 38, fontWeight: '900', color: '#0F172A', letterSpacing: -0.8 }}>
              Delicious{'\n'}Food,{' '}
              <Text style={{ color: '#EA580C' }}>Right</Text>
            </Text>
            <Text style={{ fontSize: 36, lineHeight: 38, fontWeight: '900', color: '#EA580C', letterSpacing: -0.8 }}>
              at Your
            </Text>
            <Text style={{ fontSize: 42, lineHeight: 44, fontWeight: '900', color: '#EA580C', letterSpacing: -0.8 }}>
              Doorstep
            </Text>
            <Text style={{ ...typography.bodySmall, color: '#64748B', marginTop: spacing.sm, lineHeight: 20 }}>
              Fresh meals. Great taste.{'\n'}Happier days.
            </Text>
          </View>

          {/* Feature icons */}
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: spacing.xl, marginTop: spacing.lg, width: '62%' }}>
            {[
              { icon: 'restaurant' as const, bg: '#FFE9E8', color: '#EF4444', label1: 'Freshly', label2: 'Prepared' },
              { icon: 'bicycle' as const, bg: '#E6F7ED', color: '#10B981', label1: 'Fast', label2: 'Delivery' },
              { icon: 'shield-checkmark' as const, bg: '#FFF2E0', color: '#F59E0B', label1: 'Quality', label2: 'You Can Trust' },
            ].map((f) => (
              <View key={f.label2} style={{ alignItems: 'center', gap: 8, flex: 1 }}>
                <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: f.bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)' }}>
                  <Ionicons name={f.icon} size={20} color={f.color} />
                </View>
                <Text style={{ ...typography.caption, color: '#334155', textAlign: 'center', lineHeight: 14, fontWeight: '600' }}>
                  {f.label1}
                  {'\n'}
                  {f.label2}
                </Text>
              </View>
            ))}
          </View>

          {/* spacer for burger overlap */}
          <View style={{ height: 18 }} />
        </View>

        {/* Bottom card */}
        <View
          style={{
            marginHorizontal: 14,
            marginTop: 6,
            backgroundColor: '#FFFFFF',
            borderRadius: 24,
            padding: spacing.xl,
            gap: spacing.md,
            ...shadows.md as any,
            shadowColor: 'rgba(0,0,0,0.08)',
            borderWidth: 1,
            borderColor: 'rgba(0,0,0,0.03)',
          }}
        >
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 26, lineHeight: 30, fontWeight: '800', color: '#0F172A', letterSpacing: -0.4 }}>Welcome back</Text>
            <Text style={{ ...typography.bodySmall, color: '#64748B', lineHeight: 20 }}>Sign in to enjoy premium food from our single kitchen, crafted fresh.</Text>
          </View>

          {/* Buttons */}
          <View style={{ gap: 12, marginTop: 4 }}>
            {/* Google */}
            <Pressable
              onPress={handleGoogle}
              disabled={googleLoading}
              style={{ height: 54, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1.2, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, opacity: googleLoading ? 0.6 : 1 }}
            >
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#4285F4' }}>G</Text>
              </View>
              <Text style={{ flex: 1, ...typography.labelLarge, color: '#0F172A', fontWeight: '600' }}>{googleLoading ? 'Signing in…' : 'Continue with Google'}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>

            {/* Email - orange gradient */}
            <Pressable onPress={() => router.push('/(auth)/login')} style={{ height: 54, borderRadius: 14, overflow: 'hidden' }}>
              <LinearGradient colors={['#FF5A3D', '#FF7A3D']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 }}>
                <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="mail" size={16} color="#FFF" />
                </View>
                <Text style={{ flex: 1, ...typography.labelLarge, color: '#FFF', fontWeight: '700' }}>Continue with Email</Text>
                <Ionicons name="chevron-forward" size={18} color="#FFF" />
              </LinearGradient>
            </Pressable>

            {/* Phone */}
            <Pressable onPress={() => (router as any).push('/(auth)/phone')} style={{ height: 54, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1.2, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12 }}>
              <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="call" size={14} color="#FFF" />
              </View>
              <Text style={{ flex: 1, ...typography.labelLarge, color: '#0F172A', fontWeight: '600' }}>Continue with Phone</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </Pressable>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 2 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
            <Text style={{ ...typography.captionBold, color: '#94A3B8', letterSpacing: 0.6 }}>OR</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: '#E2E8F0' }} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, alignItems: 'center' }}>
            <Text style={{ ...typography.bodySmall, color: '#64748B' }}>New to Foody?</Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ ...typography.label, color: '#EA580C', fontWeight: '700' }}>Create account</Text>
                <Ionicons name="chevron-forward" size={14} color="#EA580C" />
              </Pressable>
            </Link>
          </View>

          <Text style={{ ...typography.caption, color: '#94A3B8', textAlign: 'center', marginTop: 2, lineHeight: 16 }}>
            By continuing, you agree to our <Text style={{ textDecorationLine: 'underline', color: '#64748B' }}>Terms & Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
