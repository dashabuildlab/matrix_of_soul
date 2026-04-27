import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import { FALLBACK_ENERGIES } from '@/lib/fallbackData';
import { ENERGIES } from '@/lib/staticData';
import { useI18n } from '@/lib/i18n';
import { GameInstructions } from '@/components/ui/GameInstructions';
import { GameResultsAnimation } from '@/components/ui/GameResultsAnimation';
import { trackFeatureUsed } from '@/lib/analytics';

// ── Constants ──────────────────────────────────────────────────
const TOTAL_QUESTIONS = 15;
const TIME_PER_QUESTION = 10; // seconds
const XP_PER_CORRECT = 10;

// Element mapping by energy name (Ukrainian keys for internal lookup)
const ELEMENT_MAP: Record<string, string> = {
  'Блазень':          'fire',
  'Маг':              'fire',
  'Жриця':            'water',
  'Імператриця':      'earth',
  'Імператор':        'fire',
  'Ієрофант':         'earth',
  'Закохані':         'air',
  'Колісниця':        'water',
  'Справедливість':   'fire',
  'Відлюдник':        'water',
  'Колесо Фортуни':   'fire',
  'Сила':             'air',
  'Повішений':        'water',
  'Смерть':           'water',
  'Помірність':       'fire',
  'Диявол':           'earth',
  'Вежа':             'fire',
  'Зірка':            'air',
  'Місяць':           'water',
  'Сонце':            'fire',
  'Суд':              'fire',
  'Світ':             'earth',
};

const ELEMENT_NAMES: Record<string, Record<string, string>> = {
  fire:  { uk: 'Вогонь', en: 'Fire' },
  water: { uk: 'Вода', en: 'Water' },
  earth: { uk: 'Земля', en: 'Earth' },
  air:   { uk: 'Повітря', en: 'Air' },
};

const ALL_ELEMENT_KEYS = ['fire', 'water', 'earth', 'air'];

// ── Types ──────────────────────────────────────────────────────
type FactType = 'planet' | 'keyword' | 'element';

interface Statement {
  text: string;
  isTrue: boolean;
  cardName: string;
}

