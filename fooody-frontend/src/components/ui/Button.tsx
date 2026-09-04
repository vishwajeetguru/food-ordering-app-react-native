import * as React from 'react';
import { Pressable, Text, ActivityIndicator, ViewStyle, TextStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost';

export function Button({
  title,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  style,
  textStyle,
  accessibilityLabel,
  icon,
}: {
  title: string;
  onPress?: () => void;
  variant?: Variant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  icon?: React.ReactNode;
}) {
  const scale = useSharedValue(1);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => { scale.value = withSpring(0.97, { damping: 15, stiffness: 400 }); };
  const handlePressOut = () => { scale.value = withSpring(1, { damping: 15, stiffness: 400 }); };

  const isDisabled = disabled || loading;

  const bg = variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.surfaceMuted : 'transparent';
  const borderColor = variant === 'outline' ? colors.border : 'transparent';
  const textColor = variant === 'primary' ? colors.textInverse : colors.textPrimary;

  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPress={() => {
          if (isDisabled) return;
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(()=>{});
          onPress?.();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        style={[
          {
            height: 52,
            borderRadius: radius.md,
            backgroundColor: bg,
            borderWidth: variant === 'outline' ? 1 : 0,
            borderColor,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.sm,
            paddingHorizontal: spacing.xl,
            opacity: isDisabled ? 0.6 : 1,
          },
          style,
        ]}
      >
        {loading ? <ActivityIndicator color={textColor} /> : icon}
        <Text style={[{ color: textColor, ...typography.labelLarge }, textStyle]}>{title}</Text>
      </Pressable>
    </Animated.View>
  );
}
