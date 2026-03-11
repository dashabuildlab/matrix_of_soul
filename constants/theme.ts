export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────
  bg: '#F8F4FF',
  bgCard: '#FFFFFF',
  bgCardLight: '#F0EBFF',
  bgInput: '#EDE8FF',

  // ── Primary — purple/violet ───────────────────────────────
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',
  primaryMuted: 'rgba(139, 92, 246, 0.12)',

  // ── Accent — warm gold (the only non-purple tone) ─────────
  accent: '#F5C542',
  accentLight: '#FDE68A',
  accentMuted: 'rgba(245, 197, 66, 0.15)',

  // ── Text ─────────────────────────────────────────────────
  text: '#1A0A35',
  textSecondary: '#6B4FA0',
  textMuted: '#9B87C0',

  // ── Status — all purple-family ────────────────────────────
  success: '#9F7AEA',      // medium purple  (positive)
  warning: '#F5C542',      // gold            (caution — accent)
  error: '#B91C88',        // magenta-purple  (alert)
  info: '#A78BFA',         // light purple    (neutral info)

  // ── Mood — gold (great) → deep purple (terrible) ─────────
  moodGreat: '#F5C542',    // gold
  moodGood: '#A78BFA',     // light purple
  moodNeutral: '#8B5CF6',  // purple
  moodBad: '#6D28D9',      // deep purple
  moodTerrible: '#4C1D95', // very deep purple

  // ── Borders ───────────────────────────────────────────────
  border: '#DDD5F0',
  borderLight: '#EEE8FF',

  // ── Gradients ─────────────────────────────────────────────
  gradientPurple: ['#6D28D9', '#8B5CF6', '#A78BFA'] as const,
  gradientDark: ['#2D1B69', '#4C1D95'] as const,
  gradientCard: ['#FFFFFF', '#F8F4FF'] as const,
  gradientHero: ['#DDD6FE', '#C4B5FD', '#A78BFA'] as const,

  // ── Overlay ───────────────────────────────────────────────
  overlay: 'rgba(109, 40, 217, 0.35)',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const FontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 22,
  xxl: 28,
  title: 34,
} as const;

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;
