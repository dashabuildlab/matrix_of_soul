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
import { Button } from '../../components/ui/Button';
import { TAROT_CARDS, drawRandomCards } from '../../constants/tarotData';
import { useAppStore } from '../../stores/useAppStore';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing.lg * 2 - Spacing.sm) / 2;

const SPREADS = [
  {
    name: 'Три Карти',
    icon: 'layers-outline' as const,
    cards: 3,
    gradient: ['#1E1B4B', '#4338CA'] as [string, string],
    description: 'Минуле · Сьогодення · Майбутнє',
  },
  {
    name: 'Хрест',
    icon: 'add-outline' as const,
    cards: 5,
    gradient: ['#064E3B', '#047857'] as [string, string],
    description: 'Ситуація та шлях',
  },
  {
    name: 'Кельтський',
    icon: 'apps-outline' as const,
    cards: 10,
    gradient: ['#78350F', '#B45309'] as [string, string],
    description: 'Повний аналіз',
  },
];

const AI_SPREADS = [
  {
    name: 'Так чи Ні?',
    icon: 'help-circle-outline' as const,
    route: '/tarot/yesno',
    gradient: ['#1E1B4B', '#6D28D9'] as [string, string],
    description: 'Чітка відповідь від карт',
    emoji: '🎯',
  },
  {
    name: 'На Людину',
    icon: 'person-outline' as const,
    route: '/tarot/person',
    gradient: ['#831843', '#BE185D'] as [string, string],
    description: 'Енергія та почуття людини',
    emoji: '❤️',
  },
  {
    name: 'Прогноз',
    icon: 'trending-up-outline' as const,
    route: '/tarot/period',
    gradient: ['#064E3B', '#059669'] as [string, string],
    description: 'Тиждень, місяць, рік',
    emoji: '📅',
  },
  {
    name: 'Астропрогноз',
    icon: 'planet-outline' as const,
    route: '/tarot/astro',
    gradient: ['#0F0820', '#312E81'] as [string, string],
    description: 'Меркурій, Місяць, планети',
    emoji: '🪐',
  },
];

