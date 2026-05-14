export const Colors = {
  // ── Backgrounds ──────────────────────────────────────────
  bg: '#0D0B1A',           // deep dark purple-black
  bgCard: '#1A1633',       // dark card
  bgCardLight: '#221E3D',  // slightly lighter card
  bgInput: '#1E1A36',      // dark input field

  // ── Primary — purple/violet ───────────────────────────────
  primary: '#8B5CF6',
  primaryLight: '#A78BFA',
  primaryDark: '#6D28D9',
  primaryMuted: 'rgba(139, 92, 246, 0.18)',

  // ── Accent — warm gold (the only non-purple tone) ─────────
  accent: '#F5C542',
  accentLight: '#FDE68A',
  accentMuted: 'rgba(245, 197, 66, 0.15)',

  // ── Text ─────────────────────────────────────────────────
  text: '#F0EBFF',         // near-white with slight purple tint
  textSecondary: '#C4B5FD', // light lavender
  textMuted: '#7C6FA8',    // muted purple

  // ── Status — all purple-family ────────────────────────────
  success: '#9F7AEA',      // medium purple  (positive)
  warning: '#F5C542',      // gold            (caution — accent)
  error: '#F472B6',        // pink-magenta    (alert — visible on dark)
  info: '#A78BFA',         // light purple    (neutral info)

  // ── Mood — gold (great) → deep purple (terrible) ─────────
  moodGreat: '#F5C542',    // gold
  moodGood: '#A78BFA',     // light purple
  moodNeutral: '#8B5CF6',  // purple
  moodBad: '#6D28D9',      // deep purple
  moodTerrible: '#4C1D95', // very deep purple

  // ── Borders ───────────────────────────────────────────────
  border: '#2E2756',       // dark purple border
  borderLight: '#3B3267',  // slightly lighter border

  // ── Gradients ─────────────────────────────────────────────
  gradientPurple: ['#6D28D9', '#8B5CF6', '#A78BFA'] as const,
  gradientDark: ['#0D0B1A', '#1E1B4B'] as const,
  gradientCard: ['#1A1633', '#221E3D'] as const,
  gradientHero: ['#2D1B69', '#4C1D95', '#6D28D9'] as const,

  // ── Overlay ───────────────────────────────────────────────
  overlay: 'rgba(109, 40, 217, 0.5)',
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
