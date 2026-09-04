import * as React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { shadows } from '@/theme/shadows';
import { FloatingCart } from '@/components/FloatingCart';

const TABS = {
  home: { label: 'Home', icon: 'home' },
  menu: { label: 'Menu', icon: 'restaurant' },
  offers: { label: 'Offers', icon: 'pricetags' },
  orders: { label: 'Orders', icon: 'receipt' },
} as const;

type IoniconName = keyof typeof Ionicons.glyphMap;

function TabIcon({ focused, label, icon }: { focused: boolean; label: string; icon: string }) {
  const scale = useSharedValue(1);
  const progress = useSharedValue(focused ? 1 : 0);

  React.useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, { duration: 180 });
    if (focused) {
      scale.value = withSequence(withTiming(1.22, { duration: 120 }), withSpring(1, { damping: 8, stiffness: 300 }));
    }
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: 0.65 + 0.35 * progress.value }));
  const pillStyle = useAnimatedStyle(() => ({
    backgroundColor: progress.value > 0 ? colors.primaryMuted : 'transparent',
    borderRadius: 999,
  }));

  return (
    <Animated.View style={[pillStyle, { alignItems: 'center', justifyContent: 'center', width: 56, height: 40, gap: 2 }]}>
      <Animated.View style={iconStyle}>
        <Ionicons
          name={(focused ? (icon as IoniconName) : (`${icon}-outline` as IoniconName))}
          size={22}
          color={focused ? colors.primary : colors.tabInactive}
        />
      </Animated.View>
      <Animated.Text style={{ fontSize: 10, fontWeight: '700', color: focused ? colors.primary : colors.tabInactive, opacity: 0.6 + 0.4 * progress.value }}>
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

export default function TabsLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          tabBarShowLabel: false,
          tabBarStyle: styles.tabBar,
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        {(Object.keys(TABS) as Array<keyof typeof TABS>).map((name) => (
          <Tabs.Screen
            key={name}
            name={name}
            options={{
              tabBarIcon: ({ focused }) => <TabIcon focused={focused} label={TABS[name].label} icon={TABS[name].icon} />,
            }}
          />
        ))}
      </Tabs>
      <FloatingCart />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 68,
    paddingTop: 6,
    paddingBottom: 8,
    backgroundColor: colors.surface,
    borderTopColor: colors.borderLight,
    borderTopWidth: 1,
    ...(shadows.lg as any),
    shadowColor: 'rgba(26,26,26,0.08)',
  },
});
