import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { getDailyEnergy } from '../../lib/matrix-calc';
import { useAppStore, Mood } from '../../stores/useAppStore';

const MOODS: { key: Mood; emoji: string; label: string; color: string }[] = [
  { key: 'great', emoji: '🌟', label: 'Чудово', color: Colors.moodGreat },
  { key: 'good', emoji: '😊', label: 'Добре', color: Colors.moodGood },
  { key: 'neutral', emoji: '😐', label: 'Нормально', color: Colors.moodNeutral },
  { key: 'bad', emoji: '😔', label: 'Погано', color: Colors.moodBad },
  { key: 'terrible', emoji: '😢', label: 'Жахливо', color: Colors.moodTerrible },
];

export default function NewJournalEntryScreen() {
  const router = useRouter();
  const addJournalEntry = useAppStore((s) => s.addJournalEntry);
  const [mood, setMood] = useState<Mood | null>(null);
  const [text, setText] = useState('');
  const dailyEnergy = getDailyEnergy();

  const handleSave = () => {
    if (!mood) return;
    addJournalEntry({
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('uk-UA'),
      mood,
      energyOfDay: dailyEnergy,
      reflectionText: text,
      createdAt: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Energy of day */}
      <View style={styles.energyRow}>
        <Text style={styles.label}>Енергія дня</Text>
        <EnergyBadge energyId={dailyEnergy} size="sm" showName />
      </View>

      {/* Mood selector */}
      <Text style={styles.label}>Як ви себе почуваєте?</Text>
      <View style={styles.moodRow}>
        {MOODS.map((m) => (
          <TouchableOpacity
            key={m.key}
            onPress={() => setMood(m.key)}
            activeOpacity={0.7}
            style={[
              styles.moodItem,
              mood === m.key && { borderColor: m.color, backgroundColor: m.color + '20' },
            ]}
          >
            <Text style={styles.moodEmoji}>{m.emoji}</Text>
            <Text
              style={[
                styles.moodLabel,
                mood === m.key && { color: m.color },
              ]}
            >
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reflection */}
      <Text style={styles.label}>Ваші думки</Text>
      <TextInput
        style={styles.textArea}
        value={text}
        onChangeText={setText}
        placeholder="Запишіть свої думки, відчуття, спостереження..."
        placeholderTextColor={Colors.textMuted}
        multiline
        numberOfLines={8}
        textAlignVertical="top"
      />

      <Button
        title="Зберегти"
        onPress={handleSave}
        disabled={!mood}
        style={{ marginTop: Spacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  energyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  moodRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  moodItem: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  moodEmoji: { fontSize: 24, marginBottom: 4 },
  moodLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 200,
    lineHeight: 24,
  },
});
