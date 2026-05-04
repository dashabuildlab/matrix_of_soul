import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { getEnergyById } from '../../constants/energies';
import { useAppStore, Mood } from '../../stores/useAppStore';

const MOOD_EMOJI: Record<Mood, string> = {
  great: '🌟',
  good: '😊',
  neutral: '😐',
  bad: '😔',
  terrible: '😢',
};

export default function JournalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const entry = useAppStore((s) => s.journalEntries.find((e) => e.id === id));

  if (!entry) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Запис не знайдено</Text>
      </View>
    );
  }

  const energy = getEnergyById(entry.energyOfDay);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.date}>{entry.date}</Text>
        <Text style={styles.mood}>{MOOD_EMOJI[entry.mood]}</Text>
      </View>

      <Card style={styles.energyCard}>
        <Text style={styles.label}>Енергія дня</Text>
        <View style={styles.energyRow}>
          <EnergyBadge energyId={entry.energyOfDay} size="md" showName />
          <Text style={styles.energyAdvice}>{energy?.advice}</Text>
        </View>
      </Card>

      <Card style={styles.textCard}>
        <Text style={styles.label}>Рефлексія</Text>
        <Text style={styles.reflectionText}>{entry.reflectionText}</Text>
      </Card>

      {entry.aiInsight && (
        <Card style={styles.aiCard}>
          <Text style={styles.aiLabel}>AI Інсайт</Text>
          <Text style={styles.aiText}>{entry.aiInsight}</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  notFound: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  date: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  mood: { fontSize: 32 },
  label: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  energyCard: { marginBottom: Spacing.md },
  energyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  energyAdvice: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  textCard: { marginBottom: Spacing.md },
  reflectionText: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  aiCard: {
    borderColor: Colors.primary,
    marginBottom: Spacing.md,
  },
  aiLabel: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  aiText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
});
