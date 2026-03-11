import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { TAROT_CARDS } from '../../constants/tarotData';
import { useAppStore } from '../../stores/useAppStore';

const { width } = Dimensions.get('window');

type GameMode = 'browse' | 'quiz_keyword' | 'quiz_name' | 'quiz_yesno' | 'result';

interface QuizQuestion {
  card: (typeof TAROT_CARDS)[0];
  options: string[];
  correctIndex: number;
  type: 'keyword' | 'name' | 'yesno';
}

function generateKeywordQuestion(cards: typeof TAROT_CARDS): QuizQuestion {
  const card = cards[Math.floor(Math.random() * cards.length)];
  const keyword = card.keywords[Math.floor(Math.random() * card.keywords.length)];
  const wrongs = cards
    .filter((c) => c.id !== card.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((c) => c.nameUk);
  const options = [card.nameUk, ...wrongs].sort(() => Math.random() - 0.5);
  return {
    card,
    options,
    correctIndex: options.indexOf(card.nameUk),
    type: 'keyword',
  };
}

function generateNameQuestion(cards: typeof TAROT_CARDS): QuizQuestion {
  const card = cards[Math.floor(Math.random() * cards.length)];
  const wrongs = cards
    .filter((c) => c.id !== card.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3)
    .map((c) => c.keywords[0]);
  const options = [card.keywords[0], ...wrongs].sort(() => Math.random() - 0.5);
  return {
    card,
    options,
    correctIndex: options.indexOf(card.keywords[0]),
    type: 'name',
  };
}

function generateYesNoQuestion(cards: typeof TAROT_CARDS): QuizQuestion {
  const card = cards[Math.floor(Math.random() * cards.length)];
  const options = ['Так', 'Ні', 'Можливо'];
  const correctAnswer = card.yesNo === 'yes' ? 'Так' : card.yesNo === 'no' ? 'Ні' : 'Можливо';
  return {
    card,
    options,
    correctIndex: options.indexOf(correctAnswer),
    type: 'yesno',
  };
}

const DIFFICULTY_LEVELS = [
  { id: 'quiz_keyword', label: 'Ключові слова', icon: 'key-outline' as const, description: 'Вгадай карту за ключовим словом', xp: 10 },
  { id: 'quiz_name', label: 'Значення', icon: 'book-outline' as const, description: 'Вгадай значення карти за назвою', xp: 15 },
  { id: 'quiz_yesno', label: 'Так чи Ні', icon: 'help-outline' as const, description: 'Вгадай відповідь карти', xp: 20 },
];

const QUIZ_LENGTH = 5;

export default function TarotLearnScreen() {
  const [mode, setMode] = useState<GameMode>('browse');
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizType, setQuizType] = useState<GameMode>('quiz_keyword');
  const [browsedCard, setBrowsedCard] = useState<(typeof TAROT_CARDS)[0] | null>(null);

  const addTokens = useAppStore((s) => s.addTokens);

  const startQuiz = (type: GameMode) => {
    setQuizType(type);
    setScore(0);
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setShowExplanation(false);
    const q = generateQuestion(type);
    setCurrentQuestion(q);
    setMode(type);
  };

  const generateQuestion = (type: GameMode): QuizQuestion => {
    switch (type) {
      case 'quiz_keyword': return generateKeywordQuestion(TAROT_CARDS);
      case 'quiz_name': return generateNameQuestion(TAROT_CARDS);
      case 'quiz_yesno': return generateYesNoQuestion(TAROT_CARDS);
      default: return generateKeywordQuestion(TAROT_CARDS);
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
      // Quiz complete
      const level = DIFFICULTY_LEVELS.find((d) => d.id === quizType);
      const xpEarned = score * (level?.xp ?? 10);
      addTokens(Math.floor(xpEarned / 50)); // Convert XP to tokens
      setMode('result');
    } else {
      setQuestionIndex(nextIdx);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setCurrentQuestion(generateQuestion(quizType));
    }
  };

  if (mode === 'browse') {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.header}>
          <Ionicons name="library-outline" size={40} color="#A78BFA" />
          <Text style={styles.headerTitle}>Вивчення Таро</Text>
          <Text style={styles.headerSubtitle}>Грай та запам'ятовуй значення карт</Text>
        </LinearGradient>

        {/* Quiz modes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Режими навчання</Text>
          {DIFFICULTY_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.id}
              style={styles.levelCard}
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

        {/* Card browser */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Всі Аркани (22)</Text>
          <View style={styles.cardsGrid}>
            {TAROT_CARDS.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={styles.cardMini}
                onPress={() => setBrowsedCard(card)}
              >
                <LinearGradient
                  colors={['#1E1B4B', '#4338CA']}
                  style={styles.cardMiniGradient}
                >
                  <Text style={styles.cardMiniNum}>{card.id}</Text>
                  <Text style={styles.cardMiniName} numberOfLines={2}>{card.nameUk}</Text>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Card detail modal */}
        {browsedCard && (
          <View style={styles.cardDetailOverlay}>
            <View style={styles.cardDetailContainer}>
              <TouchableOpacity style={styles.closeBtn} onPress={() => setBrowsedCard(null)}>
                <Ionicons name="close" size={24} color={Colors.textMuted} />
              </TouchableOpacity>
              <ScrollView>
                <LinearGradient colors={['#1E1B4B', '#4338CA']} style={styles.cardDetailHero}>
                  <Text style={styles.cardDetailNum}>{browsedCard.id}</Text>
                  <Text style={styles.cardDetailTitle}>{browsedCard.nameUk}</Text>
                  <Text style={styles.cardDetailTitleEn}>{browsedCard.name}</Text>
                  <View style={styles.cardDetailMeta}>
                    <Text style={styles.cardMetaTag}>{browsedCard.element}</Text>
                    <Text style={styles.cardMetaTag}>{browsedCard.planet}</Text>
                    <Text style={[styles.cardMetaTag, { color: browsedCard.yesNo === 'yes' ? Colors.success : browsedCard.yesNo === 'no' ? Colors.error : Colors.accent }]}>
                      {browsedCard.yesNo === 'yes' ? 'Так ✓' : browsedCard.yesNo === 'no' ? 'Ні ✗' : 'Можливо ~'}
                    </Text>
                  </View>
                </LinearGradient>

                <View style={styles.cardDetailBody}>
                  <View style={styles.keywords}>
                    {browsedCard.keywords.map((kw) => (
                      <View key={kw} style={styles.kwBadge}>
                        <Text style={styles.kwText}>{kw}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.meaningSection}>
                    <Text style={styles.meaningLabel}>↑ Пряме положення</Text>
                    <Text style={styles.meaningText}>{browsedCard.upright}</Text>
                  </View>

                  <View style={styles.meaningSection}>
                    <Text style={[styles.meaningLabel, { color: Colors.error }]}>↓ Перевернуте</Text>
                    <Text style={styles.meaningText}>{browsedCard.reversed}</Text>
                  </View>

                  <View style={styles.meaningSection}>
                    <Text style={[styles.meaningLabel, { color: Colors.success }]}>💡 Порада</Text>
                    <Text style={styles.meaningText}>{browsedCard.advice}</Text>
                  </View>

                  <View style={styles.meaningSection}>
                    <Text style={[styles.meaningLabel, { color: '#F9A8D4' }]}>❤️ Любов</Text>
                    <Text style={styles.meaningText}>{browsedCard.loveAdvice}</Text>
                  </View>

                  <View style={styles.meaningSection}>
                    <Text style={[styles.meaningLabel, { color: Colors.accent }]}>💼 Кар'єра</Text>
                    <Text style={styles.meaningText}>{browsedCard.careerAdvice}</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        )}
      </ScrollView>
    );
  }

  if (mode === 'result') {
    const level = DIFFICULTY_LEVELS.find((d) => d.id === quizType);
    const xpEarned = score * (level?.xp ?? 10);
    const tokensEarned = Math.floor(xpEarned / 50);
    const percentage = Math.round((score / QUIZ_LENGTH) * 100);

    return (
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
            <Text style={styles.resultSecBtnText}>Повернутись</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // Quiz mode
  if (!currentQuestion) return null;

  const getQuestion = () => {
    switch (currentQuestion.type) {
      case 'keyword':
        return `Яка карта пов'язана з ключовим словом:\n"${currentQuestion.card.keywords[0]}"?`;
      case 'name':
        return `Яке ключове слово відповідає карті:\n"${currentQuestion.card.nameUk}"?`;
      case 'yesno':
        return `Яку відповідь дає карта\n"${currentQuestion.card.nameUk}" на пряме питання?`;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0F0820', '#1E1B4B']} style={{ flex: 1 }}>
        {/* Progress */}
        <View style={styles.quizHeader}>
          <TouchableOpacity onPress={() => setMode('browse')}>
            <Ionicons name="close" size={24} color={Colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${(questionIndex / QUIZ_LENGTH) * 100}%` }]} />
          </View>
          <Text style={styles.progressLabel}>{questionIndex + 1}/{QUIZ_LENGTH}</Text>
        </View>

        <ScrollView contentContainerStyle={styles.quizContent}>
          {/* Score */}
          <View style={styles.scoreRow}>
            <Ionicons name="star" size={16} color={Colors.accent} />
            <Text style={styles.scoreText}>{score} правильно</Text>
          </View>

          {/* Card display */}
          <View style={styles.quizCard}>
            {currentQuestion.type !== 'name' && (
              <LinearGradient colors={['#1E1B4B', '#4338CA']} style={styles.quizCardVisual}>
                <Text style={styles.quizCardNum}>{currentQuestion.card.id}</Text>
                {currentQuestion.type === 'keyword' && (
                  <Text style={styles.quizCardHint}>?</Text>
                )}
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

          {/* Explanation */}
          {showExplanation && (
            <Card style={styles.explanationCard}>
              <Text style={styles.explanationTitle}>
                {selectedAnswer === currentQuestion.correctIndex ? '✅ Правильно!' : '❌ Неправильно'}
              </Text>
              <Text style={styles.explanationText}>
                {currentQuestion.card.nameUk} ({currentQuestion.card.name}) — {currentQuestion.card.upright}
              </Text>
              <TouchableOpacity style={styles.nextBtn} onPress={nextQuestion}>
                <Text style={styles.nextBtnText}>
                  {questionIndex < QUIZ_LENGTH - 1 ? 'Далі →' : 'Завершити'}
                </Text>
              </TouchableOpacity>
            </Card>
          )}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 100 },

  header: {
    alignItems: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#A78BFA',
    fontSize: FontSize.md,
    textAlign: 'center',
  },

  section: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },

  levelCard: { marginBottom: Spacing.xs },
  levelCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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

  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  cardMini: {
    width: (width - Spacing.lg * 2 - Spacing.xs * 4) / 5,
    aspectRatio: 0.7,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  cardMiniGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    gap: 2,
  },
  cardMiniNum: { color: Colors.accent, fontSize: FontSize.md, fontWeight: '800' },
  cardMiniName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },

  cardDetailOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    zIndex: 100,
  },
  cardDetailContainer: {
    flex: 1,
    marginTop: 60,
    backgroundColor: Colors.bg,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardDetailHero: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.xxl,
  },
  cardDetailNum: { color: Colors.accent, fontSize: FontSize.title, fontWeight: '900' },
  cardDetailTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800' },
  cardDetailTitleEn: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.md },
  cardDetailMeta: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  cardMetaTag: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },

  cardDetailBody: { padding: Spacing.lg, gap: Spacing.md },
  keywords: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  kwBadge: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  kwText: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: '600' },

  meaningSection: {
    gap: 6,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  meaningLabel: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  meaningText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  // Quiz styles
  quizHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    paddingTop: 56,
  },
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
  progressLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    minWidth: 32,
    textAlign: 'right',
  },

  quizContent: { padding: Spacing.lg, gap: Spacing.lg, paddingBottom: 40 },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
  },
  scoreText: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '700' },

  quizCard: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  quizCardVisual: {
    width: 100,
    height: 140,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  quizCardNum: { color: Colors.accent, fontSize: FontSize.title, fontWeight: '900' },
  quizCardHint: { color: 'rgba(255,255,255,0.5)', fontSize: 40, fontWeight: '800' },
  questionText: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
  },

  optionsGrid: { gap: Spacing.sm },
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

  explanationCard: {
    gap: Spacing.md,
    borderColor: Colors.primary,
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

  // Result styles
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
