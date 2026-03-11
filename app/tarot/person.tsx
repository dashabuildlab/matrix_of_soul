import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { TAROT_CARDS, drawRandomCards } from '../../constants/tarotData';

const { width } = Dimensions.get('window');

const RELATIONSHIP_TYPES = [
  { id: 'romantic', label: 'Романтичний', icon: 'heart-outline' as const },
  { id: 'friend', label: 'Друг', icon: 'people-outline' as const },
  { id: 'work', label: 'Колега', icon: 'briefcase-outline' as const },
  { id: 'family', label: 'Родина', icon: 'home-outline' as const },
];

const SPREAD_POSITIONS = [
  { key: 'personality', label: 'Особистість', description: 'Хто ця людина, її суть' },
  { key: 'feelings', label: 'Почуття', description: 'Що відчуває до вас' },
  { key: 'potential', label: 'Потенціал', description: 'Майбутнє ваших стосунків' },
];

export default function PersonScreen() {
  const [step, setStep] = useState(1); // 1=info, 2=result
  const [personName, setPersonName] = useState('');
  const [relationType, setRelationType] = useState('romantic');
  const [question, setQuestion] = useState('');
  const [cards, setCards] = useState<Array<{ card: (typeof TAROT_CARDS)[0]; isReversed: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeCard, setActiveCard] = useState(0);

  const doReading = () => {
    if (!personName.trim()) return;
    setIsLoading(true);

    setTimeout(() => {
      const drawn = drawRandomCards(3).map((card) => ({
        card,
        isReversed: Math.random() > 0.65,
      }));
      setCards(drawn);
      setIsLoading(false);
      setStep(2);
    }, 2000);
  };

  const getAIInsight = () => {
    if (!cards.length) return '';
    const pos = SPREAD_POSITIONS[activeCard];
    const entry = cards[activeCard];
    const isRev = entry.isReversed;

    const insights: Record<string, Record<string, string>> = {
      personality: {
        yes: `${personName} — людина з яскравою енергією ${entry.card.nameUk}. Вона несе в собі якості: ${entry.card.keywords.join(', ')}.`,
        reversed: `Зараз ${personName} перебуває у тіньовому прояві своєї енергії. Можливо, вона закрита або переживає внутрішній конфлікт.`,
      },
      feelings: {
        yes: `По відношенню до вас ${personName} відчуває ${entry.card.loveAdvice.toLowerCase()}`,
        reversed: `${personName} може мати суперечливі почуття або приховувати їх від вас.`,
      },
      potential: {
        yes: `Ваші стосунки мають яскравий потенціал. ${entry.card.advice}`,
        reversed: `Стосунки потребують уваги та роботи. ${entry.card.advice}`,
      },
    };

    return (insights[pos.key]?.[isRev ? 'reversed' : 'yes']) ?? entry.card.upright;
  };

  if (step === 1) {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={['#831843', '#BE185D']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="person-circle-outline" size={44} color="#FCE7F3" />
          <Text style={styles.headerTitle}>Розклад на Людину</Text>
          <Text style={styles.headerSubtitle}>
            Дізнайтесь енергію людини та потенціал ваших стосунків
          </Text>
        </LinearGradient>

        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Ім'я людини *</Text>
          <TextInput
            style={styles.input}
            value={personName}
            onChangeText={setPersonName}
            placeholder="Введіть ім'я"
            placeholderTextColor={Colors.textMuted}
          />
        </Card>

        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Тип стосунків</Text>
          <View style={styles.typeGrid}>
            {RELATIONSHIP_TYPES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.typeItem, relationType === t.id && styles.typeItemActive]}
                onPress={() => setRelationType(t.id)}
              >
                <Ionicons
                  name={t.icon}
                  size={20}
                  color={relationType === t.id ? Colors.text : Colors.textMuted}
                />
                <Text style={[styles.typeLabel, relationType === t.id && styles.typeLabelActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.fieldLabel}>Ваше запитання (необов'язково)</Text>
          <TextInput
            style={styles.inputMultiline}
            value={question}
            onChangeText={setQuestion}
            placeholder="Що ви хочете дізнатись про цю людину?"
            placeholderTextColor={Colors.textMuted}
            multiline
          />
        </Card>

        <Card style={styles.infoCard}>
          <Text style={styles.infoTitle}>🃏 Три карти розкажуть:</Text>
          {SPREAD_POSITIONS.map((pos, i) => (
            <View key={pos.key} style={styles.infoRow}>
              <View style={styles.infoBadge}>
                <Text style={styles.infoBadgeText}>{i + 1}</Text>
              </View>
              <View>
                <Text style={styles.infoLabel}>{pos.label}</Text>
                <Text style={styles.infoDesc}>{pos.description}</Text>
              </View>
            </View>
          ))}
        </Card>

        <Button
          title={isLoading ? 'Карти розкриваються...' : '🔮 Розкрити карти'}
          onPress={doReading}
          loading={isLoading}
          disabled={!personName.trim()}
          style={styles.button}
        />
      </ScrollView>
    );
  }

  // Step 2: Results
  const currentCard = cards[activeCard];
  const currentPos = SPREAD_POSITIONS[activeCard];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Person header */}
      <Card style={styles.personHeader}>
        <View style={styles.personAvatar}>
          <Ionicons name="person" size={28} color={Colors.primary} />
        </View>
        <View>
          <Text style={styles.personName}>{personName}</Text>
          <Text style={styles.personType}>
            {RELATIONSHIP_TYPES.find((t) => t.id === relationType)?.label}
          </Text>
        </View>
      </Card>

      {/* Card selector */}
      <View style={styles.positionSelector}>
        {SPREAD_POSITIONS.map((pos, i) => (
          <TouchableOpacity
            key={pos.key}
            style={[styles.posTab, activeCard === i && styles.posTabActive]}
            onPress={() => setActiveCard(i)}
          >
            <Text style={[styles.posTabText, activeCard === i && styles.posTabTextActive]}>
              {pos.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Current card */}
      {currentCard && (
        <Card style={styles.cardResult}>
          <View style={styles.cardTop}>
            <View style={styles.cardImageBox}>
              <Text style={styles.cardIdText}>{currentCard.card.id}</Text>
              <Ionicons name="star" size={18} color={Colors.accent} />
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.positionLabel}>{currentPos.label}</Text>
              <Text style={styles.cardTitle}>{currentCard.card.nameUk}</Text>
              <Text style={styles.cardTitleEn}>{currentCard.card.name}</Text>
              {currentCard.isReversed && (
                <View style={styles.reversedBadge}>
                  <Ionicons name="arrow-down" size={12} color={Colors.error} />
                  <Text style={styles.reversedText}>Перевернута</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.insightBox}>
            <Text style={styles.insightTitle}>💫 Інсайт</Text>
            <Text style={styles.insightText}>{getAIInsight()}</Text>
          </View>

          <Text style={styles.cardMeaning}>
            {currentCard.isReversed ? currentCard.card.reversed : currentCard.card.upright}
          </Text>

          {currentPos.key === 'feelings' && (
            <View style={styles.loveBox}>
              <Text style={styles.loveTitle}>❤️ Відносини</Text>
              <Text style={styles.loveText}>{currentCard.card.loveAdvice}</Text>
            </View>
          )}

          <View style={styles.keywords}>
            {currentCard.card.keywords.map((kw) => (
              <View key={kw} style={styles.kwBadge}>
                <Text style={styles.kwText}>{kw}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}

      {/* Navigation */}
      <View style={styles.navRow}>
        <Button
          title="← Назад"
          variant="ghost"
          disabled={activeCard === 0}
          onPress={() => setActiveCard((p) => p - 1)}
          style={{ flex: 1 }}
        />
        {activeCard < SPREAD_POSITIONS.length - 1 ? (
          <Button
            title="Далі →"
            onPress={() => setActiveCard((p) => p + 1)}
            style={{ flex: 1 }}
          />
        ) : (
          <Button
            title="Новий розклад"
            onPress={() => { setStep(1); setPersonName(''); setQuestion(''); setCards([]); setActiveCard(0); }}
            style={{ flex: 1 }}
          />
        )}
      </View>
    </ScrollView>
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
    color: '#FCE7F3',
    fontSize: FontSize.md,
    textAlign: 'center',
    opacity: 0.9,
  },

  card: { margin: Spacing.lg, marginBottom: Spacing.sm },
  button: { margin: Spacing.lg },

  fieldLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  input: {
    color: Colors.text,
    fontSize: FontSize.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: Spacing.sm,
  },
  inputMultiline: {
    color: Colors.text,
    fontSize: FontSize.md,
    minHeight: 60,
    textAlignVertical: 'top',
  },

  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  typeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeItemActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  typeLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  typeLabelActive: {
    color: Colors.text,
    fontWeight: '600',
  },

  infoCard: {
    margin: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  infoTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoBadgeText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  infoLabel: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  infoDesc: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },

  personHeader: {
    margin: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  personName: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  personType: {
    color: Colors.primary,
    fontSize: FontSize.sm,
  },

  positionSelector: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  posTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  posTabActive: {
    backgroundColor: Colors.primary,
  },
  posTabText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  posTabTextActive: {
    color: Colors.text,
  },

  cardResult: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  cardTop: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cardImageBox: {
    width: 70,
    height: 100,
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  cardIdText: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  cardDetails: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  positionLabel: {
    color: Colors.primary,
    fontSize: FontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  cardTitleEn: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  reversedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(248, 113, 113, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  reversedText: {
    color: Colors.error,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  insightBox: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    gap: 6,
  },
  insightTitle: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  insightText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  cardMeaning: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  loveBox: {
    backgroundColor: 'rgba(190, 24, 93, 0.1)',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  loveTitle: {
    color: '#F9A8D4',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  loveText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  keywords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  kwBadge: {
    backgroundColor: Colors.bgCardLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  kwText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
  },

  navRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
});
