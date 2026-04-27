/**
 * Central source of truth for static (bundle-shipped) data.
 * These values never change at runtime — they belong in constants, not in Zustand.
 * Import from here instead of reading from the store.
 */
export {
  FALLBACK_ENERGIES as ENERGIES,
  FALLBACK_MEDITATIONS as MEDITATIONS,
  FALLBACK_MOODS as MOODS,
  FALLBACK_GOALS as GOALS,
} from './fallbackData';

import { FALLBACK_TAROT_CARDS } from './fallbackData';
import { MINOR_ARCANA } from '@/constants/minorArcana';

// All 78 cards: Major Arcana (0-22) + Minor Arcana (23-78)
export const TAROT_CARDS = [...FALLBACK_TAROT_CARDS, ...MINOR_ARCANA];
