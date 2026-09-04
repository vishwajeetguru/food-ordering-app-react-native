import * as React from 'react';
import * as Location from 'expo-location';
import { Alert, Linking, Platform } from 'react-native';
import { addressApi } from '@/api/order.api';
import type { ReverseGeocodeResult } from '@/types';

type LocationState = {
  coords: { lat: number; lng: number } | null;
  address: ReverseGeocodeResult | null;
  displayAddress: string | null;
  isLoading: boolean;
  permission: Location.PermissionStatus | null;
  error: string | null;
};

export function useLocation(opts?: { autoRequest?: boolean }) {
  const [state, setState] = React.useState<LocationState>({
    coords: null,
    address: null,
    displayAddress: null,
    isLoading: false,
    permission: null,
    error: null,
  });

  const requestPermission = React.useCallback(async (): Promise<boolean> => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setState((s) => ({ ...s, permission: status }));
      if (status !== 'granted') {
        setState((s) => ({ ...s, isLoading: false, error: 'Location permission denied' }));
        return false;
      }
      return true;
    } catch (e: any) {
      setState((s) => ({ ...s, isLoading: false, error: e?.message || 'Permission error' }));
      return false;
    }
  }, []);

  const ensurePermissionOrAlert = React.useCallback(async (): Promise<boolean> => {
    const granted = await requestPermission();
    if (!granted) {
      Alert.alert(
        'Location Permission Required',
        'Foody needs your location to detect your address and deliver accurately. Please enable location in Settings.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setState((s) => ({ ...s, isLoading: false })) },
          {
            text: 'Open Settings',
            onPress: () => {
              setState((s) => ({ ...s, isLoading: false }));
              if (Platform.OS === 'ios') Linking.openURL('app-settings:');
              else Location.requestForegroundPermissionsAsync();
            },
          },
        ]
      );
      return false;
    }
    return true;
  }, [requestPermission]);

  const reverseGeocodeExpo = React.useCallback(async (lat: number, lng: number): Promise<ReverseGeocodeResult | null> => {
    try {
      // Prefer backend proxy (more reliable, consistent formatting)
      try {
        const res = await addressApi.reverseGeocode(lat, lng);
        if (res?.data) return res.data as ReverseGeocodeResult;
      } catch {}

      // Fallback: expo-location reverseGeocodeAsync (offline-friendly)
      const results = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (results.length) {
        const r: any = results[0];
        const display = [r.name, r.street, r.district, r.city || r.subregion, r.region, r.postalCode, r.country]
          .filter(Boolean)
          .join(', ');
        return {
          displayName: display,
          formattedAddress: display,
          houseNumber: r.name || '',
          road: r.street || '',
          neighbourhood: r.district || r.subregion || '',
          city: r.city || r.subregion || '',
          state: r.region || '',
          postcode: r.postalCode || '',
          country: r.country || '',
          lat, lng,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const fetchCurrent = React.useCallback(async (): Promise<LocationState> => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    const ok = await ensurePermissionOrAlert();
    if (!ok) {
      const cur = { coords: null, address: null, displayAddress: null, isLoading: false, permission: state.permission, error: 'Permission denied' } as LocationState;
      return cur;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      const addr = await reverseGeocodeExpo(lat, lng);
      const display = addr?.formattedAddress || addr?.displayName || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      const next: LocationState = {
        coords: { lat, lng },
        address: addr,
        displayAddress: display,
        isLoading: false,
        permission: 'granted' as any,
        error: null,
      };
      setState(next);
      return next;
    } catch (e: any) {
      const msg = e?.message || 'Failed to get location';
      setState((s) => ({ ...s, isLoading: false, error: msg }));
      return { coords: null, address: null, displayAddress: null, isLoading: false, permission: 'granted' as any, error: msg };
    }
  }, [ensurePermissionOrAlert, reverseGeocodeExpo, state.permission]);

  const reverseGeocode = React.useCallback(
    async (lat: number, lng: number) => {
      setState((s) => ({ ...s, isLoading: true }));
      const addr = await reverseGeocodeExpo(lat, lng);
      const display = addr?.formattedAddress || `${lat}, ${lng}`;
      setState((s) => ({ ...s, address: addr, displayAddress: display, coords: { lat, lng }, isLoading: false }));
      return addr;
    },
    [reverseGeocodeExpo]
  );

  React.useEffect(() => {
    if (opts?.autoRequest) {
      // light permission check without prompting heavy alert
      Location.getForegroundPermissionsAsync().then(({ status }) => {
        setState((s) => ({ ...s, permission: status }));
      });
    }
  }, [opts?.autoRequest]);

  return {
    ...state,
    requestPermission,
    ensurePermissionOrAlert,
    fetchCurrent,
    reverseGeocode,
    reverseGeocodeExpo,
  };
}
