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
import { Button } from '../../components/ui/Button';
import { TAROT_CARDS, drawRandomCards } from '../../constants/tarotData';

const { width } = Dimensions.get('window');

const PERIODS = [
  {
    id: 'week',
    label: 'Тиждень',
    icon: 'calendar-outline' as const,
    cards: 1,
    gradient: ['#1E3A5F', '#2563EB'] as [string, string],
    positions: ['Енергія тижня'],
    description: 'Загальна енергія на наступні 7 днів',
  },
  {
    id: 'month',
    label: 'Місяць',
    icon: 'moon-outline' as const,
    cards: 3,
    gradient: ['#3B0764', '#7C3AED'] as [string, string],
    positions: ['Початок', 'Середина', 'Кінець'],
    description: 'Три фази місяця — розвиток ситуації',
  },
  {
    id: 'quarter',
    label: '3 Місяці',
    icon: 'trending-up-outline' as const,
    cards: 3,
    gradient: ['#064E3B', '#059669'] as [string, string],
    positions: ['1-й місяць', '2-й місяць', '3-й місяць'],
    description: 'Квартальний прогноз по місяцях',
  },
  {
    id: 'year',
    label: 'Рік',
    icon: 'star-outline' as const,
    cards: 4,
    gradient: ['#78350F', '#D97706'] as [string, string],
    positions: ['Весна', 'Літо', 'Осінь', 'Зима'],
    description: 'Річний прогноз по сезонах',
  },
];

const THEMES = [
  { id: 'general', label: 'Загальний', icon: 'grid-outline' as const },
  { id: 'love', label: 'Любов', icon: 'heart-outline' as const },
  { id: 'career', label: 'Кар\'єра', icon: 'briefcase-outline' as const },
  { id: 'health', label: 'Здоров\'я', icon: 'fitness-outline' as const },
  { id: 'finance', label: 'Фінанси', icon: 'cash-outline' as const },
];

