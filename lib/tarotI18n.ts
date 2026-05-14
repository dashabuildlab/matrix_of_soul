/**
 * Tarot card i18n — keeps the LARGE per-card text translations
 * (~22 cards × 7 fields ≈ 150 strings per language) out of the main
 * locale files and in their own `locales/tarot/<lang>.ts` modules.
 *
 * The structural data (id, English `name`, arcana, yesNo) stays in
 * constants/tarotData.ts. Localized fields are looked up by id+locale.
 */

import ukCards from '@/locales/tarot/uk';
import enCards from '@/locales/tarot/en';
import esCards from '@/locales/tarot/es';
import zhCards from '@/locales/tarot/zh';
import arCards from '@/locales/tarot/ar';
import deCards from '@/locales/tarot/de';
import frCards from '@/locales/tarot/fr';
import ptBRCards from '@/locales/tarot/pt-BR';

export interface TarotCardL10n {
  /** Localized display name (e.g. "Блазень", "El Loco", "傻瓜") */
  name: string;
  /** 4 short keywords */
  keywords: string[];
  /** Upright interpretation paragraph */
  upright: string;
  /** Reversed interpretation paragraph */
  reversed: string;
  /** General advice */
  advice: string;
  /** Love-area advice */
  loveAdvice: string;
  /** Career-area advice */
  careerAdvice: string;
  /** Element name (e.g. "Air", "Повітря", "风") */
  element: string;
  /** Planet name */
  planet: string;
}

export type TarotCardsByLocale = Record<number, TarotCardL10n>;

// All 9 locales. en-GB reuses en. Falls back to en for anything missing.
const TAROT_LOCALES: Record<string, TarotCardsByLocale> = {
  en: enCards,
  'en-GB': enCards,
  uk: ukCards,
  es: esCards,
  zh: zhCards,
  ar: arCards,
  de: deCards,
  fr: frCards,
  'pt-BR': ptBRCards,
};

/** Get localized card data by id. Falls back to English if locale or id missing. */
export function getTarotCardL10n(cardId: number, locale: string): TarotCardL10n {
  const table = TAROT_LOCALES[locale] ?? enCards;
  return table[cardId] ?? enCards[cardId];
}

/**
 * Backward-compatible card display helper.
 *
 * Works for ALL 78 cards across the codebase:
 * - Major Arcana (id 0-21) → fully localized via TAROT_LOCALES
 * - Minor Arcana (id 23-78, from constants/minorArcana.ts) → legacy `nameUk`
 *   / `upright` / `reversed` etc. fields (currently Ukrainian only, English
 *   fallback for non-uk locales until Minor Arcana is translated).
 *
 * `card` accepts any legacy card shape with optional fields.
 */
export interface LegacyTarotCard {
  id: number;
  name: string;
  nameUk?: string;
  keywords?: string[];
  upright?: string;
  reversed?: string;
  advice?: string;
  loveAdvice?: string;
  careerAdvice?: string;
  element?: string;
  planet?: string;
}

export function getCardForDisplay(card: LegacyTarotCard, locale: string): TarotCardL10n {
  // Major Arcana — fully localized
  if (card.id >= 0 && card.id <= 21) {
    return getTarotCardL10n(card.id, locale);
  }
  // Minor Arcana — use legacy uk fields (TODO: translate to other locales)
  return {
    name: card.nameUk ?? card.name,
    keywords: card.keywords ?? [],
    upright: card.upright ?? '',
    reversed: card.reversed ?? '',
    advice: card.advice ?? '',
    loveAdvice: card.loveAdvice ?? '',
    careerAdvice: card.careerAdvice ?? '',
    element: card.element ?? '',
    planet: card.planet ?? '',
  };
}

/** Translate the localized "yes/no/maybe" answer. */
export function translateYesNo(answer: 'yes' | 'no' | 'maybe', locale: string): string {
  const map: Record<string, Record<'yes' | 'no' | 'maybe', string>> = {
    en: { yes: 'YES', no: 'NO', maybe: 'MAYBE' },
    'en-GB': { yes: 'YES', no: 'NO', maybe: 'MAYBE' },
    uk: { yes: 'ТАК', no: 'НІ', maybe: 'МОЖЛИВО' },
    es: { yes: 'SÍ', no: 'NO', maybe: 'QUIZÁS' },
    zh: { yes: '是', no: '否', maybe: '也许' },
    ar: { yes: 'نعم', no: 'لا', maybe: 'ربما' },
    de: { yes: 'JA', no: 'NEIN', maybe: 'VIELLEICHT' },
    fr: { yes: 'OUI', no: 'NON', maybe: 'PEUT-ÊTRE' },
    'pt-BR': { yes: 'SIM', no: 'NÃO', maybe: 'TALVEZ' },
  };
  return (map[locale] ?? map.en)[answer];
}
