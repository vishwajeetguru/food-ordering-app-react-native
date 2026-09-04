import * as React from 'react';
import { View, ViewStyle } from 'react-native';
import { colors } from '@/theme/colors';
import { radius } from '@/theme/spacing';
import { shadows } from '@/theme/shadows';

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.borderLight,
          overflow: 'hidden',
        },
        shadows.sm as any,
        style,
      ]}
    >
      {children}
    </View>
  );
}
