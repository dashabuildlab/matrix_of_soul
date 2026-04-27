import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { calculateMatrix } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';
import { useAppStore } from '../../stores/useAppStore';

export default function CreateMatrixScreen() {
  const router = useRouter();
  const addMatrix = useAppStore((s) => s.addMatrix);
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [result, setResult] = useState<ReturnType<typeof calculateMatrix> | null>(null);

  const handleCalculate = () => {
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (isNaN(d) || isNaN(m) || isNaN(y) || d < 1 || d > 31 || m < 1 || m > 12 || y < 1900 || y > 2030) {
      Alert.alert('Помилка', 'Введіть коректну дату народження');
      return;
    }

    try {
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const matrix = calculateMatrix(dateStr);
      setResult(matrix);
    } catch {
      Alert.alert('Помилка', 'Не вдалося розрахувати матрицю. Перевірте дату.');
    }
  };

  const handleSave = () => {
    if (!result) return;
    addMatrix({
      id: Date.now().toString(),
      name: name || `Матриця ${result.birthDate}`,
      birthDate: result.birthDate,
      data: result,
      createdAt: new Date().toISOString(),
    });
    router.back();
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Ім'я (необов'язково)</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Наприклад: Моя матриця"
        placeholderTextColor={Colors.textMuted}
      />

      <Text style={styles.label}>Дата народження</Text>
      <View style={styles.dateRow}>
        <TextInput
          style={[styles.input, styles.dateInput]}
          value={day}
          onChangeText={setDay}
          placeholder="ДД"
          placeholderTextColor={Colors.textMuted}
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.dateInput]}
          value={month}
          onChangeText={setMonth}
          placeholder="ММ"
          placeholderTextColor={Colors.textMuted}
          keyboardType="number-pad"
          maxLength={2}
        />
        <TextInput
          style={[styles.input, styles.yearInput]}
          value={year}
          onChangeText={setYear}
          placeholder="РРРР"
          placeholderTextColor={Colors.textMuted}
          keyboardType="number-pad"
          maxLength={4}
        />
      </View>

      <Button
        title="Розрахувати"
        onPress={handleCalculate}
        style={{ marginTop: Spacing.lg }}
      />

      {result && (
        <View style={styles.resultSection}>
          <Text style={styles.resultTitle}>Результат</Text>

          <Card style={styles.resultCard}>
            <Text style={styles.resultLabel}>Особистість</Text>
            <View style={styles.resultRow}>
              <EnergyBadge energyId={result.personality} size="lg" showName />
              <Text style={styles.resultDesc}>
                {getEnergyById(result.personality)?.positive}
              </Text>
            </View>
          </Card>

          <View style={styles.miniGrid}>
            {[
              { label: 'Душа', value: result.soul },
              { label: 'Доля', value: result.destiny },
              { label: 'Духовне', value: result.spiritual },
              { label: 'Матеріальне', value: result.material },
              { label: 'Талант (Бог)', value: result.talentFromGod },
              { label: 'Талант (Рід)', value: result.talentFromFamily },
              { label: 'Призначення', value: result.purpose },
              { label: 'Кармічний хвіст', value: result.karmicTail },
              { label: 'Центр', value: result.center },
            ].map((item) => (
              <Card key={item.label} style={styles.miniCard}>
                <Text style={styles.miniLabel}>{item.label}</Text>
                <EnergyBadge energyId={item.value} size="sm" showName />
              </Card>
            ))}
          </View>

          <Button
            title="Зберегти Матрицю"
            onPress={handleSave}
            style={{ marginTop: Spacing.lg }}
          />
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
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
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
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  miniCard: {
    width: '31%',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  miniLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
});
