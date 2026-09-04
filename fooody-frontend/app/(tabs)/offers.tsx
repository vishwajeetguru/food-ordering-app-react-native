import * as React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { TopBar } from '@/components/TopBar';
import { useOffers } from '@/hooks/useCatalog';

export default function Offers() {
  const { data: offers, isPending } = useOffers();
  const [copied, setCopied] = React.useState<string | null>(null);

  const copy = (code: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 1800);
  };

  if (isPending) {
    return (
      <SafeAreaView style={{ flex:1, backgroundColor: colors.background, alignItems:'center', justifyContent:'center' }}>
        <Text style={{ ...typography.bodySmall, color: colors.textTertiary }}>Loading offers...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <TopBar />

        <Animated.View entering={FadeInDown.duration(500)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.md, gap: spacing.sm }}>
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>Offers for you 🎉</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>Grab a deal before it's gone — apply codes at checkout.</Text>
        </Animated.View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg, gap: spacing.md }}>
          {(offers ?? []).map((o, i) => {
            const isCopied = copied === o.code;
            return (
              <Animated.View key={o.id} entering={FadeInUp.delay(120 + i * 90).duration(500)}>
                <LinearGradient
                  colors={[(o.colors?.[0] as string) || colors.primary, (o.colors?.[1] as string) || colors.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ borderRadius: radius.xl, padding: spacing.lg, gap: spacing.sm, ...shadows.md as any }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={{ fontSize: 18 }}>{o.emoji}</Text>
                        <Text style={{ ...typography.h3, color: '#fff' }}>{o.title}</Text>
                      </View>
                      <Text style={{ ...typography.bodySmall, color: 'rgba(255,255,255,0.9)' }}>{o.subtitle}</Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 }}>
                      <Text style={{ ...typography.captionBold, color: '#fff' }}>{o.tag}</Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                      <View style={{ borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', borderStyle: 'dashed', paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.12)' }}>
                        <Text style={{ ...typography.labelLarge, color: '#fff', letterSpacing: 1.5 }}>{o.code}</Text>
                      </View>
                      <Text style={{ ...typography.caption, color: 'rgba(255,255,255,0.85)' }}>min order applies</Text>
                    </View>
                    <Pressable
                      onPress={() => copy(o.code)}
                      style={{ backgroundColor: '#fff', paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.md }}
                    >
                      <Text style={{ ...typography.label, color: (o.colors?.[0] as string) || colors.primary, fontWeight: '800' }}>{isCopied ? '✓ Copied' : 'Apply'}</Text>
                    </Pressable>
                  </View>
                </LinearGradient>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View entering={FadeInUp.delay(600).duration(500)} style={{ paddingHorizontal: spacing.xl, marginTop: spacing.lg }}>
          <View style={{ backgroundColor: colors.accentLight, borderRadius: radius.lg, padding: spacing.lg, flexDirection: 'row', gap: spacing.md, alignItems: 'center', borderWidth: 1, borderColor: '#F5DFAE' }}>
            <Text style={{ fontSize: 28 }}>🎁</Text>
            <View style={{ flex: 1 }}>
              <Text style={{ ...typography.label, color: colors.textPrimary }}>Refer a friend, earn ₹200</Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>Share your code and both of you save on next order.</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
