import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import { FALLBACK_ENERGIES } from '@/lib/fallbackData';
import { ENERGIES } from '@/lib/staticData';
import type { Energy } from '@/constants/energies';
import { useI18n } from '@/lib/i18n';
import { GameInstructions } from '@/components/ui/GameInstructions';
import { GameResultsAnimation } from '@/components/ui/GameResultsAnimation';
import { trackFeatureUsed } from '@/lib/analytics';

const TOTAL_ROUNDS = 10;
const XP_PER_CORRECT = 15;

type Round = {
  target: Energy;
  clueText: string;
  clueLabel: string;
  options: Energy[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Determine clue based on difficulty progression:
 *  Rounds 1-3  → full positive description
 *  Rounds 4-7  → keywords only
 *  Rounds 8-10 → planet only
 */
function buildClue(card: Energy, roundIndex: number, isUk: boolean): { clueText: string; clueLabel: string } {
  if (roundIndex < 3) {
    const text = isUk ? card.positive : ((card as any).positiveEn ?? card.positive);
    return { clueText: text, clueLabel: isUk ? 'Опис' : 'Description' };
  }
  if (roundIndex < 7) {
    const keywords = isUk ? card.keywords : ((card as any).keywordsEn ?? card.keywords);
    return { clueText: keywords.join(', '), clueLabel: isUk ? 'Ключові слова' : 'Keywords' };
  }
  const planet = isUk ? card.planet : ((card as any).planetEn ?? card.planet);
  return { clueText: planet, clueLabel: isUk ? 'Планета' : 'Planet' };
}

export default function GuessTheCardScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  const isUk = locale === 'uk';
  const addXP = useAppStore((s) => s.addXP);
  const setGameRecord = useAppStore((s) => s.setGameRecord);
  const getGameRecord = useAppStore((s) => s.getGameRecord);
  const energies: Energy[] = ENERGIES?.length ? ENERGIES : FALLBACK_ENERGIES;

  // Build all rounds once
  const rounds = useMemo<Round[]>(() => {
    if (energies.length < 4) return [];
    const picked = shuffle(energies).slice(0, TOTAL_ROUNDS);
    return picked.map((target, idx) => {
      const others = energies.filter((e) => e.id !== target.id);
      const distractors = shuffle(others).slice(0, 3);
      const options = shuffle([target, ...distractors]);
      const { clueText, clueLabel } = buildClue(target, idx, isUk);
      return { target, clueText, clueLabel, options };
    });
  }, [energies, isUk]);

  const [current, setCurrent] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const feedbackAnim   = useRef(new Animated.Value(0)).current;
  const countdownAnim  = useRef(new Animated.Value(0)).current;
  const highlightAnim  = useRef(new Animated.Value(0)).current;
  const prevLabelRef   = useRef('');

  const round = rounds[current];

  // Flash highlight when clue theme changes (rounds 1→4 and 4→8)
  useEffect(() => {
    if (!round) return;
    if (prevLabelRef.current && prevLabelRef.current !== round.clueLabel) {
      Animated.sequence([
        Animated.timing(highlightAnim, { toValue: 1, duration: 250, useNativeDriver: false }),
        Animated.timing(highlightAnim, { toValue: 0, duration: 1000, useNativeDriver: false }),
      ]).start();
    }
    prevLabelRef.current = round.clueLabel;
  }, [round?.clueLabel]);

  const handleSelect = (picked: Energy) => {
    if (selectedId !== null) return;
    setSelectedId(picked.id);
    const isCorrect = picked.id === round.target.id;
    if (isCorrect) setScore((s) => s + 1);

    countdownAnim.setValue(1);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(feedbackAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(1500),
        Animated.timing(feedbackAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]),
      Animated.timing(countdownAnim, { toValue: 0, duration: 1850, useNativeDriver: false }),
    ]).start(() => {
      if (current + 1 >= rounds.length) {
        const finalScore = isCorrect ? score + 1 : score;
        addXP(finalScore * XP_PER_CORRECT);
        trackFeatureUsed('guess_game', 'learn', 'free');
        setIsNewRecord(setGameRecord('guess', finalScore));
        setFinished(true);
      } else {
        setCurrent((c) => c + 1);
        setSelectedId(null);
      }
    });
  };

  const restart = () => {
    setCurrent(0);
    setSelectedId(null);
    setScore(0);
    setFinished(false);
    setIsNewRecord(false);
  };

  if (!rounds.length) return null;

  const screenHeader = <Stack.Screen options={{ headerShown: false }} />;

  // Interpolated highlight colours (useNativeDriver: false required for colour)
  const hlBadgeBg = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(139,92,246,0.15)', 'rgba(245,197,66,0.25)'],
  });
  const hlBadgeBorder = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(139,92,246,0.25)', 'rgba(245,197,66,0.90)'],
  });
  const hlCardBorder = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(139,92,246,0.3)', 'rgba(245,197,66,0.85)'],
  });
  const hlCardBg = highlightAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(25,12,55,0.85)', 'rgba(245,197,66,0.08)'],
  });

  // ── Result screen ──────────────────────────────────────────
  if (finished) {
    const pct = Math.round((score / rounds.length) * 100);
    const xpEarned = score * XP_PER_CORRECT;
    const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '📚';
    return (
      <View style={styles.root}>
        {screenHeader}
        <LinearGradient colors={[Colors.bg, '#1C1040', Colors.bg]} style={StyleSheet.absoluteFill} />
        <GameResultsAnimation
          title={isUk ? 'Результат' : 'Result'}
          stars={pct >= 80 ? 3 : pct >= 50 ? 2 : 1}
          xp={xpEarned}
          stats={[
            { label: isUk ? 'Правильних:' : 'Correct:', value: `${score}/${rounds.length}` },
            { label: '', value: `${pct}%` },
            ...(isNewRecord ? [{ label: '🏆', value: isUk ? 'Новий рекорд!' : 'New record!' }] : []),
          ]}
        >
          <TouchableOpacity onPress={restart}>
            <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.actionBtn}>
              <Ionicons name="refresh" size={18} color="#fff" />
              <Text style={styles.actionBtnText}>{isUk ? 'Спробувати ще раз' : 'Try again'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>{isUk ? 'Повернутися' : 'Go back'}</Text>
          </TouchableOpacity>
        </GameResultsAnimation>
      </View>
    );
  }

  // ── Question screen ────────────────────────────────────────
  return (
    <View style={styles.root}>
      {screenHeader}
      <LinearGradient colors={[Colors.bg, '#1C1040', Colors.bg]} style={StyleSheet.absoluteFill} />
      <GameInstructions
        gameId="guess"
        title="Дзеркало долі"
        steps={[
          'Вам показують ситуацію або характер.',
          'Оберіть карту (аркан), яка найкраще відповідає.',
          'За правильну відповідь отримуєте досвід.',
          'Всього 10 раундів — спробуйте вгадати якомога більше!',
        ]}
        onStart={() => {}}
      />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header: back + title + progress */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isUk ? 'Дзеркало долі' : 'Destiny Mirror'}</Text>
          <Text style={styles.headerProgress}>{current + 1}/{TOTAL_ROUNDS}</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${((current + 1) / TOTAL_ROUNDS) * 100}%` }]} />
        </View>

        {/* Difficulty badge — highlights when theme changes */}
        <Animated.View style={[
          styles.diffBadge,
          { backgroundColor: hlBadgeBg, borderWidth: 1, borderColor: hlBadgeBorder },
        ]}>
          <Ionicons
            name={current < 3 ? 'document-text' : current < 7 ? 'key' : 'planet'}
            size={14}
            color={Colors.primary}
          />
          <Text style={styles.diffText}>{round.clueLabel}</Text>
        </Animated.View>

        {/* Clue card — highlights when theme changes */}
        <Animated.View style={[
          styles.clueCard,
          { borderColor: hlCardBorder, backgroundColor: hlCardBg },
        ]}>
          <Text style={styles.clueCardText}>{round.clueText}</Text>
        </Animated.View>

        <Text style={styles.promptText}>{isUk ? 'Яка це карта?' : 'Which card is it?'}</Text>

        {/* 4 answer options */}
        {round.options.map((option, i) => {
          const isSelected = selectedId === option.id;
          const isCorrect = option.id === round.target.id;
          const showResult = selectedId !== null;

          let borderColor = 'rgba(139,92,246,0.3)';
          let bg = Colors.bgCard;
          if (showResult && isCorrect) {
            borderColor = '#22C55E';
            bg = 'rgba(34,197,94,0.12)';
          } else if (showResult && isSelected && !isCorrect) {
            borderColor = '#EF4444';
            bg = 'rgba(239,68,68,0.12)';
          }

          const letter = String.fromCharCode(65 + i); // A, B, C, D

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.7}
              onPress={() => handleSelect(option)}
              disabled={selectedId !== null}
            >
              <View style={[styles.optionCard, { borderColor, backgroundColor: bg }]}>
                <View style={styles.optionLetterCircle}>
                  <Text style={styles.optionLetter}>{letter}</Text>
                </View>
                <Text style={styles.optionName} numberOfLines={2}>{isUk ? option.name : ((option as any).arcana ?? option.name)}</Text>
                {showResult && isCorrect && (
                  <Ionicons name="checkmark-circle" size={22} color="#22C55E" />
                )}
                {showResult && isSelected && !isCorrect && (
                  <Ionicons name="close-circle" size={22} color="#EF4444" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Score indicator */}
        <View style={styles.scoreRow}>
          <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
          <Text style={styles.scoreText}>{score} {isUk ? 'правильних' : 'correct'}</Text>
        </View>

        {/* Countdown bar */}
        {selectedId !== null && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>
              {current + 1 < rounds.length
                ? (isUk ? 'Наступне питання...' : 'Next question...')
                : (isUk ? 'Завершення...' : 'Finishing...')}
            </Text>
            <View style={styles.countdownBarBg}>
              <Animated.View
                style={[
                  styles.countdownBarFill,
                  {
                    width: countdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingTop: 56, paddingBottom: 20 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingRight: 40,
  },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerProgress: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    width: 45,
    textAlign: 'right',
  },

  // Progress bar
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },

  // Difficulty badge
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md,
  },
  diffText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },

  // Clue card
  clueCard: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  clueCardLabel: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  clueCardText: {
    color: '#fff',
    fontSize: FontSize.md,
    lineHeight: 24,
    textAlign: 'center',
  },

  // Prompt
  promptText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.md,
  },

  // Option cards
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
  },
  optionLetterCircle: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  optionLetter: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  optionName: {
    flex: 1,
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '600',
  },

  // Score
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
  },
  scoreText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // Record
  recordBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
    marginTop: Spacing.md,
    backgroundColor: 'rgba(139,92,246,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
  },
  recordText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '700' as const },
  prevRecord: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.sm },

  // Countdown
  countdownContainer: {
    marginTop: Spacing.lg,
    alignItems: 'center' as const,
  },
  countdownLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600' as const,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  countdownBarBg: {
    width: '100%' as const,
    height: 4,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 2,
    overflow: 'hidden' as const,
  },
  countdownBarFill: {
    height: '100%' as const,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },

  // Result screen
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  resultEmoji: { fontSize: 60, marginBottom: Spacing.md },
  resultLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  resultScore: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    marginTop: 4,
  },
  resultPct: {
    color: Colors.primary,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: 4,
  },
  resultXP: {
    color: '#22C55E',
    fontSize: FontSize.md,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: BorderRadius.lg,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  backLink: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
});
