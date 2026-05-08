import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAppStore } from '../../stores/useAppStore';
import { askClaude } from '../../lib/claude';
import { useI18n } from '../../lib/i18n';
import { MarkdownText } from '../../components/ui/MarkdownText';

type Step = 1 | 2 | 3 | 4 | 'result';

const PEOPLE_OPTIONS = ['2', '3', '4', '5+'];
const ROLE_OPTIONS = ['Партнер', 'Друг', 'Колега', 'Родич', 'Незнайомець', 'Начальник'];
const SITUATION_TYPES = ['Конфлікт', 'Непорозуміння', 'Вибір', 'Образа', 'Зрада', 'Ревнощі', 'Маніпуляція', 'Інше'];
const RESPONSE_FORMATS = [
  { label: 'М\'яка порада', desc: 'Делікатна підтримуюча відповідь', icon: 'heart-outline' as const },
  { label: 'Жорстка правда', desc: 'Чесна об\'єктивна оцінка', icon: 'flash-outline' as const },
  { label: 'Покроковий план', desc: 'Конкретні кроки для вирішення', icon: 'list-outline' as const },
  { label: 'Аналіз сторін', desc: 'Хто правий, хто ні', icon: 'scale-outline' as const },
];

/** Compute number of other participants from peopleCount string */
function otherCount(pc: string): number {
  switch (pc) {
    case '2': return 1;
    case '3': return 2;
    case '4': return 3;
    case '5+': return 4;
    default: return 1;
  }
}

interface ConflictData {
  peopleCount: string;
  myRole: string;
  personRoles: string[]; // one per other person
  situationType: string;
  description: string;
  responseFormat: string;
}

interface ConflictResult {
  objectiveView: string;
  outsideView: string;
  recommendations: { person: string; advice: string }[];
  righteousnessAnalysis: string;
  mainAdvice: string;
}

async function analyzeConflictWithAI(data: ConflictData, locale: string): Promise<ConflictResult> {
  const systemPrompt = `Ви — AI психолог та езотерик застосунку Matrix of Soul. Ви аналізуєте міжособистісні конфлікти глибоко, персоналізовано та практично. Відповідайте структуровано, з конкретними порадами.`;

  const participantsDesc = data.personRoles
    .map((r, i) => `- Людина ${i + 1}: ${r || 'не вказано'}`)
    .join('\n');

  const userPrompt = `Проаналізуй цю ситуацію і надай детальну відповідь у форматі JSON (без коментарів, тільки JSON):

Ситуація:
- Тип: ${data.situationType}
- Кількість учасників: ${data.peopleCount}
- Моя роль: ${data.myRole || 'не вказано'}
- Інші учасники:
${participantsDesc}
- Опис: ${data.description}
- Формат відповіді: ${data.responseFormat || 'збалансований аналіз'}

Поверни JSON такого формату:
{
  "objectiveView": "об'єктивна оцінка ситуації (2-4 пункти)",
  "outsideView": "погляд стороннього спостерігача",
  "recommendations": [
    {"person": "Я", "advice": "конкретна порада для вас"}${data.personRoles.map((r, i) => `,\n    {"person": "Людина ${i + 1} (${r || '?'})", "advice": "порада"}`).join('')}
  ],
  "righteousnessAnalysis": "аналіз правоти сторін",
  "mainAdvice": "головне послання та наступний крок"
}`;

  const raw = await askClaude(systemPrompt, [], userPrompt, 2000, locale);

  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('no JSON');
    return JSON.parse(jsonMatch[0]) as ConflictResult;
  } catch {
    return {
      objectiveView: raw,
      outsideView: '',
      recommendations: [],
      righteousnessAnalysis: '',
      mainAdvice: '',
    };
  }
}

