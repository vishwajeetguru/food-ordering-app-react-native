import * as React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';

type SearchBarProps = {
  value?: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  onPress?: () => void;
  autoFocus?: boolean;
  onClear?: () => void;
  accessibilityLabel?: string;
};

export function SearchBar({ value, onChangeText, placeholder = 'Search for dishes', onPress, autoFocus, onClear, accessibilityLabel = 'Search' }: SearchBarProps) {
  const isButton = !!onPress && !onChangeText;

  if (isButton) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityLabel={accessibilityLabel}
        style={{
          flex: 1,
          height: 44,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.borderLight,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: spacing.lg,
          gap: spacing.sm,
          ...shadows.xs as any,
        }}
      >
        <Ionicons name="search" size={18} color={colors.textTertiary} />
        <Text style={{ ...typography.bodySmall, color: colors.textTertiary, flex: 1 }}>{placeholder}</Text>
      </Pressable>
    );
  }

  return (
    <View
      style={{
        flex: 1,
        height: 44,
        borderRadius: radius.md,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.borderLight,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
        gap: spacing.sm,
        ...shadows.xs as any,
      }}
    >
      <Ionicons name="search" size={18} color={colors.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        autoFocus={autoFocus}
        returnKeyType="search"
        style={{ flex: 1, ...typography.bodySmall, color: colors.textPrimary, paddingVertical: 0 }}
      />
      {value ? (
        <Pressable onPress={onClear} hitSlop={8}>
          <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
        </Pressable>
      ) : null}
    </View>
  );
}
