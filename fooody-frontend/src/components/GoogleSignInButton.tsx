import * as React from 'react';
import { Text, Alert, Platform } from 'react-native';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { authService } from '@/services/auth.service';
import { useAuthStore } from '@/store/authStore';

WebBrowser.maybeCompleteAuthSession();

function getGoogleClientIds() {
  return {
    web: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '',
    ios: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '',
    android: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '',
  };
}

const GIcon = <Text style={{ fontWeight: '800', color: '#4285F4' }}>G</Text>;

function GoogleConfiguredButton() {
  const ids = getGoogleClientIds();
  const router = useRouter();
  const { refreshUser } = useAuthStore();
  const [loading, setLoading] = React.useState(false);

  // Platform-specific IDs prevent the "iosClientId must be defined" crash.
  // On native, a web clientId also works (Expo Go / Expo dev client).
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: ids.web || undefined,
    iosClientId: ids.ios || undefined,
    androidClientId: ids.android || undefined,
  });

  React.useEffect(() => {
    if (response?.type === 'success') {
      const idToken = (response.authentication as any)?.idToken || response.params?.id_token;
      if (idToken) {
        setLoading(true);
        authService
          .signInWithGoogleCredential(idToken)
          .then(async () => {
            await refreshUser();
            router.replace('/(tabs)/home');
          })
          .catch((e: any) => Alert.alert('Google sign-in failed', e.message))
          .finally(() => setLoading(false));
      }
    } else if (response?.type === 'error') {
      Alert.alert('Google sign-in failed', (response as any).error?.message || 'Unknown error');
    }
  }, [response]);

  const handlePress = async () => {
    if (Platform.OS === 'web') {
      setLoading(true);
      try {
        await authService.signInWithGoogle();
        await refreshUser();
        router.replace('/(tabs)/home');
      } catch (e: any) {
        if (e.code === 'auth/unauthorized-domain') {
          Alert.alert('Unauthorized domain', 'Add localhost and your domain to Firebase Console → Authentication → Settings → Authorized domains');
        } else {
          Alert.alert('Google sign-in failed', e.message);
        }
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!request) {
      Alert.alert('Google request not ready', 'Please try again in a moment');
      return;
    }
    await promptAsync();
  };

  return (
    <Button
      title={loading ? 'Signing in…' : 'Continue with Google'}
      onPress={handlePress}
      loading={loading}
      variant="outline"
      icon={GIcon}
    />
  );
}

export function GoogleSignInButton() {
  const ids = getGoogleClientIds();
  const isConfigured =
    Platform.OS === 'web'
      ? !!ids.web
      : Platform.OS === 'ios'
        ? !!(ids.ios || ids.web)
        : !!(ids.android || ids.web);

  if (!isConfigured) {
    return (
      <Button
        title="Continue with Google"
        variant="outline"
        icon={GIcon}
        onPress={() =>
          Alert.alert(
            'Google sign-in not configured',
            'Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID (and optionally EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID / EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID) to .env from Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration. Then restart with npx expo start --clear. For now, use Email or Phone.'
          )
        }
      />
    );
  }
  return <GoogleConfiguredButton />;
}
