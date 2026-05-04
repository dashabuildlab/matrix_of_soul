# Session Changelog — 2026-05-04

Всі зміни, рішення та виправлення виконані в цій сесії розробки.

---

## 1. Кнопка «(tabs)» на Back Button

**Проблема.** На всіх Stack-екранах кнопка «назад» показувала текст `(tabs)` замість простої стрілки.

**Причина.** В React Navigation v7 / Expo Router v6 властивості `headerBackTitleVisible: false` та `headerBackTitle: ''` більше не працюють для native-stack.

**Рішення.** В `app/_layout.tsx` замінено на:
```tsx
headerBackButtonDisplayMode: 'minimal',
```

---

## 2. Краш медіаплеєра (TypeError: likedMeditations undefined)

**Проблема.** `app/meditation/player.tsx` рядки 91–93 викликали `likedMeditations.includes(med.id)` — але це поле не існувало в store.

**Рішення.** В `stores/useAppStore.ts` додано поля та метод:
```typescript
likedMeditations: string[];
toggleLikedMeditation: (id: string) => void;
```

---

## 3. Список улюблених медитацій

**Проблема.** Лайкнуті медитації не відображались.

**Рішення.** В `app/meditation.tsx` додано:
- Читання `likedMeditations` зі store
- Фільтрація `favorites`
- Горизонтальна секція з улюбленими медитаціями у верхній частині екрана

---

## 4. Paywall не завантажував плани

**Проблема.** В Expo Go RevenueCat запускається в Browser Mode (`_configured = false`), `getOfferings()` повертає `null`, UI показував "Не вдалося завантажити плани".

**Рішення.** В `app/paywall.tsx`:
- Додано `IS_EXPO_GO` detection: `Constants.appOwnership === 'expo'`
- Додано `FALLBACK_PLANS` (фіксовані ціни в гривнях: ₴999/рік, ₴149/міс, ₴49/тиж)
- В режимі fallback: `handleSubscribe` → `setPremium(true, plan)` напряму, без RevenueCat

---

## 5. Зменшення кількості спеціальних розкладів

**Зміна.** В `app/(tabs)/tarot.tsx` зменшено `SPECIAL_SPREADS` з 8 до 4:
- Залишено: Так чи Ні, На людину, Кохання, Прогноз
- Видалено: Фінанси та інші

---

## 6. Розклад Таро — заблоковано за Premium

**Логіка.** Єдиний безкоштовний розклад — "Три карти". Всі інші — тільки з Premium.

**Реалізація.** В `app/(tabs)/tarot.tsx` додано:
```typescript
const navigateSpread = (pathname, params, isFree = false) => {
  if (!isFree && !isPremium) { router.push('/paywall'); return; }
  router.push({ pathname, params });
};
```
- "Три карти" → `isFree = true`
- Заблоковані розклади: opacity 0.65 + lock-іконка

---

## 7. Виправлення заголовка розкладу (показував «three», «celtic» тощо)

**Проблема.** `{type || 'Розклад'}` відображав raw URL-параметр.

**Рішення.** В `app/tarot/spread.tsx` додано:
```typescript
const SPREAD_NAMES: Record<string, string> = {
  three: 'Три карти', cross: 'Хрест', celtic: 'Кельтський хрест', ...
};
const spreadName = nameParam || SPREAD_NAMES[type] || 'Розклад';
```
Навігація передає `name` параметр: `{ ...spread.params, name: spread.name }`.

---

## 8. Довідник — відсутня кнопка «назад», невірні роути

**Проблема.** Розклад Зодіаки/Планети/Чакри відкривались як tabs-екрани (без back button), маршрути вели на `/learn`.

**Рішення.**
- В `app/_layout.tsx` додано Stack.Screen-и: `learn/signs`, `learn/planets`, `learn/chakras`, `learn/tarot` з українськими заголовками
- В `app/(tabs)/tarot.tsx` маршрути виправлено на `/learn/signs`, `/learn/planets`, `/learn/chakras`
- Заголовок "learn" приховано через `headerShown: false` або правильні title

---

## 9. Кнопка «Почати» на Welcome-екрані нічого не робила

**Причина.** `_layout.tsx` читав `onboarding_done` з SecureStore один раз при ініціалізації. Welcome-екран видаляв ключ, але стан `onboardingDone` в компоненті залишався `true` → redirect на onboarding-екрані спрацьовував, блокуючи навігацію.

**Рішення.** Доданий `storeOnboardingCompleted` з Zustand-стору. Redirect спрацьовує тільки коли **обидва** значення `true`:
```tsx
redirect={onboardingDone && storeOnboardingCompleted}
```

