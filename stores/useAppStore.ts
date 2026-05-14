import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MatrixData } from '../lib/matrix-calc';

// ── Pending analysis (background PDF generation) ──────────────────────────────
export type PendingAnalysisStatus = 'generating' | 'ready' | 'error' | 'cancelled';

export interface PendingAnalysisSection {
  key: string;
  title: string;
  text: string;
}

export interface PendingAnalysis {
  matrixId: string;
  matrixName: string;
  matrixBirthDate: string;
  matrixData: MatrixData;
  locale: string;
  status: PendingAnalysisStatus;
  progress: number;   // sections completed so far
  total: number;      // total sections
  currentSectionTitle: string | null;
  completedSections: PendingAnalysisSection[];
  errorMessage?: string;
  readyToastShown: boolean;
  startedAt: string;
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

export interface DayCardEntry {
  date: string;       // YYYY-MM-DD
  cardId: number;
  cardName: string;
  cardMeaning: string;
  keywords: string[];
}

export interface DayMatrixEntry {
  date: string;       // YYYY-MM-DD
  summary: string;
  energyId: number;
  energyName: string;
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
  { id: 'first_matrix', title: 'Перший крок', description: 'Створіть свою першу матрицю', icon: 'star', xp: 50 },
  { id: 'first_tarot', title: 'Оракул', description: 'Зробіть перший розклад Таро', icon: 'layers-outline', xp: 30 },
  { id: 'streak_3', title: '3 дні поспіль', description: 'Відвідайте додаток 3 дні підряд', icon: 'flame', xp: 100 },
  { id: 'streak_7', title: 'Тиждень практики', description: 'Відвідайте додаток 7 днів підряд', icon: 'diamond', xp: 250 },
  { id: 'streak_30', title: 'Місяць мудрості', description: 'Відвідайте додаток 30 днів підряд', icon: 'ribbon', xp: 1000 },
  { id: 'first_ai', title: 'Діалог з Всесвітом', description: 'Поставте перше питання AI', icon: 'sparkles-outline', xp: 40 },
  { id: 'quiz_master', title: 'Майстер Таро', description: 'Пройдіть вікторину з результатом 100%', icon: 'checkmark-circle-outline', xp: 200 },
  { id: 'meditation_5', title: 'Медитатор', description: 'Прослухайте 5 медитацій', icon: 'leaf-outline', xp: 100 },
];

interface AppState {
  // Auth
  isAuthenticated: boolean;
  userId: string | null;

  // User profile
  userName: string | null;
  userBirthDate: string | null;
  knowledgeLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  setUserProfile: (name: string, birthDate: string) => void;
  pushToServer: () => Promise<void>;

  // Matrices
  savedMatrices: SavedMatrix[];
  addMatrix: (matrix: SavedMatrix) => void;
  removeMatrix: (id: string) => void;

  // Tarot spreads history
  tarotSpreads: TarotSpread[];
  addTarotSpread: (spread: TarotSpread) => void;

  // Daily card & matrix history (shown in profile)
  dayCardHistory: DayCardEntry[];
  addDayCardEntry: (entry: DayCardEntry) => void;
  dayMatrixHistory: DayMatrixEntry[];
  addDayMatrixEntry: (entry: DayMatrixEntry) => void;

  // AI chat sessions
  chatSessions: AIChatSession[];
  addChatSession: (session: AIChatSession) => void;
  addMessageToSession: (sessionId: string, message: ChatMessage) => void;
  updateSessionTitle: (sessionId: string, title: string) => void;
  getCurrentSession: () => AIChatSession | null;
  activeSessionId: string | null;
  setActiveSession: (id: string | null) => void;

  // Tokens / premium currency (кристали)
  tokens: number;
  addTokens: (n: number) => void;
  useToken: () => boolean;
  spendCrystals: (amount: number) => boolean; // spend exact amount; returns false if not enough

  // Destiny matrix (premium — one per user, generated from onboarding birth date)
  destinyMatrix: SavedMatrix | null;
  setDestinyMatrix: (m: SavedMatrix | null) => void;
  destinyMatrixAiSummary: string | null;
  setDestinyMatrixAiSummary: (text: string) => void;

  // Push notifications & daily gift
  pushEnabled: boolean;
  setPushEnabled: (val: boolean) => void;
  dailyCardEnabled: boolean;
  setDailyCardEnabled: (val: boolean) => void;
  firstOpenDate: string | null;
  setFirstOpenDate: (date: string) => void;
  lastNotificationScheduledDate: string | null;
  setLastNotificationScheduledDate: (date: string) => void;
  lastGiftClaimedDate: string | null;
  consecutiveMissedGifts: number;
  incrementMissedGifts: () => void;
  pendingGift: { type: 'tarot-spread'; date: string } | null;
  setPendingGift: (gift: { type: 'tarot-spread'; date: string } | null) => void;
  canClaimGift: () => boolean;
  claimDailyGift: (amount: number) => void;
  clearExpiredGifts: () => void;

