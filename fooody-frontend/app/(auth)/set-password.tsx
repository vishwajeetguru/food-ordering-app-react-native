import * as React from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

const schema = z.object({
  password: z.string().min(8,'Min 8').regex(/[A-Z]/,'Need uppercase').regex(/[a-z]/,'Need lowercase').regex(/[0-9]/,'Need number'),
  confirm: z.string(),
}).refine((d)=>d.password===d.confirm, { message:'Passwords do not match', path:['confirm'] });

export default function SetPassword() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email?: string }>();
  const { refreshUser } = useAuthStore();
  const { control, handleSubmit, formState:{ errors } } = useForm({ resolver: zodResolver(schema), defaultValues:{ password:'', confirm:'' } });
  const [loading, setLoading] = React.useState(false);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      await authService.setPassword(data.password);
      await refreshUser();
      Alert.alert('Success', 'Password set! You can now login with email & password.', [{ text:'Continue', onPress:()=>router.replace('/(tabs)/home') }]);
    } catch (e:any) { Alert.alert('Failed', e.message || 'Could not set password'); } finally { setLoading(false); }
  };

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.xl }} keyboardShouldPersistTaps="handled">
        <View style={{ gap:6, marginTop: spacing.lg }}>
          <Text style={{ ...typography.displayMedium, color: colors.textPrimary }}>Set password</Text>
          <Text style={{ ...typography.body, color: colors.textSecondary }}>
            {email ? `For ${email}, create a strong password to enable email + password login.` : 'Create a password for faster login next time.'}
          </Text>
        </View>
        <View style={{ gap: spacing.lg }}>
          <Controller control={control} name="password" render={({field})=>(
            <Input label="Password" placeholder="StrongPass1" secureTextEntry value={field.value} onChangeText={field.onChange} error={errors.password?.message as string} />
          )} />
          <Controller control={control} name="confirm" render={({field})=>(
            <Input label="Confirm Password" placeholder="Repeat password" secureTextEntry value={field.value} onChangeText={field.onChange} error={errors.confirm?.message as string} />
          )} />
          <Button title="Save & Continue" onPress={handleSubmit(onSubmit)} loading={loading} />
          <Button title="Skip for now" variant="ghost" onPress={()=>router.replace('/(tabs)/home')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
