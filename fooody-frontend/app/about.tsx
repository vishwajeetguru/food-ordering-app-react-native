import * as React from 'react';
import { View, Text, ScrollView, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Image } from 'expo-image';
import { colors } from '@/theme/colors';
import { spacing, radius } from '@/theme/spacing';
import { typography } from '@/theme/typography';
import { shadows } from '@/theme/shadows';

export default function About(){
  const router = useRouter();
  const about = {
    name: 'Foody',
    version: '1.0.0',
    tagline: 'Good food. Delivered simply.',
    description: 'Foody is a single-kitchen, curated food delivery experience. We focus on freshness, 30-40 min delivery, and Zomato-style precise addressing with wishlist & in-app support.',
    features: ['Fresh ingredients daily','30-40 min average delivery','Precise address with live location','Wishlist & favourites','Push + in-app notifications','In-app support tickets','Admin control for orders & users'],
    contact: { email: 'hello@foody.app', phone: '+91 98765 43210', address: 'Food Street 12, Culinary City, India' },
    links: { privacy: 'https://foody.app/privacy', terms: 'https://foody.app/terms' }
  };
  return (
    <SafeAreaView style={{ flex:1, backgroundColor: colors.background }}>
      <View style={{ flexDirection:'row', alignItems:'center', gap: spacing.md, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, backgroundColor: colors.surface, borderBottomWidth:1, borderBottomColor: colors.borderLight }}>
        <Pressable onPress={()=>router.back()} style={{ width:40, height:40, borderRadius:20, backgroundColor: colors.surfaceMuted, alignItems:'center', justifyContent:'center' }}>
          <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <Text style={{ ...typography.h2, color: colors.textPrimary }}>About</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg, paddingBottom: 40 }}>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, padding: spacing.xl, alignItems:'center', gap: spacing.md, borderWidth:1, borderColor: colors.borderLight, ...shadows.sm as any }}>
          <Image source={require('../assets/icon.png')} style={{ width:72, height:72, borderRadius:16 }} contentFit="contain" />
          <Text style={{ ...typography.h1, color: colors.textPrimary }}>{about.name} <Text style={{ color: colors.primary }}>v{about.version}</Text></Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary, textAlign:'center' }}>{about.tagline}</Text>
          <View style={{ paddingHorizontal:12, paddingVertical:6, borderRadius:999, backgroundColor: colors.primaryMuted, borderWidth:1, borderColor: colors.primaryLight }}><Text style={{ ...typography.captionBold, color: colors.primary }}>Single kitchen • Curated</Text></View>
        </View>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm, borderWidth:1, borderColor: colors.borderLight }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }}>Our story</Text>
          <Text style={{ ...typography.bodySmall, color: colors.textSecondary, lineHeight:20 }}>{about.description}</Text>
        </View>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth:1, borderColor: colors.borderLight }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }}>Features</Text>
          {about.features.map(f=>(
            <View key={f} style={{ flexDirection:'row', gap: spacing.sm, alignItems:'center' }}>
              <View style={{ width:24, height:24, borderRadius:12, backgroundColor: colors.successLight, alignItems:'center', justifyContent:'center' }}><Ionicons name="checkmark" size={14} color={colors.success} /></View>
              <Text style={{ ...typography.bodySmall, color: colors.textPrimary, flex:1 }}>{f}</Text>
            </View>
          ))}
        </View>
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md, borderWidth:1, borderColor: colors.borderLight }}>
          <Text style={{ ...typography.h4, color: colors.textPrimary }}>Contact</Text>
          <Pressable onPress={()=>Linking.openURL(`mailto:${about.contact.email}`)} style={{ flexDirection:'row', gap: spacing.md, alignItems:'center' }}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} /><Text style={{ ...typography.bodySmall, color: colors.textPrimary }}>{about.contact.email}</Text>
          </Pressable>
          <Pressable onPress={()=>Linking.openURL(`tel:${about.contact.phone}`)} style={{ flexDirection:'row', gap: spacing.md, alignItems:'center' }}>
            <Ionicons name="call-outline" size={18} color={colors.primary} /><Text style={{ ...typography.bodySmall, color: colors.textPrimary }}>{about.contact.phone}</Text>
          </Pressable>
          <View style={{ flexDirection:'row', gap: spacing.md }}>
            <Ionicons name="location-outline" size={18} color={colors.primary} /><Text style={{ ...typography.bodySmall, color: colors.textSecondary, flex:1 }}>{about.contact.address}</Text>
          </View>
        </View>
        <View style={{ flexDirection:'row', gap: spacing.md }}>
          <Pressable onPress={()=>Linking.openURL(about.links.privacy)} style={{ flex:1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems:'center', borderWidth:1, borderColor: colors.borderLight }}><Text style={{ ...typography.label, color: colors.primary }}>Privacy</Text></Pressable>
          <Pressable onPress={()=>Linking.openURL(about.links.terms)} style={{ flex:1, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, alignItems:'center', borderWidth:1, borderColor: colors.borderLight }}><Text style={{ ...typography.label, color: colors.primary }}>Terms</Text></Pressable>
        </View>
        <Text style={{ ...typography.caption, color: colors.textTertiary, textAlign:'center' }}>© 2026 Foody. Made with ❤️ in India.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