  // Subscription
  isPremium: boolean;
  premiumPlan: 'yearly' | 'monthly' | 'weekly' | null;
  setPremium: (val: boolean, plan?: 'yearly' | 'monthly' | 'weekly') => void;

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
  likedMeditations: string[];
  toggleLikedMeditation: (id: string) => void;
  notifications: NotificationItem[];
  addNotification: (notif: NotificationItem) => void;
  markNotificationRead: (id: string) => void;

  // AI consent
  aiConsentGiven: boolean;
  setAiConsentGiven: () => void;

  // Per-matrix AI analysis cache (keyed by matrix ID)
  matrixAnalyses: Record<string, string>;
  setMatrixAnalysis: (id: string, text: string) => void;

  // Daily matrix AI cache (keyed by date string "YYYY-MM-DD")
  dailyMatrixCache: Record<string, string>;
  setDailyMatrixCache: (date: string, text: string) => void;

  // Background PDF analysis generation
  pendingAnalysis: PendingAnalysis | null;
  startAnalysis: (params: {
    matrixId: string;
    matrixName: string;
    matrixBirthDate: string;
    matrixData: MatrixData;
    locale: string;
    total: number;
  }) => void;
  setAnalysisCurrentSection: (title: string) => void;
  appendAnalysisSection: (section: PendingAnalysisSection) => void;
  markAnalysisReady: () => void;
  markAnalysisError: (message: string) => void;
  markAnalysisCancelled: () => void;
  markReadyToastShown: () => void;
  clearPendingAnalysis: () => void;
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
  knowledgeLevel: null,
  setUserProfile: (name, birthDate) => set({ userName: name, userBirthDate: birthDate }),
  pushToServer: async () => {
    // Profile sync handled by backend API via Firebase Auth token.
    // Local state is the source of truth — nothing to push here.
  },

  savedMatrices: [],
  addMatrix: (matrix) =>
    set((state) => ({ savedMatrices: [matrix, ...state.savedMatrices] })),
  removeMatrix: (id) =>
    set((state) => ({
      savedMatrices: state.savedMatrices.filter((m) => m.id !== id),
    })),

  tarotSpreads: [],
  addTarotSpread: (spread) =>
    set((state) => ({ tarotSpreads: [spread, ...state.tarotSpreads] })),

  dayCardHistory: [],
  addDayCardEntry: (entry) =>
    set((state) => {
      if (state.dayCardHistory.some((e) => e.date === entry.date)) return {};
      return { dayCardHistory: [entry, ...state.dayCardHistory].slice(0, 60) };
    }),
  dayMatrixHistory: [],
  addDayMatrixEntry: (entry) =>
    set((state) => {
      if (state.dayMatrixHistory.some((e) => e.date === entry.date)) return {};
      return { dayMatrixHistory: [entry, ...state.dayMatrixHistory].slice(0, 60) };
    }),

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
  updateSessionTitle: (sessionId, title) =>
    set((state) => ({
      chatSessions: state.chatSessions.map((s) =>
        s.id === sessionId ? { ...s, title } : s
      ),
    })),
  getCurrentSession: () => {
    const state = get();
    return state.chatSessions.find((s) => s.id === state.activeSessionId) ?? null;
  },
  setActiveSession: (id) => set({ activeSessionId: id }),

  tokens: 0,
  addTokens: (n) => set((state) => ({ tokens: state.tokens + n })),
  useToken: () => {
    const state = get();
    if (state.isPremium) return true;
    if (state.tokens <= 0) return false;
    set((s) => ({ tokens: s.tokens - 1 }));
    return true;
  },
  spendCrystals: (amount) => {
    const state = get();
    if (state.isPremium) return true;
    if (state.tokens < amount) return false;
    set((s) => ({ tokens: s.tokens - amount }));
    return true;
  },

  // Destiny matrix
  destinyMatrix: null,
  setDestinyMatrix: (m) => set({ destinyMatrix: m }),
  destinyMatrixAiSummary: null,
  setDestinyMatrixAiSummary: (text) => set({ destinyMatrixAiSummary: text }),

  // Push notifications & daily gift
  pushEnabled: true,
  setPushEnabled: (val) => set({ pushEnabled: val }),
  dailyCardEnabled: false,
  setDailyCardEnabled: (val) => set({ dailyCardEnabled: val }),
  firstOpenDate: null,
  setFirstOpenDate: (date) => set({ firstOpenDate: date }),
  lastNotificationScheduledDate: null,
  setLastNotificationScheduledDate: (date) => set({ lastNotificationScheduledDate: date }),
  lastGiftClaimedDate: null,
  consecutiveMissedGifts: 0,
  incrementMissedGifts: () => set((s) => ({ consecutiveMissedGifts: s.consecutiveMissedGifts + 1 })),
  pendingGift: null,
  setPendingGift: (gift) => set({ pendingGift: gift }),
  canClaimGift: () => {
    const state = get();
    const today = new Date().toISOString().split('T')[0];
    return !!state.pendingGift && state.pendingGift.date === today;
  },
  claimDailyGift: (amount) => {
    set((s) => ({
      tokens: s.tokens + amount,
      lastGiftClaimedDate: new Date().toISOString().split('T')[0],
      pendingGift: null,
      consecutiveMissedGifts: 0,
    }));
  },
  clearExpiredGifts: () => {
    const state = get();
    const today = new Date().toISOString().split('T')[0];
    if (state.pendingGift && state.pendingGift.date < today) {
      set({ pendingGift: null });
    }
  },

