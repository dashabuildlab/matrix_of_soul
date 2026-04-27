/**
 * Rider-Waite Tarot images (public domain, 1909)
 * Bundled locally for reliable loading on all platforms (Android, iOS, Web).
 * Major Arcana: IDs 1-22, Minor Arcana: IDs 23-78
 */

// Major Arcana (300px wide, ~50KB each)
// id:0 = The Fool (same image as id:22 — both are Блазень in the deck)
export const TAROT_IMAGES: Record<number, any> = {
  0:  require('../assets/tarot/22.jpg'),
  1:  require('../assets/tarot/1.jpg'),
  2:  require('../assets/tarot/2.jpg'),
  3:  require('../assets/tarot/3.jpg'),
  4:  require('../assets/tarot/4.jpg'),
  5:  require('../assets/tarot/5.jpg'),
  6:  require('../assets/tarot/6.jpg'),
  7:  require('../assets/tarot/7.jpg'),
  8:  require('../assets/tarot/8.jpg'),
  9:  require('../assets/tarot/9.jpg'),
  10: require('../assets/tarot/10.jpg'),
  11: require('../assets/tarot/11.jpg'),
  12: require('../assets/tarot/12.jpg'),
  13: require('../assets/tarot/13.jpg'),
  14: require('../assets/tarot/14.jpg'),
  15: require('../assets/tarot/15.jpg'),
  16: require('../assets/tarot/16.jpg'),
  17: require('../assets/tarot/17.jpg'),
  18: require('../assets/tarot/18.jpg'),
  19: require('../assets/tarot/19.jpg'),
  20: require('../assets/tarot/20.jpg'),
  21: require('../assets/tarot/21.jpg'),
  22: require('../assets/tarot/22.jpg'),
  // Minor Arcana — Wands
  23: require('../assets/tarot/23.jpg'),
  24: require('../assets/tarot/24.jpg'),
  25: require('../assets/tarot/25.jpg'),
  26: require('../assets/tarot/26.jpg'),
  27: require('../assets/tarot/27.jpg'),
  28: require('../assets/tarot/28.jpg'),
  29: require('../assets/tarot/29.jpg'),
  30: require('../assets/tarot/30.jpg'),
  31: require('../assets/tarot/31.jpg'),
  32: require('../assets/tarot/32.jpg'),
  33: require('../assets/tarot/33.jpg'),
  34: require('../assets/tarot/34.jpg'),
  35: require('../assets/tarot/35.jpg'),
  36: require('../assets/tarot/36.jpg'),
  // Minor Arcana — Cups
  37: require('../assets/tarot/37.jpg'),
  38: require('../assets/tarot/38.jpg'),
  39: require('../assets/tarot/39.jpg'),
  40: require('../assets/tarot/40.jpg'),
  41: require('../assets/tarot/41.jpg'),
  42: require('../assets/tarot/42.jpg'),
  43: require('../assets/tarot/43.jpg'),
  44: require('../assets/tarot/44.jpg'),
  45: require('../assets/tarot/45.jpg'),
  46: require('../assets/tarot/46.jpg'),
  47: require('../assets/tarot/47.jpg'),
  48: require('../assets/tarot/48.jpg'),
  49: require('../assets/tarot/49.jpg'),
  50: require('../assets/tarot/50.jpg'),
  // Minor Arcana — Swords
  51: require('../assets/tarot/51.jpg'),
  52: require('../assets/tarot/52.jpg'),
  53: require('../assets/tarot/53.jpg'),
  54: require('../assets/tarot/54.jpg'),
  55: require('../assets/tarot/55.jpg'),
  56: require('../assets/tarot/56.jpg'),
  57: require('../assets/tarot/57.jpg'),
  58: require('../assets/tarot/58.jpg'),
  59: require('../assets/tarot/59.jpg'),
  60: require('../assets/tarot/60.jpg'),
  61: require('../assets/tarot/61.jpg'),
  62: require('../assets/tarot/62.jpg'),
  63: require('../assets/tarot/63.jpg'),
  64: require('../assets/tarot/64.jpg'),
  // Minor Arcana — Pentacles
  65: require('../assets/tarot/65.jpg'),
  66: require('../assets/tarot/66.jpg'),
  67: require('../assets/tarot/67.jpg'),
  68: require('../assets/tarot/68.jpg'),
  69: require('../assets/tarot/69.jpg'),
  70: require('../assets/tarot/70.jpg'),
  71: require('../assets/tarot/71.jpg'),
  72: require('../assets/tarot/72.jpg'),
  73: require('../assets/tarot/73.jpg'),
  74: require('../assets/tarot/74.jpg'),
  75: require('../assets/tarot/75.jpg'),
  76: require('../assets/tarot/76.jpg'),
  77: require('../assets/tarot/77.jpg'),
  78: require('../assets/tarot/78.jpg'),
};

export function getTarotImageSource(cardId: number): any | null {
  return TAROT_IMAGES[cardId] ?? null;
}

export function getTarotImageUrl(cardId: number): string | null {
  // Only return URL if we have the image
  return TAROT_IMAGES[cardId] ? `tarot/${cardId}.jpg` : null;
}

export function hasTarotImage(cardId: number): boolean {
  return !!TAROT_IMAGES[cardId];
}
