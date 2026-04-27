import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useI18n } from '@/lib/i18n';

interface CardPickerDeckProps {
  count: number;
  totalCards?: number;
  onComplete: (pickedCardIds: number[]) => void;
}

export function CardPickerDeck({ count, totalCards = 78, onComplete }: CardPickerDeckProps) {
  const { locale } = useI18n();
  const isUk = locale === 'uk';

  const shuffledDeck = useMemo(
    () => Array.from({ length: totalCards }, (_, i) => i + 1).sort(() => Math.random() - 0.5),
    []
  );
  const [picked, setPicked] = useState<number[]>([]);

  const handlePick = (cardId: number) => {
    if (picked.includes(cardId) || picked.length >= count) return;
    const next = [...picked, cardId];
    setPicked(next);
    if (next.length >= count) {
      setTimeout(() => onComplete(next), 500);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {isUk ? 'Оберіть карти' : 'Choose your cards'}
      </Text>
      <Text style={styles.counter}>
        {picked.length} / {count}
      </Text>
      <Text style={styles.hint}>
        {isUk
          ? 'Зосередьтесь на запитанні та оберіть карти, які вас притягують'
          : 'Focus on your question and choose the cards that attract you'}
      </Text>
      <View style={styles.deck}>
        {shuffledDeck.map((cardId) => {
          const isPicked = picked.includes(cardId);
          const allPicked = picked.length >= count;
          return (
            <TouchableOpacity
              key={cardId}
              activeOpacity={0.7}
              disabled={isPicked || allPicked}
              onPress={() => handlePick(cardId)}
              style={[
                styles.card,
                isPicked && styles.cardPicked,
                allPicked && !isPicked && styles.cardDone,
              ]}
            >
              <LinearGradient
                colors={isPicked ? ['#F5C542', '#C8901A'] : ['#1E1B4B', '#312E81']}
                style={styles.cardInner}
              >
                {isPicked ? (
                  <Ionicons name="checkmark" size={16} color="#1A0A3E" />
                ) : (
                  <Text style={styles.cardSymbol}>✦</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>
      {picked.length >= count && (
        <Text style={styles.doneText}>
          {isUk ? '✦ Карти обрано — розкриваємо...' : '✦ Cards chosen — revealing...'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: Spacing.sm },
  title: {
    color: Colors.text, fontSize: FontSize.lg, fontWeight: '800',
    textAlign: 'center', marginBottom: 4,
  },
  counter: {
    color: Colors.accent, fontSize: FontSize.md, fontWeight: '700',
    textAlign: 'center', marginBottom: Spacing.sm,
  },
  hint: {
    color: Colors.textMuted, fontSize: FontSize.sm,
    textAlign: 'center', marginBottom: Spacing.lg,
  },
  deck: {
    flexDirection: 'row', flexWrap: 'wrap',
    justifyContent: 'center', gap: 6,
  },
  card: {
    width: 44, height: 66, borderRadius: 6, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
  },
  cardPicked: {
    borderWidth: 2, borderColor: Colors.accent, opacity: 0.4,
  },
  cardDone: { opacity: 0.5 },
  cardInner: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  cardSymbol: { color: 'rgba(139,92,246,0.4)', fontSize: 16 },
  doneText: {
    color: Colors.accent, fontSize: FontSize.sm, fontWeight: '700',
    textAlign: 'center', marginTop: Spacing.md,
  },
});
