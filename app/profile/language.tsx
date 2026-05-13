import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { I18nManager } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { Card } from '@/components/ui/Card';
import { useI18n } from '@/lib/i18n';

type LangItem = {
  code: string;
  flag: string;
  native: string;   // Language name in the language itself
  label: string;    // Language name in English
  region: string;   // Market label
};

const LANGUAGES: LangItem[] = [
  // English first — default language
  { code: 'en',    flag: '🇺🇸', native: 'English (US)',  label: 'English (US)',       region: 'Global · Business' },
  { code: 'en-GB', flag: '🇬🇧', native: 'English (UK)',  label: 'English (UK)',       region: 'Great Britain' },
  // European
  { code: 'de',    flag: '🇩🇪', native: 'Deutsch',       label: 'German',             region: 'Deutschland · Österreich · Schweiz' },
  { code: 'fr',    flag: '🇫🇷', native: 'Français',      label: 'French',             region: 'France · Belgique · Suisse' },
  // Latin America
  { code: 'es',    flag: '🇲🇽', native: 'Español',       label: 'Spanish',            region: 'América Latina · USA' },
  { code: 'pt-BR', flag: '🇧🇷', native: 'Português',     label: 'Portuguese (Brazil)', region: 'Brasil' },
  // Asia & Middle East
  { code: 'zh',    flag: '🇨🇳', native: '中文',           label: 'Chinese (Simplified)', region: '中国大陆' },
  { code: 'ar',    flag: '🇸🇦', native: 'العربية',        label: 'Arabic',             region: 'الشرق الأوسط' },
  // Local
  { code: 'uk',    flag: '🇺🇦', native: 'Українська',    label: 'Ukrainian',          region: 'Україна' },
];

export default function LanguageScreen() {
  const router = useRouter();
  const { locale, setLocale, t } = useI18n();

  const RTL_LOCALES = ['ar'];
  const currentIsRTL = RTL_LOCALES.includes(locale);

  const handleSelect = (code: string) => {
    const nextIsRTL = RTL_LOCALES.includes(code);
    setLocale(code);
    // If switching between RTL/LTR or vice versa, show restart notice
    if (nextIsRTL !== currentIsRTL) {
      Alert.alert(
        nextIsRTL ? 'يتطلب إعادة تشغيل' : 'Restart Required',
        nextIsRTL
          ? 'ستُطبَّق اللغة العربية واتجاه النص عند إعادة تشغيل التطبيق.'
          : 'The layout direction change will take effect after restarting the app.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } else {
      // Small delay so the user sees the checkmark before going back
      setTimeout(() => router.back(), 180);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F0820', '#1E1B4B']} style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Ionicons name="language-outline" size={28} color="#A78BFA" />
          <Text style={styles.headerTitle}>{t.language.title}</Text>
          <Text style={styles.headerSubtitle}>{t.language.subtitle}</Text>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.infoCard}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>{t.language.infoText}</Text>
        </Card>

        {LANGUAGES.map((lang) => {
          const isActive = locale === lang.code;
          return (
            <TouchableOpacity
              key={lang.code}
              activeOpacity={0.7}
              onPress={() => handleSelect(lang.code)}
            >
              <Card style={[styles.langRow, isActive && styles.langRowActive]}>
                <Text style={styles.flag}>{lang.flag}</Text>
                <View style={styles.langInfo}>
                  <Text style={[styles.langNative, isActive && styles.langNativeActive]}>
                    {lang.native}
                  </Text>
                  <Text style={styles.langLabel}>{lang.label}</Text>
                  <Text style={styles.langRegion}>{lang.region}</Text>
                </View>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </Card>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: { padding: Spacing.xl, paddingTop: 60, paddingBottom: Spacing.lg },
  backBtn: {
    position: 'absolute', top: 56, left: Spacing.lg, zIndex: 1, padding: 8,
  },
  headerContent: { alignItems: 'center', gap: 6 },
  headerTitle: {
    color: Colors.text, fontSize: FontSize.xl, fontWeight: '800', marginTop: 4,
  },
  headerSubtitle: { color: 'rgba(167,139,250,0.75)', fontSize: FontSize.sm },
  content: { padding: Spacing.lg },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.lg,
    backgroundColor: 'rgba(139,92,246,0.08)', borderColor: 'rgba(139,92,246,0.25)',
  },
  infoText: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  langRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm,
  },
  langRowActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  flag: { fontSize: 30 },
  langInfo: { flex: 1 },
  langNative: {
    color: Colors.text, fontSize: FontSize.md, fontWeight: '700',
  },
  langNativeActive: { color: Colors.primaryLight },
  langLabel: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 1 },
  langRegion: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
});
