import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { Stack } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { TAROT_CARDS } from '../../lib/staticData';
import { TAROT_IMAGES } from '../../constants/tarotImages';
import { useAppStore } from '../../stores/useAppStore';
import { getCardForDisplay } from '../../lib/tarotI18n';
import { useI18n } from '../../lib/i18n';

const { width } = Dimensions.get('window');
const CARD_COL = 3;
const CARD_WIDTH = (width - Spacing.lg * 2 - Spacing.sm * (CARD_COL - 1)) / CARD_COL;

type GameMode = 'browse' | 'quiz_keyword' | 'quiz_name' | 'quiz_yesno' | 'result';

interface QuizQuestion {
  card: (typeof TAROT_CARDS)[0];
  options: string[];
  correctIndex: number;
  type: 'keyword' | 'name' | 'yesno';
}

// ─── Question generators ──────────────────────────────────────────────────────

function generateKeywordQuestion(cards: typeof TAROT_CARDS, locale: string): QuizQuestion {
  const card = cards[Math.floor(Math.random() * cards.length)];
  const cardL10n = getCardForDisplay(card, locale);
  const wrongs = cards
    .filter((c) => c.id !== card.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((c) => getCardForDisplay(c, locale).name);
  const options = [cardL10n.name, ...wrongs].sort(() => Math.random() - 0.5);
  return { card, options, correctIndex: options.indexOf(cardL10n.name), type: 'keyword' };
}

function generateNameQuestion(cards: typeof TAROT_CARDS, locale: string): QuizQuestion {
  const card = cards[Math.floor(Math.random() * cards.length)];
  const cardL10n = getCardForDisplay(card, locale);
  const wrongs = cards
    .filter((c) => c.id !== card.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((c) => getCardForDisplay(c, locale).keywords[0] ?? '');
  const firstKw = cardL10n.keywords[0] ?? '';
  const options = [firstKw, ...wrongs].sort(() => Math.random() - 0.5);
  return { card, options, correctIndex: options.indexOf(firstKw), type: 'name' };
}

function generateYesNoQuestion(cards: typeof TAROT_CARDS, _locale: string): QuizQuestion {
  const card = cards[Math.floor(Math.random() * cards.length)];
  const options = ['Так', 'Ні', 'Можливо'];
  const correctAnswer = card.yesNo === 'yes' ? 'Так' : card.yesNo === 'no' ? 'Ні' : 'Можливо';
  return { card, options, correctIndex: options.indexOf(correctAnswer), type: 'yesno' };
}

const GAME_MODES = [
  { id: 'quiz_keyword', label: 'Ключові слова', icon: 'key-outline' as const, description: 'Вгадай карту за ключовим словом', xp: 10 },
  { id: 'quiz_name',    label: 'Значення',      icon: 'book-outline' as const, description: 'Вгадай значення карти за назвою',  xp: 15 },
  { id: 'quiz_yesno',  label: 'Так чи Ні',     icon: 'help-outline' as const, description: 'Вгадай відповідь карти',           xp: 20 },
];

const QUIZ_LENGTH = 5;

const INSTRUCTIONS: Record<string, string> = {
  quiz_keyword: 'Тобі показують ключове слово — вгадай, якій карті воно належить. Чим більше ти вгадаєш, тим більше XP отримаєш!',
  quiz_name:    'Тобі показують зображення карти — обери правильне ключове слово, що відповідає їй.',
  quiz_yesno:   'Тобі показують карту — визнач, яку відповідь вона дає на пряме запитання: Так, Ні або Можливо.',
};

// ─── Main component ──────────────────────────────────────────────────────────

export default function TarotLearnScreen() {
  const { locale } = useI18n();
  const [mode, setMode] = useState<GameMode>('browse');
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizType, setQuizType] = useState<GameMode>('quiz_keyword');

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Instructions modal
  const [showInstructions, setShowInstructions] = useState(false);
  const hasSeenRef = useRef(false);

  // Encyclopedia modal
  const [encyclopediaCard, setEncyclopediaCard] = useState<(typeof TAROT_CARDS)[0] | null>(null);

  const addTokens = useAppStore((s) => s.addTokens);
  const addXP     = useAppStore((s) => s.addXP);

  // ── Timer helpers ──
  const startTimer = useCallback(() => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
  }, []);

  const pauseTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const resetTimer = useCallback(() => {
    pauseTimer();
    setElapsed(0);
  }, [pauseTimer]);

  useEffect(() => {
    return () => pauseTimer();
  }, [pauseTimer]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Instructions ──
  const openInstructions = () => {
    pauseTimer();
    setShowInstructions(true);
  };

  const closeInstructions = () => {
    setShowInstructions(false);
    if (mode !== 'browse' && mode !== 'result') startTimer();
  };

  // ── Quiz logic ──
  const generateQuestion = (type: GameMode): QuizQuestion => {
    switch (type) {
      case 'quiz_keyword': return generateKeywordQuestion(TAROT_CARDS, locale);
      case 'quiz_name':    return generateNameQuestion(TAROT_CARDS, locale);
      case 'quiz_yesno':   return generateYesNoQuestion(TAROT_CARDS, locale);
      default:             return generateKeywordQuestion(TAROT_CARDS, locale);
    }
  };

  const startQuiz = (type: GameMode) => {
    setQuizType(type);
    setScore(0);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentQuestion(generateQuestion(type));
    setMode(type);
    resetTimer();

    if (!hasSeenRef.current) {
      hasSeenRef.current = true;
      setShowInstructions(true);
    } else {
      startTimer();
    }
  };

  const handleAnswer = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    setShowExplanation(true);
    if (idx === currentQuestion?.correctIndex) {
      setScore((s) => s + 1);
    }
  };

  const nextQuestion = () => {
    const nextIdx = questionIndex + 1;
    if (nextIdx >= QUIZ_LENGTH) {
      pauseTimer();
      const level = GAME_MODES.find((d) => d.id === quizType);
      const xpEarned = score * (level?.xp ?? 10);
      addXP(xpEarned);
      addTokens(Math.floor(xpEarned / 50));
      setMode('result');
    } else {
      setQuestionIndex(nextIdx);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setCurrentQuestion(generateQuestion(quizType));
    }
  };

  const getQuestion = () => {
    if (!currentQuestion) return '';
    const l10n = getCardForDisplay(currentQuestion.card, locale);
    switch (currentQuestion.type) {
      case 'keyword':
        return `Яка карта пов'язана з ключовим словом "${l10n.keywords[0] ?? ''}"?`;
      case 'name':
        return `Яке ключове слово відповідає карті "${l10n.name}"?`;
      case 'yesno':
        return `Яку відповідь дає карта "${l10n.name}" на пряме питання?`;
    }
  };

  // ─── BROWSE mode ───────────────────────────────────────────────────────────

  if (mode === 'browse') {
    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />

        <ScrollView style={styles.container} contentContainerStyle={styles.browseContent}>
          {/* Header */}
          <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.browseHeader}>
            <Ionicons name="library-outline" size={40} color="#A78BFA" />
            <Text style={styles.browseTitle}>Вивчення Таро</Text>
            <Text style={styles.browseSubtitle}>Грай та запам'ятовуй значення карт</Text>
          </LinearGradient>

          {/* Game mode cards */}
          <View style={styles.browseSection}>
            {GAME_MODES.map((level) => (
              <TouchableOpacity
                key={level.id}
                onPress={() => startQuiz(level.id as GameMode)}
                activeOpacity={0.8}
              >
                <Card style={styles.levelCardInner}>
                  <View style={styles.levelIcon}>
                    <Ionicons name={level.icon} size={24} color={Colors.primary} />
                  </View>
                  <View style={styles.levelInfo}>
                    <Text style={styles.levelTitle}>{level.label}</Text>
                    <Text style={styles.levelDesc}>{level.description}</Text>
                  </View>
                  <View style={styles.xpBadge}>
                    <Text style={styles.xpText}>+{level.xp} XP</Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>

          {/* Encyclopedia section */}
          <Text style={styles.encyclopediaTitle}>Карти таро</Text>
          <View style={styles.cardGrid}>
            {TAROT_CARDS.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.cardGridItem}
                onPress={() => setEncyclopediaCard(card)}
                activeOpacity={0.75}
              >
                {TAROT_IMAGES[card.id] ? (
                  <Image source={TAROT_IMAGES[card.id]} style={styles.cardGridImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardGridImage, styles.cardGridFallback]}>
                    <Text style={styles.cardGridNum}>{card.id}</Text>
                  </View>
                )}
                <Text style={styles.cardGridName} numberOfLines={2}>{getCardForDisplay(card, locale).name}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Encyclopedia detail modal */}
        <Modal
          visible={encyclopediaCard !== null}
          animationType="slide"
          transparent
          onRequestClose={() => setEncyclopediaCard(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalSheet}>
              <TouchableOpacity style={styles.modalClose} onPress={() => setEncyclopediaCard(null)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>

              {encyclopediaCard && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View style={styles.modalCardRow}>
                    {TAROT_IMAGES[encyclopediaCard.id] ? (
                      <Image
                        source={TAROT_IMAGES[encyclopediaCard.id]}
                        style={styles.modalCardImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={[styles.modalCardImage, styles.cardGridFallback]}>
                        <Text style={styles.cardGridNum}>{encyclopediaCard.id}</Text>
                      </View>
                    )}
                    <View style={styles.modalCardInfo}>
                      <Text style={styles.modalCardName}>{getCardForDisplay(encyclopediaCard, locale).name}</Text>
                      <Text style={styles.modalCardNameEn}>{encyclopediaCard.name}</Text>
                      <View style={styles.keywordWrap}>
                        {getCardForDisplay(encyclopediaCard, locale).keywords.map((kw) => (
                          <View key={kw} style={styles.kwBadge}>
                            <Text style={styles.kwText}>{kw}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  </View>

                  <View style={styles.modalMeaning}>
                    <View style={styles.modalMeaningLabelRow}>
                      <Ionicons name="arrow-up-circle-outline" size={14} color={Colors.primaryLight} />
                      <Text style={styles.modalMeaningLabel}>Пряме значення</Text>
                    </View>
                    <Text style={styles.modalMeaningText}>{getCardForDisplay(encyclopediaCard, locale).upright}</Text>
                  </View>
                  <View style={styles.modalMeaning}>
                    <View style={styles.modalMeaningLabelRow}>
                      <Ionicons name="sync-outline" size={14} color={Colors.primaryLight} />
                      <Text style={styles.modalMeaningLabel}>Перевернута</Text>
                    </View>
                    <Text style={styles.modalMeaningText}>{getCardForDisplay(encyclopediaCard, locale).reversed}</Text>
                  </View>
                  <View style={styles.modalMeaning}>
                    <View style={styles.modalMeaningLabelRow}>
                      <Ionicons name="bulb-outline" size={14} color={Colors.accent} />
                      <Text style={[styles.modalMeaningLabel, { color: Colors.accent }]}>Порада</Text>
                    </View>
                    <Text style={styles.modalMeaningText}>{getCardForDisplay(encyclopediaCard, locale).advice}</Text>
                  </View>
                  <View style={{ height: 32 }} />
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
      </>
    );
  }

  // ─── RESULT mode ───────────────────────────────────────────────────────────

  if (mode === 'result') {
    const level = GAME_MODES.find((d) => d.id === quizType);
    const xpEarned = score * (level?.xp ?? 10);
    const tokensEarned = Math.floor(xpEarned / 50);
    const percentage = Math.round((score / QUIZ_LENGTH) * 100);

    return (
      <>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.container}>
          <LinearGradient colors={['#0F0820', '#1E1B4B']} style={styles.resultScreen}>
            <Text style={styles.resultEmoji}>
              {percentage >= 80 ? '🎉' : percentage >= 60 ? '👏' : '💪'}
            </Text>
            <Text style={styles.resultTitle}>
              {percentage >= 80 ? 'Чудово!' : percentage >= 60 ? 'Добре!' : 'Продовжуй!'}
            </Text>
            <Text style={styles.resultScore}>{score}/{QUIZ_LENGTH}</Text>
            <Text style={styles.resultPercent}>{percentage}%</Text>
            <Text style={styles.resultTime}>⏱ {formatTime(elapsed)}</Text>

            <View style={styles.resultRewards}>
              <View style={styles.rewardItem}>
                <Text style={styles.rewardValue}>+{xpEarned}</Text>
                <Text style={styles.rewardLabel}>XP</Text>
              </View>
              {tokensEarned > 0 && (
                <View style={styles.rewardItem}>
                  <Ionicons name="diamond" size={24} color={Colors.accent} />
                  <Text style={styles.rewardValue}>+{tokensEarned}</Text>
                  <Text style={styles.rewardLabel}>Кристалів</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.resultBtn} onPress={() => startQuiz(quizType)}>
              <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={styles.resultBtnGradient}>
                <Text style={styles.resultBtnText}>Грати ще</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.resultSecBtn} onPress={() => setMode('browse')}>
              <Text style={styles.resultSecBtnText}>Повернутись до ігор</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </>
    );
  }

  // ─── QUIZ mode ─────────────────────────────────────────────────────────────

  if (!currentQuestion) return null;

  const showCardVisual = currentQuestion.type !== 'keyword';
  const cardImg = TAROT_IMAGES[currentQuestion.card.id];

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Instructions modal */}
      <Modal visible={showInstructions} transparent animationType="fade" onRequestClose={closeInstructions}>
        <View style={styles.instrOverlay}>
          <View style={styles.instrSheet}>
            <Text style={styles.instrTitle}>Як грати</Text>
            <Text style={styles.instrText}>
              {INSTRUCTIONS[quizType] ?? ''}
            </Text>
            <View style={styles.instrTips}>
              <View style={styles.instrTipRow}>
                <Ionicons name="timer-outline" size={18} color={Colors.primaryLight} />
                <Text style={styles.instrTipText}>Час іде поки ти граєш</Text>
              </View>
              <View style={styles.instrTipRow}>
                <Ionicons name="help-circle-outline" size={18} color={Colors.primaryLight} />
                <Text style={styles.instrTipText}>Кнопка "?" — відкрити інструкцію (зупиняє таймер)</Text>
              </View>
              <View style={styles.instrTipRow}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.success} />
                <Text style={styles.instrTipText}>Обирай відповідь — побачиш пояснення</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.instrBtn} onPress={closeInstructions}>
              <Text style={styles.instrBtnText}>Зрозуміло, грати!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        <LinearGradient colors={['#0F0820', '#1E1B4B']} style={{ flex: 1 }}>
          {/* Quiz header */}
          <View style={styles.quizHeader}>
            <TouchableOpacity onPress={() => { pauseTimer(); setMode('browse'); }} style={styles.quizHeaderBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.textMuted} />
            </TouchableOpacity>

            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${(questionIndex / QUIZ_LENGTH) * 100}%` }]} />
            </View>

            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>

            <TouchableOpacity onPress={openInstructions} style={styles.quizHeaderBtn}>
              <Ionicons name="help-circle-outline" size={22} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Score — centered, full width */}
          <View style={styles.scoreRow}>
            <Ionicons name="star" size={16} color={Colors.accent} />
            <Text style={styles.scoreText}>{score} / {QUIZ_LENGTH}</Text>
            <Text style={styles.progressLabel}>{questionIndex + 1}/{QUIZ_LENGTH}</Text>
          </View>

          {/* Card visual */}
          <View style={styles.quizCard}>
            {showCardVisual ? (
              cardImg ? (
                <Image source={cardImg} style={styles.quizCardImage} resizeMode="cover" />
              ) : (
                <LinearGradient colors={['#1E1B4B', '#4338CA']} style={styles.quizCardVisual}>
                  <Text style={styles.quizCardNum}>{currentQuestion.card.id}</Text>
                </LinearGradient>
              )
            ) : (
              <LinearGradient colors={['#1E1B4B', '#4338CA']} style={styles.quizCardVisual}>
                <Ionicons name="help" size={44} color="rgba(255,255,255,0.3)" />
                <Text style={styles.quizCardHint}>?</Text>
              </LinearGradient>
            )}

            <Text style={styles.questionText}>{getQuestion()}</Text>
          </View>

          {/* Options */}
          <View style={styles.optionsGrid}>
            {currentQuestion.options.map((opt, idx) => {
              let bgColor = Colors.bgCard;
              let borderColor = Colors.border;
              let textColor = Colors.text;

              if (selectedAnswer !== null) {
                if (idx === currentQuestion.correctIndex) {
                  bgColor = 'rgba(52, 211, 153, 0.15)';
                  borderColor = Colors.success;
                  textColor = Colors.success;
                } else if (idx === selectedAnswer) {
                  bgColor = 'rgba(248, 113, 113, 0.15)';
                  borderColor = Colors.error;
                  textColor = Colors.error;
                }
              }

              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.optionBtn, { backgroundColor: bgColor, borderColor }]}
                  onPress={() => handleAnswer(idx)}
                  disabled={selectedAnswer !== null}
                  activeOpacity={0.75}
                >
                  <Text style={styles.optionLetter}>{String.fromCharCode(65 + idx)}</Text>
                  <Text style={[styles.optionText, { color: textColor }]}>{opt}</Text>
                  {selectedAnswer !== null && idx === currentQuestion.correctIndex && (
                    <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  )}
                  {selectedAnswer === idx && idx !== currentQuestion.correctIndex && (
                    <Ionicons name="close-circle" size={20} color={Colors.error} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation overlay — absolute bottom sheet */}
          {showExplanation && (
            <View style={styles.explanationOverlay}>
              <View style={styles.explanationSheet}>
                <View style={styles.explanationTitleRow}>
                  <Ionicons
                    name={selectedAnswer === currentQuestion.correctIndex ? 'checkmark-circle' : 'close-circle'}
                    size={22}
                    color={selectedAnswer === currentQuestion.correctIndex ? '#10B981' : Colors.error}
                  />
                  <Text style={[styles.explanationTitle, { color: selectedAnswer === currentQuestion.correctIndex ? '#10B981' : Colors.error }]}>
                    {selectedAnswer === currentQuestion.correctIndex ? 'Правильно!' : 'Неправильно'}
                  </Text>
                </View>
                <Text style={styles.explanationText}>
                  {getCardForDisplay(currentQuestion.card, locale).name} ({currentQuestion.card.name}) — {getCardForDisplay(currentQuestion.card, locale).upright}
                </Text>
                <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
                  <Text style={styles.nextBtnText}>
                    {questionIndex < QUIZ_LENGTH - 1 ? 'Далі →' : 'Завершити'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </LinearGradient>
      </View>
    </>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // ── Browse ──
  browseContent: { paddingBottom: 100 },
  browseHeader: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: 60,
    gap: Spacing.sm,
  },
  browseTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  browseSubtitle: {
    color: '#A78BFA',
    fontSize: FontSize.md,
    textAlign: 'center',
  },
  browseSection: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  levelCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xs,
  },
  levelIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelInfo: { flex: 1, gap: 2 },
  levelTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  levelDesc: { color: Colors.textMuted, fontSize: FontSize.sm },
  xpBadge: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  xpText: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: '700' },

  // ── Encyclopedia ──
  encyclopediaTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    marginTop: Spacing.xs,
  },
  cardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  cardGridItem: {
    width: CARD_WIDTH,
    alignItems: 'center',
    gap: 4,
  },
  cardGridImage: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.5,
    borderRadius: BorderRadius.sm,
  },
  cardGridFallback: {
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardGridNum: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  cardGridName: {
    color: Colors.textMuted,
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },

  // ── Encyclopedia modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    maxHeight: '90%',
  },
  modalClose: {
    alignSelf: 'flex-end',
    padding: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  modalCardRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalCardImage: {
    width: 90,
    height: 135,
    borderRadius: BorderRadius.md,
  },
  modalCardInfo: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  modalCardName: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  modalCardNameEn: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  keywordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  kwBadge: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  kwText: {
    color: Colors.primaryLight,
    fontSize: 11,
    fontWeight: '600',
  },
  modalMeaning: {
    marginBottom: Spacing.md,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  modalMeaningLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  modalMeaningLabel: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  modalMeaningText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  // ── Quiz header ──
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingTop: 56,
    paddingBottom: Spacing.sm,
  },
  quizHeaderBtn: { padding: Spacing.xs },
  progressBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
  },
  timerText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    minWidth: 42,
    textAlign: 'right',
  },
  progressLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },

  // ── Score ──
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
  },
  scoreText: { color: Colors.accent, fontSize: FontSize.lg, fontWeight: '800' },

  // ── Card visual ──
  quizCard: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  quizCardImage: {
    width: 90,
    height: 130,
    borderRadius: BorderRadius.md,
  },
  quizCardVisual: {
    width: 90,
    height: 130,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  quizCardNum: { color: Colors.accent, fontSize: FontSize.title, fontWeight: '900' },
  quizCardHint: { color: 'rgba(255,255,255,0.4)', fontSize: 36, fontWeight: '800' },
  questionText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: Spacing.sm,
  },

  // ── Options ──
  optionsGrid: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
  },
  optionLetter: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.1)',
    textAlign: 'center',
    lineHeight: 28,
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  optionText: {
    flex: 1,
    fontSize: FontSize.md,
    fontWeight: '500',
  },

  // ── Explanation overlay ──
  explanationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  explanationSheet: {
    backgroundColor: Colors.bgCard,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  explanationTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  explanationTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  explanationText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  nextBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },

  // ── Instructions modal ──
  instrOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  instrSheet: {
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instrTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  instrText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
    textAlign: 'center',
  },
  instrTips: { gap: Spacing.sm },
  instrTipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  instrTipText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    flex: 1,
  },
  instrBtn: {
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  instrBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },

  // ── Result ──
  resultScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.lg,
  },
  resultEmoji: { fontSize: 72 },
  resultTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800' },
  resultScore: { color: Colors.accent, fontSize: 56, fontWeight: '900' },
  resultPercent: { color: Colors.textMuted, fontSize: FontSize.xl, fontWeight: '600' },
  resultTime: { color: Colors.textMuted, fontSize: FontSize.md },
  resultRewards: {
    flexDirection: 'row',
    gap: Spacing.xl,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
  },
  rewardItem: { alignItems: 'center', gap: 4 },
  rewardValue: { color: Colors.accent, fontSize: FontSize.xxl, fontWeight: '800' },
  rewardLabel: { color: Colors.textMuted, fontSize: FontSize.sm },
  resultBtn: {
    width: '100%',
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  resultBtnGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
  },
  resultBtnText: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '700' },
  resultSecBtn: { padding: Spacing.md },
  resultSecBtnText: { color: Colors.textMuted, fontSize: FontSize.md },
});
