import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { getDailyEnergy } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';
import { drawRandomCards } from '../../constants/tarotData';
import { useAppStore } from '../../stores/useAppStore';

const { width } = Dimensions.get('window');

const ASTRO_PERIODS = [
  {
    title: 'Ретроградний Меркурій',
    dates: '1–25 Квіт 2025',
    impact: 'Комунікації, транспорт, контракти',
    advice: 'Не підписуйте важливі документи',
    color: '#818CF8',
    icon: 'planet-outline' as const,
    active: false,
  },
  {
    title: 'Місячне затемнення',
    dates: '7 Берез 2025',
    impact: 'Завершення циклів, емоції',
    advice: 'Відпустіть те, що більше не служить вам',
    color: '#C084FC',
    icon: 'moon-outline' as const,
    active: true,
  },
];

export default function TodayScreen() {
  const router = useRouter();
  const today = new Date();
  const dailyEnergy = getDailyEnergy(today);
  const energy = getEnergyById(dailyEnergy);
  const savedMatrices = useAppStore((s) => s.savedMatrices);
  const userName = useAppStore((s) => s.userName);
  const streak = useAppStore((s) => s.streak);
  const notifications = useAppStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const affirmation = notifications.find((n) => n.type === 'affirmation');

  const [dailyCard] = useState(() => drawRandomCards(1)[0]);

  const dateStr = today.toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Greeting */}
      <View style={styles.greetingRow}>
        <View>
          <Text style={styles.greeting}>
            {userName ? `Привіт, ${userName}! 👋` : 'Добрий день! 👋'}
          </Text>
          <Text style={styles.dateText} suppressHighlightingOnPress>
            {dateStr}
          </Text>
        </View>
        <View style={styles.greetingRight}>
          {streak > 0 && (
            <TouchableOpacity style={styles.streakBadge} onPress={() => router.push('/profile/achievements' as any)}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakCount}>{streak}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => router.push('/paywall')}
          >
            <Ionicons name="diamond-outline" size={22} color={Colors.accent} />
            {unreadCount > 0 && <View style={styles.notifDot} />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Affirmation of the day */}
      {affirmation && (
        <Card style={styles.affirmationCard}>
          <Text style={styles.affirmationEmoji}>✨</Text>
          <Text style={styles.affirmationText}>{affirmation.body}</Text>
        </Card>
      )}

      {/* Energy of the Day */}
      <LinearGradient
        colors={['#3D1A78', '#6D28D9', '#8B5CF6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.energyCard}
      >
        <View style={styles.energyHeader}>
          <Text style={styles.energyLabel}>ЕНЕРГІЯ ДНЯ</Text>
          <TouchableOpacity
            onPress={() => router.push('/meditation')}
            style={styles.meditationBtn}
          >
            <Ionicons name="headset-outline" size={16} color="#E9D5FF" />
            <Text style={styles.meditationBtnText}>Медитація</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.energyMain}>
          <View style={styles.energyNumberBadge}>
            <Text style={styles.energyNumber}>{dailyEnergy}</Text>
          </View>
          <View style={styles.energyInfo}>
            <Text style={styles.energyName}>{energy?.name}</Text>
            <Text style={styles.energyKeywords}>
              {energy?.keywords.join(' · ')}
            </Text>
            <Text style={styles.energyAdvice} numberOfLines={2}>
              {energy?.advice}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.shareEnergyBtn}
          onPress={() => router.push('/share')}
        >
          <Ionicons name="share-social-outline" size={14} color="#E9D5FF" />
          <Text style={styles.shareEnergyText}>Поділитись</Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Card of the Day */}
      <Text style={styles.sectionTitle}>Карта Дня</Text>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => router.push('/tarot/spread' as any)}
      >
        <Card style={styles.cardOfDay}>
          <View style={styles.cardOfDayLeft}>
            <View style={styles.tarotCardPlaceholder}>
              <Ionicons name="star" size={20} color={Colors.accent} />
              <Text style={styles.tarotCardNumber}>{dailyCard.id}</Text>
            </View>
          </View>
          <View style={styles.cardOfDayInfo}>
            <Text style={styles.cardOfDayName}>{dailyCard.nameUk}</Text>
            <Text style={styles.cardOfDayKeywords}>
              {dailyCard.keywords.slice(0, 3).join(' · ')}
            </Text>
            <Text style={styles.cardOfDayAdvice} numberOfLines={2}>
              {dailyCard.advice}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
        </Card>
      </TouchableOpacity>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Швидкий доступ</Text>
      <View style={styles.quickGrid}>
        {[
          {
            icon: 'grid-outline' as const,
            title: 'Моя Матриця',
            subtitle: savedMatrices.length > 0 ? `${savedMatrices.length} збережено` : 'Створити',
            gradient: ['#4C1D95', '#7C3AED'] as [string, string],
            route: '/matrix/create',
          },
          {
            icon: 'heart-outline' as const,
            title: 'Сумісність',
            subtitle: 'Партнер чи друг',
            gradient: ['#831843', '#BE185D'] as [string, string],
            route: '/matrix/compatibility',
          },
          {
            icon: 'help-circle-outline' as const,
            title: 'Так / Ні',
            subtitle: 'Швидка відповідь',
            gradient: ['#064E3B', '#059669'] as [string, string],
            route: '/tarot/yesno',
          },
          {
            icon: 'person-add-outline' as const,
            title: 'На Людину',
            subtitle: 'Новий знайомий',
            gradient: ['#1E3A5F', '#2563EB'] as [string, string],
            route: '/tarot/person',
          },
        ].map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.quickItem}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as any)}
          >
            <LinearGradient
              colors={item.gradient}
              style={styles.quickGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={item.icon} size={24} color="#FFFFFF" />
              <Text style={styles.quickTitle}>{item.title}</Text>
              <Text style={styles.quickSubtitle}>{item.subtitle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Astro Forecast */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Астро Прогноз</Text>
        <TouchableOpacity onPress={() => router.push('/tarot/astro' as any)}>
          <Text style={styles.seeAll}>Всі →</Text>
        </TouchableOpacity>
      </View>
      {ASTRO_PERIODS.map((period) => (
        <TouchableOpacity
          key={period.title}
          activeOpacity={0.7}
          onPress={() => router.push('/tarot/astro' as any)}
        >
          <Card style={[styles.astroCard, period.active && styles.astroCardActive]}>
            {period.active && (
              <View style={styles.activeTag}>
                <Text style={styles.activeTagText}>ЗАРАЗ</Text>
              </View>
            )}
            <View style={styles.astroRow}>
              <View style={[styles.astroIcon, { backgroundColor: period.color + '22' }]}>
                <Ionicons name={period.icon} size={22} color={period.color} />
              </View>
              <View style={styles.astroInfo}>
                <Text style={styles.astroTitle}>{period.title}</Text>
                <Text style={styles.astroDates}>{period.dates}</Text>
                <Text style={styles.astroImpact}>{period.impact}</Text>
              </View>
            </View>
            <Text style={styles.astroAdvice}>💡 {period.advice}</Text>
          </Card>
        </TouchableOpacity>
      ))}

      {/* AI Chat Promo */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/ai/chat' as any)}
      >
        <LinearGradient
          colors={['#1E1B4B', '#312E81', '#4338CA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.aiPromoCard}
        >
          <Ionicons name="chatbubble-ellipses" size={32} color="#A5B4FC" />
          <View style={styles.aiPromoInfo}>
            <Text style={styles.aiPromoTitle}>AI Езотерик</Text>
            <Text style={styles.aiPromoText}>
              Задайте питання своїй матриці або картам Таро
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#A5B4FC" />
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 120 },

  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  greeting: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  greetingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  streakEmoji: { fontSize: 16 },
  streakCount: { color: '#F97316', fontSize: FontSize.sm, fontWeight: '800' },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1,
    borderColor: Colors.bg,
  },
  affirmationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    borderColor: Colors.accentMuted,
    paddingVertical: Spacing.sm,
  },
  affirmationEmoji: { fontSize: 20 },
  affirmationText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
    flex: 1,
    fontStyle: 'italic',
  },

  energyCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  energyLabel: {
    color: '#E9D5FF',
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  meditationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  meditationBtnText: {
    color: '#E9D5FF',
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  energyMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  energyNumberBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  energyNumber: {
    color: '#FFFFFF',
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  energyInfo: { flex: 1 },
  energyName: {
    color: '#FFFFFF',
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: 2,
  },
  energyKeywords: {
    color: '#E9D5FF',
    fontSize: FontSize.sm,
    marginBottom: 4,
  },
  energyAdvice: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
  shareEnergyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  shareEnergyText: {
    color: '#E9D5FF',
    fontSize: FontSize.xs,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  seeAll: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.md,
  },

  cardOfDay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardOfDayLeft: {},
  tarotCardPlaceholder: {
    width: 52,
    height: 76,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tarotCardNumber: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  cardOfDayInfo: { flex: 1 },
  cardOfDayName: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  cardOfDayKeywords: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  cardOfDayAdvice: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginTop: 4,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  quickItem: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  quickGradient: {
    padding: Spacing.md,
    minHeight: 100,
    gap: Spacing.xs,
  },
  quickTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
    marginTop: Spacing.xs,
  },
  quickSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
  },

  astroCard: {
    marginBottom: Spacing.sm,
  },
  astroCardActive: {
    borderColor: '#A78BFA',
    borderWidth: 1.5,
  },
  activeTag: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.sm,
  },
  activeTagText: {
    color: Colors.primaryLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
  },
  astroRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  astroIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  astroInfo: { flex: 1 },
  astroTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  astroDates: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: 1,
  },
  astroImpact: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  astroAdvice: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
    fontStyle: 'italic',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },

  aiPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  aiPromoInfo: { flex: 1 },
  aiPromoTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  aiPromoText: {
    color: '#A5B4FC',
    fontSize: FontSize.sm,
    marginTop: 2,
  },
});
