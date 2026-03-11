import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { getDailyEnergy } from '../../lib/matrix-calc';
import { useAppStore, Mood } from '../../stores/useAppStore';

const MOOD_EMOJI: Record<Mood, string> = {
  great: '🌟',
  good: '😊',
  neutral: '😐',
  bad: '😔',
  terrible: '😢',
};

const MOOD_LABELS: Record<Mood, string> = {
  great: 'Чудово',
  good: 'Добре',
  neutral: 'Нормально',
  bad: 'Погано',
  terrible: 'Жахливо',
};

export default function JournalScreen() {
  const router = useRouter();
  const entries = useAppStore((s) => s.journalEntries);
  const dailyEnergy = getDailyEnergy();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Today's prompt */}
      <Card style={styles.todayCard}>
        <View style={styles.todayHeader}>
          <Text style={styles.todayLabel}>Сьогодні</Text>
          <EnergyBadge energyId={dailyEnergy} size="sm" />
        </View>
        <Text style={styles.todayQuestion}>
          Як ви себе почуваєте сьогодні?
        </Text>
        <Text style={styles.todayHint}>
          Запишіть свої думки та відчуття. Енергія дня — {dailyEnergy}
        </Text>
        <Button
          title="Новий Запис"
          onPress={() => router.push('/journal/new')}
          style={{ marginTop: Spacing.md }}
        />
      </Card>

      {/* Entries */}
      {entries.length > 0 ? (
        <>
          <Text style={styles.sectionTitle}>Записи</Text>
          {entries.map((entry) => (
            <TouchableOpacity
              key={entry.id}
              activeOpacity={0.7}
              onPress={() => router.push(`/journal/${entry.id}`)}
            >
              <Card style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <Text style={styles.entryMood}>
                    {MOOD_EMOJI[entry.mood]}
                  </Text>
                  <View style={styles.entryInfo}>
                    <Text style={styles.entryDate}>{entry.date}</Text>
                    <Text style={styles.entryMoodLabel}>
                      {MOOD_LABELS[entry.mood]}
                    </Text>
                  </View>
                  <EnergyBadge energyId={entry.energyOfDay} size="sm" />
                </View>
                <Text style={styles.entryPreview} numberOfLines={2}>
                  {entry.reflectionText}
                </Text>
              </Card>
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <Card style={styles.emptyCard}>
          <Ionicons
            name="journal-outline"
            size={48}
            color={Colors.textMuted}
          />
          <Text style={styles.emptyText}>
            Поки що записів немає
          </Text>
          <Text style={styles.emptyHint}>
            Почніть вести щоденник рефлексій
          </Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  todayCard: { marginBottom: Spacing.lg },
  todayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  todayLabel: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  todayQuestion: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  todayHint: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  entryCard: { marginBottom: Spacing.sm },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  entryMood: { fontSize: 28 },
  entryInfo: { flex: 1 },
  entryDate: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  entryMoodLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  entryPreview: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 20,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginTop: Spacing.lg,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptyHint: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
  },
});