---

## 10. Довідник таро — тільки 22 карти замість 78

**Проблема.** `app/learn/tarot.tsx` імпортував з `constants/tarotData` (22 Major Arcana).

**Рішення.** Змінено імпорт на `lib/staticData` (`TAROT_CARDS` = 78 карт: 22 Major + 56 Minor Arcana).

---

## 11. Видалення кнопки «Пропустити» з онбордингу

**Зміна.** В `app/onboarding.tsx` (старій версії) видалено умовний блок зі `skipButton`.

---

## 12. Повний перепис Онбордингу

**Запит.** Відтворити онбординг як у `matrix-of-destiny` (референсні зображення: `C:\Users\dell\Desktop\job\matrix\онбординг`).

### Архітектура

Крок-машина: `welcome → intent → focus → gender → dob → generating → aha → registration → /(tabs)`

### Компоненти

#### `WheelPicker`
- `ScrollView` з `snapToInterval={48}`, `decelerationRate="fast"`
- Fade-градієнти зверху/знизу
- Підсвічена золота лінія вибраного елемента

#### `useEntrance()`
- Хук: `Animated.Value` fade + slideUp за 400ms
- Використовується в кожному кроці для плавного входу

#### `OptionRow` (Proper Component)
- Замінює попередній `renderOption()` — виправлено порушення Rules of Hooks (хуки в `.map()`)
- Props: `id`, `icon`, `label`, `active`, `onToggle`, `enterDelay`
- Анімації: tap-scale bounce, checkmark pop-in, `Reanimated.FadeInUp`

#### `WelcomeStep`
- Текст: "МАТРИЦЯ ДОЛІ & ТАРО" + "Дізнайся, що записано у твоїй даті народження"
- Каскадна анімація: subtitle → line1 → line2 → line3 → desc → btn (staggered delays)
- Повільна ротація космосу (80 секунд)
- Кнопка: breathing glow loop + micro-pulse при появі

#### `IntentStep`
- 5 варіантів: самопізнання, стосунки, шлях, щоденні підказки, Таро
- Multi-select, disabled CTA → активується з анімацією при першому виборі
- `Reanimated.FadeInUp` для кожного рядка з delay

#### `FocusStep`
- 5 варіантів: ясність, стосунки, сильні сторони, напрямок, щоденні підказки
- Аналогічний механізм до IntentStep

#### `GenderStep`
- 2 варіанти: Чоловік / Жінка
- Single-select з radio-кнопкою

#### `BirthDateStep`
- TextInput для імені (required — блокує CTA якщо порожнє)
- WheelPicker × 3 (День / Місяць / Рік)
- Lock-іконка: "Зберігається тільки на твоєму пристрої"
- CTA: "Розрахувати мою матрицю →"

#### `GeneratingStep`
- Анімований orb (пульсуючий LinearGradient) замість відео-сфери (яка є в matrix-of-destiny)
- Прогрес-бар + checklist (4 кроки → "Готово!")
- Автоперехід через 1.8s після завершення

#### `AhaTeaserStep`
- `MatrixDiagram` + gradient overlay (без `mysteryMode` prop — накладається власний LinearGradient)
- Карта "ТВОЯ МАТРИЦЯ ДОЛІ": Особистість (повністю відкрито) + Душа (teaser + lock) + Доля (lock) + 4 заблоковані пункти
- AI-аналіз через `askClaude` (haiku, 400 tokens) — персональна записка 3-4 речення
- Shimmer sweep + floating CTA: "Розблокуй свою Матрицю →"

#### `RegistrationStep`
- Apple Sign-In: `expo-apple-authentication` → `supabase.auth.signInWithIdToken`
- Google Sign-In: `@react-native-google-signin/google-signin` → `supabase.auth.signInWithIdToken`
- Email → navigates to `/auth/register`
- "Вже маю акаунт — Увійти" → `/auth/login`
- "Продовжити без реєстрації" — guest mode: `isAuthenticated: true, userId: 'guest_${Date.now()}'`

#### `ProgressBar`
- Золота анімована лінія вгорі екрана для кроків welcome→dob
- Spring-анімація при зміні кроку

### `handleDone()` (завершення онбордингу)
```typescript
await SecureStore.setItemAsync('onboarding_done', 'true');
setUserProfile(nameInput, birthDate); // зберігає ім'я та birthDate в store
setOnboardingCompleted();              // Zustand flag
// guest mode if not authenticated
router.replace('/(tabs)');
```

