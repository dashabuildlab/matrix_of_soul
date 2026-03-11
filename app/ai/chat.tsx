import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAppStore, ChatMessage, AIChatSession } from '../../stores/useAppStore';
import { getDailyEnergy } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';
import { drawRandomCards } from '../../constants/tarotData';

const AI_PERSONAS = [
  'Ваш AI Езотерик',
  'Майстер Таро',
  'Провідник Матриці',
  'Мудрець Долі',
];

function generateAIResponse(userMessage: string, context: string): string {
  const lower = userMessage.toLowerCase();
  const daily = getDailyEnergy();
  const energy = getEnergyById(daily);
  const card = drawRandomCards(1)[0];

  if (lower.includes('любов') || lower.includes('стосунк') || lower.includes('партнер')) {
    return `💜 Енергія дня (${daily}. ${energy?.name}) говорить про ${energy?.keywords[0]} у ваших стосунках.\n\nКарта ${card.nameUk} вказує: ${card.loveAdvice}\n\n✨ Порада: ${energy?.advice}\n\nПам'ятайте — щире серце завжди знаходить свій шлях. Будьте відкриті до нового, і Всесвіт відповість вам тим же.`;
  }

  if (lower.includes('робот') || lower.includes('кар\'єр') || lower.includes('гроші') || lower.includes('фінанс')) {
    return `💼 У сфері кар'єри зараз активна енергія ${daily} — ${energy?.name}.\n\nВаша карта: ${card.nameUk}\n\n📊 ${card.careerAdvice}\n\n💡 Порада на сьогодні: ${energy?.positive}\n\nОстерігайтесь: ${energy?.negative}`;
  }

  if (lower.includes('так чи ні') || lower.includes('так/ні') || lower.includes('чи варто')) {
    const answer = card.yesNo === 'yes' ? '✅ ТАК' : card.yesNo === 'no' ? '❌ НІ' : '🔄 ПОКИ НЕ ЧАС';
    return `🎴 Карта відповіді: ${card.nameUk}\n\n${answer}\n\n${card.upright}\n\n✨ ${card.advice}`;
  }

  if (lower.includes('майбутнє') || lower.includes('що буде') || lower.includes('прогноз')) {
    const cards = drawRandomCards(3);
    return `🔮 Три карти вашого прогнозу:\n\n⟨ Минуле: ${cards[0].nameUk} — ${cards[0].keywords[0]}\n⟩ Теперішнє: ${cards[1].nameUk} — ${cards[1].keywords[0]}\n⟫ Майбутнє: ${cards[2].nameUk} — ${cards[2].keywords[0]}\n\n${cards[2].upright}\n\n✨ Загальна порада: ${cards[1].advice}`;
  }

  if (lower.includes('матриц') || lower.includes('енергі') || lower.includes('доля') || lower.includes('призначення')) {
    return `🌟 Ваша енергія дня — ${daily}. ${energy?.name}\n\nЦе архетип ${energy?.arcana} (${energy?.planet}).\n\n✨ У плюсі: ${energy?.positive}\n⚠️ У мінусі: ${energy?.negative}\n\n📿 Порада: ${energy?.advice}\n\nКлючові слова: ${energy?.keywords.join(', ')}.`;
  }

  // Default esoteric response
  return `🔮 Зараз активна енергія ${daily} — ${energy?.name}, і вона резонує з вашим питанням.\n\nКарта, що з'явилась: ${card.nameUk}\n\n${card.upright}\n\n✨ Порада для вас: ${card.advice}\n\nВсесвіт завжди відповідає тим, хто готовий слухати. Довіртеся своїй інтуїції — вона вже знає правильний шлях.`;
}

const QUICK_QUESTIONS = [
  '💜 Що говорять карти про мої стосунки?',
  '💼 Яка моя енергія для кар\'єри сьогодні?',
  '🔮 Зроби прогноз на цей місяць',
  '✅ Карта відповідає на моє питання',
  '🌙 Яке моє призначення?',
  '⚡ Що заважає мені рухатись вперед?',
];

