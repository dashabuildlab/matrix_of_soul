import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';

const { width } = Dimensions.get('window');

// Static mock astro data (in a real app would come from an API)
const RETROGRADES = [
  {
    planet: 'Меркурій',
    symbol: '☿',
    isRetrograde: false,
    nextRetrograde: '15 липня 2025',
    until: '8 серпня 2025',
    effect: 'Комунікації, технології, подорожі',
    advice: 'Зараз сприятливий час для підписання договорів та нових переговорів.',
    retroAdvice: 'Уникайте підписання важливих документів. Перевіряйте деталі двічі. Техніка може давати збої.',
    color: '#60A5FA',
    gradient: ['#1E3A5F', '#2563EB'] as [string, string],
  },
  {
    planet: 'Венера',
    symbol: '♀',
    isRetrograde: false,
    nextRetrograde: '2 березня 2025',
    until: '13 квітня 2025',
    effect: 'Кохання, стосунки, краса, гроші',
    advice: 'Час для романтики і гармонії у стосунках. Гарний момент для творчості.',
    retroAdvice: 'Уникайте нових стосунків або великих фінансових витрат на розкіш.',
    color: '#F9A8D4',
    gradient: ['#831843', '#BE185D'] as [string, string],
  },
  {
    planet: 'Марс',
    symbol: '♂',
    isRetrograde: false,
    nextRetrograde: 'жовтень 2026',
    until: 'грудень 2026',
    effect: 'Енергія, дії, ініціатива, конфлікти',
    advice: 'Активний час для реалізації планів. Канальте енергію в спорт та творчість.',
    retroAdvice: 'Уникайте ризикованих дій. Конфлікти загострюються. Витримуйте паузу.',
    color: '#F87171',
    gradient: ['#450A0A', '#B91C1C'] as [string, string],
  },
  {
    planet: 'Юпітер',
    symbol: '♃',
    isRetrograde: false,
    nextRetrograde: 'жовтень 2025',
    until: 'лютий 2026',
    effect: 'Удача, розширення, мудрість, можливості',
    advice: 'Юпітер відкриває двері. Шукайте нові можливості та розширюйте горизонти.',
    retroAdvice: 'Час переосмислити свої переконання та цілі. Внутрішня робота принесе результат.',
    color: '#FDE68A',
    gradient: ['#78350F', '#D97706'] as [string, string],
  },
  {
    planet: 'Сатурн',
    symbol: '♄',
    isRetrograde: true,
    nextRetrograde: 'Зараз',
    until: '15 листопада 2025',
    effect: 'Структура, дисципліна, карма, відповідальність',
    advice: 'Час для системної праці та планування довгострокових цілей.',
    retroAdvice: 'Карма повертається. Вирішуйте незакінчені справи. Не беріться за нові великі проєкти.',
    color: '#A78BFA',
    gradient: ['#1E1B4B', '#4338CA'] as [string, string],
  },
];

const LUNAR_PHASES = [
  { name: 'Новий місяць', emoji: '🌑', energy: 'Нові початки', bestFor: 'Встановлення намірів, нові проєкти' },
  { name: 'Зростаючий місяць', emoji: '🌒', energy: 'Накопичення', bestFor: 'Розвиток проєктів, навчання' },
  { name: 'Перша чверть', emoji: '🌓', energy: 'Дія', bestFor: 'Прийняття рішень, активні кроки' },
  { name: 'Зростаючий горб', emoji: '🌔', energy: 'Концентрація', bestFor: 'Деталізація, вдосконалення' },
  { name: 'Повний місяць', emoji: '🌕', energy: 'Кульмінація', bestFor: 'Завершення, святкування, ритуали' },
  { name: 'Спадаючий горб', emoji: '🌖', energy: 'Вдячність', bestFor: 'Оцінка результатів, відпочинок' },
  { name: 'Остання чверть', emoji: '🌗', energy: 'Відпускання', bestFor: 'Звільнення від старого, очищення' },
  { name: 'Спадаючий місяць', emoji: '🌘', energy: 'Відновлення', bestFor: 'Медитація, інтроспекція' },
];

// Simulate current lunar phase (in real app would calculate)
const CURRENT_LUNAR_DAY = 15;
const CURRENT_PHASE_INDEX = 4; // Full moon

const COSMIC_EVENTS = [
  { date: 'Сьогодні', event: 'Місяць в Скорпіоні', icon: 'moon-outline' as const, impact: 'Глибокі емоції, інтуїція загострена', color: '#7C3AED' },
  { date: '15 трав.', event: 'Повний місяць у Козерозі', icon: 'radio-button-on-outline' as const, impact: 'Кульмінація проєктів, відповідальність', color: '#F5C542' },
  { date: '22 трав.', event: 'Сонце входить у Близнюки', icon: 'sunny-outline' as const, impact: 'Комунікації, навчання, багатозадачність', color: '#FCD34D' },
  { date: '6 черв.', event: 'Новий місяць у Близнюках', icon: 'ellipse-outline' as const, impact: 'Час для нових ідей та намірів', color: '#60A5FA' },
];

