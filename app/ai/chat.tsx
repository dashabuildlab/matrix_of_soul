import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAppStore, ChatMessage, AIChatSession } from '../../stores/useAppStore';

/** Derive a short session title from the daily context string or user's first message */
function deriveTitleFromContext(ctx: string): string {
  if (!ctx) return 'AI Консультація';
  const c = ctx.trim();
  if (c.includes('Розклад "Так чи Ні"')) return 'Так чи Ні — розклад';
  if (c.includes('Розклад "')) {
    const m = c.match(/Розклад "([^"]+)"/);
    if (m) return `Розклад: ${m[1]}`;
  }
  if (c.includes('Прогноз Таро')) return 'Прогноз Таро';
  if (c.includes('Матриця Дня')) return 'Матриця Дня';
  if (c.includes('Матриця')) return 'Аналіз Матриці';
  if (c.includes('Таро')) return 'Консультація Таро';
  return c.slice(0, 40).replace(/\n/g, ' ').trim();
}
import { askClaude, type ClaudeMessage } from '../../lib/claude';
import { getDailyEnergy } from '../../lib/matrix-calc';
import { useI18n } from '../../lib/i18n';
import { getAIFallbackMessage, getAIErrorTitle, getDefaultSessionTitle, getAIWelcomeMessage } from '../../lib/aiLocale';
import { MarkdownText } from '../../components/ui/MarkdownText';

function buildSystemPrompt(userName: string | null, userBirthDate: string | null, matrixSummary: string, dailyMatrixCtx?: string): string {
  const dailyEnergy = getDailyEnergy();
  return `Ви — AI Езотерик застосунку Matrix of Soul. Ви глибокий знавець Матриці Долі, Таро, нумерології та езотеричних практик.

Профіль користувача:
- Ім'я: ${userName ?? 'невідоме'}
- Дата народження: ${userBirthDate ?? 'невідома'}
- Енергія поточного дня: ${dailyEnergy}
${matrixSummary ? `\nМатриця долі:\n${matrixSummary}` : ''}${dailyMatrixCtx ? `\n${dailyMatrixCtx}` : ''}

Правила:
- Відповідайте тепло, духовно та персоналізовано
- НЕ використовуйте смайлики та емодзі у відповідях
- Якщо є дані матриці — спирайтесь на них у відповіді
- Відповідайте мовою питання (українська або англійська)
- Будьте конкретними та практичними, не лише поетичними
- НЕ використовуйте markdown розмітку (**жирний**, *курсив*) — пишіть звичайним текстом
- Якщо питання не стосується езотерики — делікатно поверніться до теми
- Дата народження та ім'я користувача вже є в системному промпті — НЕ ПИТАЙ їх у користувача повторно`;
}

const QUICK_QUESTIONS = [
  'Що говорять карти про мої стосунки?',
  'Яка моя енергія для кар\'єри сьогодні?',
  'Зроби прогноз на цей місяць',
  'Яке моє призначення?',
  'Що заважає мені рухатись вперед?',
];