export default function AIChatScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const tokens = useAppStore((s) => s.tokens);
  const isPremium = useAppStore((s) => s.isPremium);
  const useToken = useAppStore((s) => s.useToken);
  const addChatSession = useAppStore((s) => s.addChatSession);
  const addMessageToSession = useAppStore((s) => s.addMessageToSession);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const chatSessions = useAppStore((s) => s.chatSessions);
  const setActiveSession = useAppStore((s) => s.setActiveSession);

  const currentSession = chatSessions.find((s) => s.id === activeSessionId);

  useEffect(() => {
    if (!activeSessionId) {
      const newSession: AIChatSession = {
        id: Date.now().toString(),
        title: 'AI Консультація',
        context: 'general',
        messages: [
          {
            id: '0',
            role: 'assistant',
            content: `🌟 Вітаю! Я ваш особистий AI Езотерик.\n\nЯ можу допомогти вам:\n• Розтлумачити карти Таро\n• Проаналізувати вашу Матрицю Долі\n• Відповісти на питання про майбутнє\n• Дати поради щодо стосунків та кар'єри\n\nПоставте своє питання або оберіть тему нижче ✨`,
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
      };
      addChatSession(newSession);
    }
  }, []);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [currentSession?.messages.length]);

  const sendMessage = async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg) return;

    if (!isPremium && tokens <= 0) {
      Alert.alert(
        'Кристали закінчились',
        'Поповніть баланс або оформіть Premium підписку для безлімітних чатів.',
        [
          { text: 'Скасувати', style: 'cancel' },
          { text: 'Преміум', onPress: () => router.push('/paywall') },
        ]
      );
      return;
    }

    const sessionId = activeSessionId!;
    if (!text) setInput('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      createdAt: new Date().toISOString(),
    };
    addMessageToSession(sessionId, userMsg);

    setIsLoading(true);
    useToken();

    await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));

    const aiMsg: ChatMessage = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: generateAIResponse(msg, 'general'),
      createdAt: new Date().toISOString(),
    };
    addMessageToSession(sessionId, aiMsg);
    setIsLoading(false);
  };

  const messages = currentSession?.messages ?? [];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={88}
    >
      {/* Header */}
      <LinearGradient
        colors={['#1E1B4B', '#312E81']}
        style={styles.header}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Езотерик</Text>
          <View style={styles.onlineDot} />
        </View>
        {!isPremium && (
          <TouchableOpacity
            onPress={() => router.push('/paywall')}
            style={styles.tokenBadge}
          >
            <Ionicons name="diamond" size={12} color={Colors.accent} />
            <Text style={styles.tokenCount}>{tokens}</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => setActiveSession(null)}
        >
          <Ionicons name="add-circle-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messagesArea}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageBubble,
              msg.role === 'user' ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {msg.role === 'assistant' && (
              <View style={styles.aiAvatar}>
                <Ionicons name="sparkles" size={14} color={Colors.primaryLight} />
              </View>
            )}
            <View
              style={[
                styles.bubbleContent,
                msg.role === 'user' ? styles.userContent : styles.aiContent,
              ]}
            >
              <Text
                style={[
                  styles.bubbleText,
                  msg.role === 'user' ? styles.userText : styles.aiText,
                ]}
              >
                {msg.content}
              </Text>
            </View>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.messageBubble, styles.aiBubble]}>
            <View style={styles.aiAvatar}>
              <Ionicons name="sparkles" size={14} color={Colors.primaryLight} />
            </View>
            <View style={[styles.bubbleContent, styles.aiContent, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={Colors.primaryLight} />
              <Text style={styles.loadingText}>Езотерик думає...</Text>
            </View>
          </View>
        )}

        {/* Quick questions (only on empty chat) */}
        {messages.length <= 1 && (
          <View style={styles.quickQuestionsContainer}>
            <Text style={styles.quickQuestionsTitle}>Популярні запити:</Text>
            {QUICK_QUESTIONS.map((q) => (
              <TouchableOpacity
                key={q}
                style={styles.quickQuestion}
                onPress={() => sendMessage(q)}
                activeOpacity={0.7}
              >
                <Text style={styles.quickQuestionText}>{q}</Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Input */}
      <View style={styles.inputArea}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Поставте питання..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || isLoading}
        >
          <LinearGradient
            colors={['#6D28D9', '#8B5CF6']}
            style={styles.sendBtnGradient}
          >
            <Ionicons name="send" size={18} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    gap: Spacing.sm,
  },
  backBtn: { padding: Spacing.xs },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  tokenBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  tokenCount: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  newChatBtn: { padding: Spacing.xs },

  messagesArea: { flex: 1 },
  messagesContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.sm,
  },

  messageBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  userBubble: { justifyContent: 'flex-end' },
  aiBubble: { justifyContent: 'flex-start' },

  aiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },

  bubbleContent: {
    maxWidth: '80%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
  },
  userContent: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  aiContent: {
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { lineHeight: 20 },
  userText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
  },
  aiText: {
    color: Colors.text,
    fontSize: FontSize.md,
  },

  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontStyle: 'italic',
  },

  quickQuestionsContainer: {
    marginTop: Spacing.lg,
    gap: Spacing.xs,
  },
  quickQuestionsTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  quickQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  quickQuestionText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    flex: 1,
  },

  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: Spacing.md,
    gap: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgInput,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: FontSize.md,
    maxHeight: 100,
  },
  sendBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  sendBtnDisabled: { opacity: 0.4 },
  sendBtnGradient: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
