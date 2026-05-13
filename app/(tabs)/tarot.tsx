import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { useAppStore } from '../../stores/useAppStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 2 - Spacing.sm) / 2;

// ── Classic spreads (list rows with card count) ───────────────────────────────
const CLASSIC_SPREADS = [
  {
    name: 'Три карти',
    description: 'Минуле · Сьогодення · Майбутнє',
    cards: 3,
    icon: 'layers-outline' as const,
    color: '#4338CA',
    params: { type: 'three', cards: 3 },
  },
  {
    name: 'Хрест',
    description: 'Ситуація та шлях вперед',
    cards: 5,
    icon: 'add-circle-outline' as const,
    color: '#047857',
    params: { type: 'cross', cards: 5 },
  },
  {
    name: 'Кельтський хрест',
    description: 'Найповніший аналіз ситуації',
    cards: 10,
    badge: 'ДЕТАЛЬНИЙ' as const,
    icon: 'apps-outline' as const,
    color: '#B45309',
    params: { type: 'celtic', cards: 10 },
  },
  {
    name: 'Відносини',
    description: 'Двоє і зв\'язок між ними',
    cards: 6,
    icon: 'heart-outline' as const,
    color: '#BE185D',
    params: { type: 'relationship', cards: 6 },
  },
];

// ── Special AI spreads (2-column grid) ───────────────────────────────────────
const SPECIAL_SPREADS: {
  name: string; description: string;
  icon: keyof typeof import('@expo/vector-icons').Ionicons.glyphMap;
  badge: string | null; free?: boolean; route: string; gradient: [string, string]; params?: object;
}[] = [
  {
    name: 'Так чи ні?',
    description: 'Чітка відповідь від карт',
    icon: 'help-circle-outline',
    badge: 'БЕЗКОШТОВНО',
    free: true,
    route: '/tarot/yesno',
    gradient: ['#1E1B4B', '#4338CA'],
  },
  {
    name: 'На людину',
    description: 'Енергія та почуття людини',
    icon: 'person-outline',
    badge: null,
    route: '/tarot/person',
    gradient: ['#1A1040', '#5B21B6'],
  },
  {
    name: 'Кохання',
    description: 'Почуття, стосунки та перспективи',
    icon: 'heart-outline',
    badge: 'ПОПУЛЯРНЕ',
    route: '/tarot/spread',
    gradient: ['#831843', '#BE185D'],
    params: { type: 'love', name: 'Кохання' },
  },
  {
    name: 'Прогноз',
    description: 'Тиждень, місяць, рік',
    icon: 'trending-up-outline',
    badge: null,
    route: '/tarot/period',
    gradient: ['#064E3B', '#059669'],
  },
];

// ── Encyclopedia (Довідник) ───────────────────────────────────────────────────
const ENCYCLOPEDIA = [
  { icon: 'layers-outline' as const,  title: 'Карти таро',     count: 78, route: '/learn/tarot' },
  { icon: 'flower-outline' as const,  title: 'Чакри',          count: 7,  route: '/learn/chakras' },
  { icon: 'planet-outline' as const,  title: 'Планети',        count: 10, route: '/learn/planets' },
  { icon: 'partly-sunny-outline' as const, title: 'Знаки Зодіаку', count: 12, route: '/learn/signs' },
];

