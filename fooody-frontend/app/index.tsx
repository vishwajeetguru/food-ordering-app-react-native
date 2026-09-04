import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/theme/colors';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthStore();
  if (isLoading) {
    return <View style={{ flex:1, alignItems:'center', justifyContent:'center', backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (isAuthenticated) return <Redirect href="/(tabs)/home" />;
  return <Redirect href="/(auth)/welcome" />;
}