const DAILY_FORECAST = {
  energy: 8,
  message: 'Потужний день для реалізації творчих ідей. Місяць підсилює ваш інтуїтивний потенціал. Ідеальний час для завершення розпочатих проєктів та глибоких розмов.',
  favorable: ['Творчість та мистецтво', 'Глибокі розмови', 'Медитація', 'Вирішення старих конфліктів'],
  unfavorable: ['Поверхневі рішення', 'Фінансові ризики', 'Нові початки'],
};

export default function AstroScreen() {
  const [activeRetrograde, setActiveRetrograde] = useState(0);
  const [showAllRetro, setShowAllRetro] = useState(false);

  const activeRetroCount = RETROGRADES.filter((r) => r.isRetrograde).length;
  const planet = RETROGRADES[activeRetrograde];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <LinearGradient
        colors={['#0F0820', '#1E1B4B', '#312E81']}
        style={styles.header}
      >
        <Text style={styles.headerDate}>Астрологічний прогноз</Text>
        <Text style={styles.headerTitle}>✨ Сьогодні</Text>

        {/* Energy meter */}
        <View style={styles.energyMeter}>
          <Text style={styles.energyLabel}>Космічна Енергія</Text>
          <View style={styles.energyBar}>
            <View style={[styles.energyFill, { width: `${DAILY_FORECAST.energy * 10}%` }]} />
          </View>
          <Text style={styles.energyValue}>{DAILY_FORECAST.energy}/10</Text>
        </View>
      </LinearGradient>

      {/* Daily Forecast */}
      <Card style={styles.forecastCard}>
        <Text style={styles.forecastTitle}>📅 Прогноз Дня</Text>
        <Text style={styles.forecastText}>{DAILY_FORECAST.message}</Text>

        <View style={styles.favorableSection}>
          <View style={styles.favorableGroup}>
            <View style={styles.favorableHeader}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
              <Text style={styles.favorableTitle}>Сприятливо</Text>
            </View>
            {DAILY_FORECAST.favorable.map((item) => (
              <Text key={item} style={styles.favorableItem}>• {item}</Text>
            ))}
          </View>
          <View style={styles.favorableGroup}>
            <View style={styles.favorableHeader}>
              <Ionicons name="close-circle" size={16} color={Colors.error} />
              <Text style={[styles.favorableTitle, { color: Colors.error }]}>Обережно</Text>
            </View>
            {DAILY_FORECAST.unfavorable.map((item) => (
              <Text key={item} style={[styles.favorableItem, { color: Colors.textMuted }]}>• {item}</Text>
            ))}
          </View>
        </View>
      </Card>

      {/* Lunar Phase */}
      <Card style={styles.lunarCard}>
        <View style={styles.lunarHeader}>
          <Text style={styles.lunarEmoji}>{LUNAR_PHASES[CURRENT_PHASE_INDEX].emoji}</Text>
          <View>
            <Text style={styles.lunarPhase}>{LUNAR_PHASES[CURRENT_PHASE_INDEX].name}</Text>
            <Text style={styles.lunarDay}>{CURRENT_LUNAR_DAY}-й місячний день</Text>
          </View>
          <View style={styles.lunarEnergy}>
            <Text style={styles.lunarEnergyLabel}>Енергія</Text>
            <Text style={styles.lunarEnergyValue}>{LUNAR_PHASES[CURRENT_PHASE_INDEX].energy}</Text>
          </View>
        </View>
        <Text style={styles.lunarBestFor}>
          🌟 Найкраще для: {LUNAR_PHASES[CURRENT_PHASE_INDEX].bestFor}
        </Text>
      </Card>

      {/* Retrogrades */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ретроградні Планети</Text>
          {activeRetroCount > 0 && (
            <View style={styles.retroBadge}>
              <Text style={styles.retroBadgeText}>{activeRetroCount} активно</Text>
            </View>
          )}
        </View>

        {/* Planet selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.planetRow}>
            {RETROGRADES.map((r, i) => (
              <TouchableOpacity
                key={r.planet}
                style={[styles.planetChip, activeRetrograde === i && styles.planetChipActive, r.isRetrograde && styles.planetChipRetro]}
                onPress={() => setActiveRetrograde(i)}
              >
                <Text style={styles.planetSymbol}>{r.symbol}</Text>
                <Text style={[styles.planetName, activeRetrograde === i && styles.planetNameActive]}>
                  {r.planet}
                </Text>
                {r.isRetrograde && (
                  <View style={styles.retroDot} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Selected planet detail */}
        <LinearGradient
          colors={planet.gradient}
          style={styles.planetDetail}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.planetDetailHeader}>
            <Text style={styles.planetDetailSymbol}>{planet.symbol}</Text>
            <View>
              <View style={styles.planetStatusRow}>
                <Text style={styles.planetDetailName}>{planet.planet}</Text>
                <View style={[styles.statusBadge, { backgroundColor: planet.isRetrograde ? 'rgba(248,113,113,0.3)' : 'rgba(52,211,153,0.3)' }]}>
                  <Text style={[styles.statusText, { color: planet.isRetrograde ? Colors.error : Colors.success }]}>
                    {planet.isRetrograde ? '↩ Ретро' : '→ Прямий'}
                  </Text>
                </View>
              </View>
              <Text style={styles.planetEffect}>{planet.effect}</Text>
            </View>
          </View>

          {planet.isRetrograde ? (
            <View style={styles.retroInfo}>
              <Text style={styles.retroUntil}>До: {planet.until}</Text>
              <Text style={styles.retroAdviceText}>{planet.retroAdvice}</Text>
            </View>
          ) : (
            <View style={styles.retroInfo}>
              <Text style={styles.retroUntil}>Наступне ретро: {planet.nextRetrograde}</Text>
              <Text style={styles.retroAdviceText}>{planet.advice}</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Cosmic events */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Найближчі Події</Text>
        {COSMIC_EVENTS.map((event, i) => (
          <Card key={i} style={styles.eventCard}>
            <View style={[styles.eventIconBox, { backgroundColor: `${event.color}20` }]}>
              <Ionicons name={event.icon} size={20} color={event.color} />
            </View>
            <View style={styles.eventInfo}>
              <View style={styles.eventHeader}>
                <Text style={styles.eventName}>{event.event}</Text>
                <Text style={[styles.eventDate, { color: event.color }]}>{event.date}</Text>
              </View>
              <Text style={styles.eventImpact}>{event.impact}</Text>
            </View>
          </Card>
        ))}
      </View>

      {/* Zodiac compatibility */}
      <Card style={styles.tipCard}>
        <Ionicons name="bulb-outline" size={24} color={Colors.accent} />
        <Text style={styles.tipTitle}>Порада Тижня</Text>
        <Text style={styles.tipText}>
          Повний місяць у Козерозі закликає відповідально поставитись до своїх зобов'язань.
          Якщо ви відкладали важливе рішення — настав час діяти. Земна енергія дає стабільність і ясність думки.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 100 },

  header: {
    padding: Spacing.xl,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  headerDate: {
    color: '#A78BFA',
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  energyMeter: {
    width: '100%',
    marginTop: Spacing.md,
    gap: Spacing.xs,
  },
  energyLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  energyBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  energyFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },
  energyValue: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textAlign: 'right',
  },

  forecastCard: {
    margin: Spacing.lg,
    gap: Spacing.md,
  },
  forecastTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  forecastText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
  favorableSection: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  favorableGroup: { flex: 1, gap: 6 },
  favorableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  favorableTitle: {
    color: Colors.success,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  favorableItem: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    lineHeight: 18,
  },

  lunarCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  lunarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  lunarEmoji: { fontSize: 44 },
  lunarPhase: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  lunarDay: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  lunarEnergy: {
    marginLeft: 'auto',
    alignItems: 'center',
  },
  lunarEnergyLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  lunarEnergyValue: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  lunarBestFor: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  section: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    flex: 1,
  },
  retroBadge: {
    backgroundColor: 'rgba(248,113,113,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  retroBadgeText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  planetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  planetChip: {
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
    gap: 4,
    position: 'relative',
  },
  planetChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  planetChipRetro: {
    borderColor: Colors.error,
  },
  planetSymbol: {
    fontSize: 22,
    color: Colors.text,
  },
  planetName: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  planetNameActive: {
    color: Colors.text,
  },
  retroDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
  },

  planetDetail: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  planetDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  planetDetailSymbol: {
    fontSize: 44,
    color: '#FFFFFF',
  },
  planetStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 4,
  },
  planetDetailName: {
    color: '#FFFFFF',
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  planetEffect: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
  },

  retroInfo: { gap: 8 },
  retroUntil: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  retroAdviceText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    lineHeight: 22,
    fontWeight: '500',
  },

  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  eventIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventInfo: { flex: 1, gap: 3 },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventName: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    flex: 1,
  },
  eventDate: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  eventImpact: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 16,
  },

  tipCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tipTitle: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  tipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 22,
  },
});
