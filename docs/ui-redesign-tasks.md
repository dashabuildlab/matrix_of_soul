# UI Redesign & Feature Changes — Task Plan

## Summary
Redesign and feature changes for Matrix of Soul app based on design screenshots.

---

## Tasks

### ✅ T0 — Remove journal feature (DONE)
- Deleted `app/journal/[id].tsx`, `app/journal/new.tsx`, `app/(tabs)/journal.tsx`
- Removed `journal_entries` table from `supabase/migrations/001_init.sql`
- Removed "keep a journal" strings from `lib/fallbackData.ts`

---

### ✅ T1 — Animated background on 4 main pages
**Files:** `app/(tabs)/index.tsx`, `app/(tabs)/matrix.tsx`, `app/(tabs)/tarot.tsx`, `app/(tabs)/ai.tsx`  
**New file:** `components/ui/AnimatedBackground.tsx`

Implement floating star/particle animation using React Native `Animated` API:
- 20–25 floating white dots of varying sizes (1–4px)
- Each star fades in/out with random timing (2–5s loops)
- Rendered as `position: absolute` overlay with `pointerEvents: none`
- Wrap each page's root `View` with the component

---

### ✅ T2 — Card of Day redesign (Today page)
**File:** `app/(tabs)/index.tsx`

- Replace placeholder icon with actual tarot card image from `constants/tarotImages.ts`
- Card is determined once per day (deterministic: `dayOfYear % cardsCount`)
- Add card flip animation on mount (front = card back pattern → flips to card image)
- Show: card image, card name (Ukrainian), `upright` interpretation as "what today holds"
- **No "draw" button / no spread navigation** — card is pre-revealed
- Card back: dark purple gradient with gold sparkle pattern

---

### ✅ T3 — Remove Astro Forecast completely
**Files:** `app/(tabs)/index.tsx`, `app/(tabs)/tarot.tsx`, `app/(tabs)/matrix.tsx`, `app/(tabs)/ai.tsx`

Remove:
- `ASTRO_PERIODS` constant and entire "Астро Прогноз" section from Today page
- `Астропрогноз` entry from `AI_SPREADS` array in Tarot page
- "Астропрогноз" quick-link card from Matrix page quick row
- Encyclopedia entry linking to `/tarot/astro` in AI page
- All `router.push('/tarot/astro')` references

---

### ✅ T4 — Move Meditations to Today page
**File:** `app/(tabs)/index.tsx`

Add a compact meditations section to the Today page:
- Section title "Медитації"
- Horizontal scroll of meditation cards (emoji, title, duration)
- Tap → navigate to `/meditation`
- Keep the existing `/meditation` full page intact

---

### ✅ T5 — Matrix as center tab
**File:** `app/(tabs)/_layout.tsx`

Reorder tabs:
```
Before: Сьогодні | Матриця | Таро (center) | AI | Профіль
After:  Сьогодні | Таро | Матриця (center ✨) | AI Магія | Профіль
```
- Matrix gets the gold sparkles `CenterTabIcon`
- Tarot moves to position 2 (no center treatment)

---

### ✅ T6 — Tarot page redesign (match screenshots)
**File:** `app/(tabs)/tarot.tsx`

Remove:
- "Карта Дня" section (moved to Today)
- "Астропрогноз" special spread

Redesign Classic Spreads as list rows (not 3-column grid):
- Три карти · 3 карти
- Хрест · 5 карт
- Кельтський хрест [ДЕТАЛЬНИЙ] · 10 карт
- Відносини · 6 карт

Redesign Special Spreads as 2-column grid (all AI-powered):
- Так чи ні? [ШВИДКО]
- На людину
- Кохання [ПОПУЛЯРНЕ]
- Прогноз
- Кар'єра
- Рішення
- Здоров'я
- Духовний шлях
- Фінанси (full-width row)

Add Довідник section (4 items grid):
- Карти таро (22)
- Чакри (7)
- Планети (10)
- Знаки Зодіаку (12)

---

### ✅ T7 — AI Magic page: remove duplicate conflict feature
**File:** `app/(tabs)/ai.tsx`

Remove the bottom "Вирішення Конфлікту" banner — it duplicates "Аналіз Конфлікту" already in the AI Features grid. Keep the grid item.

---

---

### ⏸️ T8 — Share feature (відкладено)
**Файл:** `app/share.tsx` — **залишити, не видаляти**

Кнопки "Поділитись" тимчасово прибрані з UI:
- `app/(tabs)/index.tsx` — кнопка на карті дня та кнопка на енергії дня
- `app/(tabs)/profile.tsx` — пункт "Поділитись" у списку налаштувань

Коли повертати: реалізувати share-картку (зображення з енергією / картою), після чого повернути кнопки у ці 3 місця.

---

## Execution Order
1. T1 → AnimatedBackground component (new file, no deps)
2. T5 → Tab layout (no deps)
3. T2 + T3 + T4 → Today page (all in one pass)
4. T6 → Tarot page
5. T3 (matrix part) → Matrix page
6. T3 + T7 → AI Magic page
