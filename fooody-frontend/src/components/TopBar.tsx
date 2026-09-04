import * as React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { PressableScale } from './PressableScale';
import { useAuthStore } from '@/store/authStore';

export function TopBar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const initial = (user?.name || user?.email || 'F').trim().charAt(0).toUpperCase();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingTop: spacing.sm }}>
      <PressableScale
        onPress={() => router.push('/search')}
        accessibilityLabel="Search for dishes"
        style={{
          flex: 1,
          height: 44,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderLight,
          ...shadows.xs as any,
        }}
      >
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: spacing.sm }}>
          <Ionicons name="search" size={18} color={colors.textTertiary} />
          <Text style={{ ...typography.bodySmall, color: colors.textTertiary, flex: 1 }}>Search for dishes</Text>
        </View>
      </PressableScale>

      <PressableScale
        onPress={() => router.push('/profile')}
        accessibilityLabel="Open profile"
        style={{ width: 44, height: 44 }}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          style={{
            flex: 1,
            borderRadius: 22,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 2,
            borderColor: colors.surface,
            ...shadows.sm as any,
          }}
        >
          <Text style={{ ...typography.label, color: colors.textInverse, fontWeight: '800' }}>{initial}</Text>
        </LinearGradient>
      </PressableScale>
    </View>
  );
}
