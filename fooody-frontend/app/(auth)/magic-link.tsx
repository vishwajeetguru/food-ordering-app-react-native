import * as React from 'react';
import { View, Text, ScrollView, Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ExpoLinking from 'expo-linking';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({ email: z.string().email('Valid email required') });

export default function MagicLink() {
  const router = useRouter();
  const params = useLocalSearchParams<{ token?: string }>();
  const { refreshUser } = useAuthStore();
  const { control, handleSubmit, formState:{ errors } } = useForm({ resolver: zodResolver(schema), defaultValues:{ email:'' } });
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [sentEmail, setSentEmail] = React.useState('');

  // Handle incoming deep link with token
  React.useEffect(() => {
    const token = params.token as string | undefined;
    if (token) {
      handleVerify(token);
    }
  }, [params.token]);

  // Also listen to Linking events for foreground
  React.useEffect(() => {
    const sub = ExpoLinking.addEventListener('url', ({ url }) => {
      const { queryParams } = ExpoLinking.parse(url);
      const t = queryParams?.token as string;
      if (t) handleVerify(t);
    });
    return () => sub.remove();
  }, []);

  const handleVerify = async (token: string) => {
    try {
      setLoading(true);
      await authService.verifyMagicLink(token);
      await refreshUser();
      router.replace('/(tabs)/home');
    } catch (e: any) {
      Alert.alert('Magic link failed', e.message || 'Invalid or expired link');
    } finally { setLoading(false); }
  };

  const onSubmit = async (data:any) => {
    setLoading(true);
    try {
      const res = await authService.sendMagicLink(data.email.trim().toLowerCase());
      setSent(true); setSentEmail(data.email);
      // In dev, link is returned; show it
      const link = (res as any)?.data?.link;
      if (link) {
        Alert.alert('Magic link (dev)', link, [{ text:'Copy', onPress:()=>{}}, {text:'Open', onPress:()=>Linking.openURL(link)}]);
      }
    } catch (e:any) { Alert.alert('Error', e.message); } finally { setLoading(false); }
  };

  if (sent) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
        <View style={{ flex:1, padding: spacing.xl, gap: spacing.xl, justifyContent:'center', alignItems:'center' }}>
          <View style={{ width: 72, height:72, borderRadius: 36, backgroundColor: colors.primaryLight, alignItems:'center', justifyContent:'center' }}><Text style={{ fontSize:32 }}>✉️</Text></View>
          <Text style={{ ...typography.h1, color: colors.textPrimary, textAlign:'center' }}>Check your email</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary, textAlign:'center' }}>
            We sent a magic link to <Text style={{ fontWeight:'700', color: colors.textPrimary }}>{sentEmail}</Text>. Tap the link to sign in. It expires in 15 minutes and can be used only once.
          </Text>
          <View style={{ backgroundColor: colors.surfaceMuted, padding: spacing.md, borderRadius: radius.md }}>
            <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign:'center' }}>Deep link: foody://auth/magic-link?token=... — Expo will open the app automatically. Ensure scheme 'foody' is configured in app.json.</Text>
          </View>
          <Button title="Open Email App" onPress={()=>Linking.openURL('mailto:')} />
          <Button title="Back to Login" variant="outline" onPress={()=>router.push('/(auth)/login')} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: 6, marginTop: spacing.lg }}>
          <Text style={{ ...typography.displayMedium, color: colors.textPrimary }}>Magic link</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>Enter your email and we'll send you a one-tap sign-in link.</Text>
        </View>
        <View style={{ gap: spacing.lg }}>
          <Controller control={control} name="email" render={({ field })=>(
            <Input label="Email" placeholder="you@example.com" autoCapitalize="none" keyboardType="email-address" value={field.value} onChangeText={field.onChange} error={errors.email?.message as string} />
          )} />
          <Button title="Send Magic Link" onPress={handleSubmit(onSubmit)} loading={loading} />
          <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign:'center' }}>Link expires in 15 min • One-time use • Securely hashed</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
