import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { getDailyEnergy, calculateMatrix } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';
import { askClaude } from '../../lib/claude';
import { useAppStore } from '../../stores/useAppStore';

const SYSTEM_PROMPT =
  'Ти — езотеричний аналітик Матриці Долі. Напиши персональний прогноз на день (4–5 абзаців) на основі 4 енергій. Стиль: тепло, натхненно, практично. Мова — українська. Без вступів, підписів та нумерації.';

const GRID_POSITIONS = [
  { label: 'Загальна', key: 'personality' as const },
  { label: 'Емоції',   key: 'soul'        as const },
  { label: 'Дії',      key: 'destiny'     as const },
  { label: 'Духовне',  key: 'spiritual'   as const },
];

export default function DailyMatrixScreen() {
  const isPremium           = useAppStore((s) => s.isPremium);
  const dailyMatrixCache    = useAppStore((s) => s.dailyMatrixCache);
  const setDailyMatrixCache = useAppStore((s) => s.setDailyMatrixCache);
  const userBirthDate       = useAppStore((s) => s.userBirthDate);
  const tokens              = useAppStore((s) => s.tokens);
  const spendCrystals       = useAppStore((s) => s.spendCrystals);

  const today   = new Date();
  const dateStr = today.toISOString().split('T')[0];

  const dailyEnergy = getDailyEnergy(today);
  const energy      = getEnergyById(dailyEnergy);
  const matrix      = calculateMatrix(dateStr);

  // Personal destiny matrix (computed from stored birth date)
  const personalMatrix = React.useMemo(() => {
    if (!userBirthDate) return null;
    try {
      // userBirthDate stored as DD.MM.YYYY
      const parts = userBirthDate.split('.');
      if (parts.length === 3) {
        return calculateMatrix(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      // Might already be YYYY-MM-DD
      return calculateMatrix(userBirthDate);
    } catch { return null; }
  }, [userBirthDate]);

  const [forecast, setForecast] = useState<string>(dailyMatrixCache[dateStr] ?? '');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [comparison, setComparison] = useState<string>('');

  const generateForecast = async () => {
    if (loading) return;

    // Non-premium users spend 3 crystals; if not enough → paywall
    if (!isPremium && !dailyMatrixCache[dateStr]) {
      if (tokens < 3) {
        router.push('/paywall' as any);
        return;
      }
      spendCrystals(3);
    }

    setLoading(true);
    setError('');

    try {
      const descriptions = GRID_POSITIONS.map((p) => {
        const e = getEnergyById(matrix[p.key]);
        return `${p.label}: Архетип ${matrix[p.key]} "${e?.name}" (${e?.keywords.slice(0, 3).join(', ')})`;
      }).join('\n');

      const dateLabel = today.toLocaleDateString('uk-UA', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });

      // Build personal matrix context if available
      let personalContext = '';
      if (personalMatrix) {
        const persEnergy = getEnergyById(personalMatrix.personality);
        const soulEnergy = getEnergyById(personalMatrix.soul);
        personalContext = `\n\nОсобиста матриця долі користувача: Особистість=${personalMatrix.personality} "${persEnergy?.name}", Душа=${personalMatrix.soul} "${soulEnergy?.name}". Додай в кінці прогнозу одне речення порівняння енергій сьогодні з особистою матрицею долі — наприклад "Сьогоднішня енергія Дня особливо резонує з вашою природою [пояснення]" або "Порівняно з вашою матрицею долі, сьогодні..."`;
      }

      const result = await askClaude(
        SYSTEM_PROMPT,
        [],
        `Дата: ${dateLabel}\n\nЕнергії дня:\n${descriptions}${personalContext}\n\nСкладіть натхненний прогноз на день.`,
        1200,
      );

      setForecast(result);
      setDailyMatrixCache(dateStr, result);

      // Generate short comparison teaser if personal matrix available
      if (personalMatrix) {
        const persEnergy = getEnergyById(personalMatrix.personality);
        const todayEnergy = getEnergyById(matrix.personality);
        const compResult = await askClaude(
          'Ти — езотеричний аналітик. Відповідай ТІЛЬКИ одним коротким реченням (до 20 слів) українською мовою.',
          [],
          `Особистість за матрицею долі: ${personalMatrix.personality} "${persEnergy?.name}". Енергія дня: ${matrix.personality} "${todayEnergy?.name}". Напиши одне надихаюче речення про резонанс цих двох енергій сьогодні.`,
          150,
        );
        setComparison(compResult);
      }
    } catch {
      setError('Не вдалося отримати прогноз. Спробуйте пізніше.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isPremium && !dailyMatrixCache[dateStr]) {
      generateForecast();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium]);

  const dateLabel = today.toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* Date */}
      <Text style={styles.date}>{dateLabel}</Text>

      {/* Main energy card */}
      <Card style={styles.mainCard}>
        <EnergyBadge energyId={dailyEnergy} size="lg" />
        <Text style={styles.energyName}>{dailyEnergy}. {energy?.name}</Text>
        <Text style={styles.keywords}>{energy?.keywords.join(' · ')}</Text>
        <Text style={styles.advice}>{energy?.advice}</Text>
      </Card>

      {/* 4-position grid */}
      <Text style={styles.sectionTitle}>Енергії Дня</Text>
      <View style={styles.grid}>
        {GRID_POSITIONS.map((item) => (
          <Card key={item.label} style={styles.gridItem}>
            <Text style={styles.gridLabel}>{item.label}</Text>
            <EnergyBadge energyId={matrix[item.key]} size="md" showName />
          </Card>
        ))}
      </View>

      {/* Tip card */}
      <Card style={styles.tipCard}>
        <View style={styles.tipHeader}>
          <Ionicons name="bulb-outline" size={18} color={Colors.accent} />
          <Text style={styles.tipTitle}>Порада дня</Text>
        </View>
        <Text style={styles.tipText}>{energy?.positive}</Text>
        <View style={styles.warningRow}>
          <Ionicons name="warning-outline" size={14} color={Colors.error} />
          <Text style={styles.tipWarning}>Остерігайтесь: {energy?.negative}</Text>
        </View>
      </Card>

      {/* AI Forecast — premium only */}
      <Text style={styles.sectionTitle}>Прогноз AI</Text>

      {isPremium ? (
        <Card style={styles.forecastCard}>
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Генерую прогноз...</Text>
            </View>
          )}

          {!loading && error !== '' && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={24} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={generateForecast} style={styles.retryBtn}>
                <Text style={styles.retryText}>Спробувати знову</Text>
              </TouchableOpacity>
            </View>
          )}

          {!loading && error === '' && forecast !== '' && (
            <>
              <Text style={styles.forecastText}>{forecast}</Text>
              <TouchableOpacity onPress={generateForecast} style={styles.refreshRow}>
                <Ionicons name="refresh-outline" size={14} color={Colors.textMuted} />
                <Text style={styles.refreshText}>Оновити прогноз</Text>
              </TouchableOpacity>
            </>
          )}
        </Card>
      ) : (
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/paywall')}>
          <LinearGradient
            colors={['#78350F', '#D97706', '#F59E0B']}
            style={styles.premiumLock}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="lock-closed" size={32} color="rgba(255,255,255,0.9)" />
            <View style={styles.lockInfo}>
              <Text style={styles.lockTitle}>Прогноз AI — Premium</Text>
              <Text style={styles.lockSubtitle}>Персональний AI-аналіз на кожен день</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Destiny Matrix comparison teaser */}
      {personalMatrix && comparison !== '' && (
        <Card style={styles.comparisonCard}>
          <View style={styles.comparisonHeader}>
            <Ionicons name="infinite-outline" size={18} color={Colors.accent} />
            <Text style={styles.comparisonTitle}>Порівняння з Матрицею Долі</Text>
          </View>
          <Text style={styles.comparisonText}>{comparison}</Text>
        </Card>
      )}

      {/* CTA — Generate Destiny Matrix */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push('/matrix/create')}
        style={styles.destinyCtaWrap}
      >
        <LinearGradient
          colors={['#4C1D95', '#7C3AED', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.destinyCta}
        >
          <View style={styles.destinyCtaIcon}>
            <Ionicons name="grid-outline" size={28} color={Colors.accent} />
          </View>
          <View style={styles.destinyCtaInfo}>
            <Text style={styles.destinyCtaTitle}>Згенерувати Матрицю Долі</Text>
            <Text style={styles.destinyCtaSub}>
              {personalMatrix
                ? 'Відкрий повний аналіз своєї матриці — 22 енергії, таланти та призначення'
                : 'Введи дату народження та відкрий свою унікальну матрицю долі'}
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.8)" />
        </LinearGradient>
      </TouchableOpacity>

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
    textAlign: 'center',
  },

  mainCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  energyName: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  keywords: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  advice: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.sm,
  },

  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
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

  tipCard: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  tipTitle: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  tipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  tipWarning: {
    color: Colors.error,
    fontSize: FontSize.sm,
    lineHeight: 18,
    flex: 1,
    fontStyle: 'italic',
  },

  // AI forecast
  forecastCard: {
    marginBottom: Spacing.lg,
  },
  loadingBox: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  errorBox: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  retryText: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  forecastText: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 24,
  },
  refreshRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: Spacing.md,
  },
  refreshText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },

  // Comparison card
  comparisonCard: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  comparisonTitle: {
    color: Colors.accent,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  comparisonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
    fontStyle: 'italic',
  },

  // Destiny Matrix CTA
  destinyCtaWrap: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  destinyCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  destinyCtaIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: 'rgba(245,197,66,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  destinyCtaInfo: { flex: 1, gap: 3 },
  destinyCtaTitle: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '800' },
  destinyCtaSub: { color: 'rgba(255,255,255,0.72)', fontSize: FontSize.sm, lineHeight: 18 },

  // Premium lock banner
  premiumLock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  lockInfo: { flex: 1, gap: 3 },
  lockTitle: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '800' },
  lockSubtitle: { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.sm },
});
