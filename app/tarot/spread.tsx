import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { getEnergyById } from '../../constants/energies';
import { Button } from '../../components/ui/Button';

export default function SpreadScreen() {
  const { type, cards: cardsCount } = useLocalSearchParams<{
    type: string;
    cards: string;
  }>();
  const count = parseInt(cardsCount || '3');
  const [cards, setCards] = useState<number[]>([]);
  const [revealed, setRevealed] = useState(false);

  const drawCards = () => {
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
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{type || 'Розклад'}</Text>
      <Text style={styles.subtitle}>{count} карт</Text>

      {!revealed ? (
        <Card style={styles.startCard}>
          <Ionicons name="sparkles" size={48} color={Colors.primary} />
          <Text style={styles.startText}>
            Зосередьтесь на своєму питанні
          </Text>
          <Text style={styles.startHint}>
            Подумайте про те, що вас хвилює, та натисніть кнопку
          </Text>
          <Button
            title="Розкласти Карти"
            onPress={drawCards}
            style={{ marginTop: Spacing.lg, alignSelf: 'stretch' }}
          />
        </Card>
      ) : (
        <>
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

          <Button
            title="Новий Розклад"
            variant="secondary"
            onPress={() => {
              setCards([]);
              setRevealed(false);
            }}
            style={{ marginTop: Spacing.md }}
          />
        </>
      )}
    </ScrollView>
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
    paddingVertical: Spacing.xxl,
  },
  startText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginTop: Spacing.lg,
    textAlign: 'center',
  },
  startHint: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.sm,
    textAlign: 'center',
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
});
