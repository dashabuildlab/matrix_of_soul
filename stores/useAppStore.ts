import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MatrixData } from '../lib/matrix-calc';

export type Mood = 'great' | 'good' | 'neutral' | 'bad' | 'terrible';

export interface JournalEntry {
  id: string;
  date: string;
  mood: Mood;
  energyOfDay: number;
  reflectionText: string;
  tarotCardId?: number;
  aiInsight?: string;
  createdAt: string;
}

export interface SavedMatrix {
  id: string;
  name: string;
  birthDate: string;
  group?: string;
  data: MatrixData;
  createdAt: string;
}

export interface TarotSpread {
  id: string;
  type: string;
  question: string;
  cards: number[];
  aiInterpretation?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface AIChatSession {
  id: string;
  title: string;
  context: 'matrix' | 'tarot' | 'general';
  matrixId?: string;
  spreadId?: string;
  messages: ChatMessage[];
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
  unlockedAt?: string;
}

const ALL_ACHIEVEMENTS: Achievement[] = [
  { id: 'first_matrix', title: 'Перший крок', description: 'Створіть свою першу матрицю', icon: '🌟', xp: 50 },
  { id: 'first_tarot', title: 'Оракул', description: 'Зробіть перший розклад Таро', icon: '🃏', xp: 30 },
  { id: 'streak_3', title: '3 дні поспіль', description: 'Відвідайте додаток 3 дні підряд', icon: '🔥', xp: 100 },
  { id: 'streak_7', title: 'Тиждень практики', description: 'Відвідайте додаток 7 днів підряд', icon: '💎', xp: 250 },
  { id: 'streak_30', title: 'Місяць мудрості', description: 'Відвідайте додаток 30 днів підряд', icon: '👑', xp: 1000 },
  { id: 'first_ai', title: 'Діалог з Всесвітом', description: 'Поставте перше питання AI', icon: '🤖', xp: 40 },
  { id: 'quiz_master', title: 'Майстер Таро', description: 'Пройдіть вікторину з результатом 100%', icon: '🎯', xp: 200 },
  { id: 'invite_1', title: 'Перший реферал', description: 'Запросіть першого друга', icon: '🤝', xp: 150 },
  { id: 'meditation_5', title: 'Медитатор', description: 'Прослухайте 5 медитацій', icon: '🧘', xp: 100 },
  { id: 'journal_7', title: 'Хронікер', description: 'Зробіть 7 записів у щоденнику', icon: '📔', xp: 80 },
];

interface AppState {
  // Auth
  isAuthenticated: boolean;
  userId: string | null;

  // User profile
  userName: string | null;
  userBirthDate: string | null;
  setUserProfile: (name: string, birthDate: string) => void;

  // Matrices
  savedMatrices: SavedMatrix[];
  addMatrix: (matrix: SavedMatrix) => void;
  removeMatrix: (id: string) => void;

  // Journal
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: JournalEntry) => void;

  // Tarot spreads history
  tarotSpreads: TarotSpread[];
  addTarotSpread: (spread: TarotSpread) => void;

  // AI chat sessions
  chatSessions: AIChatSession[];
  addChatSession: (session: AIChatSession) => void;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  getCurrentSession: () => AIChatSession | null;
  activeSessionId: string | null;
  setActiveSession: (id: string | null) => void;

  // Tokens / premium currency
  tokens: number;
  addTokens: (n: number) => void;
  useToken: () => boolean;

  // Subscription
  isPremium: boolean;
  premiumPlan: 'yearly' | 'monthly' | 'weekly' | null;
  setPremium: (val: boolean, plan?: 'yearly' | 'monthly' | 'weekly') => void;

  // Referral
  referralCode: string | null;
  referralCount: number;
  setReferralCode: (code: string) => void;
  incrementReferral: () => void;

  // Onboarding
  onboardingCompleted: boolean;
  setOnboardingCompleted: () => void;

  // Gamification
  xp: number;
  level: number;
  streak: number;
  lastVisitDate: string | null;
  achievements: Achievement[];
  unlockedAchievementIds: string[];
  addXP: (amount: number) => void;
  checkAndUpdateStreak: () => { isNewDay: boolean; streakBroken: boolean; newStreak: number };
  unlockAchievement: (id: string) => Achievement | null;
  checkAchievements: () => Achievement[];
  meditationCount: number;
  incrementMeditationCount: () => void;
  notifications: NotificationItem[];
  addNotification: (notif: NotificationItem) => void;
  markNotificationRead: (id: string) => void;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'affirmation' | 'streak' | 'achievement' | 'tarot' | 'energy';
  read: boolean;
  createdAt: string;
}

const XP_PER_LEVEL = 500;

const getLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
  isAuthenticated: false,
  userId: null,

  userName: null,
  userBirthDate: null,
  setUserProfile: (name, birthDate) => set({ userName: name, userBirthDate: birthDate }),

  savedMatrices: [],
  addMatrix: (matrix) =>
    set((state) => ({ savedMatrices: [matrix, ...state.savedMatrices] })),
  removeMatrix: (id) =>
    set((state) => ({
      savedMatrices: state.savedMatrices.filter((m) => m.id !== id),
    })),

  journalEntries: [],
  addJournalEntry: (entry) =>
    set((state) => ({
      journalEntries: [entry, ...state.journalEntries],
    })),

  tarotSpreads: [],
  addTarotSpread: (spread) =>
    set((state) => ({ tarotSpreads: [spread, ...state.tarotSpreads] })),

  chatSessions: [],
  activeSessionId: null,
  addChatSession: (session) =>
    set((state) => ({
      chatSessions: [session, ...state.chatSessions],
      activeSessionId: session.id,
    })),
  addMessageToSession: (sessionId, message) =>
    set((state) => ({
      chatSessions: state.chatSessions.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, message] }
          : s
      ),
    })),
  getCurrentSession: () => {
    const state = get();
    return state.chatSessions.find((s) => s.id === state.activeSessionId) ?? null;
  },
  setActiveSession: (id) => set({ activeSessionId: id }),

  tokens: 10,
  addTokens: (n) => set((state) => ({ tokens: state.tokens + n })),
  useToken: () => {
    const state = get();
    if (state.isPremium) return true;
    if (state.tokens <= 0) return false;
    set((s) => ({ tokens: s.tokens - 1 }));
    return true;
  },

  isPremium: false,
  premiumPlan: null,
  setPremium: (val, plan = undefined) =>
    set({ isPremium: val, premiumPlan: plan ?? null }),

  referralCode: null,
  referralCount: 0,
  setReferralCode: (code) => set({ referralCode: code }),
  incrementReferral: () =>
    set((state) => ({ referralCount: state.referralCount + 1 })),

  onboardingCompleted: false,
  setOnboardingCompleted: () => set({ onboardingCompleted: true }),

  // Gamification
  xp: 0,
  level: 1,
  streak: 0,
  lastVisitDate: null,
  achievements: ALL_ACHIEVEMENTS,
  unlockedAchievementIds: [],
  meditationCount: 0,

  addXP: (amount) =>
    set((state) => {
      const newXP = state.xp + amount;
      const newLevel = getLevel(newXP);
      return { xp: newXP, level: newLevel };
    }),

  checkAndUpdateStreak: () => {
    const state = get();
    const today = new Date().toDateString();
    const lastVisit = state.lastVisitDate;

    if (lastVisit === today) {
      return { isNewDay: false, streakBroken: false, newStreak: state.streak };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    let newStreak = state.streak;
    let streakBroken = false;

    if (lastVisit === yesterdayStr) {
      newStreak = state.streak + 1;
    } else if (lastVisit !== null) {
      newStreak = 1;
      streakBroken = true;
    } else {
      newStreak = 1;
    }

    set({ streak: newStreak, lastVisitDate: today });

    // Add XP for daily visit
    get().addXP(20);

    return { isNewDay: true, streakBroken, newStreak };
  },

  unlockAchievement: (id: string) => {
    const state = get();
    if (state.unlockedAchievementIds.includes(id)) return null;
    const achievement = ALL_ACHIEVEMENTS.find((a) => a.id === id);
    if (!achievement) return null;

    const unlocked = { ...achievement, unlockedAt: new Date().toISOString() };
    set((s) => ({
      unlockedAchievementIds: [...s.unlockedAchievementIds, id],
      achievements: s.achievements.map((a) => a.id === id ? unlocked : a),
    }));
    get().addXP(achievement.xp);
    return unlocked;
  },

  checkAchievements: () => {
    const state = get();
    const newlyUnlocked: Achievement[] = [];

    const tryUnlock = (id: string) => {
      if (!state.unlockedAchievementIds.includes(id)) {
        const result = get().unlockAchievement(id);
        if (result) newlyUnlocked.push(result);
      }
    };

    if (state.savedMatrices.length >= 1) tryUnlock('first_matrix');
    if (state.tarotSpreads.length >= 1) tryUnlock('first_tarot');
    if (state.chatSessions.length >= 1) tryUnlock('first_ai');
    if (state.streak >= 3) tryUnlock('streak_3');
    if (state.streak >= 7) tryUnlock('streak_7');
    if (state.streak >= 30) tryUnlock('streak_30');
    if (state.referralCount >= 1) tryUnlock('invite_1');
    if (state.meditationCount >= 5) tryUnlock('meditation_5');
    if (state.journalEntries.length >= 7) tryUnlock('journal_7');

    return newlyUnlocked;
  },

  incrementMeditationCount: () =>
    set((state) => ({ meditationCount: state.meditationCount + 1 })),

  notifications: [],
  addNotification: (notif) =>
    set((state) => ({ notifications: [notif, ...state.notifications].slice(0, 50) })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
    }),
    {
      name: 'matrix-of-soul-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userName: state.userName,
        userBirthDate: state.userBirthDate,
        savedMatrices: state.savedMatrices,
        journalEntries: state.journalEntries,
        tarotSpreads: state.tarotSpreads,
        chatSessions: state.chatSessions,
        activeSessionId: state.activeSessionId,
        tokens: state.tokens,
        isPremium: state.isPremium,
        premiumPlan: state.premiumPlan,
        referralCode: state.referralCode,
        referralCount: state.referralCount,
        onboardingCompleted: state.onboardingCompleted,
        xp: state.xp,
        level: state.level,
        streak: state.streak,
        lastVisitDate: state.lastVisitDate,
        achievements: state.achievements,
        unlockedAchievementIds: state.unlockedAchievementIds,
        meditationCount: state.meditationCount,
        notifications: state.notifications,
      }),
    }
  )
);
