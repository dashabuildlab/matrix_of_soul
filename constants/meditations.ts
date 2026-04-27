// Types only — data lives in Supabase (app_matrixofsoul.meditations/moods/goals)
// and is cached in useAppStore.staticData

export interface MeditationItem {
  id: string;
  title: string;
  subtitle: string;
  guide: string;
  duration: string;
  durationSec: number;
  moods: string[];
  goals: string[];
  frequency: string;
  description: string;
  artwork: {
    gradient: [string, string, string];
    emoji: string;
    accentColor: string;
  };
  isPremium: boolean;
}

export interface MoodOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export interface GoalOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

// ─── Static data helpers ──────────────────────────────────────────────────────
import { MEDITATIONS, MOODS, GOALS } from '@/lib/staticData';

export function getMeditations(): MeditationItem[] { return MEDITATIONS; }
export function getMoods(): MoodOption[] { return MOODS; }
export function getGoals(): GoalOption[] { return GOALS; }

export function getMeditationById(id: string): MeditationItem | undefined {
  return getMeditations().find((m) => m.id === id);
}