export default function AIChatScreen() {
  const router = useRouter();
  const { locale } = useI18n();
  const { sessionId: paramSessionId, dailyContext } = useLocalSearchParams<{ sessionId?: string; dailyContext?: string }>();
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isPremium = useAppStore((s) => s.isPremium);
  const addChatSession = useAppStore((s) => s.addChatSession);
  const addMessageToSession = useAppStore((s) => s.addMessageToSession);
  const updateSessionTitle = useAppStore((s) => s.updateSessionTitle);
  const activeSessionId = useAppStore((s) => s.activeSessionId);
  const chatSessions = useAppStore((s) => s.chatSessions);
  const setActiveSession = useAppStore((s) => s.setActiveSession);
  const userName = useAppStore((s) => s.userName);
  const userBirthDate = useAppStore((s) => s.userBirthDate);
  const destinyMatrix = useAppStore((s) => s.destinyMatrix);

  // Premium gate
  useEffect(() => {
    if (!isPremium) {
      router.replace('/paywall');
    }
  }, [isPremium]);

  const currentSession = chatSessions.find((s) => s.id === activeSessionId);

  const matrixSummary = destinyMatrix
    ? `Особистість: ${destinyMatrix.data.personality}, Душа: ${destinyMatrix.data.soul}, Доля: ${destinyMatrix.data.destiny}, Призначення: ${destinyMatrix.data.purpose}`
    : '';

  // Daily matrix context passed from /matrix/daily "Запитати ШІ" button
  const dailyMatrixContext = dailyContext ? `\nКонтекст сесії — ${dailyContext}` : '';

  useEffect(() => {
    if (paramSessionId) {
      // Continue existing session from history
      setActiveSession(paramSessionId);
    } else {
      // Always start a new session on fresh entry
      const sessionTitle = dailyContext
        ? deriveTitleFromContext(dailyContext)
        : getDefaultSessionTitle(locale);
      const newSession: AIChatSession = {
        id: Date.now().toString(),
        title: sessionTitle,
        context: dailyContext?.includes('Таро') ? 'tarot' : 'general',
        messages: [
          {
            id: '0',
            role: 'assistant',
            content: getAIWelcomeMessage(locale),
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

  const sendMessage = useCallback(async (text?: string) => {
    const msg = text ?? input.trim();
    if (!msg || !isPremium) return;

    const sessionId = activeSessionId;
    if (!sessionId) return;

    if (!text) setInput('');
    Keyboard.dismiss();

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      createdAt: new Date().toISOString(),
    };
    addMessageToSession(sessionId, userMsg);
    setIsLoading(true);

    try {
      const history: ClaudeMessage[] = (currentSession?.messages ?? [])
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-10)
        .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const systemPrompt = buildSystemPrompt(userName, userBirthDate, matrixSummary, dailyMatrixContext);
      const aiText = await askClaude(systemPrompt, history, msg, 1500, locale);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiText || getAIFallbackMessage(locale),
        createdAt: new Date().toISOString(),
      };
      addMessageToSession(sessionId, aiMsg);

      // Auto-generate title from first user message if still generic
      const defaultTitle = getDefaultSessionTitle(locale);
      const session = useAppStore.getState().chatSessions.find((s) => s.id === sessionId);
      if (session && session.title === defaultTitle) {
        const firstUserMsg = session.messages.find((m) => m.role === 'user');
        if (firstUserMsg) {
          const autoTitle = firstUserMsg.content.slice(0, 45).replace(/\n/g, ' ').trim();
          updateSessionTitle(sessionId, autoTitle.length > 0 ? autoTitle : defaultTitle);
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      Alert.alert(getAIErrorTitle(locale), errMsg, [{ text: 'OK' }]);
    } finally {
      setIsLoading(false);
    }
  }, [activeSessionId, input, isPremium, currentSession, userName, userBirthDate, matrixSummary, locale]);

  const messages = currentSession?.messages ?? [];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  if (!isPremium) return null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <LinearGradient
        colors={['#1E1B4B', '#312E81']}
        style={styles.header}
      >
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>AI Езотерик</Text>
          <View style={styles.onlineDot} />
        </View>
        <TouchableOpacity
          style={styles.newChatBtn}
          onPress={() => {
            setActiveSession(null);
            router.replace('/ai/chat');
          }}
          testID="ai-new-chat-btn"
        >
          <Ionicons name="add-circle-outline" size={22} color={Colors.text} />
        </TouchableOpacity>
      </LinearGradient>

      {/* Messages */}
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          ref={scrollRef}
          style={styles.messagesArea}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          testID="ai-messages-scroll"
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
                {msg.role === 'user' ? (
                  <Text style={[styles.bubbleText, styles.userText]}>{msg.content}</Text>
                ) : (
                  <MarkdownText
                    text={msg.content}
                    color={Colors.text}
                    fontSize={FontSize.md}
                    lineHeight={20}
                  />
                )}
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
      </TouchableWithoutFeedback>

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
          testID="ai-chat-input"
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
          onPress={() => sendMessage()}
          disabled={!input.trim() || isLoading}
          testID="ai-chat-send-btn"
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