// ── Helpers ────────────────────────────────────────────────────
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateStatements(
  energies: typeof FALLBACK_ENERGIES,
  count: number,
  isUk: boolean,
): Statement[] {
  const statements: Statement[] = [];
  const usedCards = new Set<number>();
  const shuffledEnergies = shuffle(energies);
  const factTypes: FactType[] = ['planet', 'keyword', 'element'];
  const lang = isUk ? 'uk' : 'en';

  const getName = (e: typeof energies[0]) => isUk ? e.name : ((e as any).arcana ?? e.name);
  const getKeywords = (e: typeof energies[0]) => isUk ? e.keywords : ((e as any).keywordsEn ?? e.keywords);
  const getPlanet = (e: typeof energies[0]) => isUk ? e.planet : ((e as any).planetEn ?? e.planet);

  for (let i = 0; i < count; i++) {
    let energy = shuffledEnergies[i % shuffledEnergies.length];
    if (usedCards.has(energy.id) && i < shuffledEnergies.length) {
      const unused = shuffledEnergies.find((e) => !usedCards.has(e.id));
      if (unused) energy = unused;
    }
    usedCards.add(energy.id);

    const isTrue = Math.random() < 0.5;
    const factType = pickRandom(factTypes);
    const others = energies.filter((e) => e.id !== energy.id);
    const otherEnergy = pickRandom(others);
    const cardName = getName(energy);

    let text = '';

    if (factType === 'planet') {
      const planet = isTrue ? getPlanet(energy) : getPlanet(otherEnergy);
      if (!isTrue && planet === getPlanet(energy)) {
        const diffPlanet = others.find((e) => getPlanet(e) !== getPlanet(energy));
        if (diffPlanet) {
          text = isUk
            ? `Карта "${cardName}" пов'язана з планетою ${getPlanet(diffPlanet)}`
            : `The card "${cardName}" is associated with the planet ${getPlanet(diffPlanet)}`;
          statements.push({ text, isTrue: false, cardName });
          continue;
        }
      }
      text = isUk
        ? `Карта "${cardName}" пов'язана з планетою ${planet}`
        : `The card "${cardName}" is associated with the planet ${planet}`;
    } else if (factType === 'keyword') {
      const keywords = getKeywords(energy);
      const otherKeywords = getKeywords(otherEnergy);
      if (isTrue) {
        const kw = pickRandom(keywords);
        text = isUk
          ? `Одне з ключових слів карти "${cardName}" — "${kw}"`
          : `One of the keywords of "${cardName}" is "${kw}"`;
      } else {
        const foreignKw = otherKeywords.find(
          (k: string) => !keywords.includes(k),
        );
        if (foreignKw) {
          text = isUk
            ? `Одне з ключових слів карти "${cardName}" — "${foreignKw}"`
            : `One of the keywords of "${cardName}" is "${foreignKw}"`;
        } else {
          text = isUk
            ? `Одне з ключових слів карти "${cardName}" — "${pickRandom(otherKeywords)}"`
            : `One of the keywords of "${cardName}" is "${pickRandom(otherKeywords)}"`;
        }
      }
    } else {
      const realElementKey = ELEMENT_MAP[energy.name] ?? 'fire';
      const realElement = ELEMENT_NAMES[realElementKey][lang];
      if (isTrue) {
        text = isUk
          ? `Стихія карти "${cardName}" — ${realElement}`
          : `The element of "${cardName}" is ${realElement}`;
      } else {
        const wrongKeys = ALL_ELEMENT_KEYS.filter((e) => e !== realElementKey);
        const wrongElement = ELEMENT_NAMES[pickRandom(wrongKeys)][lang];
        text = isUk
          ? `Стихія карти "${cardName}" — ${wrongElement}`
          : `The element of "${cardName}" is ${wrongElement}`;
      }
    }

    statements.push({ text, isTrue, cardName });
  }

  return statements;
}