export default function PeriodScreen() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedTheme, setSelectedTheme] = useState('general');
  const [cards, setCards] = useState<Array<{ card: (typeof TAROT_CARDS)[0]; isReversed: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [activeCard, setActiveCard] = useState(0);

  const period = PERIODS.find((p) => p.id === selectedPeriod)!;

  const getReading = () => {
    setIsLoading(true);
    setShowResult(false);

    setTimeout(() => {
      const drawn = drawRandomCards(period.cards).map((card) => ({
        card,
        isReversed: Math.random() > 0.65,
      }));
      setCards(drawn);
      setIsLoading(false);
      setShowResult(true);
      setActiveCard(0);
    }, 2000);
  };

  const getThemeInterpretation = (card: (typeof TAROT_CARDS)[0], isReversed: boolean) => {
    const base = isReversed ? card.reversed : card.upright;
    switch (selectedTheme) {
      case 'love': return card.loveAdvice;
      case 'career': return card.careerAdvice;
      default: return base;
    }
  };

  const getGeneralAdvice = () => {
    if (!cards.length) return '';
    const yesCount = cards.filter((c) => !c.isReversed && c.card.yesNo === 'yes').length;
    const total = cards.length;
    const ratio = yesCount / total;

    if (ratio >= 0.7) return '🌟 Надзвичайно сприятливий період! Дійте активно та впевнено.';
    if (ratio >= 0.5) return '✨ Переважно позитивний час. Зберігайте фокус та будьте проактивні.';
    if (ratio >= 0.3) return '⚖️ Змішаний період. Будьте уважні до деталей та не поспішайте.';
    return '🌑 Час для роздумів та внутрішньої роботи. Не форсуйте події.';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <LinearGradient
        colors={['#064E3B', '#065F46']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="trending-up-outline" size={44} color="#6EE7B7" />
        <Text style={styles.headerTitle}>Прогноз Таро</Text>
        <Text style={styles.headerSubtitle}>
          Дізнайтесь, яку енергію несе майбутній час
        </Text>
      </LinearGradient>

      {!showResult ? (
        <>
          {/* Period selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Оберіть період</Text>
            <View style={styles.periodsGrid}>
              {PERIODS.map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.periodItem}
                  onPress={() => setSelectedPeriod(p.id)}
                >
                  <LinearGradient
                    colors={selectedPeriod === p.id ? p.gradient : ['#141428', '#1C1C3A']}
                    style={[styles.periodGradient, selectedPeriod === p.id && styles.periodSelected]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={p.icon} size={24} color={selectedPeriod === p.id ? '#FFFFFF' : Colors.textMuted} />
                    <Text style={[styles.periodLabel, selectedPeriod === p.id && styles.periodLabelActive]}>
                      {p.label}
                    </Text>
                    <Text style={styles.periodCards}>{p.cards} {p.cards === 1 ? 'карта' : 'карти'}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            <Card style={styles.periodInfo}>
              <Ionicons name={period.icon} size={20} color={Colors.primary} />
              <Text style={styles.periodInfoText}>{period.description}</Text>
            </Card>
          </View>

          {/* Theme selector */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Тема прогнозу</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.themesRow}>
                {THEMES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.themeChip, selectedTheme === t.id && styles.themeChipActive]}
                    onPress={() => setSelectedTheme(t.id)}
                  >
                    <Ionicons
                      name={t.icon}
                      size={16}
                      color={selectedTheme === t.id ? Colors.text : Colors.textMuted}
                    />
                    <Text style={[styles.themeLabel, selectedTheme === t.id && styles.themeLabelActive]}>
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <Button
            title={isLoading ? 'Карти розкриваються...' : `🔮 Розкрити ${period.cards} ${period.cards === 1 ? 'карту' : 'карти'}`}
            onPress={getReading}
            loading={isLoading}
            style={styles.button}
          />
        </>
      ) : (
        <>
          {/* Result header */}
          <Card style={styles.resultHeader}>
            <View style={styles.resultMeta}>
              <View style={[styles.metaBadge, { backgroundColor: Colors.primaryMuted }]}>
                <Ionicons name={period.icon} size={14} color={Colors.primary} />
                <Text style={styles.metaBadgeText}>{period.label}</Text>
              </View>
              <View style={[styles.metaBadge, { backgroundColor: Colors.accentMuted }]}>
                <Ionicons
                  name={THEMES.find((t) => t.id === selectedTheme)?.icon ?? 'grid-outline'}
                  size={14}
                  color={Colors.accent}
                />
                <Text style={[styles.metaBadgeText, { color: Colors.accent }]}>
                  {THEMES.find((t) => t.id === selectedTheme)?.label}
                </Text>
              </View>
            </View>
            <Text style={styles.generalAdvice}>{getGeneralAdvice()}</Text>
          </Card>

          {/* Card tabs */}
          {period.cards > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.tabsScroll}
            >
              <View style={styles.tabsRow}>
                {period.positions.map((pos, i) => (
                  <TouchableOpacity
                    key={pos}
                    style={[styles.posTab, activeCard === i && styles.posTabActive]}
                    onPress={() => setActiveCard(i)}
                  >
                    <Text style={[styles.posTabText, activeCard === i && styles.posTabTextActive]}>
                      {pos}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}

          {/* Current card */}
          {cards[activeCard] && (
            <Card style={styles.cardResult}>
              <View style={styles.cardTop}>
                <View style={styles.cardImageBox}>
                  <Text style={styles.cardId}>{cards[activeCard].card.id}</Text>
                  <Ionicons name="star" size={16} color={Colors.accent} />
                </View>
                <View style={styles.cardInfo}>
                  <Text style={styles.positionLabel}>
                    {period.positions[activeCard]}
                  </Text>
                  <Text style={styles.cardName}>{cards[activeCard].card.nameUk}</Text>
                  <Text style={styles.cardNameEn}>{cards[activeCard].card.name}</Text>
                  {cards[activeCard].isReversed && (
                    <View style={styles.reversedBadge}>
                      <Ionicons name="arrow-down" size={12} color={Colors.error} />
                      <Text style={styles.reversedText}>Перевернута</Text>
                    </View>
                  )}
                  <View style={styles.elementRow}>
                    <Text style={styles.elementText}>{cards[activeCard].card.element}</Text>
                    <Text style={styles.elementDot}>·</Text>
                    <Text style={styles.elementText}>{cards[activeCard].card.planet}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.interpretBox}>
                <Text style={styles.interpretTitle}>
                  {THEMES.find((t) => t.id === selectedTheme)?.label ?? 'Загальне'} значення
                </Text>
                <Text style={styles.interpretText}>
                  {getThemeInterpretation(cards[activeCard].card, cards[activeCard].isReversed)}
                </Text>
              </View>

              <View style={styles.adviceBox}>
                <Text style={styles.adviceTitle}>💡 Порада</Text>
                <Text style={styles.adviceText}>{cards[activeCard].card.advice}</Text>
              </View>

              <View style={styles.keywords}>
                {cards[activeCard].card.keywords.map((kw) => (
                  <View key={kw} style={styles.kwBadge}>
                    <Text style={styles.kwText}>{kw}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {/* Navigation */}
          <View style={styles.navRow}>
            {period.cards > 1 && (
              <>
                <Button
                  title="← Назад"
                  variant="ghost"
                  disabled={activeCard === 0}
                  onPress={() => setActiveCard((p) => p - 1)}
                  style={{ flex: 1 }}
                />
                <Button
                  title="Далі →"
                  variant="ghost"
                  disabled={activeCard === period.cards - 1}
                  onPress={() => setActiveCard((p) => p + 1)}
                  style={{ flex: 1 }}
                />
              </>
            )}
          </View>

          <Button
            title="Новий прогноз"
            variant="secondary"
            onPress={() => setShowResult(false)}
            style={styles.button}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 100 },

  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#6EE7B7',
    fontSize: FontSize.md,
    textAlign: 'center',
    opacity: 0.9,
  },

  section: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },

  periodsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  periodItem: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  periodGradient: {
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    minHeight: 100,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
  },
  periodSelected: {
    borderColor: 'transparent',
  },
  periodLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  periodLabelActive: {
    color: '#FFFFFF',
  },
  periodCards: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },

  periodInfo: {
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  periodInfoText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
  },

  themesRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  themeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  themeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  themeLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  themeLabelActive: {
    color: Colors.text,
    fontWeight: '600',
  },

  button: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },

  resultHeader: {
    margin: Spacing.lg,
    gap: Spacing.md,
  },
  resultMeta: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  metaBadgeText: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  generalAdvice: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 22,
    fontWeight: '500',
  },

  tabsScroll: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md },
  tabsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  posTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  posTabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  posTabText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  posTabTextActive: {
    color: Colors.text,
    fontWeight: '600',
  },

  cardResult: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cardImageBox: {
    width: 70,
    height: 100,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardId: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  cardInfo: { flex: 1, gap: 4, justifyContent: 'center' },
  positionLabel: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardName: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  cardNameEn: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  reversedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  reversedText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  elementRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  elementText: { color: Colors.primaryLight, fontSize: FontSize.xs },
  elementDot: { color: Colors.textMuted, fontSize: FontSize.xs },

  interpretBox: {
    backgroundColor: Colors.primaryMuted,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  interpretTitle: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  interpretText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  adviceBox: {
    backgroundColor: Colors.accentMuted,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  adviceTitle: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  adviceText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  keywords: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kwBadge: {
    backgroundColor: Colors.bgCardLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kwText: { color: Colors.textSecondary, fontSize: FontSize.xs },

  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
});