export default function TarotScreen() {
  const router = useRouter();
  const tarotSpreads = useAppStore((s) => s.tarotSpreads);
  const isPremium = useAppStore((s) => s.isPremium);

  const navigateSpread = (pathname: string, params?: object, isFree = false) => {
    if (!isFree && !isPremium) {
      router.push('/paywall');
      return;
    }
    router.push({ pathname: pathname as any, params });
  };

  return (
    <View style={styles.root}>
      <AnimatedBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Classic Spreads ── */}
        <Text style={styles.sectionTitle}>Класичні розклади</Text>
        <View style={styles.classicList}>
          {CLASSIC_SPREADS.map((spread) => {
            const locked = !isPremium;
            return (
              <TouchableOpacity
                key={spread.name}
                activeOpacity={0.7}
                onPress={() => navigateSpread('/tarot/spread', { ...spread.params, name: spread.name }, false)}
              >
                <Card style={[styles.classicRow, locked && styles.lockedRow]}>
                  <View style={[styles.classicIconBox, { backgroundColor: spread.color + '22' }]}>
                    <Ionicons name={spread.icon} size={22} color={locked ? Colors.textMuted : spread.color} />
                  </View>
                  <View style={styles.classicInfo}>
                    <View style={styles.classicNameRow}>
                      <Text style={[styles.classicName, locked && { color: Colors.textMuted }]} numberOfLines={1}>{spread.name}</Text>
                    </View>
                    {spread.badge && (
                      <View style={[styles.badge, { alignSelf: 'flex-start', marginBottom: 3 }]}>
                        <Text style={styles.badgeText}>{spread.badge}</Text>
                      </View>
                    )}
                    <Text style={styles.classicDesc} numberOfLines={2}>{spread.description}</Text>
                  </View>
                  <View style={styles.classicRight}>
                    {locked ? (
                      <Ionicons name="lock-closed" size={18} color={Colors.textMuted} />
                    ) : (
                      <>
                        <Text style={styles.classicCount}>{spread.cards}</Text>
                        <Text style={styles.classicCountLabel}>карт</Text>
                        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} style={{ marginTop: 4 }} />
                      </>
                    )}
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Special AI Spreads ── */}
        <View style={styles.specialHeader}>
          <Text style={styles.sectionTitle}>Спеціальні розклади</Text>
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={12} color={Colors.accent} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.specialGrid}>
          {SPECIAL_SPREADS.map((spread) => {
            const locked = !spread.free && !isPremium;
            return (
              <TouchableOpacity
                key={spread.name}
                style={styles.specialItem}
                activeOpacity={0.7}
                onPress={() => navigateSpread(spread.route, (spread as any).params, spread.free)}
              >
                <LinearGradient
                  colors={spread.gradient}
                  style={styles.specialGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Badge / lock row */}
                  <View style={styles.spreadBadgeRow}>
                    {locked ? (
                      <View style={styles.spreadLock}>
                        <Ionicons name="lock-closed" size={11} color="rgba(255,255,255,0.7)" />
                      </View>
                    ) : spread.badge ? (
                      <View style={[styles.spreadBadge, spread.free && styles.spreadBadgeFree]}>
                        <Text style={styles.spreadBadgeText}>{spread.badge}</Text>
                      </View>
                    ) : null}
                  </View>
                  <View style={styles.specialEmojiWrap}>
                    <Ionicons name={spread.icon} size={34} color={locked ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.9)'} />
                  </View>
                  <Text style={[styles.specialName, locked && { color: 'rgba(255,255,255,0.5)' }]}>{spread.name}</Text>
                  <Text style={styles.specialDesc} numberOfLines={2}>{spread.description}</Text>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Learn banner ── */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/learn/tarot')}>
          <LinearGradient
            colors={['#1E1B4B', '#312E81']}
            style={styles.learnBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.learnEmoji}>📖</Text>
            <View style={styles.learnInfo}>
              <Text style={styles.learnTitle}>Вивчити значення карт</Text>
              <Text style={styles.learnSubtitle}>Інтерактивні вікторини · Заробляй XP</Text>
            </View>
            <View style={styles.learnArrow}>
              <Ionicons name="arrow-forward" size={20} color={Colors.accent} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* ── Encyclopedia ── */}
        <Text style={styles.sectionTitle}>Довідник</Text>
        <View style={styles.encyclopediaGrid}>
          {ENCYCLOPEDIA.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={styles.encyclopediaItem}
              activeOpacity={0.7}
              onPress={() => router.push(item.route as any)}
            >
              <Card style={styles.encyclopediaCard}>
                <Ionicons name={item.icon} size={26} color={Colors.primary} />
                <Text style={styles.encyclopediaTitle}>{item.title}</Text>
                <Text style={styles.encyclopediaCount}>{item.count} записів</Text>
              </Card>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── History ── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/tarot/history')}
        >
          <Card style={styles.historyCard}>
            <Ionicons name="time-outline" size={24} color={Colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.historyText}>Історія розкладів</Text>
              {tarotSpreads.length > 0 && (
                <Text style={styles.historyCount}>{tarotSpreads.length} розкладів</Text>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </Card>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingTop: 56, paddingBottom: 120 },

  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },

  // Classic spreads
  classicList: { gap: Spacing.sm, marginBottom: Spacing.sm },
  classicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  classicIconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classicInfo: { flex: 1 },
  classicNameRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 3 },
  classicName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  classicDesc: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  classicRight: { alignItems: 'center' },
  lockedRow: { opacity: 0.65 },
  classicCount: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '800',
    lineHeight: 22,
  },
  classicCountLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  badge: {
    backgroundColor: Colors.accentMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  badgeText: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  // Special spreads
  specialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accent,
    marginTop: Spacing.md,
  },
  aiBadgeText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '800',
  },
  specialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  specialItem: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  specialGradient: {
    padding: Spacing.md,
    height: 170,
    flexDirection: 'column',
  },
  spreadBadgeRow: {
    height: 24,
    justifyContent: 'center',
    marginBottom: 4,
  },
  spreadLock: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  spreadBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  spreadBadgeFree: {
    borderColor: '#34D399',
    backgroundColor: 'rgba(5,150,105,0.35)',
  },
  spreadBadgeText: {
    color: Colors.accent,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  specialEmojiWrap: {
    flex: 1,
    justifyContent: 'center',
  },
  specialIcon: { opacity: 0.9 },
  specialName: { color: '#FFFFFF', fontSize: FontSize.md, fontWeight: '700', marginTop: 4 },
  specialDesc: { color: 'rgba(255,255,255,0.65)', fontSize: FontSize.xs, lineHeight: 15, marginTop: 2 },

  // Finance (full width)
  financeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  financeIcon: { opacity: 0.9 },
  financeInfo: { flex: 1 },
  financeName: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '700' },
  financeDesc: { color: 'rgba(255,255,255,0.65)', fontSize: FontSize.sm, marginTop: 2 },

  // Learn banner
  learnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  learnEmoji: { fontSize: 32 },
  learnInfo: { flex: 1, gap: 3 },
  learnTitle: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '700' },
  learnSubtitle: { color: '#A78BFA', fontSize: FontSize.sm },
  learnArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accentMuted,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Encyclopedia
  encyclopediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  encyclopediaItem: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
  },
  encyclopediaCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  encyclopediaTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  encyclopediaCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },

  // History
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  historyText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  historyCount: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
});
