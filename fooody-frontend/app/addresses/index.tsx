import * as React from 'react';
import { View, Text, ScrollView, Pressable, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';
import { Button } from '@/components/ui/Button';
import { useAddresses, useDeleteAddress, useSetDefaultAddress } from '@/hooks/useCatalog';
import { useAddressStore } from '@/store/addressStore';
import { useLocation } from '@/hooks/useLocation';

function LabelIcon({ label }: { label: string }) {
  const icon = label === 'Home' ? 'home' : label === 'Work' ? 'briefcase' : 'location';
  const bg = label === 'Home' ? colors.primaryMuted : label === 'Work' ? colors.accentLight : colors.surfaceMuted;
  const col = label === 'Home' ? colors.primary : label === 'Work' ? colors.accentDark : colors.textSecondary;
  return (
    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.borderLight }}>
      <Ionicons name={icon as any} size={20} color={col} />
    </View>
  );
}

export default function AddressesScreen() {
  const router = useRouter();
  const addressesQ = useAddresses();
  const deleteM = useDeleteAddress();
  const setDefaultM = useSetDefaultAddress();
  const addressStore = useAddressStore();
  const loc = useLocation();

  React.useEffect(() => {
    if (addressesQ.data) addressStore.hydrateFromApi(addressesQ.data);
  }, [addressesQ.data]);

  const onDelete = (id: string, label: string) => {
    Alert.alert('Delete address', `Delete ${label} address?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteM.mutateAsync(id);
          } catch (e: any) {
            Alert.alert('Failed', e?.message || 'Could not delete');
          }
        },
      },
    ]);
  };

  const onSetDefault = async (id: string) => {
    try {
      await setDefaultM.mutateAsync(id);
    } catch (e: any) {
      Alert.alert('Failed', e?.message || 'Could not set default');
    }
  };

  const onUseCurrent = async () => {
    const res = await loc.fetchCurrent();
    if (res.coords && res.displayAddress) {
      router.push({
        pathname: '/addresses/add',
        params: {
          lat: String(res.coords.lat),
          lng: String(res.coords.lng),
          autoAddress: res.displayAddress || '',
          city: res.address?.city || '',
          pincode: res.address?.postcode || '',
          state: res.address?.state || '',
          area: res.address?.road || res.address?.neighbourhood || '',
        },
      } as any);
    } else if (loc.error) {
      // already alerted via hook; stay
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ paddingHorizontal: spacing.xl, paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.borderLight }}>
        <Pressable onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ ...typography.h2, color: colors.textPrimary }}>Your addresses</Text>
          <Text style={{ ...typography.caption, color: colors.textSecondary }}>{addressesQ.data?.length ? `${addressesQ.data.length} saved` : 'Save Home, Work & more'} • Zomato style</Text>
        </View>
        <Pressable onPress={onUseCurrent} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primaryLight }}>
          <Ionicons name="locate" size={16} color={colors.primary} />
          <Text style={{ ...typography.captionBold, color: colors.primary }}>Use current</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: spacing.xl, gap: spacing.md, paddingBottom: 120 }}
        refreshControl={<RefreshControl refreshing={addressesQ.isFetching} onRefresh={() => addressesQ.refetch()} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {addressesQ.isPending ? (
          <View style={{ padding: 40, alignItems: 'center' }}><ActivityIndicator color={colors.primary} /><Text style={{ ...typography.caption, color: colors.textSecondary, marginTop: 12 }}>Loading addresses…</Text></View>
        ) : addressesQ.isError ? (
          <View style={{ backgroundColor: colors.errorLight, borderRadius: radius.lg, padding: spacing.lg, borderWidth: 1, borderColor: colors.error, gap: spacing.sm }}>
            <Text style={{ ...typography.label, color: colors.error }}>Failed to load addresses</Text>
            <Text style={{ ...typography.caption, color: colors.textSecondary }}>{(addressesQ.error as any)?.message || 'Check your connection'}</Text>
            <Pressable onPress={() => addressesQ.refetch()} style={{ alignSelf: 'flex-start', marginTop: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
              <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>Retry</Text>
            </Pressable>
          </View>
        ) : !addressesQ.data?.length ? (
          <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md, borderWidth: 1, borderColor: colors.borderLight, ...shadows.sm as any }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryMuted, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="location-outline" size={32} color={colors.primary} />
            </View>
            <Text style={{ ...typography.h3, color: colors.textPrimary, textAlign: 'center' }}>No saved addresses</Text>
            <Text style={{ ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', maxWidth: 280 }}>
              Add your Home, Work or any other address. We’ll ask for location permission once to autofill — just like Zomato.
            </Text>
            <Button title={loc.isLoading ? 'Detecting…' : 'Use my current location'} onPress={onUseCurrent} loading={loc.isLoading} style={{ marginTop: spacing.sm, width: '100%' }} />
            <Pressable onPress={() => router.push('/addresses/add')} style={{ paddingVertical: spacing.sm }}>
              <Text style={{ ...typography.label, color: colors.primary }}>Add address manually →</Text>
            </Pressable>
            {loc.error ? <Text style={{ ...typography.caption, color: colors.error }}>{loc.error}</Text> : null}
          </View>
        ) : (
          <>
            {addressesQ.data.map((a) => (
              <View key={a.id} style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, borderWidth: a.isDefault ? 1.5 : 1, borderColor: a.isDefault ? colors.primary : colors.borderLight, gap: spacing.sm, ...shadows.xs as any }}>
                <View style={{ flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' }}>
                  <LabelIcon label={a.label} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
                      <Text style={{ ...typography.label, color: colors.textPrimary }}>{a.label === 'Other' && a.customLabel ? a.customLabel : a.label}</Text>
                      {a.isDefault ? (
                        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: colors.primary, }}>
                          <Text style={{ ...typography.captionBold, color: colors.textInverse, fontSize: 10 }}>DEFAULT</Text>
                        </View>
                      ) : null}
                      {a.pincode ? <Text style={{ ...typography.caption, color: colors.textTertiary }}>• {a.pincode}</Text> : null}
                    </View>
                    <Text style={{ ...typography.bodySmall, color: colors.textPrimary, lineHeight: 20 }}>
                      {[a.houseFlat, a.area, a.landmark, a.city, a.state].filter(Boolean).join(', ') || a.fullAddress || a.address}
                    </Text>
                    {a.details ? <Text style={{ ...typography.caption, color: colors.textSecondary }}>{a.details}</Text> : null}
                    {(a.lat && a.lng) ? <Text style={{ ...typography.caption, color: colors.textTertiary }}><Ionicons name="navigate" size={10} /> {a.lat.toFixed(5)}, {a.lng.toFixed(5)}</Text> : null}
                  </View>
                </View>

                <View style={{ height: 1, backgroundColor: colors.divider, marginVertical: spacing.sm }} />

                <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
                  {!a.isDefault ? (
                    <Pressable onPress={() => onSetDefault(a.id)} disabled={setDefaultM.isPending} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.primaryMuted, borderWidth: 1, borderColor: colors.primaryLight }}>
                      <Text style={{ ...typography.captionBold, color: colors.primary }}>{setDefaultM.isPending ? '…' : 'Set as default'}</Text>
                    </Pressable>
                  ) : null}
                  <Pressable onPress={() => router.push({ pathname: '/addresses/add', params: { id: a.id } } as any)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ ...typography.captionBold, color: colors.textPrimary }}>Edit</Text>
                  </Pressable>
                  <Pressable onPress={() => onDelete(a.id, a.label)} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.errorLight }}>
                    <Text style={{ ...typography.captionBold, color: colors.error }}>Delete</Text>
                  </Pressable>
                  <View style={{ flex: 1 }} />
                  <Pressable onPress={() => { addressStore.setSelectedId(a.id); Alert.alert('Selected', `${a.label} set as delivery address for next order`); }} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: colors.borderLight }}>
                    <Text style={{ ...typography.captionBold, color: colors.textSecondary }}>↗ Deliver here</Text>
                  </Pressable>
                </View>
              </View>
            ))}

            <View style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: colors.borderLight, borderStyle: 'dashed' as any }}>
              <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
              <Text style={{ ...typography.caption, color: colors.textSecondary, flex: 1 }}>Tap “Use current” to grant location and autofill your address instantly. You can still edit before saving.</Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Bottom CTA */}
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.borderLight, ...shadows.sm as any }}>
        <Button title="+ Add new address" onPress={() => router.push('/addresses/add')} />
        <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign: 'center', marginTop: spacing.sm }}>We only ask for location when you add or change address.</Text>
      </View>
    </SafeAreaView>
  );
}
