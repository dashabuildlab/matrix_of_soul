import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { calculateMatrix } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';
import { useAppStore } from '../../stores/useAppStore';

interface Errors {
  day?: string;
  month?: string;
  year?: string;
}

export default function CreateMatrixScreen() {
  const router = useRouter();
  const addMatrix = useAppStore((s) => s.addMatrix);
  const [name, setName] = useState('');
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [calcError, setCalcError] = useState('');
  const [result, setResult] = useState<ReturnType<typeof calculateMatrix> | null>(null);

  const validate = (): boolean => {
    const newErrors: Errors = {};
    const d = parseInt(day, 10);
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);

    if (!day || isNaN(d) || d < 1 || d > 31) newErrors.day = 'від 1 до 31';
    if (!month || isNaN(m) || m < 1 || m > 12) newErrors.month = 'від 1 до 12';
    if (!year || isNaN(y) || y < 1900 || y > new Date().getFullYear())
      newErrors.year = '1900–' + new Date().getFullYear();

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCalculate = () => {
    setCalcError('');
    if (!validate()) return;

    try {
      const d = parseInt(day, 10);
      const m = parseInt(month, 10);
      const y = parseInt(year, 10);
      const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const matrix = calculateMatrix(dateStr);
      setResult(matrix);
    } catch {
      setCalcError('Не вдалося розрахувати матрицю. Перевірте дату.');
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

  const clearError = (field: keyof Errors) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  return (
    <>
      {/* Close button in header */}
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

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Ім'я (необов'язково)</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Наприклад: Моя матриця"
          placeholderTextColor={Colors.textMuted}
          testID="matrix-name-input"
        />

        <Text style={styles.label}>Дата народження</Text>
        <View style={styles.dateRow}>
          {/* Day */}
          <View style={styles.dateFieldWrap}>
            <TextInput
              style={[styles.input, styles.dateInput, errors.day && styles.inputError]}
              value={day}
              onChangeText={(v) => { setDay(v); clearError('day'); }}
              placeholder="ДД"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={2}
              testID="matrix-day-input"
            />
            {errors.day && <Text style={styles.errorText}>{errors.day}</Text>}
          </View>

          {/* Month */}
          <View style={styles.dateFieldWrap}>
            <TextInput
              style={[styles.input, styles.dateInput, errors.month && styles.inputError]}
              value={month}
              onChangeText={(v) => { setMonth(v); clearError('month'); }}
              placeholder="ММ"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={2}
              testID="matrix-month-input"
            />
            {errors.month && <Text style={styles.errorText}>{errors.month}</Text>}
          </View>

          {/* Year */}
          <View style={[styles.dateFieldWrap, { flex: 1.5 }]}>
            <TextInput
              style={[styles.input, errors.year && styles.inputError]}
              value={year}
              onChangeText={(v) => { setYear(v); clearError('year'); }}
              placeholder="РРРР"
              placeholderTextColor={Colors.textMuted}
              keyboardType="number-pad"
              maxLength={4}
              testID="matrix-year-input"
            />
            {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
          </View>
        </View>

        {calcError ? (
          <View style={styles.calcErrorBox}>
            <Ionicons name="alert-circle-outline" size={16} color={Colors.error} />
            <Text style={styles.calcErrorText}>{calcError}</Text>
          </View>
        ) : null}

        <Button
          title="Розрахувати"
          onPress={handleCalculate}
          style={{ marginTop: Spacing.lg }}
          testID="matrix-calculate-btn"
        />

        {result && (
          <View style={styles.resultSection} testID="matrix-result-section">
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
              testID="matrix-save-btn"
            />
          </View>
        )}
      </ScrollView>
    </>
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
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  dateRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'flex-start',
  },
  dateFieldWrap: {
    flex: 1,
  },
  dateInput: { width: '100%' },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    marginTop: 4,
    marginLeft: 2,
  },
  calcErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  calcErrorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    flex: 1,
  },
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
