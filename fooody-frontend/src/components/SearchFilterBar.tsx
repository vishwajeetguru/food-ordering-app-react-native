import * as React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { colors } from '@/theme/colors';
import { spacing, radius, hitSlop } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';

export type SearchFilterBarProps = {
  placeholder?: string;
  value?: string;
  onChangeText?: (t: string) => void;
  onSearchPress?: () => void;
  onFilterPress?: () => void;
  onSubmit?: (text: string) => void;
  /** if true renders TextInput, else pressable navigation */
  editable?: boolean;
  autoFocus?: boolean;
  style?: any;
};

export const SearchFilterBar = React.memo(function SearchFilterBar({
  placeholder = 'Search for dishes',
  value,
  onChangeText,
  onSearchPress,
  onFilterPress,
  onSubmit,
  editable = false,
  autoFocus = false,
  style,
}: SearchFilterBarProps) {
  const [focused, setFocused] = React.useState(false);

  const handleSearch = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSearchPress?.();
  }, [onSearchPress]);

  const handleFilter = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onFilterPress?.();
  }, [onFilterPress]);

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xl }, style]}>
      {/* Search field */}
      {editable ? (
        <View
          style={{
            flex: 1,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: focused ? colors.primary : colors.borderLight,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
            ...shadows.xs as any,
          }}
        >
          <Ionicons name="search" size={20} color={colors.textTertiary} />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={colors.textTertiary}
            autoFocus={autoFocus}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onSubmitEditing={(e) => onSubmit?.(e.nativeEvent.text)}
            returnKeyType="search"
            style={{ flex: 1, fontSize: 15, color: colors.textPrimary, paddingVertical: 0 }}
            accessibilityLabel="Search for dishes"
          />
          {!!value && (
            <Pressable onPress={() => onChangeText?.('')} hitSlop={hitSlop}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      ) : (
        <Pressable
          onPress={handleSearch}
          accessibilityRole="search"
          accessibilityLabel={placeholder}
          style={({ pressed }) => ({
            flex: 1,
            height: 48,
            borderRadius: radius.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.borderLight,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: spacing.lg,
            gap: spacing.sm,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
            ...shadows.xs as any,
          })}
        >
          <Ionicons name="search" size={20} color={colors.textSecondary} />
          <Text style={{ ...typography.bodySmall, color: colors.textTertiary, flex: 1, fontSize: 15 }} numberOfLines={1}>
            {value || placeholder}
          </Text>
        </Pressable>
      )}

      {/* Filter button */}
      <Pressable
        onPress={handleFilter}
        hitSlop={hitSlop}
        accessibilityRole="button"
        accessibilityLabel="Filters"
        style={({ pressed }) => ({
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: colors.primaryMuted,
          borderWidth: 1,
          borderColor: '#FFE0D6',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.94 : 1 }],
          ...shadows.xs as any,
        })}
      >
        <Ionicons name="options-outline" size={20} color={colors.primary} style={{ transform: [{ rotate: '90deg' }] }} />
        {/* small red dots like screenshot */}
        <View
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            width: 6,
            height: 6,
            borderRadius: 3,
            backgroundColor: colors.primary,
            borderWidth: 1,
            borderColor: colors.primaryMuted,
          }}
        />
      </Pressable>
    </View>
  );
});
