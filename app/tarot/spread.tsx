import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { getEnergyById } from '../../constants/energies';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../stores/useAppStore';
import { TAROT_IMAGES } from '../../constants/tarotImages';

const SPREAD_NAMES: Record<string, string> = {
  three: 'Три карти',
  cross: 'Хрест',
  celtic: 'Кельтський хрест',
  relationship: 'Відносини',
  love: 'Кохання',
  career: "Кар'єра",
  decision: 'Рішення',
  health: "Здоров'я",
  spiritual: 'Духовний шлях',
  finance: 'Фінанси',
};

export default function SpreadScreen() {
  const router = useRouter();
  const { type, cards: cardsCount, name: nameParam } = useLocalSearchParams<{
    type: string;
    cards: string;
    name: string;
  }>();
  const count = parseInt(cardsCount || '3');
  const spreadName = nameParam || SPREAD_NAMES[type] || 'Розклад';
  const isPremium      = useAppStore((s) => s.isPremium);
  const tokens         = useAppStore((s) => s.tokens);
  const spendCrystals  = useAppStore((s) => s.spendCrystals);
  const addTarotSpread = useAppStore((s) => s.addTarotSpread);

  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [cards, setCards] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  const validateQuestion = (q: string): string | null => {
    const t = q.trim();
    if (t.length < 8) return 'Запитання надто коротке (мінімум 8 символів)';
    if (t.split(/\s+/).filter(Boolean).length < 2) return 'Введіть повноцінне запитання (мінімум 2 слова)';
    return null;
  };

  const drawCards = () => {
    const err = validateQuestion(question);
    if (err) { setQuestionError(err); return; }
    setQuestionError(null);

    // Non-premium spreads cost 1 crystal
    if (!isPremium) {
      if (tokens < 1) {
        router.push('/paywall');
        return;
      }
      spendCrystals(1);
    }

    const drawn: number[] = [];
    while (drawn.length < count) {
      const card = Math.floor(Math.random() * 22) + 1;
      if (!drawn.includes(card)) drawn.push(card);
    }
    setCards(drawn);
    setRevealed(true);

    addTarotSpread({
      id: Date.now().toString(),
      type: type || 'spread',
      question,
      cards: drawn,
      createdAt: new Date().toISOString(),
    });
  };

  const positionLabels = [
    'Минуле',
    'Теперішнє',
    'Майбутнє',
    'Підсвідоме',
    'Свідоме',
    'Близьке майбутнє',
    'Ви',
    'Оточення',
    'Надії/Страхи',
    'Результат',
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{ marginRight: 4 }}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{spreadName}</Text>
        <Text style={styles.subtitle}>{count} карт</Text>

        {!revealed ? (
          <Card style={styles.startCard}>
            <Ionicons name="sparkles" size={48} color={Colors.primary} />
            <Text style={styles.startText}>Сформулюйте своє запитання</Text>
            <Text style={styles.startHint}>
              Зосередьтесь на тому, що вас хвилює, та введіть запитання
            </Text>

            {/* Question input */}
            <View style={[styles.inputWrap, questionError != null && styles.inputWrapError]}>
              <TextInput
                style={styles.questionInput}
                value={question}
                onChangeText={(v) => { setQuestion(v); if (validateQuestion(v) === null) setQuestionError(null); }}
                placeholder="Ваше запитання до карт..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{question.length}/200</Text>
            </View>
            {questionError != null && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>{questionError}</Text>
              </View>
            )}

            <Button
              title="Розкласти Карти"
              onPress={drawCards}
              style={{ marginTop: Spacing.lg, alignSelf: 'stretch' }}
            />
          </Card>
        ) : (
          <>
            {/* Question recap */}
            <Card style={styles.questionDisplay}>
              <Text style={styles.questionDisplayLabel}>Ваше запитання:</Text>
              <Text style={styles.questionDisplayText}>"{question}"</Text>
            </Card>

            {cards.map((cardId, index) => {
              const energy = getEnergyById(cardId);
              const img = TAROT_IMAGES[cardId];
              return (
                <Card key={index} style={styles.cardItem}>
                  <Text style={styles.position}>
                    {positionLabels[index] || `Позиція ${index + 1}`}
                  </Text>
                  <View style={styles.cardRow}>
                    {img ? (
                      <Image source={img} style={styles.cardImage} resizeMode="cover" />
                    ) : (
                      <View style={styles.cardImageFallback}>
                        <Text style={styles.cardImageFallbackNum}>{cardId}</Text>
                      </View>
                    )}
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>{cardId}. {energy?.name}</Text>
                      <Text style={styles.cardKeywords}>{energy?.keywords.join(' · ')}</Text>
                      <Text style={styles.cardMeaning}>{energy?.positive}</Text>
                    </View>
                  </View>
                </Card>
              );
            })}

            {/* Ask AI */}
            <TouchableOpacity
              style={styles.aiBtn}
              onPress={() => {
                const ctx = `Розклад "${spreadName}", питання: "${question}". Карти: ${cards.map((id, i) => {
                  const e = getEnergyById(id);
                  return `${positionLabels[i] || `Позиція ${i+1}`} — ${e?.name ?? id}`;
                }).join('; ')}.`;
                if (isPremium) {
                  router.push({ pathname: '/ai/chat', params: { dailyContext: ctx } } as any);
                } else {
                  router.push('/paywall');
                }
              }}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#1E1B4B', '#4338CA']} style={styles.aiBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <Ionicons name={isPremium ? 'sparkles' : 'lock-closed'} size={18} color="#A5B4FC" />
                <Text style={styles.aiBtnText}>Запитати AI Єзотерика</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.disclaimerBox}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.disclaimerText}>Лише для розваг. Не замінює професійних порад.</Text>
            </View>

            <Button
              title="Новий Розклад"
              variant="secondary"
              onPress={() => { setCards([]); setRevealed(false); setQuestion(''); }}
              style={{ marginTop: Spacing.md }}
            />
          </>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 120 },

  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },

  startCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  startText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  startHint: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 20,
  },

  inputWrap: {
    width: '100%',
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginTop: Spacing.sm,
  },
  inputWrapError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  questionInput: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 22,
    minHeight: 72,
    textAlignVertical: 'top',
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
  },

  questionDisplay: {
    marginBottom: Spacing.md,
  },
  questionDisplayLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionDisplayText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontStyle: 'italic',
  },

  cardImage: {
    width: 64,
    height: 96,
    borderRadius: BorderRadius.sm,
  },
  cardImageFallback: {
    width: 64,
    height: 96,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardImageFallbackNum: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  aiBtn: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  aiBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  aiBtnText: {
    color: '#A5B4FC',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  cardItem: { marginBottom: Spacing.md },
  position: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  cardInfo: { flex: 1 },
  cardName: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  cardKeywords: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  cardMeaning: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginTop: Spacing.xs,
  },

  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.sm,
  },
  disclaimerText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 16,
    flex: 1,
  },
});
