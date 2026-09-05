import * as React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useMaintenance } from '@/hooks/useRealtime';
import { useAuthStore } from '@/store/authStore';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import Ionicons from '@expo/vector-icons/Ionicons';

export function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { maintenanceMode, maintenanceMessage, isLoading } = useMaintenance();
  const user = useAuthStore(s => s.user);
  const role = (user as any)?.role;
  const isAdmin = role === 'admin';

  // While loading, don't block
  if (isLoading) return <>{children}</>;
  // Admins bypass maintenance
  if (maintenanceMode && !isAdmin) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FFFBF5', alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg }}>
        <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF2E8', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="construct" size={36} color={colors.primary} />
        </View>
        <View style={{ alignItems: 'center', gap: spacing.sm }}>
          <Text style={{ ...typography.h1, color: colors.textPrimary, textAlign: 'center' }}>Under Maintenance</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, maxWidth: 320 }}>
            {maintenanceMessage || 'Foody is under maintenance. Please check back soon. We are improving your experience!'}
          </Text>
        </View>
        <View style={{ backgroundColor: '#fff', borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight, width: '100%', maxWidth: 360 }}>
          <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>What’s happening?</Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 4 }}>Our team is performing scheduled maintenance. Orders are temporarily paused and will resume automatically when maintenance ends. This page will update instantly when we’re back.</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.warning }} />
          <Text style={{ ...typography.caption, color: colors.textTertiary }}>Realtime — will auto-refresh when maintenance ends</Text>
        </View>
      </View>
    );
  }
  return <>{children}</>;
}