// ── Component ──────────────────────────────────────────────────
export default function TrueFalseScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  const isUk = locale === 'uk';
  const addXP = useAppStore((s) => s.addXP);
  const setGameRecord = useAppStore((s) => s.setGameRecord);
  const getGameRecord = useAppStore((s) => s.getGameRecord);
  const energies = ENERGIES?.length ? ENERGIES : FALLBACK_ENERGIES;

  // ── Game state ───────────────────────────────────────────────
  const [statements, setStatements] = useState<Statement[]>([]);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_PER_QUESTION);

  // ── Animations ───────────────────────────────────────────────
  const timerWidth = useRef(new Animated.Value(1)).current;
  const feedbackOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const countdownAnim = useRef(new Animated.Value(0)).current;
  const timerAnimRef = useRef<Animated.CompositeAnimation | null>(null);
  const timerInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Initialize game ──────────────────────────────────────────
  useEffect(() => {
    setStatements(generateStatements(energies, TOTAL_QUESTIONS, isUk));
  }, [energies, isUk]);

  // ── Timer logic (paused during instructions) ────────────────
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (finished || answered || !statements.length || paused) return;

    // Reset timer state
    setTimeLeft(TIME_PER_QUESTION);
    timerWidth.setValue(1);

    // Animate width from 1 to 0 over TIME_PER_QUESTION seconds
    const anim = Animated.timing(timerWidth, {
      toValue: 0,
      duration: TIME_PER_QUESTION * 1000,
      useNativeDriver: false,
    });
    timerAnimRef.current = anim;
    anim.start();

    // Countdown for display + auto-wrong on timeout
    let remaining = TIME_PER_QUESTION;
    timerInterval.current = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerInterval.current) clearInterval(timerInterval.current);
        handleAnswer(null); // timeout = wrong
      }
    }, 1000);

    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (timerAnimRef.current) timerAnimRef.current.stop();
    };
  }, [current, finished, statements.length, paused, answered]);

  // ── Answer handler ───────────────────────────────────────────
  const handleAnswer = (playerSaidTrue: boolean | null) => {
    if (answered) return;
    setAnswered(true);

    // Stop timer
    if (timerInterval.current) clearInterval(timerInterval.current);
    if (timerAnimRef.current) timerAnimRef.current.stop();

    const stmt = statements[current];
    const isCorrect =
      playerSaidTrue !== null && playerSaidTrue === stmt.isTrue;

    setLastCorrect(isCorrect);

    if (isCorrect) {
      setScore((s) => s + XP_PER_CORRECT);
      setStreak((s) => {
        const next = s + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }

    // Feedback animation + countdown
    countdownAnim.setValue(1);
    Animated.parallel([
      Animated.sequence([
        Animated.timing(feedbackOpacity, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.delay(1200),
        Animated.timing(feedbackOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(cardScale, {
          toValue: 1.03,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(cardScale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(countdownAnim, {
        toValue: 0,
        duration: 1550,
        useNativeDriver: false,
      }),
    ]).start(() => {
      if (current + 1 >= TOTAL_QUESTIONS) {
        const finalScore = isCorrect ? score + XP_PER_CORRECT : score;
        const correctCount = Math.round(finalScore / XP_PER_CORRECT);
        setFinished(true);
        addXP(finalScore);
        trackFeatureUsed('truefalse_game', 'learn', 'free');
        setIsNewRecord(setGameRecord('truefalse', correctCount));
      } else {
        setCurrent((c) => c + 1);
        setAnswered(false);
        setLastCorrect(null);
      }
    });
  };

  // ── Restart ──────────────────────────────────────────────────
  const restart = () => {
    setStatements(generateStatements(energies, TOTAL_QUESTIONS, isUk));
    setCurrent(0);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setAnswered(false);
    setLastCorrect(null);
    setFinished(false);
    setIsNewRecord(false);
    setTimeLeft(TIME_PER_QUESTION);
    timerWidth.setValue(1);
    feedbackOpacity.setValue(0);
    countdownAnim.setValue(0);
  };

  // ── Loading guard ────────────────────────────────────────────
  if (!statements.length) return null;

  const stmt = statements[current];

  // ── Timer bar color ──────────────────────────────────────────
  const timerColor = timeLeft <= 3 ? '#EF4444' : Colors.accent;
  const screenHeader = <Stack.Screen options={{ headerShown: false }} />;

  // ── RESULT SCREEN ────────────────────────────────────────────
  if (finished) {
    const correct = Math.round(score / XP_PER_CORRECT);
    const pct = Math.round((correct / TOTAL_QUESTIONS) * 100);
    const emoji = pct >= 80 ? '🏆' : pct >= 50 ? '⭐' : '📚';

    return (
      <LinearGradient colors={['#0D0B1E', '#1C1040', '#0D0B1E']} style={styles.root}>
        {screenHeader}
        <GameResultsAnimation
          title={isUk ? 'Результат' : 'Result'}
          stars={pct >= 80 ? 3 : pct >= 50 ? 2 : 1}
          xp={score}
          stats={[
            { label: isUk ? 'Правильних:' : 'Correct:', value: `${correct}/${TOTAL_QUESTIONS}` },
            { label: '', value: `${pct}%` },
            { label: isUk ? 'Найкраща серія:' : 'Best streak:', value: String(bestStreak) },
            ...(isNewRecord ? [{ label: '🏆', value: isUk ? 'Новий рекорд!' : 'New record!' }] : []),
          ]}
        >
          <TouchableOpacity onPress={restart}>
            <LinearGradient colors={[Colors.accent, Colors.accentDark]} style={styles.actionBtn}>
              <Ionicons name="refresh" size={18} color="#1A0A3E" />
              <Text style={styles.actionBtnText}>{isUk ? 'Спробувати ще раз' : 'Try again'}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backLink}>{isUk ? 'Повернутися' : 'Go back'}</Text>
          </TouchableOpacity>
        </GameResultsAnimation>
      </LinearGradient>
    );
  }

  // ── GAME SCREEN ──────────────────────────────────────────────
  return (
    <LinearGradient colors={['#0D0B1E', '#1C1040', '#0D0B1E']} style={styles.root}>
      {screenHeader}
      <GameInstructions
        gameId="truefalse"
        title="Правда чи міф"
        steps={[
          'Вам показують твердження про Таро та езотерику.',
          'Визначте — це правда чи міф.',
          'Відповідайте швидко — час обмежений!',
          'Чим більше правильних — тим більше досвіду.',
        ]}
        onStart={() => {}}
        onPause={() => setPaused(true)}
        onResume={() => setPaused(false)}
      />
      <View style={styles.container}>
        {/* ── Header ──────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isUk ? 'Правда чи міф' : 'True or myth'}</Text>
          <Text style={styles.headerProgress}>
            {current + 1}/{TOTAL_QUESTIONS}
          </Text>
        </View>

        {/* ── Timer bar ───────────────────────────────── */}
        <View style={styles.timerBarBg}>
          <Animated.View
            style={[
              styles.timerBarFill,
              {
                backgroundColor: timerColor,
                width: timerWidth.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
              },
            ]}
          />
        </View>
        <Text style={[styles.timerText, timeLeft <= 3 && styles.timerTextDanger]}>
          {timeLeft}{isUk ? 'с' : 's'}
        </Text>

        {/* ── Score row ───────────────────────────────── */}
        <View style={styles.scoreRow}>
          <View style={styles.scoreBadge}>
            <Ionicons name="star" size={14} color="#22C55E" />
            <Text style={styles.scoreValue}>{score} XP</Text>
          </View>
          {streak > 1 && (
            <View style={styles.streakBadge}>
              <Ionicons name="flash" size={14} color={Colors.accent} />
              <Text style={styles.streakValue}>{streak} {isUk ? 'серія' : 'streak'}</Text>
            </View>
          )}
        </View>

        {/* ── Statement card ──────────────────────────── */}
        <View style={styles.statementArea}>
          <Animated.View
            style={[
              styles.statementCard,
              { transform: [{ scale: cardScale }] },
            ]}
          >
            {/* Feedback overlay */}
            <Animated.View
              style={[
                styles.feedbackOverlay,
                {
                  opacity: feedbackOpacity,
                  backgroundColor:
                    lastCorrect === true
                      ? 'rgba(34,197,94,0.18)'
                      : 'rgba(239,68,68,0.18)',
                },
              ]}
            />

            <Ionicons
              name="help-circle-outline"
              size={28}
              color={Colors.primaryLight}
              style={{ marginBottom: Spacing.sm }}
            />

            <Text style={styles.statementText}>
              {stmt.text.split(`"${stmt.cardName}"`).length > 1 ? (
                <>
                  {stmt.text.split(`"${stmt.cardName}"`)[0]}
                  <Text style={styles.cardNameHighlight}>
                    &quot;{stmt.cardName}&quot;
                  </Text>
                  {stmt.text.split(`"${stmt.cardName}"`)[1]}
                </>
              ) : (
                stmt.text
              )}
            </Text>

            {/* Feedback icon */}
            {lastCorrect !== null && (
              <Animated.View style={[styles.feedbackIcon, { opacity: feedbackOpacity }]}>
                <Ionicons
                  name={lastCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={40}
                  color={lastCorrect ? '#22C55E' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.feedbackLabel,
                    { color: lastCorrect ? '#22C55E' : '#EF4444' },
                  ]}
                >
                  {lastCorrect ? (isUk ? 'Правильно!' : 'Correct!') : (isUk ? 'Неправильно!' : 'Wrong!')}
                </Text>
              </Animated.View>
            )}
          </Animated.View>
        </View>

        {/* ── Answer buttons ──────────────────────────── */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity
            activeOpacity={0.7}
            disabled={answered}
            onPress={() => handleAnswer(true)}
            style={styles.answerBtnWrap}
          >
            <LinearGradient
              colors={answered ? ['#1a3a2a', '#1a3a2a'] : ['#166534', '#15803d']}
              style={[
                styles.answerBtn,
                answered && styles.answerBtnDisabled,
              ]}
            >
              <Ionicons name="checkmark-circle" size={28} color="#4ade80" />
              <Text style={styles.answerBtnText}>{isUk ? 'Правда' : 'True'}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            disabled={answered}
            onPress={() => handleAnswer(false)}
            style={styles.answerBtnWrap}
          >
            <LinearGradient
              colors={answered ? ['#3a1a1a', '#3a1a1a'] : ['#7f1d1d', '#991b1b']}
              style={[
                styles.answerBtn,
                answered && styles.answerBtnDisabled,
              ]}
            >
              <Ionicons name="close-circle" size={28} color="#f87171" />
              <Text style={styles.answerBtnText}>{isUk ? 'Міф' : 'Myth'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* ── Countdown bar ────────────────────────────── */}
        {answered && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>
              {current + 1 < TOTAL_QUESTIONS
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

        {/* ── Progress dots ───────────────────────────── */}
        <View style={styles.dotsRow}>
          {statements.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === current && styles.dotActive,
                i < current && styles.dotDone,
              ]}
            />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

// ── Styles ─────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: 56 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    paddingRight: 40,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  headerProgress: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right',
  },

  // Timer
  timerBarBg: {
    height: 6,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  timerBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  timerText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: Spacing.sm,
  },
  timerTextDanger: {
    color: '#EF4444',
  },

  // Score
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(34,197,94,0.12)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  scoreValue: {
    color: '#22C55E',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(245,197,66,0.12)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  streakValue: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },

  // Statement card
  statementArea: {
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  statementCard: {
    width: '100%',
    backgroundColor: 'rgba(25, 12, 55, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.3)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    overflow: 'hidden',
  },
  feedbackOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xl,
  },
  statementText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: FontSize.lg,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
  },
  cardNameHighlight: {
    color: Colors.accent,
    fontWeight: '900',
  },
  feedbackIcon: {
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  feedbackLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginTop: 4,
  },

  // Answer buttons
  buttonsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  answerBtnWrap: {
    flex: 1,
  },
  answerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 18,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  answerBtnDisabled: {
    opacity: 0.4,
  },
  answerBtnText: {
    color: '#fff',
    fontSize: FontSize.lg,
    fontWeight: '800',
  },

  // Record
  recordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.md,
    backgroundColor: 'rgba(245,197,66,0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(245,197,66,0.3)',
  },
  recordBadgeText: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '700' },
  prevRecord: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.sm },

  // Countdown
  countdownContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  countdownLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  countdownBarBg: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(139,92,246,0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  countdownBarFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: 2,
  },

  // Progress dots
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingBottom: Spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(139,92,246,0.2)',
  },
  dotActive: {
    backgroundColor: Colors.accent,
    width: 16,
  },
  dotDone: {
    backgroundColor: 'rgba(139,92,246,0.5)',
  },

  // Result screen
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  resultEmoji: {
    fontSize: 60,
    marginBottom: Spacing.md,
  },
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
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginTop: 4,
  },
  resultStatsRow: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.xl,
  },
  resultStat: {
    alignItems: 'center',
    gap: 4,
  },
  resultStatValue: {
    color: '#fff',
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  resultStatLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
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
    color: '#1A0A3E',
    fontSize: FontSize.md,
    fontWeight: '800',
  },
  backLink: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: Spacing.sm,
  },
});
