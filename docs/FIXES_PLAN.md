# Matrix of Soul — Fixes Plan

> Created: 2026-05-05  
> Status: In Progress

---

## 1. Fix Tarot Spread History Saving
**Files:** `app/tarot/spread.tsx`, `app/tarot/yesno.tsx`, `app/tarot/period.tsx`, `app/tarot/person.tsx`  
**Problem:** When a spread is done, `addTarotSpread()` is never called — spreads don't appear in history.  
**Fix:** Add `addTarotSpread()` call after cards are drawn in each spread file.

---

## 2. Remove All Header Titles App-Wide
**Files:** `app/_layout.tsx`, `app/(tabs)/_layout.tsx`  
**Problem:** Stack navigation shows title text on every page (e.g. "Розклад Таро", "AI Магія", "Сьогодні").  
**Fix:**  
- `app/_layout.tsx`: Set `title: ''` on all Stack.Screen entries; set `headerShown: false` on screens that have their own custom header (conflict, learn/tarot).  
- `app/(tabs)/_layout.tsx`: Add `headerShown: false` to "index" (Сьогодні) and "ai" (AI Магія) tabs.

---

## 3. Restructure AI Magic Page
**File:** `app/(tabs)/ai.tsx`  
**Problem:** "Рекомендації" and "Любовний прогноз" tiles just open the same chat as "AI Єзотерик" — redundant.  
**Fix:**  
- Remove "Рекомендації" and "Любовний прогноз" tiles.  
- Make "AI Єзотерик" a large full-width hero button.  
- Keep "Аналіз конфлікту" as a standalone feature card.  
- Chat history (premium only) remains below.

---

## 4. Smart Chat Session Titles + AI Doesn't Ask for Birth Date
**Files:** `app/ai/chat.tsx`, `stores/useAppStore.ts`  
**Problem:**  
- All chat sessions are titled "AI Консультація" regardless of context.  
- AI asks user for birth date even though it's already in the system prompt from onboarding.  
**Fix:**  
- Store: add `updateSessionTitle(sessionId, title)` action.  
- Chat: on session creation with `dailyContext` param, derive smart title from context string.  
- Chat: after first AI response, update session title to first ~40 chars of user's first message.  
- System prompt: add rule "Якщо дата народження відома — не питай її в користувача".

---

## 5. Conflict Analysis — Multi-Person Roles
**File:** `app/ai/conflict.tsx`  
**Problem:** When user selects 3+ people, there's still only ONE "Роль іншої людини" field — should be one per other person.  
**Fix:**  
- Compute `otherCount = peopleCount - 1` (max 4 for "5+").  
- Replace `otherRoles: string[]` with `personRoles: string[]` (one entry per other person, indexed).  
- Step 1: render N separate role pickers labelled "Людина 1", "Людина 2" etc.  
- Pass all roles to AI prompt.

---

## 6. learn/tarot.tsx Full Overhaul
**File:** `app/learn/tarot.tsx`  
**Changes:**  
- Remove "Режими навчання" section title from browse mode.  
- Hide Stack header (`headerShown: false`).  
- Add count-up timer that pauses when instructions modal is open.  
- Add instructions modal: auto-opens on first game launch; reopen button pauses timer.  
- Single back button → returns to browse (not `router.back()`).  
- Card images: `quiz_name` & `quiz_yesno` → real TAROT_IMAGES; `quiz_keyword` → mystery gradient card.  
- Score counter: full-width, centered, above card visual (not flex-end).  
- Remove `\n` from `getQuestion()` — use inline text.  
- Explanation: shown as absolute bottom overlay (replaces options), no scroll needed.  
- Encyclopedia section in browse: 3-column grid of all card images; tap → detail modal with name + meaning.

---

## DELIBERATELY REMOVED: Referral Program

**Decision:** The referral program has been permanently removed from the app by explicit user request. It must NOT be re-added.

**What was removed:**
- `app/matrix/referral.tsx` — page left as dead code (cannot delete)
- `stores/useAppStore.ts` — removed `referralCode`, `referralCount`, `setReferralCode`, `incrementReferral` from interface, implementation, and `partialize`
- `stores/useAppStore.ts` — removed `invite_1` from `ALL_ACHIEVEMENTS`
- `stores/useAppStore.ts` — removed `if (state.referralCount >= 1) tryUnlock('invite_1')` from `checkAchievements`
- `app/(tabs)/matrix.tsx` — removed "Запросити" card from the 2-column grid; Сумісність is now full-width
- `app/_layout.tsx` — removed `<Stack.Screen name="matrix/referral" ... />`

---

## 7. Daily History Feature
**Files:** `stores/useAppStore.ts`, `app/(tabs)/index.tsx`, `app/matrix/daily.tsx`, `app/(tabs)/profile.tsx`  
**Feature:** Track "card of the day" and "matrix of the day" history in user profile.  
**Details:**  
- Store: add `dayCardHistory: DayCardEntry[]` and `dayMatrixHistory: DayMatrixEntry[]` arrays.  
  - `DayCardEntry`: `{ date, cardId, cardName, meaning }`  
  - `DayMatrixEntry`: `{ date, aiSummary }`  
- `index.tsx`: when card of the day is shown, save to `dayCardHistory` (once per day).  
- `matrix/daily.tsx`: when AI summary is generated, save to `dayMatrixHistory`.  
- `profile.tsx`: add "Щоденна Історія" section showing recent entries (card of day + matrix of day).  
- Note: Spread history and AI chat history stay on their existing pages (NOT in profile).
