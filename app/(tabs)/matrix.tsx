import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { MatrixDiagram } from '../../components/matrix/MatrixDiagram';
import { calculateMatrix } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';
import { askClaude } from '../../lib/claude';
import { useAppStore } from '../../stores/useAppStore';

const { width } = Dimensions.get('window');

const MATRIX_POSITIONS = [
  { key: 'personality', label: 'Особистість' },
  { key: 'soul',        label: 'Душа' },
  { key: 'destiny',     label: 'Доля' },
  { key: 'spiritual',   label: 'Духовне' },
  { key: 'material',    label: 'Матеріальне' },
];

export default function MatrixScreen() {
  const router = useRouter();

  const isPremium           = useAppStore((s) => s.isPremium);
  const userBirthDate       = useAppStore((s) => s.userBirthDate);
  const userName            = useAppStore((s) => s.userName);
  const destinyMatrix       = useAppStore((s) => s.destinyMatrix);
  const setDestinyMatrix    = useAppStore((s) => s.setDestinyMatrix);
  const aiSummary           = useAppStore((s) => s.destinyMatrixAiSummary);
  const setAiSummary        = useAppStore((s) => s.setDestinyMatrixAiSummary);
  const addXP               = useAppStore((s) => s.addXP);
  const streak              = useAppStore((s) => s.streak);
  const xp                  = useAppStore((s) => s.xp);
  const level               = useAppStore((s) => s.level);

  const [generating, setGenerating] = useState(false);

  // Always compute preview from stored birth date (shows blurred for non-premium)
  const previewMatrix = useMemo(() => {
    if (!userBirthDate) return null;
    try {
      const parts = userBirthDate.split('.');
      if (parts.length === 3) {
        return calculateMatrix(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
      return calculateMatrix(userBirthDate);
    } catch { return null; }
  }, [userBirthDate]);

  const diagramSize = width - Spacing.lg * 2 - 2;

  // Generate AI summary in background after matrix is first saved
  const generateAiSummary = async (matrix: ReturnType<typeof calculateMatrix>) => {
    try {
      const p = getEnergyById(matrix.personality);
      const s = getEnergyById(matrix.soul);
      const d = getEnergyById(matrix.destiny);
      const result = await askClaude(
        'Ти — езотеричний аналітик. Пиши теплою, мотивуючою мовою українською. Без markdown розмітки.',
        [],
        `Особистість: ${matrix.personality} "${p?.name}" — ${p?.positive}\nДуша: ${matrix.soul} "${s?.name}" — ${s?.positive}\nДоля: ${matrix.destiny} "${d?.name}" — ${d?.positive}\n\nНапиши загальний підсумок матриці долі в 3-4 речення: хто ця людина, в чому її сила, яке її призначення.`,
        300,
      );
      setAiSummary(result);
    } catch { /* silent */ }
  };

  const handleGenerateMatrix = async () => {
    if (!userBirthDate || !previewMatrix) return;
    setGenerating(true);
    try {
      const newMatrix = {
        id: Date.now().toString(),
        name: userName ? `${userName}` : 'Моя Матриця Долі',
        birthDate: userBirthDate,
        data: previewMatrix,
        createdAt: new Date().toISOString(),
      };
      setDestinyMatrix(newMatrix);
      addXP(100);
      generateAiSummary(previewMatrix);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.root}>
      <AnimatedBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} testID="matrix-tab-screen">

        {/* ── Gamification bar (no crystals here) ── */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/profile/achievements')}>
          <Card style={styles.gamifyBar}>
            <View style={styles.gamifyItem}>
              <Text style={styles.gamifyEmoji}>🔥</Text>
              <View>
                <Text style={styles.gamifyValue}>{streak}</Text>
                <Text style={styles.gamifyLabel}>Серія</Text>
              </View>
            </View>
            <View style={styles.gamifyDivider} />
            <View style={styles.gamifyItem}>
              <Text style={styles.gamifyEmoji}>⭐</Text>
              <View>
                <Text style={styles.gamifyValue}>{xp}</Text>
                <Text style={styles.gamifyLabel}>XP</Text>
              </View>
            </View>
            <View style={styles.gamifyDivider} />
            <View style={styles.gamifyItem}>
              <Text style={styles.gamifyEmoji}>🏆</Text>
              <View>
                <Text style={styles.gamifyValue}>{level} рів.</Text>
                <Text style={styles.gamifyLabel}>Рівень</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Card>
        </TouchableOpacity>

        {/* ── DESTINY MATRIX SECTION ── */}
        {destinyMatrix ? (
          /* ── State C: premium + matrix generated ── */
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Матриця Долі</Text>
              <Text style={styles.sectionSub}>{destinyMatrix.birthDate}</Text>
            </View>

            <LinearGradient colors={['#1E1B4B', '#0A0A1A']} style={styles.diagramContainer}>
              <MatrixDiagram data={destinyMatrix.data} size={diagramSize} />
            </LinearGradient>

            {/* Key positions */}
            {MATRIX_POSITIONS.map((pos) => {
              const energyId = (destinyMatrix.data as any)[pos.key] as number;
              const energy = getEnergyById(energyId);
              return (
                <Card key={pos.key} style={styles.posCard}>
                  <View style={styles.posRow}>
                    <EnergyBadge energyId={energyId} size="md" />
                    <View style={styles.posInfo}>
                      <Text style={styles.posLabel}>{pos.label}</Text>
                      <Text style={styles.posName}>{energyId}. {energy?.name}</Text>
                      <Text style={styles.posDesc} numberOfLines={2}>{energy?.positive}</Text>
                    </View>
                  </View>
                </Card>
              );
            })}

            {/* AI summary */}
            <Card style={styles.aiSummaryCard}>
              {aiSummary ? (
                <>
                  <View style={styles.aiSummaryHeader}>
                    <Ionicons name="sparkles" size={18} color={Colors.accent} />
                    <Text style={styles.aiSummaryTitle}>Підсумок Матриці</Text>
                  </View>
                  <Text style={styles.aiSummaryText}>{aiSummary}</Text>
                </>
              ) : (
                <View style={styles.aiSummaryLoading}>
                  <ActivityIndicator color={Colors.primary} size="small" />
                  <Text style={styles.aiSummaryLoadingText}>Генерується аналіз...</Text>
                </View>
              )}
            </Card>

            {/* AI Chat CTA */}
            <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/ai/chat' as any)} style={styles.aiChatBtnWrap}>
              <LinearGradient colors={['#4C1D95', '#7C3AED', '#8B5CF6']} style={styles.aiChatBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
                <View style={styles.aiChatBtnIcon}>
                  <Ionicons name="chatbubble-ellipses" size={24} color={Colors.accent} />
                </View>
                <View style={styles.aiChatBtnInfo}>
                  <Text style={styles.aiChatBtnTitle}>Запитати ШІ про матрицю</Text>
                  <Text style={styles.aiChatBtnSub}>Детальний аналіз та поради</Text>
                </View>
                <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.8)" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          /* ── State A/B: no generated matrix ── */
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Матриця Долі</Text>
            </View>

            {previewMatrix ? (
              /* Blurred preview from onboarding birth date */
              <View style={styles.blurredWrap}>
                <LinearGradient colors={['#1E1B4B', '#0A0A1A']} style={styles.diagramContainer}>
                  <View style={{ opacity: 0.22 }}>
                    <MatrixDiagram data={previewMatrix} size={diagramSize} />
                  </View>
                </LinearGradient>
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <LinearGradient
                    colors={['transparent', 'rgba(8,1,26,0.35)', 'rgba(8,1,26,0.8)', Colors.bg]}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
                <View style={styles.blurLockCenter}>
                  <View style={styles.blurLockIcon}>
                    <Ionicons name="lock-closed" size={28} color={Colors.accent} />
                  </View>
                  <Text style={styles.blurLockTitle}>✦ Твоя Матриця Долі ✦</Text>
                  <Text style={styles.blurLockSub}>
                    {isPremium
                      ? 'Натисни нижче, щоб розкрити свою матрицю'
                      : 'Відкрий 22 енергії, таланти та своє призначення'}
                  </Text>
                </View>
              </View>
            ) : (
              <Card style={styles.noDateCard}>
                <Ionicons name="grid-outline" size={44} color={Colors.primaryMuted} />
                <Text style={styles.noDateTitle}>Матриця Долі</Text>
                <Text style={styles.noDateText}>
                  {isPremium
                    ? 'Пройдіть онбординг із датою народження для генерації матриці'
                    : 'Придбайте Premium та відкрийте свою унікальну матрицю долі'}
                </Text>
              </Card>
            )}

            <TouchableOpacity
              activeOpacity={0.85}
              disabled={generating}
              onPress={() => !isPremium ? router.push('/paywall') : handleGenerateMatrix()}
            >
              <LinearGradient
                colors={isPremium ? ['#5B21B6', '#7C3AED', '#8B5CF6'] : ['#1E1B4B', '#4338CA']}
                style={styles.generateBtn}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {generating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name={isPremium ? 'sparkles' : 'diamond-outline'} size={20} color="#FFFFFF" />
                    <Text style={styles.generateBtnText}>
                      {isPremium ? 'Створити матрицю долі' : 'Розблокувати матрицю долі'}
                    </Text>
                    <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.8)" />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Daily Matrix ── */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/matrix/daily')} style={styles.dailyWrap}>
          <Card style={styles.dailyCard}>
            <View style={styles.dailyLeft}>
              <View style={styles.dailyIcon}>
                <Ionicons name="sunny-outline" size={22} color={Colors.accent} />
              </View>
              <View>
                <Text style={styles.dailyTitle}>Матриця Дня</Text>
                <Text style={styles.dailySub}>Енергія та прогноз сьогодні</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
          </Card>
        </TouchableOpacity>

        {/* ── Compatibility + Referral ── */}
        <View style={styles.twoCol}>
          <TouchableOpacity style={styles.twoColItem} activeOpacity={0.7} onPress={() => router.push('/matrix/compatibility')} testID="matrix-compatibility-btn">
            <LinearGradient colors={['#2D1B69', '#6D28D9']} style={styles.twoColGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <View style={styles.twoColIcon}>
                <Ionicons name="heart" size={22} color="#FCE7F3" />
              </View>
              <Text style={styles.twoColTitle}>Сумісність</Text>
              <Text style={styles.twoColSub}>Порівняти дві матриці</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.twoColItem} activeOpacity={0.7} onPress={() => router.push('/matrix/referral')}>
            <Card style={styles.twoColCard}>
              <View style={[styles.twoColIcon, { backgroundColor: 'rgba(249,168,212,0.15)' }]}>
                <Ionicons name="gift-outline" size={22} color="#F9A8D4" />
              </View>
              <Text style={styles.twoColTitle}>Запросити</Text>
              <Text style={styles.twoColSub}>Бонуси за друзів</Text>
            </Card>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 120 },

  // Gamification bar
  gamifyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  gamifyItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  gamifyEmoji: { fontSize: 18 },
  gamifyValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '800' },
  gamifyLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '500' },
  gamifyDivider: { width: 1, height: 28, backgroundColor: Colors.border },

  // Section header
  sectionHeader: { marginBottom: Spacing.sm },
  sectionTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700' },
  sectionSub: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },

  // Matrix diagram
  diagramContainer: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Key positions
  posCard: { marginBottom: Spacing.sm },
  posRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  posInfo: { flex: 1 },
  posLabel: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  posName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700', marginTop: 2 },
  posDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18, marginTop: 2 },

  // AI summary
  aiSummaryCard: { marginBottom: Spacing.md },
  aiSummaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  aiSummaryTitle: { color: Colors.accent, fontSize: FontSize.md, fontWeight: '700' },
  aiSummaryText: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22 },
  aiSummaryLoading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  aiSummaryLoadingText: { color: Colors.textMuted, fontSize: FontSize.sm },

  // AI chat button
  aiChatBtnWrap: { marginBottom: Spacing.md },
  aiChatBtn: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aiChatBtnIcon: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  aiChatBtnInfo: { flex: 1 },
  aiChatBtnTitle: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '700' },
  aiChatBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, marginTop: 2 },

  // Blurred preview
  blurredWrap: { marginBottom: Spacing.md, position: 'relative' },
  blurLockCenter: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  blurLockIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderWidth: 1.5, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  blurLockTitle: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 1,
  },
  blurLockSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 18,
  },

  // No birth date placeholder
  noDateCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  noDateTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  noDateText: {
    color: Colors.textMuted, fontSize: FontSize.sm,
    textAlign: 'center', lineHeight: 20,
  },

  // Generate / unlock button
  generateBtn: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  generateBtnText: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '800', flex: 1, textAlign: 'center' },

  // Daily Matrix card
  dailyWrap: { marginBottom: Spacing.md },
  dailyCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dailyLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  dailyIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.accentMuted,
    borderWidth: 1, borderColor: Colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  dailyTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  dailySub: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },

  // 2-column row
  twoCol: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  twoColItem: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  twoColGradient: { padding: Spacing.md, minHeight: 120, gap: Spacing.sm, borderRadius: BorderRadius.lg },
  twoColCard: { minHeight: 120, gap: Spacing.sm },
  twoColIcon: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  twoColTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  twoColSub: { color: Colors.textSecondary, fontSize: FontSize.sm },
});
