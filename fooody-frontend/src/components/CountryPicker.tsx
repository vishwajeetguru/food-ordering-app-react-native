import * as React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { COUNTRIES, Country } from '@/constants/countries';

export function CountryPicker({
  visible,
  selected,
  onSelect,
  onClose,
}: {
  visible: boolean;
  selected: Country;
  onSelect: (c: Country) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q.replace(/\D/g, '')) ||
        c.iso2.toLowerCase() === q
    );
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ padding: spacing.xl, gap: spacing.md }}>
          <Text style={{ ...typography.h2, color: colors.textPrimary }}>Select country</Text>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing.sm,
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              borderWidth: 1,
              borderColor: colors.borderLight,
              paddingHorizontal: spacing.md,
              height: 48,
            }}
          >
            <Text style={{ fontSize: 16, color: colors.textTertiary }}>⌕</Text>
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search country name or code"
              placeholderTextColor={colors.textTertiary}
              style={{ flex: 1, ...typography.body, color: colors.textPrimary, height: '100%' }}
              autoFocus
            />
          </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(c) => c.iso2}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = item.iso2 === selected.iso2;
            return (
              <Pressable
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing.md,
                  paddingHorizontal: spacing.xl,
                  paddingVertical: spacing.md,
                  backgroundColor: isSelected ? colors.primaryMuted : 'transparent',
                }}
              >
                <Text style={{ fontSize: 24 }}>{item.flag}</Text>
                <Text style={{ ...typography.body, color: colors.textPrimary, flex: 1 }}>{item.name}</Text>
                <Text style={{ ...typography.body, color: colors.textSecondary }}>+{item.dial}</Text>
                {isSelected ? <Text style={{ ...typography.label, color: colors.primary }}>✓</Text> : null}
              </Pressable>
            );
          }}
          ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: spacing.xl }} />}
        />

        <TouchableOpacity onPress={onClose} style={{ padding: spacing.lg, alignItems: 'center' }}>
          <Text style={{ ...typography.label, color: colors.primary }}>Cancel</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </Modal>
  );
}
