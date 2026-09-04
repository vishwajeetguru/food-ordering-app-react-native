import * as React from 'react';
import { View, Text, Image, Pressable, ScrollView } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Button } from '@/components/ui/Button';
import { GoogleSignInButton } from '@/components/GoogleSignInButton';

export default function Welcome() {
  const router = useRouter();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ paddingTop: spacing['4xl'], paddingBottom: spacing['3xl'], paddingHorizontal: spacing.xl, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }}>
          <Animated.View entering={FadeIn.duration(600)} style={{ alignItems: 'center', gap: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 20, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 32 }}>🍔</Text>
            </View>
            <Text style={{ ...typography.displayLarge, color: colors.textInverse, textAlign: 'center' }}>Foody</Text>
            <Text style={{ ...typography.body, color: 'rgba(255,255,255,0.85)', textAlign: 'center' }}>Good food. Delivered simply.</Text>
          </Animated.View>
          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800' }}
              style={{ width: '100%', height: 200, borderRadius: radius.xl, marginTop: spacing.xl }}
            />
          </Animated.View>
        </LinearGradient>

        <Animated.View entering={FadeInUp.delay(400).duration(600)} style={{ padding: spacing.xl, gap: spacing.lg, flex: 1 }}>
          <View style={{ gap: spacing.sm, marginTop: spacing.lg }}>
            <Text style={{ ...typography.h1, color: colors.textPrimary }}>Welcome back</Text>
            <Text style={{ ...typography.body, color: colors.textSecondary }}>Sign in to enjoy premium food from our single kitchen, crafted fresh.</Text>
          </View>

          <View style={{ gap: spacing.md, marginTop: spacing.md }}>
            <GoogleSignInButton />

            <Button title="Continue with Email" onPress={() => router.push('/(auth)/login')} />
            <Button title="Continue with Phone" variant="outline" onPress={() => (router as any).push('/(auth)/phone')} />
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: spacing.md }}>
            <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>New to Foody?</Text>
            <Link href="/(auth)/signup" asChild>
              <Pressable><Text style={{ ...typography.label, color: colors.primary }}>Create account</Text></Pressable>
            </Link>
          </View>

          <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.md }}>
            By continuing, you agree to our Terms & Privacy Policy
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
