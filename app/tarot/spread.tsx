import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { getEnergyById } from '../../constants/energies';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../stores/useAppStore';

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
  const isFreeSpread = type === 'three'; // "Три карти" is always free

  const isPremium     = useAppStore((s) => s.isPremium);
  const tokens        = useAppStore((s) => s.tokens);
  const spendCrystals = useAppStore((s) => s.spendCrystals);

  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState(false);
  const [cards, setCards] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  const drawCards = () => {
    if (!question.trim()) {
      setQuestionError(true);
      return;
    }
    setQuestionError(false);

    // Non-premium non-free spreads cost 1 crystal
    if (!isPremium && !isFreeSpread) {
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
            <View style={[styles.inputWrap, questionError && styles.inputWrapError]}>
              <TextInput
                style={styles.questionInput}
                value={question}
                onChangeText={(v) => { setQuestion(v); if (v.trim()) setQuestionError(false); }}
                placeholder="Ваше запитання до карт..."
                placeholderTextColor={Colors.textMuted}
                multiline
                maxLength={200}
              />
              <Text style={styles.charCount}>{question.length}/200</Text>
            </View>
            {questionError && (
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
                <Text style={styles.errorText}>Введіть запитання перед розкладом</Text>
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
              return (
                <Card key={index} style={styles.cardItem}>
                  <Text style={styles.position}>
                    {positionLabels[index] || `Позиція ${index + 1}`}
                  </Text>
                  <View style={styles.cardRow}>
                    <EnergyBadge energyId={cardId} size="lg" />
                    <View style={styles.cardInfo}>
                      <Text style={styles.cardName}>
                        {cardId}. {energy?.name}
                      </Text>
                      <Text style={styles.cardKeywords}>
                        {energy?.keywords.join(' · ')}
                      </Text>
                      <Text style={styles.cardMeaning}>
                        {energy?.positive}
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}

            <View style={styles.disclaimerBox}>
              <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
              <Text style={styles.disclaimerText}>Лише для розваг. Не замінює професійних порад.</Text>
            </View>

            <Button
              title="Новий Розклад"
              variant="secondary"
              onPress={() => {
                setCards([]);
                setRevealed(false);
                setQuestion('');
              }}
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
  },
  subtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
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
