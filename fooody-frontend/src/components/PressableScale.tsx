import * as React from 'react';
import { Pressable, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export function PressableScale({
  onPress,
  children,
  style,
  disabled,
  accessibilityLabel,
}: {
  onPress?: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityLabel={accessibilityLabel}
        onPressIn={() => { scale.value = withSpring(0.94, { damping: 18, stiffness: 350 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 14, stiffness: 300 }); }}
        style={{ flex: 1 }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