export default function TarotScreen() {
  const router = useRouter();
  const [dailyCard, setDailyCard] = useState<{ card: (typeof TAROT_CARDS)[0]; isReversed: boolean } | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const tarotSpreads = useAppStore((s) => s.tarotSpreads);
  const addXP = useAppStore((s) => s.addXP);

  const drawDailyCard = () => {
    setIsRevealing(true);
    setTimeout(() => {
      const card = drawRandomCards(1)[0];
      setDailyCard({ card, isReversed: Math.random() > 0.7 });
      setIsRevealing(false);
      addXP(5);
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Card of the Day */}
      <Text style={styles.sectionTitle}>Карта Дня</Text>
      {dailyCard === null ? (
        <Card style={styles.drawCard}>
          <Ionicons name="sparkles" size={48} color={Colors.primary} />
          <Text style={styles.drawText}>Витягніть свою карту дня</Text>
          <Text style={styles.drawSubtext}>Дізнайтесь, що підготував для вас цей день</Text>
          <Button
            title={isRevealing ? 'Відкриваю...' : '🔮 Витягнути Карту'}
            onPress={drawDailyCard}
            loading={isRevealing}
            style={{ marginTop: Spacing.md, alignSelf: 'stretch' }}
          />
        </Card>
      ) : (
        <Card style={styles.revealedCard}>
          <View style={styles.revealedRow}>
            <View style={styles.cardImageBox}>
              <Text style={styles.cardNumber}>{dailyCard.card.id}</Text>
              <Ionicons name="star" size={18} color={Colors.accent} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{dailyCard.card.nameUk}</Text>
              <Text style={styles.cardNameEn}>{dailyCard.card.name}</Text>
              {dailyCard.isReversed && (
                <View style={styles.reversedBadge}>
                  <Text style={styles.reversedText}>↓ Перевернута</Text>
                </View>
              )}
              <Text style={styles.cardKeywords} numberOfLines={1}>
                {dailyCard.card.keywords.join(' · ')}
              </Text>
            </View>
          </View>
          <Text style={styles.cardMeaning} numberOfLines={3}>
            {dailyCard.isReversed ? dailyCard.card.reversed : dailyCard.card.upright}
          </Text>
          <Text style={styles.cardAdvice}>{dailyCard.card.advice}</Text>
          <View style={styles.cardActions}>
            <Button title="Нова Карта" variant="ghost" onPress={() => setDailyCard(null)} style={{ flex: 1 }} />
            <Button title="Поділитись" variant="secondary" onPress={() => router.push('/share')} style={{ flex: 1 }} />
          </View>
        </Card>
      )}

      {/* Classic Spreads */}
      <Text style={styles.sectionTitle}>Класичні Розклади</Text>
      <View style={styles.spreadsGrid}>
        {SPREADS.map((spread) => (
          <TouchableOpacity
            key={spread.name}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/tarot/spread', params: { type: spread.name, cards: spread.cards } })}
          >
            <LinearGradient colors={spread.gradient} style={styles.spreadCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name={spread.icon} size={28} color="#FFFFFF" />
              <Text style={styles.spreadName}>{spread.name}</Text>
              <Text style={styles.spreadDesc}>{spread.description}</Text>
              <Text style={styles.spreadCards}>{spread.cards} карт</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* AI Spreads */}
      <Text style={styles.sectionTitle}>Спеціальні Розклади</Text>
      <View style={styles.aiSpreadsGrid}>
        {AI_SPREADS.map((spread) => (
          <TouchableOpacity
            key={spread.name}
            style={styles.aiSpreadItem}
            activeOpacity={0.7}
            onPress={() => router.push(spread.route as any)}
          >
            <LinearGradient colors={spread.gradient} style={styles.aiSpreadGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Text style={styles.aiSpreadEmoji}>{spread.emoji}</Text>
              <Text style={styles.aiSpreadName}>{spread.name}</Text>
              <Text style={styles.aiSpreadDesc}>{spread.description}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Learn tarot */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/learn/tarot')}>
        <LinearGradient
          colors={['#1E1B4B', '#312E81']}
          style={styles.learnBanner}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Text style={styles.learnEmoji}>🎓</Text>
          <View style={styles.learnInfo}>
            <Text style={styles.learnTitle}>Вивчити значення карт</Text>
            <Text style={styles.learnSubtitle}>Інтерактивні вікторини · Заробляй XP</Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color="#A78BFA" />
        </LinearGradient>
      </TouchableOpacity>

      {/* History */}
      <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/tarot/history')}>
        <Card style={styles.historyCard}>
          <Ionicons name="time-outline" size={24} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.historyText}>Історія Розкладів</Text>
            {tarotSpreads.length > 0 && (
              <Text style={styles.historyCount}>{tarotSpreads.length} розкладів</Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
        </Card>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 120 },

  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },

  drawCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  drawText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginTop: Spacing.sm,
  },
  drawSubtext: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
  },

  revealedCard: { gap: Spacing.md },
  revealedRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'center' },
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
  cardNumber: { color: Colors.accent, fontSize: FontSize.xl, fontWeight: '800' },
  cardInfo: { flex: 1, gap: 4 },
  cardName: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  cardNameEn: { color: Colors.textMuted, fontSize: FontSize.sm },
  reversedBadge: {
    backgroundColor: 'rgba(248,113,113,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  reversedText: { color: Colors.error, fontSize: FontSize.xs, fontWeight: '600' },
  cardKeywords: { color: Colors.primaryLight, fontSize: FontSize.xs },
  cardMeaning: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
  cardAdvice: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: 20,
    backgroundColor: Colors.primaryMuted,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    fontStyle: 'italic',
  },
  cardActions: { flexDirection: 'row', gap: Spacing.sm },

  spreadsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  spreadCard: {
    width: (width - Spacing.lg * 2 - Spacing.sm * 2) / 3,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.xs,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
  },
  spreadName: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: '700', textAlign: 'center' },
  spreadDesc: { color: 'rgba(255,255,255,0.6)', fontSize: 10, textAlign: 'center' },
  spreadCards: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs },

  aiSpreadsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  aiSpreadItem: {
    width: CARD_WIDTH,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  aiSpreadGradient: {
    padding: Spacing.md,
    minHeight: 110,
    gap: Spacing.xs,
    justifyContent: 'center',
  },
  aiSpreadEmoji: { fontSize: 28 },
  aiSpreadName: { color: '#FFFFFF', fontSize: FontSize.md, fontWeight: '700' },
  aiSpreadDesc: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, lineHeight: 16 },

  learnBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  learnEmoji: { fontSize: 36 },
  learnInfo: { flex: 1, gap: 3 },
  learnTitle: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '700' },
  learnSubtitle: { color: '#A78BFA', fontSize: FontSize.sm },

  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  historyText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  historyCount: { color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 },
});
