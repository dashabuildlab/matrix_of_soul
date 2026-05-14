/**
 * Tarot card STRUCTURAL data.
 *
 * Localized text fields (name, keywords, upright, reversed, advice,
 * loveAdvice, careerAdvice, element, planet) moved to `locales/tarot/<lang>.ts`
 * and accessed via `getTarotCardL10n(id, locale)` from `lib/tarotI18n.ts`.
 *
 * This file keeps only locale-independent data: id, English canonical
 * `name`, arcana type, and `yesNo` answer used by the Yes/No spread.
 */

export interface TarotCard {
  id: number;
  /** Canonical English name — used as fallback when locale data missing. */
  name: string;
  /** Major Arcana ids 0-21 are localized via lib/tarotI18n.ts.
   *  Minor Arcana ids 23-78 (constants/minorArcana.ts) still ship the legacy
   *  Ukrainian fields below — they will be migrated to per-locale files later. */
  arcana: 'major' | 'minor';
  yesNo: 'yes' | 'no' | 'maybe';

  // ── Legacy localized fields (Minor Arcana / older code paths) ─────────
  // For UI use `getCardForDisplay(card, locale)` from `lib/tarotI18n.ts`
  // instead of reading these directly.
  nameUk?: string;
  keywords?: string[];
  keywordsEn?: string[];
  description?: string;
  descriptionEn?: string;
  upright?: string;
  reversed?: string;
  advice?: string;
  loveAdvice?: string;
  careerAdvice?: string;
  financeAdvice?: string;
  healthAdvice?: string;
  spiritualAdvice?: string;
  element?: string;
  planet?: string;
  // Legacy English duplicates (lib/fallbackData.ts) — optional
  uprightEn?: string;
  reversedEn?: string;
  adviceEn?: string;
  loveAdviceEn?: string;
  careerAdviceEn?: string;
  financeAdviceEn?: string;
  healthAdviceEn?: string;
  spiritualAdviceEn?: string;
  elementEn?: string;
  planetEn?: string;
}

export const TAROT_CARDS: TarotCard[] = [
  { id: 0,  name: 'The Fool',          arcana: 'major', yesNo: 'yes'   },
  { id: 1,  name: 'The Magician',      arcana: 'major', yesNo: 'yes'   },
  { id: 2,  name: 'The High Priestess',arcana: 'major', yesNo: 'maybe' },
  { id: 3,  name: 'The Empress',       arcana: 'major', yesNo: 'yes'   },
  { id: 4,  name: 'The Emperor',       arcana: 'major', yesNo: 'yes'   },
  { id: 5,  name: 'The Hierophant',    arcana: 'major', yesNo: 'yes'   },
  { id: 6,  name: 'The Lovers',        arcana: 'major', yesNo: 'yes'   },
  { id: 7,  name: 'The Chariot',       arcana: 'major', yesNo: 'yes'   },
  { id: 8,  name: 'Strength',          arcana: 'major', yesNo: 'yes'   },
  { id: 9,  name: 'The Hermit',        arcana: 'major', yesNo: 'maybe' },
  { id: 10, name: 'Wheel of Fortune',  arcana: 'major', yesNo: 'yes'   },
  { id: 11, name: 'Justice',           arcana: 'major', yesNo: 'yes'   },
  { id: 12, name: 'The Hanged Man',    arcana: 'major', yesNo: 'maybe' },
  { id: 13, name: 'Death',             arcana: 'major', yesNo: 'no'    },
  { id: 14, name: 'Temperance',        arcana: 'major', yesNo: 'yes'   },
  { id: 15, name: 'The Devil',         arcana: 'major', yesNo: 'no'    },
  { id: 16, name: 'The Tower',         arcana: 'major', yesNo: 'no'    },
  { id: 17, name: 'The Star',          arcana: 'major', yesNo: 'yes'   },
  { id: 18, name: 'The Moon',          arcana: 'major', yesNo: 'maybe' },
  { id: 19, name: 'The Sun',           arcana: 'major', yesNo: 'yes'   },
  { id: 20, name: 'Judgement',         arcana: 'major', yesNo: 'yes'   },
  { id: 21, name: 'The World',         arcana: 'major', yesNo: 'yes'   },
];

// ── Spread positions: localized via t.tarotExtra.spreadPositions (later) ─────
export const TAROT_SPREAD_POSITIONS: Record<string, string[]> = {
  'three-cards': ['Минуле', 'Теперішнє', 'Майбутнє'],
  'cross': ['Ситуація', 'Перешкода', 'Підсвідоме', 'Свідоме', 'Результат'],
  'celtic': ['Ситуація', 'Перешкода', 'Минуле', 'Майбутнє', 'Вища мета', 'Підсвідоме', 'Ваша роль', 'Оточення', 'Надії/Страхи', 'Результат'],
  'yes-no': ['Відповідь'],
  'person': ['Хто ця людина', 'Ставлення до вас', 'Скрите', 'Майбутнє розвитку', 'Порада'],
  'period': ['Початок', 'Середина', 'Кінець', 'Урок', 'Загальний вплив'],
  'relationship': ['Ви', 'Партнер', 'Зв\'язок', 'Перешкоди', 'Потенціал'],
};

// ── AI prompts: locale is injected by askClaude() language instruction now ──
export const AI_TAROT_PROMPTS = {
  general: (cards: string[], question: string) =>
    `You are an experienced esotericist and Tarot master. The user asked: "${question}". Cards drawn: ${cards.join(', ')}. Give a deep, empathic, and practical interpretation of these cards in the context of the question. Be warm, supportive, and include a concrete piece of advice.`,

  yesNo: (card: string, question: string) =>
    `You are a Tarot master. Question: "${question}". Card: ${card}. Give a brief, clear Yes/No answer with a short 2-3 sentence explanation.`,

  person: (cards: string[], personName: string) =>
    `You are an esotericist. A spread about a person named "${personName}". Cards: ${cards.join(', ')}. Describe this person, their attitude, and possible relationship development. Be warm and practical.`,

  period: (cards: string[], period: string) =>
    `You are a Tarot master. Forecast for ${period}. Position cards: ${cards.join(', ')}. Give a detailed forecast — what to expect at the start, middle, end, and the main lesson. Be supportive and practical.`,
};

export function getCardById(id: number): TarotCard | undefined {
  return TAROT_CARDS.find((c) => c.id === id);
}

export function drawRandomCards(count: number): TarotCard[] {
  const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Yes/No answer (structural only).
 *
 * For LOCALIZED Yes/No labels use `translateYesNo(card.yesNo, locale)`
 * from `lib/tarotI18n.ts` together with this colour.
 */
export function getYesNoAnswer(card: TarotCard): { answer: 'yes' | 'no' | 'maybe'; color: string } {
  switch (card.yesNo) {
    case 'yes':   return { answer: 'yes',   color: '#10B981' };
    case 'no':    return { answer: 'no',    color: '#EF4444' };
    case 'maybe': return { answer: 'maybe', color: '#F59E0B' };
  }
}
