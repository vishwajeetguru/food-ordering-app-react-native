import * as React from 'react';
import { View } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming, useAnimatedStyle, Easing } from 'react-native-reanimated';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/spacing';

export function Skeleton({ width = '100%', height = 16, style, borderRadius }: any) {
  const opacity = useSharedValue(0.6);
  React.useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, []);
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          backgroundColor: colors.shimmer,
          borderRadius: borderRadius ?? radius.sm,
        },
        aStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={{ padding: 12, gap: 10, backgroundColor: colors.surface, borderRadius: 16, borderWidth: 1, borderColor: colors.borderLight }}>
      <Skeleton height={140} borderRadius={12} />
      <Skeleton width="70%" height={16} />
      <Skeleton width="90%" height={12} />
      <Skeleton width={80} height={28} />
    </View>
  );
}
