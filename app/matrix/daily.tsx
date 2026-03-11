import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { getDailyEnergy, calculateMatrix } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';

export default function DailyMatrixScreen() {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const dailyEnergy = getDailyEnergy(today);
  const energy = getEnergyById(dailyEnergy);
  const matrix = calculateMatrix(dateStr);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.date}>
        {today.toLocaleDateString('uk-UA', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })}
      </Text>

      <Card style={styles.mainCard}>
        <EnergyBadge energyId={dailyEnergy} size="lg" />
        <Text style={styles.energyName}>
          {dailyEnergy}. {energy?.name}
        </Text>
        <Text style={styles.keywords}>
          {energy?.keywords.join(' · ')}
        </Text>
        <Text style={styles.advice}>{energy?.advice}</Text>
      </Card>

      <Text style={styles.sectionTitle}>Енергії Дня</Text>
      <View style={styles.grid}>
        {[
          { label: 'Загальна', value: matrix.personality },
          { label: 'Емоції', value: matrix.soul },
          { label: 'Дії', value: matrix.destiny },
          { label: 'Духовне', value: matrix.spiritual },
        ].map((item) => (
          <Card key={item.label} style={styles.gridItem}>
            <Text style={styles.gridLabel}>{item.label}</Text>
            <EnergyBadge energyId={item.value} size="md" showName />
          </Card>
        ))}
      </View>

      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>Порада дня</Text>
        <Text style={styles.tipText}>
          {energy?.positive}
        </Text>
        <Text style={styles.tipWarning}>
          Остерігайтесь: {energy?.negative}
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  date: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
    textTransform: 'capitalize',
  },
  mainCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  energyName: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginTop: Spacing.md,
  },
  keywords: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
  advice: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    marginTop: Spacing.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  gridItem: {
    width: '48%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  gridLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  tipCard: { paddingVertical: Spacing.lg },
  tipTitle: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  tipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginBottom: Spacing.sm,
  },
  tipWarning: {
    color: Colors.error,
    fontSize: FontSize.sm,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
