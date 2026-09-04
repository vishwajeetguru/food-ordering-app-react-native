import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, ActivityIndicator, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAddresses, useCreateAddress, useUpdateAddress } from '@/hooks/useCatalog';
import { useLocation } from '@/hooks/useLocation';
import type { Address } from '@/types';

const LABELS: Address['label'][] = ['Home', 'Work', 'Other'];

export default function AddAddressScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; lat?: string; lng?: string; autoAddress?: string; city?: string; pincode?: string; state?: string; area?: string }>();
  const id = params.id;
  const isEdit = !!id;

  const addressesQ = useAddresses();
  const existing: Address | undefined = isEdit ? addressesQ.data?.find((a) => a.id === id) : undefined;

  const createM = useCreateAddress();
  const updateM = useUpdateAddress();
  const loc = useLocation();

  // Form state
  const [label, setLabel] = React.useState<Address['label']>('Home');
  const [customLabel, setCustomLabel] = React.useState('');
  const [houseFlat, setHouseFlat] = React.useState('');
  const [area, setArea] = React.useState('');
  const [landmark, setLandmark] = React.useState('');
  const [city, setCity] = React.useState('');
  const [stateName, setStateName] = React.useState('');
  const [pincode, setPincode] = React.useState('');
  const [details, setDetails] = React.useState('');
  const [receiverName, setReceiverName] = React.useState('');
  const [receiverPhone, setReceiverPhone] = React.useState('');
  const [isDefault, setIsDefault] = React.useState(false);
  const [coords, setCoords] = React.useState<{ lat: number; lng: number } | null>(null);
  const [formatted, setFormatted] = React.useState<string>('');

  // Autofill from params when navigated via "Use current location"
  React.useEffect(() => {
    if (!isEdit && params.lat && params.lng) {
      const lat = parseFloat(params.lat as string);
      const lng = parseFloat(params.lng as string);
      if (!isNaN(lat) && !isNaN(lng)) setCoords({ lat, lng });
      if (params.autoAddress) setFormatted(params.autoAddress as string);
      if (params.area) setArea(params.area as string);
      if (params.city) setCity(params.city as string);
      if (params.pincode) setPincode(params.pincode as string);
      if (params.state) setStateName(params.state as string);
    }
  }, [params.lat, params.lng]);

  // Hydrate for edit
  React.useEffect(() => {
    if (existing) {
      setLabel(existing.label);
      setCustomLabel(existing.customLabel || '');
      setHouseFlat(existing.houseFlat || '');
      setArea(existing.area || '');
      setLandmark(existing.landmark || '');
      setCity(existing.city || '');
      setStateName(existing.state || '');
      setPincode(existing.pincode || '');
      setDetails(existing.details || '');
      setReceiverName(existing.receiverName || '');
      setReceiverPhone(existing.receiverPhone || '');
      setIsDefault(!!existing.isDefault);
      if (existing.lat && existing.lng) setCoords({ lat: existing.lat, lng: existing.lng });
      setFormatted(existing.fullAddress || existing.address || '');
    }
  }, [existing?.id]);

  const pending = createM.isPending || updateM.isPending;

  const onUseCurrentLocation = async () => {
    const res = await loc.fetchCurrent();
    if (res.coords) {
      setCoords(res.coords);
      const addr = res.address;
      if (addr) {
        setFormatted(addr.formattedAddress || addr.displayName || '');
        if (addr.road || addr.neighbourhood) setArea(addr.road || addr.neighbourhood);
        if (addr.city) setCity(addr.city);
        if (addr.state) setStateName(addr.state);
        if (addr.postcode) setPincode(addr.postcode);
      } else if (res.displayAddress) {
        setFormatted(res.displayAddress);
      }
    }
  };

  const validateAndBuild = (): { ok: boolean; payload?: any; msg?: string } => {
    const trimmedHouse = houseFlat.trim();
    const trimmedArea = area.trim();
    const trimmedCity = city.trim();
    // Build full address like Zomato: house + area + city + state + pincode
    const parts = [trimmedHouse, trimmedArea, landmark.trim(), trimmedCity, stateName.trim(), pincode.trim()].filter(Boolean);
    const fullAddress = parts.join(', ') || formatted.trim();
    const mainAddress = fullAddress || (area.trim() ? area.trim() : '');

    if (!mainAddress || mainAddress.length < 5) {
      return { ok: false, msg: 'Please enter house/flat and area (minimum 5 characters). Use current location to autofill.' };
    }
    if (label === 'Other' && customLabel.trim() && customLabel.trim().length < 2) {
      return { ok: false, msg: 'Custom label must be at least 2 characters' };
    }
    if (pincode && !/^[0-9]{4,10}$/.test(pincode.trim())) {
      return { ok: false, msg: 'Enter a valid pincode (4-10 digits)' };
    }
    if (receiverPhone && !/^[0-9+\- ]{7,20}$/.test(receiverPhone.trim())) {
      return { ok: false, msg: 'Enter a valid phone for receiver' };
    }
    return {
      ok: true,
      payload: {
        label,
        customLabel: label === 'Other' ? (customLabel.trim() || undefined) : undefined,
        address: mainAddress.slice(0, 500),
        fullAddress: fullAddress.slice(0, 500),
        houseFlat: trimmedHouse || undefined,
        area: trimmedArea || undefined,
        landmark: landmark.trim() || undefined,
        city: trimmedCity || undefined,
        state: stateName.trim() || undefined,
        pincode: pincode.trim() || undefined,
        details: details.trim() || undefined,
        receiverName: receiverName.trim() || undefined,
        receiverPhone: receiverPhone.trim() || undefined,
        lat: coords?.lat,
        lng: coords?.lng,
        isDefault,
      },
    };
  };

  const onSave = async () => {
    const v = validateAndBuild();
    if (!v.ok) {
      Alert.alert('Check address', v.msg || 'Invalid');
      return;
    }
    try {
      if (isEdit) {
        await updateM.mutateAsync({ id: id as string, data: v.payload });
        Alert.alert('Updated', 'Address updated successfully');
      } else {
        await createM.mutateAsync(v.payload);
        Alert.alert('Saved', 'Address saved — set as default and ready for delivery');
      }
      router.back();
    } catch (e: any) {
      const msg = e?.message || e?.data?.message || 'Failed to save. Check address and try again.';
      const details = e?.details ? JSON.stringify(e.details) : '';
      Alert.alert('Save failed', details ? `${msg}\n${details}` : msg);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.h2, color: colors.textPrimary }}>{isEdit ? 'Edit address' : 'Add address'}</Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>{isEdit ? 'Update your saved address' : 'Save like Zomato — Home, Work or Other'}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: 140 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Location permission card */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight, gap: spacing.md, ...shadows.xs as any }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <Ionicons name="locate" size={18} color={colors.primary} />
            <Text style={{ ...typography.h4, color: colors.textPrimary }}>Detect my location</Text>
            <View style={{ flex: 1 }} />
            {loc.isLoading ? <ActivityIndicator size="small" color={colors.primary} /> : null}
          </View>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>
            We’ll ask for location permission only now — to fill your exact building, street & pincode. You can still edit everything before saving.
          </Text>

          {coords ? (
            <View style={{ backgroundColor: colors.primaryMuted, borderRadius: radius.md, padding: spacing.md, gap: 4, borderWidth: 1, borderColor: colors.primaryLight }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="navigate-circle" size={16} color={colors.primary} />
                <Text style={{ ...typography.captionBold, color: colors.primary }}>{coords.lat.toFixed(5)}, {coords.lng.toFixed(5)} • {city || '—'}</Text>
              </View>
              <Text style={{ ...typography.bodySmall, color: colors.textPrimary }}>{formatted || 'Address detected'}</Text>
              <Text style={{ ...typography.caption, color: colors.textSecondary }}>We’ll save these coordinates so the delivery partner finds you precisely.</Text>
            </View>
          ) : (
            <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight, borderStyle: 'dashed' as any }}>
              <Text style={{ ...typography.caption, color: colors.textSecondary, textAlign: 'center' }}>No coordinates yet — tap “Use current location” or fill manually.</Text>
            </View>
          )}

          <Button
            title={loc.isLoading ? 'Fetching location…' : coords ? 'Re-detect location' : 'Use current location'}
            onPress={onUseCurrentLocation}
            loading={loc.isLoading}
            variant={coords ? 'outline' : 'primary'}
          />
          {loc.error ? <Text style={{ ...typography.caption, color: colors.error }}>{loc.error}</Text> : null}
        </View>

        {/* Label selector — Zomato pills */}
        <View style={{ gap: spacing.sm }}>
          <Text style={{ ...typography.label, color: colors.textPrimary }}>Save as</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {LABELS.map((l) => {
              const active = label === l;
              return (
                <Pressable
                  key={l}
                  onPress={() => setLabel(l)}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 12,
                    borderRadius: 999,
                    backgroundColor: active ? colors.primary : colors.surface,
                    borderWidth: 1.5,
                    borderColor: active ? colors.primary : colors.border,
                  }}
                >
                  <Ionicons name={l === 'Home' ? 'home' : l === 'Work' ? 'briefcase' : 'location-outline'} size={16} color={active ? colors.textInverse : colors.textSecondary} />
                  <Text style={{ ...typography.label, color: active ? colors.textInverse : colors.textSecondary }}>{l}</Text>
                </Pressable>
              );
            })}
          </View>
          {label === 'Other' ? (
            <Input placeholder="Custom label e.g. Mom’s, Gym, Friend" value={customLabel} onChangeText={setCustomLabel} maxLength={30} />
          ) : null}
        </View>

        {/* Address fields */}
        <View style={{ gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }}>Complete address</Text>
          <Input label="House / Flat / Building *" placeholder="E.g. B-402, Green Heights" value={houseFlat} onChangeText={setHouseFlat} autoCapitalize="words" />
          <Input label="Area / Street / Sector *" placeholder="E.g. MG Road, Sector 18" value={area} onChangeText={setArea} autoCapitalize="words" />
          <Input label="Landmark (optional)" placeholder="E.g. Near City Mall" value={landmark} onChangeText={setLandmark} />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}><Input label="City" placeholder="City" value={city} onChangeText={setCity} /></View>
            <View style={{ flex: 1 }}><Input label="State" placeholder="State" value={stateName} onChangeText={setStateName} /></View>
          </View>
          <Input label="Pincode" placeholder="6-digit pincode" value={pincode} onChangeText={setPincode} keyboardType="number-pad" maxLength={6} />
          <Input label="Complete house details (optional)" placeholder="E.g. 2nd floor, door code" value={details} onChangeText={setDetails} multiline />
          {formatted ? (
            <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight }}>
              <Text style={{ ...typography.captionBold, color: colors.textSecondary }}>Detected full address</Text>
              <Text style={{ ...typography.caption, color: colors.textPrimary, marginTop: 4 }}>{formatted}</Text>
            </View>
          ) : null}
        </View>

        <View style={{ gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.borderLight }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }}>Receiver (optional)</Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>Add who should receive the order — helps delivery partner.</Text>
          <Input label="Receiver name" placeholder="E.g. Vishwa" value={receiverName} onChangeText={setReceiverName} />
          <Input label="Receiver phone" placeholder="Phone" value={receiverPhone} onChangeText={setReceiverPhone} keyboardType="phone-pad" />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: isDefault ? colors.primaryLight : colors.borderLight, gap: spacing.md }}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={{ ...typography.label, color: colors.textPrimary }}>Set as default</Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>Deliver all orders here unless you choose another address.</Text>
          </View>
          <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ true: colors.primary, false: colors.border }} thumbColor={colors.surface} />
        </View>

        <View style={{ backgroundColor: colors.accentLight, borderRadius: radius.md, padding: spacing.md, flexDirection: 'row', gap: spacing.sm, borderWidth: 1, borderColor: colors.accent }}>
          <Ionicons name="shield-checkmark-outline" size={18} color={colors.accentDark} />
          <Text style={{ ...typography.caption, color: colors.accentDark, flex: 1 }}>Your location stays on your phone until you save. We never track without permission — Zomato-style.</Text>
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight }}>
        <Button title={pending ? 'Saving…' : isEdit ? 'Update address' : 'Save address'} onPress={onSave} loading={pending} disabled={pending} />
        <Pressable onPress={() => router.back()} style={{ paddingVertical: spacing.sm, alignItems: 'center', marginTop: spacing.sm }}>
          <Text style={{ ...typography.label, color: colors.textSecondary }}>Cancel</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
