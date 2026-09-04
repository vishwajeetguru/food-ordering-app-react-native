import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';

type Props = {
  label?: string;
  sub: string;
  hasAddress: boolean;
  isLoading?: boolean;
  count?: number;
  onPress?: () => void;
};

export const DeliveryLocationBar = React.memo(function DeliveryLocationBar({
  label = 'Home',
  sub,
  hasAddress,
  isLoading,
  count,
  onPress,
}: Props) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress?.();
      }}
      accessibilityLabel={`Delivering to ${label}, ${sub}`}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginHorizontal: spacing.xl,
        paddingHorizontal: spacing.lg,
        paddingVertical: 12,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderLight,
        opacity: pressed ? 0.88 : 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
        ...shadows.xs as any,
      })}
    >
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: colors.primaryMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="location" size={16} color={colors.primary} />
      </View>

      <View style={{ flex: 1, gap: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ ...typography.caption, color: colors.textSecondary, fontSize: 13 }}>Delivering to</Text>
          {isLoading ? (
            <Text style={{ ...typography.label, color: colors.textTertiary }}>Locating…</Text>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <Text style={{ ...typography.label, color: colors.textPrimary, fontWeight: '700' }}>{label}</Text>
              <Ionicons name="caret-down" size={10} color={colors.textPrimary} />
            </View>
          )}
        </View>
        <Text style={{ ...typography.caption, color: colors.textSecondary, fontSize: 13 }} numberOfLines={1}>
          {isLoading ? 'Fetching address...' : sub}
        </Text>
      </View>

      {typeof count === 'number' && count > 1 ? (
        <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ ...typography.captionBold, color: colors.textSecondary, fontSize: 10 }}>{count}</Text>
        </View>
      ) : (
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      )}
    </Pressable>
  );
});