  isPremium: false,
  premiumPlan: null,
  setPremium: (val, plan = undefined) =>
    set({ isPremium: val, premiumPlan: plan ?? null }),

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
    if (state.meditationCount >= 5) tryUnlock('meditation_5');

    return newlyUnlocked;
  },

  incrementMeditationCount: () =>
    set((state) => ({ meditationCount: state.meditationCount + 1 })),

  likedMeditations: [],
  toggleLikedMeditation: (id) =>
    set((state) => ({
      likedMeditations: state.likedMeditations.includes(id)
        ? state.likedMeditations.filter((x) => x !== id)
        : [...state.likedMeditations, id],
    })),

  notifications: [],
  addNotification: (notif) =>
    set((state) => ({ notifications: [notif, ...state.notifications].slice(0, 50) })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),

  // AI consent
  aiConsentGiven: false,
  setAiConsentGiven: () => set({ aiConsentGiven: true }),

  // Per-matrix AI analysis cache
  matrixAnalyses: {},
  setMatrixAnalysis: (id, text) =>
    set((state) => ({
      matrixAnalyses: { ...state.matrixAnalyses, [id]: text },
    })),

  // Daily matrix AI cache
  dailyMatrixCache: {},
  setDailyMatrixCache: (date, text) =>
    set((state) => ({
      dailyMatrixCache: { ...state.dailyMatrixCache, [date]: text },
    })),

  // Background PDF analysis
  pendingAnalysis: null,
  startAnalysis: (params) =>
    set({
      pendingAnalysis: {
        ...params,
        status: 'generating',
        progress: 0,
        currentSectionTitle: null,
        completedSections: [],
        readyToastShown: false,
        startedAt: new Date().toISOString(),
      },
    }),
  setAnalysisCurrentSection: (title) =>
    set((state) => ({
      pendingAnalysis: state.pendingAnalysis
        ? { ...state.pendingAnalysis, currentSectionTitle: title }
        : null,
    })),
  appendAnalysisSection: (section) =>
    set((state) => {
      if (!state.pendingAnalysis) return {};
      const completedSections = [...state.pendingAnalysis.completedSections, section];
      return {
        pendingAnalysis: {
          ...state.pendingAnalysis,
          completedSections,
          progress: completedSections.length,
        },
      };
    }),
  markAnalysisReady: () =>
    set((state) => ({
      pendingAnalysis: state.pendingAnalysis
        ? { ...state.pendingAnalysis, status: 'ready' }
        : null,
    })),
  markAnalysisError: (message) =>
    set((state) => ({
      pendingAnalysis: state.pendingAnalysis
        ? { ...state.pendingAnalysis, status: 'error', errorMessage: message }
        : null,
    })),
  markAnalysisCancelled: () =>
    set((state) => ({
      pendingAnalysis: state.pendingAnalysis
        ? { ...state.pendingAnalysis, status: 'cancelled' }
        : null,
    })),
  markReadyToastShown: () =>
    set((state) => ({
      pendingAnalysis: state.pendingAnalysis
        ? { ...state.pendingAnalysis, readyToastShown: true }
        : null,
    })),
  clearPendingAnalysis: () => set({ pendingAnalysis: null }),
    }),
    {
      name: 'matrix-of-soul-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userName: state.userName,
        userBirthDate: state.userBirthDate,
        knowledgeLevel: state.knowledgeLevel,
        savedMatrices: state.savedMatrices,
        tarotSpreads: state.tarotSpreads,
        dayCardHistory: state.dayCardHistory,
        dayMatrixHistory: state.dayMatrixHistory,
        chatSessions: state.chatSessions,
        activeSessionId: state.activeSessionId,
        tokens: state.tokens,
        isPremium: state.isPremium,
        premiumPlan: state.premiumPlan,
        onboardingCompleted: state.onboardingCompleted,
        xp: state.xp,
        level: state.level,
        streak: state.streak,
        lastVisitDate: state.lastVisitDate,
        achievements: state.achievements,
        unlockedAchievementIds: state.unlockedAchievementIds,
        meditationCount: state.meditationCount,
        notifications: state.notifications,
        pendingAnalysis: state.pendingAnalysis,
        aiConsentGiven: state.aiConsentGiven,
        matrixAnalyses: state.matrixAnalyses,
        dailyMatrixCache: state.dailyMatrixCache,
        destinyMatrix: state.destinyMatrix,
        destinyMatrixAiSummary: state.destinyMatrixAiSummary,
        pushEnabled: state.pushEnabled,
        dailyCardEnabled: state.dailyCardEnabled,
        firstOpenDate: state.firstOpenDate,
        lastNotificationScheduledDate: state.lastNotificationScheduledDate,
        lastGiftClaimedDate: state.lastGiftClaimedDate,
        consecutiveMissedGifts: state.consecutiveMissedGifts,
        pendingGift: state.pendingGift,
      }),
    }
  )
);
