import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { calculateMatrix, calculateCompatibility } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';

export default function CompatibilityScreen() {
  const [date1, setDate1] = useState({ day: '', month: '', year: '' });
  const [date2, setDate2] = useState({ day: '', month: '', year: '' });
  const [result, setResult] = useState<ReturnType<typeof calculateCompatibility> | null>(null);

  const handleCalculate = () => {
    const d1 = parseInt(date1.day), m1 = parseInt(date1.month), y1 = parseInt(date1.year);
    const d2 = parseInt(date2.day), m2 = parseInt(date2.month), y2 = parseInt(date2.year);

    if (!d1 || !m1 || !y1 || !d2 || !m2 || !y2) {
      Alert.alert('Помилка', 'Заповніть обидві дати');
      return;
    }

    const dateStr1 = `${y1}-${String(m1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
    const dateStr2 = `${y2}-${String(m2).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;
    const matrix1 = calculateMatrix(dateStr1);
    const matrix2 = calculateMatrix(dateStr2);
    setResult(calculateCompatibility(matrix1, matrix2));
  };

  const DateInputGroup = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: typeof date1;
    onChange: (v: typeof date1) => void;
  }) => (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dateRow}>
        <TextInput
          style={[styles.input, styles.dateInput]}
          value={value.day}
          onChangeText={(t) => onChange({ ...value, day: t })}
          placeholder="ДД"
          placeholderTextColor={Colors.textMuted}
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.dateInput]}
          value={value.month}
          onChangeText={(t) => onChange({ ...value, month: t })}
          placeholder="ММ"
          placeholderTextColor={Colors.textMuted}
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.yearInput]}
          value={value.year}
          onChangeText={(t) => onChange({ ...value, year: t })}
          placeholder="РРРР"
          placeholderTextColor={Colors.textMuted}
          keyboardType="number-pad"
          maxLength={4}
        />
      </View>
    </View>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <DateInputGroup label="Партнер 1" value={date1} onChange={setDate1} />
      <DateInputGroup label="Партнер 2" value={date2} onChange={setDate2} />

      <Button
        title="Розрахувати Сумісність"
        onPress={handleCalculate}
        style={{ marginTop: Spacing.lg }}
      />

      {result && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>Сумісність</Text>
          {[
            { label: 'Загальна', value: result.overall },
            { label: "Зв'язок Душ", value: result.soulConnection },
            { label: "Зв'язок Доль", value: result.destinyConnection },
            { label: 'Кармічний Урок', value: result.karmicLesson },
          ].map((item) => {
            const energy = getEnergyById(item.value);
            return (
              <Card key={item.label} style={styles.resultCard}>
                <Text style={styles.resultLabel}>{item.label}</Text>
                <View style={styles.resultRow}>
                  <EnergyBadge energyId={item.value} size="md" showName />
                  <Text style={styles.resultDesc}>{energy?.advice}</Text>
                </View>
              </Card>
            );
          })}
        </View>
      )}
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
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateRow: { flexDirection: 'row', gap: Spacing.sm },
  dateInput: { flex: 1 },
  yearInput: { flex: 1.5 },
  resultSection: { marginTop: Spacing.xl },
  resultTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  resultCard: { marginBottom: Spacing.md },
  resultLabel: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  resultDesc: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
});
