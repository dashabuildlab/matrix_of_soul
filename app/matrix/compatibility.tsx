import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { calculateMatrix, calculateCompatibility } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';

// ── Types ────────────────────────────────────────────────────────────────────
interface DateFields { day: string; month: string; year: string }
interface FieldErrors { day?: string; month?: string; year?: string }

interface DateInputGroupProps {
  label: string;
  value: DateFields;
  onChange: (v: DateFields) => void;
  errors: FieldErrors;
  onErrors: (e: FieldErrors) => void;
  dayRef?: React.RefObject<TextInput>;
  monthRef: React.RefObject<TextInput>;
  yearRef: React.RefObject<TextInput>;
  nextDayRef?: React.RefObject<TextInput>;
}

// ── Validation ───────────────────────────────────────────────────────────────
function validateDate(v: DateFields): FieldErrors {
  const errors: FieldErrors = {};
  const d = parseInt(v.day, 10);
  const m = parseInt(v.month, 10);
  const y = parseInt(v.year, 10);

  if (!v.day)                              errors.day   = 'Введіть день';
  else if (isNaN(d) || d < 1 || d > 31)   errors.day   = 'День 1–31';

  if (!v.month)                            errors.month = 'Введіть місяць';
  else if (isNaN(m) || m < 1 || m > 12)   errors.month = 'Місяць 1–12';

  if (!v.year)                             errors.year  = 'Введіть рік';
  else if (isNaN(y) || y < 1900 || y > new Date().getFullYear())
    errors.year = `Рік 1900–${new Date().getFullYear()}`;

  return errors;
}

// ── DateInputGroup — defined OUTSIDE the screen to avoid remounts ─────────
function DateInputGroup({
  label, value, onChange, errors, onErrors,
  dayRef, monthRef, yearRef, nextDayRef,
}: DateInputGroupProps) {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.dateRow}>

        {/* Day */}
        <View style={styles.fieldWrap}>
          <TextInput
            ref={dayRef}
            style={[styles.input, errors.day ? styles.inputError : null]}
            value={value.day}
            onChangeText={(t) => {
              onChange({ ...value, day: t });
              if (errors.day) onErrors({ ...errors, day: undefined });
              if (t.length === 2) monthRef.current?.focus();
            }}
            placeholder="ДД"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={2}
            returnKeyType="next"
            onSubmitEditing={() => monthRef.current?.focus()}
          />
          {errors.day ? <Text style={styles.errorText}>{errors.day}</Text> : null}
        </View>

        {/* Month */}
        <View style={styles.fieldWrap}>
          <TextInput
            ref={monthRef}
            style={[styles.input, errors.month ? styles.inputError : null]}
            value={value.month}
            onChangeText={(t) => {
              onChange({ ...value, month: t });
              if (errors.month) onErrors({ ...errors, month: undefined });
              if (t.length === 2) yearRef.current?.focus();
            }}
            placeholder="ММ"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={2}
            returnKeyType="next"
            onSubmitEditing={() => yearRef.current?.focus()}
          />
          {errors.month ? <Text style={styles.errorText}>{errors.month}</Text> : null}
        </View>

        {/* Year */}
        <View style={[styles.fieldWrap, styles.yearWrap]}>
          <TextInput
            ref={yearRef}
            style={[styles.input, errors.year ? styles.inputError : null]}
            value={value.year}
            onChangeText={(t) => {
              onChange({ ...value, year: t });
              if (errors.year) onErrors({ ...errors, year: undefined });
              if (t.length === 4 && nextDayRef) nextDayRef.current?.focus();
            }}
            placeholder="РРРР"
            placeholderTextColor={Colors.textMuted}
            keyboardType="number-pad"
            maxLength={4}
            returnKeyType={nextDayRef ? 'next' : 'done'}
            onSubmitEditing={() => nextDayRef?.current?.focus()}
          />
          {errors.year ? <Text style={styles.errorText}>{errors.year}</Text> : null}
        </View>

      </View>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────────
export default function CompatibilityScreen() {
  const [date1, setDate1] = useState<DateFields>({ day: '', month: '', year: '' });
  const [date2, setDate2] = useState<DateFields>({ day: '', month: '', year: '' });
  const [errors1, setErrors1] = useState<FieldErrors>({});
  const [errors2, setErrors2] = useState<FieldErrors>({});
  const [result, setResult] = useState<ReturnType<typeof calculateCompatibility> | null>(null);

  // Refs for focus chain: d1d → d1m → d1y → d2d → d2m → d2y
  const d1m = useRef<TextInput>(null);
  const d1y = useRef<TextInput>(null);
  const d2d = useRef<TextInput>(null);
  const d2m = useRef<TextInput>(null);
  const d2y = useRef<TextInput>(null);

  const handleCalculate = () => {
    const e1 = validateDate(date1);
    const e2 = validateDate(date2);
    setErrors1(e1);
    setErrors2(e2);
    if (Object.keys(e1).length > 0 || Object.keys(e2).length > 0) return;

    const d1 = parseInt(date1.day), m1 = parseInt(date1.month), y1 = parseInt(date1.year);
    const d2 = parseInt(date2.day), m2 = parseInt(date2.month), y2 = parseInt(date2.year);

    const dateStr1 = `${y1}-${String(m1).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
    const dateStr2 = `${y2}-${String(m2).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;
    setResult(calculateCompatibility(calculateMatrix(dateStr1), calculateMatrix(dateStr2)));
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#1E1B4B', Colors.bg]} style={styles.header}>
        <Text style={styles.headerTitle}>Сумісність</Text>
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="close" size={22} color={Colors.text} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <DateInputGroup
          label="Партнер 1"
          value={date1}
          onChange={setDate1}
          errors={errors1}
          onErrors={setErrors1}
          monthRef={d1m}
          yearRef={d1y}
          nextDayRef={d2d}
        />

        <DateInputGroup
          label="Партнер 2"
          value={date2}
          onChange={setDate2}
          errors={errors2}
          onErrors={setErrors2}
          dayRef={d2d}
          monthRef={d2m}
          yearRef={d2y}
        />

        <Button
          title="Розрахувати Сумісність"
          onPress={handleCalculate}
          style={{ marginTop: Spacing.lg }}
        />

        {result && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Результат</Text>
            {[
              { label: 'Загальна',        value: result.overall },
              { label: "Зв'язок Душ",     value: result.soulConnection },
              { label: "Зв'язок Доль",    value: result.destinyConnection },
              { label: 'Кармічний Урок',  value: result.karmicLesson },
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
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 56,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    position: 'relative',
  },
  headerTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700' },
  closeBtn: {
    position: 'absolute',
    right: Spacing.lg,
    top: 56,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 120 },

  group: { marginBottom: Spacing.sm },
  label: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dateRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  fieldWrap: { flex: 1 },
  yearWrap: { flex: 1.5 },

  input: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    textAlign: 'center',
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    color: Colors.error,
    fontSize: 10,
    marginTop: 4,
    textAlign: 'center',
  },

  resultSection: { marginTop: Spacing.xl },
  resultTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.md },
  resultCard: { marginBottom: Spacing.md },
  resultLabel: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  resultDesc: { flex: 1, color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 },
});
