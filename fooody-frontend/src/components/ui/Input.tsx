import * as React from 'react';
import { View, TextInput, Text, StyleSheet, TextInputProps, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

export function Input({
  label,
  error,
  containerStyle,
  ...props
}: TextInputProps & { label?: string; error?: string; containerStyle?: ViewStyle }) {
  const [focused, setFocused] = React.useState(false);
  return (
    <View style={[{ gap: 6 }, containerStyle]}>
      {label ? <Text style={{ ...typography.label, color: colors.textSecondary }}>{label}</Text> : null}
      <TextInput
        {...props}
        onFocus={(e)=>{ setFocused(true); props.onFocus?.(e); }}
        onBlur={(e)=>{ setFocused(false); props.onBlur?.(e); }}
        placeholderTextColor={colors.textTertiary}
        style={[
          styles.input,
          {
            borderColor: error ? colors.error : focused ? colors.primary : colors.border,
            backgroundColor: colors.surface,
          },
          props.style as any,
        ]}
      />
      {error ? <Text style={{ ...typography.caption, color: colors.error }}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.2,
    paddingHorizontal: spacing.lg,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
