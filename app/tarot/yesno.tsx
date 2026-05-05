import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TAROT_CARDS } from '../../constants/tarotData';
import { TAROT_IMAGES } from '../../constants/tarotImages';
import { useAppStore } from '../../stores/useAppStore';

const { width } = Dimensions.get('window');

const ANSWER_CONFIG = {
  yes: {
    label: 'ТАК',
    iconName: 'checkmark-circle' as const,
    gradient: ['#064E3B', '#059669'] as [string, string],
    textColor: '#34D399',
    description: 'Карти говорять ТАК. Всесвіт підтримує ваш намір.',
  },
  no: {
    label: 'НІ',
    iconName: 'close-circle' as const,
    gradient: ['#4C0519', '#BE123C'] as [string, string],
    textColor: '#F87171',
    description: 'Карти радять почекати або переглянути свій підхід.',
  },
  maybe: {
    label: 'МОЖЛИВО',
    iconName: 'help-circle' as const,
    gradient: ['#1E1B4B', '#4338CA'] as [string, string],
    textColor: '#A78BFA',
    description: 'Ситуація неоднозначна. Прислухайтесь до своєї інтуїції.',
  },
};

export default function YesNoScreen() {
  const router = useRouter();
  const isPremium = useAppStore((s) => s.isPremium);
  const [question, setQuestion] = useState('');
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [result, setResult] = useState<{ card: (typeof TAROT_CARDS)[0]; isReversed: boolean } | null>(null);
  const [isRevealing, setIsRevealing] = useState(false);
  const [cardScale] = useState(new Animated.Value(0));

  const validateQuestion = (q: string): string | null => {
    const t = q.trim();
    if (t.length < 8) return 'Запитання надто коротке (мінімум 8 символів)';
    if (t.split(/\s+/).filter(Boolean).length < 2) return 'Введіть повноцінне запитання (мінімум 2 слова)';
    return null;
  };

  const askCards = () => {
    const err = validateQuestion(question);
    if (err) { setQuestionError(err); return; }
    setQuestionError(null);
    setIsRevealing(true);
    setResult(null);

    setTimeout(() => {
      const randomCard = TAROT_CARDS[Math.floor(Math.random() * TAROT_CARDS.length)];
      const isReversed = Math.random() > 0.6;
      setResult({ card: randomCard, isReversed });
      setIsRevealing(false);

      Animated.spring(cardScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }, 2000);

    cardScale.setValue(0);
  };

  const reset = () => {
    setResult(null);
    setQuestion('');
    cardScale.setValue(0);
  };

  const getAnswer = () => {
    if (!result) return null;
    if (result.isReversed) {
      if (result.card.yesNo === 'yes') return 'maybe';
      if (result.card.yesNo === 'no') return 'maybe';
      return 'no';
    }
    return result.card.yesNo;
  };

  const answer = getAnswer();
  const answerConfig = answer ? ANSWER_CONFIG[answer] : null;

  return (
    <>
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <LinearGradient
        colors={['#1E1B4B', '#312E81']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="help-circle-outline" size={40} color="#A78BFA" />
        <Text style={styles.headerTitle}>Так чи Ні?</Text>
        <Text style={styles.headerSubtitle}>
          Отримайте чітку відповідь від карт Таро
        </Text>
      </LinearGradient>

      {!result ? (
        <>
          {/* Question Input */}
          <Card style={styles.questionCard}>
            <Text style={styles.questionLabel}>Ваше запитання</Text>
            <TextInput
              style={styles.questionInput}
              value={question}
              onChangeText={setQuestion}
              placeholder="Чи варто мені...?"
              placeholderTextColor={Colors.textMuted}
              multiline
              maxLength={200}
            />
            <Text style={styles.charCount}>{question.length}/200</Text>
          </Card>

          {/* Tips */}
          <Card style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Поради для кращого результату</Text>
            {[
              'Формулюйте запитання чітко та конкретно',
              'Запитуйте про одну ситуацію',
              'Зосередьтесь на запитанні перед натисканням',
            ].map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </Card>

          {questionError && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={Colors.error} />
              <Text style={styles.errorText}>{questionError}</Text>
            </View>
          )}

          <Button
            title={isRevealing ? 'Карти відповідають...' : 'Запитати карти'}
            onPress={askCards}
            loading={isRevealing}
            style={styles.askButton}
          />

          {/* Example questions */}
          <Text style={styles.examplesTitle}>Приклади запитань</Text>
          {[
            'Чи варто мені змінити роботу?',
            'Чи розвиваються ці стосунки позитивно?',
            'Чи правильне моє рішення?',
          ].map((example, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => setQuestion(example)}
              style={styles.exampleItem}
            >
              <Ionicons name="arrow-forward-circle-outline" size={18} color={Colors.primary} />
              <Text style={styles.exampleText}>{example}</Text>
            </TouchableOpacity>
          ))}
        </>
      ) : (
        <>
          {/* Answer Display */}
          {answerConfig && (
            <Animated.View style={{ transform: [{ scale: cardScale }] }}>
              <LinearGradient
                colors={answerConfig.gradient}
                style={styles.answerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name={answerConfig.iconName} size={64} color={answerConfig.textColor} />
                <Text style={styles.answerLabel}>{answerConfig.label}</Text>
                <Text style={styles.answerDescription}>{answerConfig.description}</Text>
              </LinearGradient>
            </Animated.View>
          )}

          {/* Your question */}
          <Card style={styles.questionDisplay}>
            <Text style={styles.questionDisplayLabel}>Ваше запитання:</Text>
            <Text style={styles.questionDisplayText}>"{question}"</Text>
          </Card>

          {/* Card result */}
          <Card style={styles.cardResult}>
            <View style={styles.cardHeader}>
              {TAROT_IMAGES[result.card.id] ? (
                <Image
                  source={TAROT_IMAGES[result.card.id]}
                  style={[styles.cardImageBox, result.isReversed && { transform: [{ rotate: '180deg' }] }]}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.cardImageBox}>
                  <Text style={styles.cardIdText}>{result.card.id}</Text>
                  <Ionicons name="star" size={20} color={Colors.accent} />
                </View>
              )}
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{result.card.nameUk}</Text>
                <Text style={styles.cardNameEn}>{result.card.name}</Text>
                {result.isReversed && (
                  <View style={styles.reversedBadge}>
                    <Ionicons name="arrow-down" size={12} color={Colors.error} />
                    <Text style={styles.reversedText}>Перевернута</Text>
                  </View>
                )}
                <View style={styles.cardMeta}>
                  <Text style={styles.cardMetaText}>{result.card.element}</Text>
                  <Text style={styles.cardMetaDot}>·</Text>
                  <Text style={styles.cardMetaText}>{result.card.planet}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.cardMeaning}>
              {result.isReversed ? result.card.reversed : result.card.upright}
            </Text>

            <View style={styles.adviceBox}>
              <Text style={styles.adviceTitle}>Порада карти:</Text>
              <Text style={styles.adviceText}>{result.card.advice}</Text>
            </View>

            {/* Keywords */}
            <View style={styles.keywords}>
              {result.card.keywords.map((kw) => (
                <View key={kw} style={styles.keywordBadge}>
                  <Text style={styles.keywordText}>{kw}</Text>
                </View>
              ))}
            </View>
          </Card>

          {/* Reversed card explanation */}
          {result.isReversed && (
            <View style={styles.reversedInfoCard}>
              <View style={styles.reversedInfoHeader}>
                <Ionicons name="information-circle-outline" size={18} color={Colors.textMuted} />
                <Text style={styles.reversedInfoTitle}>Що означає перевернута карта?</Text>
              </View>
              <Text style={styles.reversedInfoText}>
                Перевернута карта — це не погано. Вона вказує, що енергія карти проявляється
                складніше або заблокована. Це сигнал звернути увагу на цю сферу та попрацювати
                з прихованим потенціалом.
              </Text>
            </View>
          )}

          <View style={styles.disclaimerBox}>
            <Ionicons name="information-circle-outline" size={14} color={Colors.textMuted} />
            <Text style={styles.disclaimerText}>Лише для розваг. Не замінює професійних порад.</Text>
          </View>

          {/* Ask AI */}
          <TouchableOpacity
            style={styles.aiBtn}
            onPress={() => {
              const ctx = `Розклад "Так чи Ні", питання: "${question}". Карта: ${result.card.nameUk}${result.isReversed ? ' (перевернута)' : ''}. Відповідь: ${answer === 'yes' ? 'ТАК' : answer === 'no' ? 'НІ' : 'МОЖЛИВО'}.`;
              if (isPremium) {
                router.push({ pathname: '/ai/chat', params: { dailyContext: ctx } } as any);
              } else {
                router.push('/paywall');
              }
            }}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#1E1B4B', '#4338CA']} style={styles.aiBtnInner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Ionicons name={isPremium ? 'sparkles' : 'lock-closed'} size={18} color="#A5B4FC" />
              <Text style={styles.aiBtnText}>Запитати AI Єзотерика</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Button
            title="Запитати знову"
            onPress={reset}
            style={styles.resetButton}
          />
        </>
      )}
    </ScrollView>
    </>
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

  questionCard: {
    margin: Spacing.lg,
    marginBottom: Spacing.md,
  },
  questionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  questionInput: {
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },

  tipsCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCardLight,
  },
  tipsTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: 6,
  },
  tipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    flex: 1,
  },

  askButton: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  examplesTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  exampleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  exampleText: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
  },

  answerGradient: {
    margin: Spacing.lg,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  answerEmoji: {
    fontSize: 56,
  },
  answerLabel: {
    color: '#FFFFFF',
    fontSize: FontSize.title,
    fontWeight: '900',
    letterSpacing: 4,
  },
  answerDescription: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },

  questionDisplay: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  questionDisplayLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: 4,
  },
  questionDisplayText: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontStyle: 'italic',
  },

  cardResult: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cardImageBox: {
    width: 80,
    height: 120,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSize.xs,
  },
  aiBtn: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  aiBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  aiBtnText: {
    color: '#A5B4FC',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  cardIdText: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  cardInfo: {
    flex: 1,
    gap: 6,
    justifyContent: 'center',
  },
  cardName: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  cardNameEn: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  reversedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  reversedText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardMetaText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
  },
  cardMetaDot: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },

  cardMeaning: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  adviceBox: {
    backgroundColor: Colors.primaryMuted,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  adviceTitle: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  adviceText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  keywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  keywordBadge: {
    backgroundColor: Colors.bgCardLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  keywordText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },

  resetButton: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },

  reversedInfoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.bgCardLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  reversedInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  reversedInfoTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  reversedInfoText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  answerEmoji: { fontSize: 56 },

  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  disclaimerText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 16,
    flex: 1,
  },
});
