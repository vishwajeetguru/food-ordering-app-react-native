import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { useAuthStore } from '@/store/authStore';
import { useUnreadCount } from '@/hooks/useNotifications';

type GreetingHeaderProps = {
  /** Override name, defaults to auth user */
  name?: string;
  /** Override greeting e.g. "Good morning" */
  greeting?: string;
  /** Show red dot on bell */
  hasNotification?: boolean;
  /** Notification count badge (optional) */
  notificationCount?: number;
  /** Callbacks */
  onNotificationPress?: () => void;
  onProfilePress?: () => void;
  /** Hide notification/profile if needed */
  hideActions?: boolean;
  style?: any;
};

function getTimeGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning,';
  if (h < 18) return 'Good afternoon,';
  return 'Good evening,';
}

export const GreetingHeader = React.memo(function GreetingHeader({
  name,
  greeting,
  hasNotification = true,
  notificationCount,
  onNotificationPress,
  onProfilePress,
  hideActions = false,
  style,
}: GreetingHeaderProps) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const displayName = name ?? user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'Vishwa';
  const greetText = greeting ?? getTimeGreeting();
  const initial = (displayName || 'F').trim().charAt(0).toUpperCase();
  const unreadQ = useUnreadCount();
  const effectiveCount = notificationCount ?? (unreadQ.data ?? 0);
  const showDot = hasNotification && effectiveCount > 0;
  const badgeText = effectiveCount > 9 ? '9+' : String(effectiveCount);

  const handleNotif = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onNotificationPress) onNotificationPress();
    else router.push('/notifications' as any);
  }, [onNotificationPress, router]);

  const handleProfile = React.useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (onProfilePress) onProfilePress();
    else router.push('/profile' as any);
  }, [onProfilePress, router]);

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: spacing.xl,
          paddingTop: spacing.sm,
          paddingBottom: spacing.sm,
        },
        style,
      ]}
      accessibilityRole="header"
    >
      {/* Left: greeting */}
      <View style={{ flex: 1, gap: 2, paddingRight: spacing.lg }}>
        <Text
          style={{ ...typography.bodySmall, color: colors.textSecondary, fontSize: 14, lineHeight: 18 }}
          numberOfLines={1}
          accessibilityLabel={greetText}
        >
          {greetText}
        </Text>
        <Text
          style={{
            fontSize: 24,
            lineHeight: 28,
            fontWeight: '800' as const,
            color: colors.textPrimary,
            letterSpacing: -0.4,
          }}
          numberOfLines={1}
        >
          {displayName} <Text style={{ fontSize: 20 }}>👋</Text>
        </Text>
      </View>

      {/* Right: actions */}
      {!hideActions && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          {/* Notification bell */}
          <Pressable
            onPress={handleNotif}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.borderLight,
              alignItems: 'center',
              justifyContent: 'center',
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
              ...shadows.xs as any,
            })}
          >
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            {showDot && (
              <View
                style={{
                  position: 'absolute',
                  top: 7,
                  right: 9,
                  width: effectiveCount ? 18 : 10,
                  height: effectiveCount ? 18 : 10,
                  borderRadius: 999,
                  backgroundColor: colors.error,
                  borderWidth: 2,
                  borderColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {effectiveCount ? (
                  <Text style={{ color: colors.textInverse, fontSize: 10, fontWeight: '700', lineHeight: 10 }}>
                    {badgeText}
                  </Text>
                ) : null}
              </View>
            )}
          </Pressable>

          {/* Avatar */}
          <Pressable
            onPress={handleProfile}
            hitSlop={8}
            accessibilityLabel="Open profile"
            accessibilityRole="button"
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 22,
              overflow: 'hidden',
              borderWidth: 2,
              borderColor: colors.surface,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
              ...shadows.sm as any,
            })}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ ...typography.labelLarge, color: colors.textInverse, fontWeight: '800', fontSize: 16 }}>
                {initial}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      )}
    </View>
  );
});
