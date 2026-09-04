import * as React from 'react';
import { View, Text, FlatList, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { useDebouncedValue } from '@/hooks/useDebouncedSearch';
import { useProducts, useCategories } from '@/hooks/useCatalog';
import { SearchBar } from '@/components/SearchBar';

export default function Search() {
  const router = useRouter();
  const [query, setQuery] = React.useState('');
  const debounced = useDebouncedValue(query, 300);
  const [recent, setRecent] = React.useState<string[]>(['pizza', 'biryani']);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

  const { data: categories } = useCategories();
  const hasQuery = debounced.trim().length > 0;
  const hasFilter = !!selectedCategory || hasQuery;
  const { data: results, isPending } = useProducts(
    hasFilter ? { search: debounced.trim() || undefined, categoryId: selectedCategory || undefined } : undefined,
  );
  const list = hasFilter ? (results ?? []) : [];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <Animated.View entering={FadeInDown.duration(350)} style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.sm, gap: spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
          <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </Pressable>
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search for dishes" autoFocus onClear={() => setQuery('')} />
        </View>
        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          <Pressable
            onPress={() => setSelectedCategory(null)}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: !selectedCategory ? colors.primary : colors.surface, borderWidth: 1, borderColor: !selectedCategory ? colors.primary : colors.border }}
          >
            <Text style={{ ...typography.label, color: !selectedCategory ? colors.textInverse : colors.textPrimary }}>All</Text>
          </Pressable>
          {(categories ?? []).map((c) => {
            const active = selectedCategory === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => setSelectedCategory(active ? null : c.id)}
                style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999, backgroundColor: active ? colors.primary : colors.surface, borderWidth: 1, borderColor: active ? colors.primary : colors.border }}
              >
                <Text style={{ ...typography.label, color: active ? colors.textInverse : colors.textPrimary }}>{c.name}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </Animated.View>

      {!hasFilter ? (
        <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }}>
          {recent.length ? (
            <Animated.View entering={FadeInUp.delay(100).duration(400)} style={{ gap: spacing.md }}>
              <Text style={{ ...typography.h4, color: colors.textPrimary }}>Recent searches</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {recent.map((r) => (
                  <Pressable key={r} onPress={() => setQuery(r)} style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }}>
                    <Text style={{ ...typography.bodySmall, color: colors.textPrimary }}>🕒 {r}</Text>
                  </Pressable>
                ))}
              </View>
            </Animated.View>
          ) : null}

          <Animated.View entering={FadeInUp.delay(180).duration(400)} style={{ gap: spacing.md }}>
            <Text style={{ ...typography.h4, color: colors.textPrimary }}>Categories</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {(categories ?? []).map((c) => (
                <Pressable key={c.id} onPress={() => { setQuery(c.name); setRecent((prev) => [c.name, ...prev.filter((x) => x !== c.name)].slice(0, 5)); }} style={{ width: '48%', flexDirection: 'row', gap: spacing.md, alignItems: 'center', backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight }}>
                  <Image source={{ uri: c.image }} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.shimmer }} />
                  <Text style={{ ...typography.label, color: colors.textPrimary }}>{c.name}</Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      ) : isPending ? (
        <View style={{ flex:1, alignItems:'center', justifyContent:'center', padding: spacing.xl }}>
          <Text style={{ ...typography.bodySmall, color: colors.textTertiary }}>Searching...</Text>
        </View>
      ) : list.length === 0 ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl }}>
          <Text style={{ fontSize: 48 }}>🔍</Text>
          <Text style={{ ...typography.h3, color: colors.textPrimary }}>No results for "{debounced}"</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' }}>Try different keywords or browse categories</Text>
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.xl, gap: spacing.md }}
          renderItem={({ item }) => (
            <Pressable onPress={() => {
              setRecent((prev) => [item.name, ...prev.filter((x) => x !== item.name)].slice(0, 5));
              router.push(`/product/${item.id}`);
            }} style={{ flexDirection: 'row', gap: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.borderLight }}>
              <Image source={{ uri: item.image }} style={{ width: 72, height: 72, borderRadius: radius.md, backgroundColor: colors.shimmer }} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ ...typography.label, color: colors.textPrimary }}>{item.name}</Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary }} numberOfLines={1}>{item.description}</Text>
                <Text style={{ ...typography.priceSmall, color: colors.textPrimary }}>₹{item.price}</Text>
              </View>
            </Pressable>
          )}
        />
      )}
    </SafeAreaView>
  );
}
