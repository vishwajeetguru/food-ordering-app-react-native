import { SafeAreaView } from 'react-native-safe-area-context';
import { RestaurantMenu } from '@/components/RestaurantMenu';
import { colors } from '@/theme/colors';

export default function Restaurant() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <RestaurantMenu headerMode="overlay" />
    </SafeAreaView>
  );
}
