import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import { useResponsive } from '@/hooks/useResponsive';
import { useI18n } from '@/lib/i18n';
import { trackFeatureUsed, FEATURES } from '@/lib/analytics';

type TabKey = 'daily' | 'dailyMatrix' | 'spreads';

// Track history view on import
setTimeout(() => trackFeatureUsed(FEATURES.HISTORY, 'profile'), 0);

export default function HistoryScreen() {
  const { t, locale } = useI18n();

  const TABS = [
    { key: 'daily' as const, label: t.profileExtra.historyTabs[0], icon: 'sunny-outline' as const },
    { key: 'dailyMatrix' as const, label: locale === 'uk' ? 'Матриці дня' : 'Daily Matrices', icon: 'calendar-outline' as const },
    { key: 'spreads' as const, label: t.profileExtra.historyTabs[1], icon: 'layers-outline' as const },
  ];

  const WEEKDAYS_UK = t.profileExtra.weekdays;
  const [tab, setTab] = useState<TabKey>('daily');
  const { isDesktop, isTablet } = useResponsive();
  const wide = isDesktop || isTablet;

  const dailyCardHistory = useAppStore((s) => s.dailyCardHistory);
  const dailyMatrixHistory = useAppStore((s) => s.dailyMatrixHistory);
  const tarotSpreads = useAppStore((s) => s.tarotSpreads);
  const savedMatrices = useAppStore((s) => s.savedMatrices);
  const insets = useSafeAreaInsets();

  const todayStr = new Date().toISOString().split('T')[0];

  // ── Empty state ──
  const emptyState = (icon: any, text: string) => (
    <View style={styles.emptyWrap}>
      <Ionicons name={icon} size={48} color="rgba(139,92,246,0.3)" />
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );

  // ── Daily cards tab ──
  const dailyTab = dailyCardHistory.length === 0
    ? emptyState('sunny-outline', t.profileExtra.noCardsYet)
    : (
      <View style={[styles.listWrap, wide && styles.listWrapWide]}>
        {dailyCardHistory.map((entry) => {
          const d = new Date(entry.date + 'T00:00:00Z');
          const weekday = WEEKDAYS_UK[d.getDay()];
          const isToday = entry.date === todayStr;
          const dateLabel = isToday
            ? t.ui.todayLabel
            : d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short' });

          return (
            <View key={entry.date} style={[styles.historyRow, isToday && styles.historyRowToday]}>
              {/* Mini card art */}
              <LinearGradient colors={['#0D0526', '#1B0A55']} style={styles.miniCard}>
                <Text style={styles.miniMoon}>☽</Text>
                <Text style={styles.miniNum}>{entry.cardId}</Text>
              </LinearGradient>

              {/* Info */}
              <View style={styles.historyInfo}>
                <Text style={styles.historyName}>{entry.cardNameUk}</Text>
                <Text style={styles.historyDate}>
                  {weekday}, {dateLabel}
                </Text>
              </View>

              {/* Today badge */}
              {isToday && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayBadgeText}>{t.ui.todayLabel}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
    );

  // ── Daily Matrix tab ──
  const dailyMatrixTab = dailyMatrixHistory.length === 0
    ? emptyState('calendar-outline', locale === 'uk' ? 'Ще немає матриць дня' : 'No daily matrices yet')
    : (
      <View style={[styles.listWrap, wide && styles.listWrapWide]}>
        {dailyMatrixHistory.map((entry) => (
          <TouchableOpacity
            key={entry.date + entry.locale}
            style={styles.historyRow}
            activeOpacity={0.7}
            onPress={() => {
              // Show full analysis in alert (or navigate)
              Alert.alert(
                `${entry.energyName} (${entry.dailyEnergyId})`,
                entry.aiAnalysis || (locale === 'uk' ? 'Аналіз недоступний' : 'Analysis unavailable'),
              );
            }}
          >
            <View style={styles.spreadIconWrap}>
              <Ionicons name="calendar-outline" size={20} color={Colors.accent} />
            </View>
            <View style={styles.historyInfo}>
              <Text style={styles.historyName}>{entry.energyName}</Text>
              <Text style={styles.historyDate}>
                {new Date(entry.date + 'T00:00:00Z').toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}
              </Text>
              <Text style={styles.historyQuestion} numberOfLines={2}>
                {entry.aiAnalysis?.substring(0, 80) ?? ''}...
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    );

  // ── Spreads tab ──
  const spreadTypeNames: Record<string, { uk: string; en: string }> = {
    'classic': { uk: 'Класичний розклад', en: 'Classic Spread' },
    'three': { uk: 'Три карти', en: 'Three Cards' },
    'celtic_cross': { uk: 'Кельтський хрест', en: 'Celtic Cross' },
    'person': { uk: 'Розклад на людину', en: 'Person Reading' },
    'love': { uk: 'Розклад на кохання', en: 'Love Reading' },
    'career': { uk: 'Розклад на кар\'єру', en: 'Career Reading' },
    'period': { uk: 'Прогноз на період', en: 'Period Forecast' },
    'yesno': { uk: 'Так / Ні', en: 'Yes / No' },
    'chat_spread': { uk: 'Розклад з AI чату', en: 'AI Chat Spread' },
    'astro': { uk: 'Астро-розклад', en: 'Astro Spread' },
    'daily': { uk: 'Карта дня', en: 'Daily Card' },
  };
  const getSpreadName = (spread: any) => {
    if (spread.spreadName) return spread.spreadName;
    const names = spreadTypeNames[spread.type];
    return names ? (locale === 'uk' ? names.uk : names.en) : spread.type;
  };

  const spreadsTab = tarotSpreads.length === 0
    ? emptyState('layers-outline', locale === 'uk' ? 'Ще немає збережених розкладів' : 'No saved spreads yet')
    : (
      <View style={[styles.listWrap, wide && styles.listWrapWide]}>
        {tarotSpreads.map((spread) => {
          const d = new Date(spread.createdAt);
          return (
            <View key={spread.id} style={styles.historyRow}>
              <View style={styles.spreadIconWrap}>
                <Ionicons name="layers-outline" size={20} color={Colors.primaryLight} />
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyName}>{getSpreadName(spread)}</Text>
                <Text style={styles.historyDate} numberOfLines={1}>
                  {spread.cards.length} карт · {d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Text>
                {spread.question ? (
                  <Text style={styles.historyQuestion} numberOfLines={1}>{spread.question}</Text>
                ) : null}
              </View>
              {spread.aiInterpretation && (
                <View style={styles.aiBadge}>
                  <Ionicons name="sparkles" size={10} color={Colors.accent} />
                </View>
              )}
            </View>
          );
        })}
      </View>
    );

  // Matrices tab removed — the user has a single personal Destiny Matrix
  // (created during onboarding), so a history of saved matrices has no
  // meaning here. The savedMatrices store field is kept for compatibility
  // features that may still reference it.

  return (
    <View style={styles.root}>
      {/* Tab bar */}
      <View style={styles.tabBarWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabBar}
        >
          {TABS.map((tabItem) => {
            const active = tab === tabItem.key;
            return (
              <TouchableOpacity
                key={tabItem.key}
                style={[styles.tab, active && styles.tabActive]}
                onPress={() => setTab(tabItem.key)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={tabItem.icon}
                  size={15}
                  color={active ? Colors.accent : Colors.textMuted}
                />
                <Text style={[styles.tabText, active && styles.tabTextActive]}>
                  {tabItem.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {tab === 'daily' && dailyTab}
        {tab === 'dailyMatrix' && dailyMatrixTab}
        {tab === 'spreads' && spreadsTab}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: { flex: 1 },
  scrollContent: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
  },

  // ── Tab bar ──
  tabBarWrap: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(139,92,246,0.15)',
  },
  tabBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  tabActive: {
    backgroundColor: 'rgba(139,92,246,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.35)',
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.accent,
    fontWeight: '700',
  },

  // ── List ──
  listWrap: {
    gap: Spacing.sm,
  },
  listWrapWide: {
    maxWidth: 600,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: 'rgba(25,12,55,0.80)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.20)',
  },
  historyRowToday: {
    borderColor: 'rgba(139,92,246,0.50)',
  },

  // Mini card
  miniCard: {
    width: 38,
    height: 54,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,197,66,0.4)',
    gap: 1,
    flexShrink: 0,
  },
  miniMoon: { color: 'rgba(245,197,66,0.9)', fontSize: 14, lineHeight: 16 },
  miniNum: { color: 'rgba(245,197,66,0.75)', fontSize: 9, fontWeight: '900' },

  // Icons for spreads/matrices
  spreadIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.30)',
    flexShrink: 0,
  },
  matrixIconWrap: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(245,197,66,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(245,197,66,0.25)',
    flexShrink: 0,
  },

  // Info
  historyInfo: { flex: 1, gap: 2 },
  historyName: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '700' },
  historyDate: { color: Colors.textMuted, fontSize: FontSize.xs },
  historyQuestion: { color: 'rgba(255,255,255,0.4)', fontSize: FontSize.xs, marginTop: 1 },

  // Badges
  todayBadge: {
    backgroundColor: 'rgba(139,92,246,0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.40)',
  },
  todayBadgeText: { color: Colors.primaryLight, fontSize: 9, fontWeight: '700' },
  aiBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(245,197,66,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(245,197,66,0.25)',
  },

  // Empty
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
  },
});
