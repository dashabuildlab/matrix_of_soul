/**
 * Zod schema for the server sync payload.
 * Any new field added to Zustand state that should be synced MUST be added here.
 * TypeScript will error at pushToServer() if the payload doesn't match.
 */
import { z } from 'zod';

const SavedMatrixSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  name: z.string(),
  birthDate: z.string(),
  group: z.string().optional(),
  data: z.any(),
  createdAt: z.string(),
  aiInterpretation: z.string().optional(),
  aiInterpretationLocale: z.string().optional(),
  aiInterpretationAt: z.string().optional(),
});

const TarotSpreadSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  type: z.string(),
  spreadName: z.string().optional(),
  question: z.string(),
  cards: z.array(z.number()),
  cardNames: z.array(z.string()).optional(),
  reversed: z.array(z.boolean()).optional(),
  positionLabels: z.array(z.string()).optional(),
  aiInterpretation: z.string().optional(),
  shortSummary: z.string().optional(),
  createdAt: z.string(),
});

const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant']),
  content: z.string(),
  createdAt: z.string(),
  cards: z.array(z.object({
    id: z.number(),
    name: z.string(),
    nameUk: z.string(),
    isReversed: z.boolean(),
    position: z.string().optional(),
  })).optional(),
});

const AIChatSessionSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  title: z.string(),
  context: z.enum(['matrix', 'tarot', 'general', 'destiny-matrix']),
  matrixId: z.string().optional(),
  spreadId: z.string().optional(),
  messages: z.array(ChatMessageSchema),
  createdAt: z.string(),
});

const CompatibilityReadingSchema = z.object({
  id: z.string(),
  date1: z.string(),
  date2: z.string(),
  locale: z.string(),
  aiInterpretation: z.string(),
  createdAt: z.string(),
});

const DailyCardEntrySchema = z.object({
  date: z.string(),
  userId: z.string().optional(),
  cardId: z.number(),
  cardNameUk: z.string(),
});

const NotificationSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  type: z.enum(['affirmation', 'streak', 'achievement', 'tarot', 'energy']),
  read: z.boolean(),
  createdAt: z.string(),
});

export const UserSyncPayloadSchema = z.object({
  // Profile
  userName: z.string().nullable(),
  userBirthDate: z.string().nullable(),
  userGender: z.enum(['male', 'female']).nullable(),
  personalMatrix: z.any().nullable(),
  // Onboarding prefs
  knowledgeLevel: z.enum(['beginner', 'intermediate', 'advanced']).nullable(),
  lifeFocus: z.array(z.string()),
  dailyCardEnabled: z.boolean(),
  // Gamification
  xp: z.number(),
  level: z.number(),
  streak: z.number(),
  lastVisitDate: z.string().nullable(),
  tokens: z.number(),
  isPremium: z.boolean(),
  premiumPlan: z.enum(['yearly', 'monthly', 'weekly']).nullable(),
  referralCode: z.string().nullable(),
  referralCount: z.number(),
  onboardingCompleted: z.boolean(),
  meditationCount: z.number(),
  likedMeditations: z.array(z.string()),
  unlockedAchievementIds: z.array(z.string()),
  purchasedMeditationIds: z.array(z.string()),
  // Collections
  savedMatrices: z.array(SavedMatrixSchema),
  tarotSpreads: z.array(TarotSpreadSchema),
  chatSessions: z.array(AIChatSessionSchema),
  dailyCardHistory: z.array(DailyCardEntrySchema),
  notifications: z.array(NotificationSchema),
  compatibilityReadings: z.array(CompatibilityReadingSchema),
});

export type UserSyncPayload = z.infer<typeof UserSyncPayloadSchema>;