export default function ConflictScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConflictResult | null>(null);
  const isPremium = useAppStore((s) => s.isPremium);

  const [data, setData] = useState<ConflictData>({
    peopleCount: '2',
    myRole: '',
    personRoles: [''],
    situationType: '',
    description: '',
    responseFormat: '',
  });

  // Keep personRoles length in sync with peopleCount
  const syncPersonRoles = (pc: string) => {
    const n = otherCount(pc);
    const updated = Array.from({ length: n }, (_, i) => data.personRoles[i] ?? '');
    setData((prev) => ({ ...prev, peopleCount: pc, personRoles: updated }));
  };

  const setPersonRole = (index: number, role: string) => {
    const updated = [...data.personRoles];
    updated[index] = role;
    setData((prev) => ({ ...prev, personRoles: updated }));
  };

  const handleAnalyze = async () => {
    if (!data.description.trim()) {
      Alert.alert('Опишіть ситуацію', 'Введіть короткий опис ситуації');
      return;
    }
    if (!isPremium) {
      router.push('/paywall');
      return;
    }

    try {
      setLoading(true);
      const analysisResult = await analyzeConflictWithAI(data, locale);
      setResult(analysisResult);
      setStep('result');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Невідома помилка';
      Alert.alert('Помилка аналізу', msg);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = step === 'result' ? 100 : ((step as number) / 4) * 100;
  const n = otherCount(data.peopleCount);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#2D1B69', '#4C1D95']}
        style={styles.header}
      >
        <TouchableOpacity
          onPress={() => step === 1 || step === 'result' ? router.back() : setStep((s) => (s as number) - 1 as Step)}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 'result' ? 'Аналіз Ситуації' : 'Вирішення Конфлікту'}
        </Text>
        <View style={{ width: 36 }} />
      </LinearGradient>

      {/* Progress bar */}
      {step !== 'result' && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBg}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
          <Text style={styles.progressText}>Крок {step} з 4</Text>
        </View>
      )}

      <ScrollView style={styles.content} contentContainerStyle={styles.contentInner} showsVerticalScrollIndicator={false}>

        {/* Step 1: People count & roles */}
        {step === 1 && (
          <View>
            <Text style={styles.stepTitle}>Хто бере участь?</Text>
            <Text style={styles.stepSubtitle}>Оберіть кількість людей у ситуації</Text>

            <View style={styles.optionsRow}>
              {PEOPLE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.optionChip, data.peopleCount === opt && styles.optionChipSelected]}
                  onPress={() => syncPersonRoles(opt)}
                >
                  <Text style={[styles.optionChipText, data.peopleCount === opt && styles.optionChipTextSelected]}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Ваша роль</Text>
            <View style={styles.optionsWrap}>
              {ROLE_OPTIONS.map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.optionChip, data.myRole === r && styles.optionChipSelected]}
                  onPress={() => setData({ ...data, myRole: r })}
                >
                  <Text style={[styles.optionChipText, data.myRole === r && styles.optionChipTextSelected]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Render one role picker per other person */}
            {Array.from({ length: n }).map((_, i) => (
              <View key={i}>
                <Text style={styles.fieldLabel}>
                  {n === 1 ? 'Роль іншої людини' : `Людина ${i + 1} — роль`}
                </Text>
                <View style={styles.optionsWrap}>
                  {ROLE_OPTIONS.map((r) => (
                    <TouchableOpacity
                      key={r}
                      style={[styles.optionChip, data.personRoles[i] === r && styles.optionChipSelected]}
                      onPress={() => setPersonRole(i, r)}
                    >
                      <Text style={[styles.optionChipText, data.personRoles[i] === r && styles.optionChipTextSelected]}>
                        {r}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            ))}

            <Button title="Далі →" onPress={() => setStep(2)} style={styles.nextBtn} />
          </View>
        )}

        {/* Step 2: Situation type */}
        {step === 2 && (
          <View>
            <Text style={styles.stepTitle}>Тип ситуації</Text>
            <Text style={styles.stepSubtitle}>Що найкраще описує вашу ситуацію?</Text>

            <View style={styles.optionsWrap}>
              {SITUATION_TYPES.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.optionChipLarge, data.situationType === t && styles.optionChipSelected]}
                  onPress={() => setData({ ...data, situationType: t })}
                >
                  <Text style={[styles.optionChipText, data.situationType === t && styles.optionChipTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button
              title="Далі →"
              onPress={() => data.situationType ? setStep(3) : Alert.alert('', 'Оберіть тип ситуації')}
              style={styles.nextBtn}
            />
          </View>
        )}

        {/* Step 3: Description */}
        {step === 3 && (
          <View>
            <Text style={styles.stepTitle}>Опишіть ситуацію</Text>
            <Text style={styles.stepSubtitle}>
              Коротко опишіть, що сталось. Що ви відчуваєте? Що вас найбільше турбує?
            </Text>

            <TextInput
              style={styles.descriptionInput}
              multiline
              numberOfLines={6}
              placeholder="Наприклад: Мій партнер не відповідав на дзвінки цілий вечір, а коли повернувся, сказав що просто хотів побути на самоті. Я відчуваю образу і тривогу..."
              placeholderTextColor={Colors.textMuted}
              value={data.description}
              onChangeText={(t) => setData({ ...data, description: t })}
              maxLength={500}
            />
            <Text style={styles.charCount}>{data.description.length}/500</Text>

            <Button
              title="Далі →"
              onPress={() => data.description.trim() ? setStep(4) : Alert.alert('', 'Опишіть ситуацію')}
              style={styles.nextBtn}
            />
          </View>
        )}

        {/* Step 4: Response format */}
        {step === 4 && (
          <View>
            <Text style={styles.stepTitle}>Формат відповіді</Text>
            <Text style={styles.stepSubtitle}>Який тип аналізу вам потрібен?</Text>

            {RESPONSE_FORMATS.map((f) => (
              <TouchableOpacity
                key={f.label}
                style={[styles.formatCard, data.responseFormat === f.label && styles.formatCardSelected]}
                onPress={() => setData({ ...data, responseFormat: f.label })}
                activeOpacity={0.7}
              >
                <Ionicons name={f.icon} size={20} color={data.responseFormat === f.label ? Colors.primaryLight : Colors.textMuted} style={{ marginRight: 8 }} />
                <View style={styles.formatLeft}>
                  <Text style={styles.formatLabel}>{f.label}</Text>
                  <Text style={styles.formatDesc}>{f.desc}</Text>
                </View>
                {data.responseFormat === f.label && (
                  <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loadingText}>AI аналізує ситуацію...</Text>
              </View>
            ) : (
              <Button
                title="Отримати Аналіз"
                onPress={handleAnalyze}
                style={styles.nextBtn}
              />
            )}
            {!isPremium && <Text style={styles.tokenHint}>Потрібен Premium</Text>}
          </View>
        )}

        {/* Result */}
        {step === 'result' && result && (
          <View>
            <Card style={styles.resultCard}>
              <View style={styles.resultSectionHeader}>
                <Ionicons name="search-outline" size={16} color={Colors.primaryLight} />
                <Text style={styles.resultSectionTitle}>Об'єктивна оцінка</Text>
              </View>
              <MarkdownText text={result.objectiveView} color={Colors.textSecondary} fontSize={FontSize.md} lineHeight={22} />
            </Card>

            <Card style={styles.resultCard}>
              <View style={styles.resultSectionHeader}>
                <Ionicons name="eye-outline" size={16} color={Colors.primaryLight} />
                <Text style={styles.resultSectionTitle}>Погляд збоку</Text>
              </View>
              <MarkdownText text={result.outsideView} color={Colors.textSecondary} fontSize={FontSize.md} lineHeight={22} />
            </Card>

            <Card style={styles.resultCard}>
              <View style={styles.resultSectionHeader}>
                <Ionicons name="chatbubble-outline" size={16} color={Colors.primaryLight} />
                <Text style={styles.resultSectionTitle}>Рекомендації</Text>
              </View>
              {result.recommendations.map((rec, i) => (
                <View key={i} style={styles.recommendationBlock}>
                  <Text style={styles.recommendationPerson}>{rec.person}</Text>
                  <MarkdownText text={rec.advice} color={Colors.textSecondary} fontSize={FontSize.md} lineHeight={22} />
                </View>
              ))}
            </Card>

            <Card style={styles.resultCard}>
              <View style={styles.resultSectionHeader}>
                <Ionicons name="scale-outline" size={16} color={Colors.primaryLight} />
                <Text style={styles.resultSectionTitle}>Аналіз правоти</Text>
              </View>
              <MarkdownText text={result.righteousnessAnalysis} color={Colors.textSecondary} fontSize={FontSize.md} lineHeight={22} />
            </Card>

            <LinearGradient
              colors={['#2D1B69', '#4C1D95', '#6D28D9']}
              style={styles.mainAdviceCard}
            >
              <MarkdownText text={result.mainAdvice} color="#FFFFFF" fontSize={FontSize.md} lineHeight={24} />
            </LinearGradient>

            <Button
              title="Нова Ситуація"
              variant="secondary"
              onPress={() => {
                setStep(1);
                setResult(null);
                setData({ peopleCount: '2', myRole: '', personRoles: [''], situationType: '', description: '', responseFormat: '' });
              }}
              style={styles.nextBtn}
            />

            <Button
              title="Обговорити з AI"
              onPress={() => router.push('/ai/chat')}
              style={{ marginTop: Spacing.sm }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: 56,
    paddingBottom: Spacing.md,
    justifyContent: 'space-between',
  },
  backBtn: { padding: Spacing.xs, width: 36 },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.xs,
  },
  progressBg: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
  },
  content: { flex: 1 },
  contentInner: { padding: Spacing.lg, paddingBottom: 120 },

  stepTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  optionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionChipLarge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionChipSelected: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  optionChipText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  optionChipTextSelected: {
    color: Colors.primaryLight,
    fontWeight: '600',
  },
  descriptionInput: {
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: FontSize.md,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 140,
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  formatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  formatCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  formatLeft: { flex: 1 },
  formatLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  formatDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    fontStyle: 'italic',
  },
  tokenHint: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  nextBtn: { marginTop: Spacing.lg },

  resultCard: { marginBottom: Spacing.md },
  resultSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  resultSectionTitle: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  recommendationBlock: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  recommendationPerson: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  mainAdviceCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  mainAdviceText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    lineHeight: 24,
  },
});