### Ключові відмінності від matrix-of-destiny
| matrix-of-destiny | matrix-of-soul |
|---|---|
| Firebase Auth | Supabase Auth |
| `useI18n()` (багатомовність) | Тільки українська |
| Video sphere (expo-video) | Animated orb (LinearGradient) |
| `mysteryMode` prop | Власний gradient overlay |
| Analytics tracking | Без аналітики |
| Language step | Відсутній |
| Inline Paywall step | Відсутній (є окремий `/paywall`) |
| `setPersonalMatrix`, `setUserGender` | Не додавались до store |

---

## 13. Матриця Дня — порівняння з Матрицею Долі

**Запит.** Використати дату народження з онбордингу в Матриці Дня: показати порівняльне речення та кнопку "Згенерувати Матрицю Долі".

### Зміни в `app/matrix/daily.tsx`

**Зчитування персональних даних:**
```typescript
const userBirthDate = useAppStore((s) => s.userBirthDate);

const personalMatrix = React.useMemo(() => {
  if (!userBirthDate) return null;
  // DD.MM.YYYY → YYYY-MM-DD
  const parts = userBirthDate.split('.');
  return calculateMatrix(`${parts[2]}-${parts[1]}-${parts[0]}`);
}, [userBirthDate]);
```

**Збагачений AI-промпт:**
Якщо є `personalMatrix`, в промпт для генерації прогнозу добавляється:
```
Особиста матриця долі: Особистість=N "name", Душа=M "name".
Додай в кінці прогнозу одне речення порівняння енергій сьогодні з особистою матрицею долі.
```

**Окреме порівняльне речення** (state: `comparison`):
- Окремий виклик `askClaude` (150 tokens) — одне речення про резонанс особистої та денної енергій
- Показується в картці "Порівняння з Матрицею Долі" (тільки якщо є personMatrix та comparison)

**CTA "Згенерувати Матрицю Долі":**
```tsx
<TouchableOpacity onPress={() => router.push('/matrix/create')}>
  <LinearGradient colors={['#4C1D95', '#7C3AED', '#8B5CF6']} ...>
    ...
    <Text>Згенерувати Матрицю Долі</Text>
    <Text>
      {personalMatrix
        ? 'Відкрий повний аналіз своєї матриці — 22 енергії, таланти та призначення'
        : 'Введи дату народження та відкрий свою унікальну матрицю долі'}
    </Text>
  </LinearGradient>
</TouchableOpacity>
```

**Примітка.** Матриця Долі як повний перегляд залишається закритою за Premium. Порівняння в Матриці Дня — безкоштовний teaser.

---

## Файли змінені в цій сесії

| Файл | Тип змін |
|---|---|
| `app/_layout.tsx` | Back button fix, нові Stack.Screen, redirect fix |
| `app/onboarding.tsx` | **Повний перепис** — step-based flow |
| `app/matrix/daily.tsx` | personalMatrix, порівняння, CTA |
| `app/meditation.tsx` | Секція улюблених медитацій |
| `app/paywall.tsx` | IS_EXPO_GO detection, FALLBACK_PLANS |
| `app/tarot/spread.tsx` | SPREAD_NAMES map, name param |
| `app/(tabs)/tarot.tsx` | Premium gating, lock UI, encyclopedia routes |
| `app/learn/tarot.tsx` | 78 карт (staticData) замість 22 |
| `stores/useAppStore.ts` | likedMeditations, toggleLikedMeditation |

---

## Технічні нотатки

### Rules of Hooks — renderOption()
У попередньому онбордингу `renderOption()` викликав `useRef` всередині `.map()`, що порушує Rules of Hooks. Виправлено шляхом створення окремого `OptionRow` компонента.

### Fallback плани (RevenueCat + Expo Go)
RevenueCat не ініціалізується в Expo Go (`_configured = false`). Рішення — двохрівневий підхід: реальні плани RevenueCat в production, hardcoded fallback в Expo Go. Fallback активує premium напряму (для тестування).

### AhaTeaserStep — mysteryMode
`MatrixDiagram` в matrix-of-soul не має prop `mysteryMode`. Ефект "таємниця" досягається через `LinearGradient` overlay:
```tsx
colors={['transparent', 'rgba(8,1,26,0.25)', 'rgba(8,1,26,0.6)', 'rgba(8,1,26,0.95)']}
```

### OnboardingDone + Store sync
Дві системи зберігання стану онбордингу:
- `SecureStore` — `onboarding_done: 'true'` (читається при старті)
- Zustand — `onboardingCompleted: boolean` (мутується в runtime)

Redirect на onboarding-екрані тепер перевіряє **обидва**: `redirect={onboardingDone && storeOnboardingCompleted}`. Це дозволяє welcome-екрану скидати онбординг без race condition.
