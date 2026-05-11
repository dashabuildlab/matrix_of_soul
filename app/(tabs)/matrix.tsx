import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { MatrixDiagram } from '../../components/matrix/MatrixDiagram';
import { calculateMatrix } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';
import { askClaude } from '../../lib/claude';
import { useI18n } from '../../lib/i18n';
import { useAppStore } from '../../stores/useAppStore';
import { MarkdownText } from '../../components/ui/MarkdownText';

const { width } = Dimensions.get('window');

// Static birth date used only for the "no date" placeholder visual
const DEMO_DATE = '1990-06-15';

export default function MatrixScreen() {
  const router = useRouter();
  const { locale } = useI18n();

  const isPremium        = useAppStore((s) => s.isPremium);
  const userBirthDate    = useAppStore((s) => s.userBirthDate);
  const userName         = useAppStore((s) => s.userName);
  const destinyMatrix    = useAppStore((s) => s.destinyMatrix);
  const setDestinyMatrix = useAppStore((s) => s.setDestinyMatrix);
  const aiSummary        = useAppStore((s) => s.destinyMatrixAiSummary);
  const setAiSummary     = useAppStore((s) => s.setDestinyMatrixAiSummary);
  const addXP            = useAppStore((s) => s.addXP);
  const streak           = useAppStore((s) => s.streak);
  const xp               = useAppStore((s) => s.xp);
  const level            = useAppStore((s) => s.level);

  const [generating, setGenerating] = useState(false);
  const autoGenDone = useRef(false);

  // ── Matrix data (MUST be declared BEFORE the auto-save effect that
  //    references previewMatrix — otherwise we hit a temporal dead zone
  //    and React throws ReferenceError on first render). ─────────────────
  const previewMatrix = useMemo(() => {
    if (!userBirthDate) return null;
    try {
      const parts = userBirthDate.split('.');
      return parts.length === 3
        ? calculateMatrix(`${parts[2]}-${parts[1]}-${parts[0]}`)
        : calculateMatrix(userBirthDate);
    } catch { return null; }
  }, [userBirthDate]);

  const demoMatrix = useMemo(() => {
    try { return calculateMatrix(DEMO_DATE); } catch { return null; }
  }, []);

  // ── Auto-save destinyMatrix when premium + birth date ─────────────────────
  // Prevents the "matrix is visible but button still says Створити" confusion.
  useEffect(() => {
    if (
      isPremium &&
      previewMatrix &&
      !destinyMatrix &&
      userBirthDate &&
      !autoGenDone.current
    ) {
      autoGenDone.current = true;
      const newMatrix = {
        id: Date.now().toString(),
        name: userName ?? 'Моя Матриця Долі',
        birthDate: userBirthDate,
        data: previewMatrix,
        createdAt: new Date().toISOString(),
      };
      setDestinyMatrix(newMatrix);
      // Generate AI summary in background (no spinner needed)
      const p = getEnergyById(previewMatrix.personality);
      const s = getEnergyById(previewMatrix.soul);
      const d = getEnergyById(previewMatrix.destiny);
      askClaude(
        'You are an esoteric analyst. Write warmly, in a motivating tone, without markdown formatting.',
        [],
        `Personality: ${previewMatrix.personality} "${p?.name}" — ${p?.positive}\nSoul: ${previewMatrix.soul} "${s?.name}" — ${s?.positive}\nDestiny: ${previewMatrix.destiny} "${d?.name}" — ${d?.positive}\n\nWrite a general summary of the destiny matrix in 3-4 sentences: who this person is, what their strength is, what their purpose is.`,
        300,
        locale,
      ).then(setAiSummary).catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPremium, !!previewMatrix, !!destinyMatrix]);

  // ── Entrance animation ────────────────────────────────────────────────────
  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(cardAnim, {
      toValue: 1,
      friction: 8,
      tension: 35,
      useNativeDriver: true,
    }).start();
  }, []);

  // Which data to display (prefer generated, then preview, then demo placeholder)
  const diagramData = destinyMatrix?.data ?? previewMatrix ?? demoMatrix;

  // Display states
  const hasDate     = !!userBirthDate;
  const isBlurred   = hasDate && !isPremium;       // has date but no premium → blur
  const isLocked    = !hasDate;                     // no date at all → heavily faded demo

  const diagramSize = width - Spacing.lg * 2 - Spacing.md * 2 - 4;

  // ── AI summary ────────────────────────────────────────────────────────────
  const generateAiSummary = async (matrix: ReturnType<typeof calculateMatrix>) => {
    try {
      const p = getEnergyById(matrix.personality);
      const s = getEnergyById(matrix.soul);
      const d = getEnergyById(matrix.destiny);
      const result = await askClaude(
        'You are an esoteric analyst. Write warmly, in a motivating tone, without markdown formatting.',
        [],
        `Personality: ${matrix.personality} "${p?.name}" — ${p?.positive}\nSoul: ${matrix.soul} "${s?.name}" — ${s?.positive}\nDestiny: ${matrix.destiny} "${d?.name}" — ${d?.positive}\n\nWrite a general summary of the destiny matrix in 3-4 sentences: who this person is, what their strength is, what their purpose is.`,
        300,
        locale,
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
        name: userName ?? 'Моя Матриця Долі',
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

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <AnimatedBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        testID="matrix-tab-screen"
      >

        {/* ── Gamification bar ── */}
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/profile/achievements')}>
          <Card style={styles.gamifyBar}>
            <View style={styles.gamifyItem}>
              <Ionicons name="flame" size={18} color="#F97316" />
              <View>
                <Text style={styles.gamifyValue}>{streak}</Text>
                <Text style={styles.gamifyLabel}>Серія</Text>
              </View>
            </View>
            <View style={styles.gamifyDivider} />
            <View style={styles.gamifyItem}>
              <Ionicons name="star" size={18} color="#F5C542" />
              <View>
                <Text style={styles.gamifyValue}>{xp}</Text>
                <Text style={styles.gamifyLabel}>XP</Text>
              </View>
            </View>
            <View style={styles.gamifyDivider} />
            <View style={styles.gamifyItem}>
              <Ionicons name="trophy" size={18} color="#F5C542" />
              <View>
                <Text style={styles.gamifyValue}>{level} рів.</Text>
                <Text style={styles.gamifyLabel}>Рівень</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </Card>
        </TouchableOpacity>

        {/* ── MATRIX CARD ── */}
        <Animated.View
          style={[
            styles.matrixCardWrap,
            {
              opacity: cardAnim,
              transform: [{ scale: cardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
            },
          ]}
        >
          <LinearGradient
            colors={['#2D1B69', '#1a1040', '#080818']}
            style={styles.matrixCard}
            start={{ x: 0.1, y: 0 }}
            end={{ x: 0.9, y: 1 }}
          >
            {/* Card header */}
            <Text style={styles.matrixCardTitle}>✦ МАТРИЦЯ ДОЛІ ✦</Text>
            {userName && hasDate && (
              <Text style={styles.matrixCardName}>{userName}</Text>
            )}
            {hasDate && (
              <Text style={styles.matrixCardDate}>{userBirthDate}</Text>
            )}

            {/* Diagram area */}
            <View style={styles.diagramArea}>
              {/* The diagram itself — faded when locked or blurred */}
              <View
                style={[
                  styles.diagramInner,
                  isLocked  && { opacity: 0.12 },
                  isBlurred && { opacity: 0.2  },
                ]}
              >
                {diagramData && (
                  <MatrixDiagram data={diagramData} size={diagramSize} />
                )}
              </View>

              {/* Gradient fade overlay for lock / blur states */}
              {(isBlurred || isLocked) && (
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                  <LinearGradient
                    colors={['transparent', 'rgba(8,1,26,0.55)', 'rgba(8,1,26,0.88)', '#080818']}
                    style={StyleSheet.absoluteFill}
                  />
                </View>
              )}

              {/* Lock overlay content */}
              {(isBlurred || isLocked) && (
                <View style={styles.lockOverlay}>
                  <View style={styles.lockIcon}>
                    <Ionicons name="lock-closed" size={30} color={Colors.accent} />
                  </View>
                  <Text style={styles.lockTitle}>
                    {isLocked ? '✦ Матриця Долі ✦' : '✦ Твоя Матриця Долі ✦'}
                  </Text>
                  <Text style={styles.lockSub}>
                    {isLocked
                      ? 'Введіть дату народження, щоб побачити свою матрицю'
                      : 'Відкрий 22 енергії, таланти та своє призначення'}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── CTA Button ── */}
        {isLocked ? (
          // No birth date → add it
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/profile/account' as any)}
            style={styles.ctaBtnWrap}
          >
            <LinearGradient
              colors={['#1E1B4B', '#4338CA']}
              style={styles.ctaBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="person-outline" size={20} color="#FFFFFF" />
              <Text style={styles.ctaBtnText}>Додати дату народження</Text>
              <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        ) : destinyMatrix ? (
          // Generated → read
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push(`/matrix/${destinyMatrix.id}` as any)}
            style={styles.ctaBtnWrap}
          >
            <LinearGradient
              colors={['#5B21B6', '#7C3AED', '#8B5CF6']}
              style={styles.ctaBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="grid-outline" size={20} color="#FFFFFF" />
              <Text style={styles.ctaBtnText}>Прочитати матрицю долі</Text>
              <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.8)" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          // Has date but not generated → unlock / generate
          <TouchableOpacity
            activeOpacity={0.85}
            disabled={generating}
            onPress={() => !isPremium ? router.push('/paywall') : handleGenerateMatrix()}
            style={styles.ctaBtnWrap}
          >
            <LinearGradient
              colors={isPremium ? ['#5B21B6', '#7C3AED', '#8B5CF6'] : ['#78350F', '#D97706', '#F59E0B']}
              style={styles.ctaBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {generating ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons
                    name={isPremium ? 'sparkles' : 'diamond-outline'}
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.ctaBtnText}>
                    {isPremium ? 'Створити матрицю долі' : 'Розблокувати матрицю долі'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="rgba(255,255,255,0.8)" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* ── AI summary (after generation) ── */}
        {destinyMatrix && (
          <Card style={styles.aiSummaryCard}>
            {aiSummary ? (
              <>
                <View style={styles.aiSummaryHeader}>
                  <Ionicons name="sparkles" size={18} color={Colors.accent} />
                  <Text style={styles.aiSummaryTitle}>Підсумок Матриці</Text>
                </View>
                <MarkdownText
                  text={aiSummary}
                  color={Colors.textSecondary}
                  fontSize={FontSize.md}
                  lineHeight={22}
                />
              </>
            ) : (
              <View style={styles.aiSummaryLoading}>
                <ActivityIndicator color={Colors.primary} size="small" />
                <Text style={styles.aiSummaryLoadingText}>Генерується аналіз...</Text>
              </View>
            )}
          </Card>
        )}

        {/* ── AI Chat CTA ── */}
        {destinyMatrix && (
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => router.push('/ai/chat' as any)}
            style={styles.aiChatBtnWrap}
          >
            <LinearGradient
              colors={['#4C1D95', '#7C3AED', '#8B5CF6']}
              style={styles.aiChatBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
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
        )}

        {/* ── Compatibility ── */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/matrix/compatibility')}
          testID="matrix-compatibility-btn"
          style={styles.compatWrap}
        >
          <LinearGradient
            colors={['#2D1B69', '#6D28D9']}
            style={styles.compatGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.compatIcon}>
              <Ionicons name="heart" size={22} color="#FCE7F3" />
            </View>
            <View style={styles.compatInfo}>
              <Text style={styles.compatTitle}>Сумісність</Text>
              <Text style={styles.compatSub}>Порівняти дві матриці</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={24} color="rgba(255,255,255,0.6)" />
          </LinearGradient>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingTop: 56, paddingBottom: 120 },

  // ── Gamification bar ──
  gamifyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  gamifyItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  gamifyValue: { color: Colors.text, fontSize: FontSize.sm, fontWeight: '800' },
  gamifyLabel: { color: Colors.textMuted, fontSize: 9, fontWeight: '500' },
  gamifyDivider: { width: 1, height: 28, backgroundColor: Colors.border },

  // ── Matrix card ──
  matrixCardWrap: {
    marginBottom: Spacing.md,
    borderRadius: 24,
    overflow: 'hidden',
    // Gold border simulation via shadow
    shadowColor: '#F5C542',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  matrixCard: {
    borderRadius: 24,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245,197,66,0.2)',
    gap: 4,
  },
  matrixCardTitle: {
    color: '#F5C542',
    fontSize: FontSize.sm,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  matrixCardName: {
    color: '#FFFFFF',
    fontSize: FontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
  matrixCardDate: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },

  // Diagram area
  diagramArea: {
    width: '100%',
    position: 'relative',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  diagramInner: {
    alignItems: 'center',
  },

  // Lock / blur overlay
  lockOverlay: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  lockIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderWidth: 1.5,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockTitle: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 1,
    textAlign: 'center',
  },
  lockSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── CTA button ──
  ctaBtnWrap: { marginBottom: Spacing.md },
  ctaBtn: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '800',
    flex: 1,
    textAlign: 'center',
  },

  // ── AI summary ──
  aiSummaryCard: { marginBottom: Spacing.md },
  aiSummaryHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: Spacing.sm },
  aiSummaryTitle: { color: Colors.accent, fontSize: FontSize.md, fontWeight: '700' },
  aiSummaryText: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22 },
  aiSummaryLoading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.sm },
  aiSummaryLoadingText: { color: Colors.textMuted, fontSize: FontSize.sm },

  // ── AI chat button ──
  aiChatBtnWrap: { marginBottom: Spacing.md },
  aiChatBtn: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  aiChatBtnIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiChatBtnInfo: { flex: 1 },
  aiChatBtnTitle: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '700' },
  aiChatBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm, marginTop: 2 },

  // ── Compatibility ──
  compatWrap: { marginBottom: Spacing.md, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  compatGradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  compatIcon: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compatInfo: { flex: 1 },
  compatTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  compatSub: { color: Colors.textSecondary, fontSize: FontSize.sm, marginTop: 2 },
});
