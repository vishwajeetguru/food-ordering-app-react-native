import { SafeAreaView } from 'react-native-safe-area-context';
import { RestaurantMenu } from '@/components/RestaurantMenu';
import { colors } from '@/theme/colors';

export default function MenuTab() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <RestaurantMenu />
    </SafeAreaView>
  );
}
