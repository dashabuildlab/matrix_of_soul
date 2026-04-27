# Matrix of Soul — Документація проєкту

> **Matrix of Destiny & Tarot** — езотерично-духовний мобільний застосунок (iOS, Android) + web-лендінг. Поєднує нумерологію Матриці Долі, 78-карткове Таро, AI-консультації Claude, медитації та гейміфікацію в темній космічній UI-темі.

**Продакшн:** [matrixofdestinytarot.com](https://matrixofdestinytarot.com) · Сервер `89.167.40.15`
**Гілка розробки:** `main` (без feature-branches і worktree — див. `CLAUDE.md`)

---

## Версії

| Файл | Версія |
|---|---|
| `app.json` (user-facing) | **1.0.30** (versionCode 30) |
| `package.json` | 1.0.12 |

> Расхождення свідоме: `app.json` — публічна версія для сторів, `package.json` — внутрішня.

## Платформи

| Платформа | Ідентифікатор |
|---|---|
| iOS | `com.matrixofsoul.myapp-` *(увага: trailing dash)* |
| Android | `com.matrixofsoul.app` |
| Web | Адаптивний (з sidebar на tablet/desktop) |

---

## Технологічний стек

### Фронтенд

| Технологія | Версія | Призначення |
|---|---|---|
| Expo | ~54.0.0 | Фреймворк (managed workflow) |
| Expo Router | ~6.0.23 | File-based навігація |
| React Native | 0.81.5 | UI |
| React | 19.1.0 | Рендеринг |
| TypeScript | ^5.3.3 | Типізація |
| Zustand | ^5.0.11 | Глобальний стейт |

### Нативні / платформенні модулі

| Пакет | Призначення |
|---|---|
| `@react-native-firebase/app`, `auth`, `analytics`, `crashlytics` v24 | Firebase Auth + Analytics + Crashlytics |
| `@react-native-google-signin/google-signin` ^16.1.2 | Google Sign-In |
| `expo-apple-authentication` ^55 | Apple Sign-In (iOS only) |
| `react-native-purchases` ^9.15 | RevenueCat (in-app purchases) |
| `@react-native-async-storage/async-storage` 2.2 | Персистенція Zustand |
| `react-native-mmkv` ^4.3 | Швидке сховище (native) |
| `expo-sqlite` ~16 | Історія AI-чатів |
| `expo-secure-store` ~15 | Безпечне сховище токенів |
| `react-native-safe-area-context` ~5.6 | Safe-area insets |
| `react-native-reanimated` ~4.1 + `react-native-worklets` 0.5 | Анімації |
| `expo-video` ~3.0 | Відео (аватар, welcome BG) |
| `expo-audio` ~1.1, `expo-av` ~16 | Аудіо медитацій |
| `react-native-svg` 15.12 | Діаграма матриці |
| `@shopify/react-native-skia` 2.2 | Графіка |
| `expo-linear-gradient` ~15 | Градієнти |
| `expo-blur` ~15 | Glass-morphism |
| `expo-notifications` ~0.32 | Push |
| `expo-localization` ~17 | Визначення локалі |
| `firebase` ^12 | Web Firebase SDK (тільки для web-білду) |

### Зовнішні API

| Сервіс | Модель / налаштування |
|---|---|
| Claude (Anthropic) | default `claude-sonnet-4-20250514`, max_tokens 900-2000 |
| ElevenLabs TTS | `eleven_multilingual_v2`, голос Sarah — генерація медитацій |
| Firebase Auth | Google, Apple, Email/Password |
| RevenueCat | entitlement `Matrix of Destiny & Tarot Pro`, packages `$rc_weekly/$rc_monthly/$rc_annual` |

---

## Структура проекту

```
matrix-of-soul/
├── app/                            # Expo Router: усі екрани
│   ├── _layout.tsx                 # Root layout, Firebase init, achievements
│   ├── index.tsx                   # Маршрутизація
│   ├── welcome.tsx                 # Welcome з відео
│   ├── onboarding.tsx              # Онбординг (ім'я, дата, фокус)
│   ├── paywall.tsx                 # Преміум-підписка (RevenueCat)
│   ├── meditation.tsx              # Каталог медитацій
│   ├── meditation/player.tsx       # Аудіоплеєр
│   ├── share.tsx                   # Поширення енергії дня
│   ├── (tabs)/                     # Табова навігація (5 табів)
│   │   ├── _layout.tsx
│   │   ├── index.tsx               # Сьогодні
│   │   ├── tarot.tsx
│   │   ├── matrix.tsx
│   │   ├── ai.tsx
│   │   ├── profile.tsx
│   │   └── learn.tsx               # (не в табах, але в групі)
│   ├── auth/
│   │   ├── login.tsx               # Email + Google + Apple + Guest
│   │   └── register.tsx
│   ├── matrix/
│   │   ├── create.tsx
│   │   ├── [id].tsx
│   │   ├── daily.tsx
│   │   ├── compatibility.tsx
│   │   └── referral.tsx
│   ├── tarot/
│   │   ├── spread.tsx              # Класичні розклади
│   │   ├── yesno.tsx
│   │   ├── person.tsx
│   │   ├── period.tsx
│   │   ├── astro.tsx
│   │   └── history.tsx
│   ├── ai/
│   │   ├── chat.tsx                # Мультисесійний чат (SQLite)
│   │   ├── conflict.tsx            # Аналіз конфлікту
│   │   └── history.tsx
│   ├── learn/                      # 10 навчальних модулів/ігор
│   │   ├── tarot.tsx
│   │   ├── chakras.tsx
│   │   ├── planets.tsx
│   │   ├── signs.tsx
│   │   ├── matrix-guide.tsx
│   │   ├── quiz.tsx
│   │   ├── memory.tsx
│   │   ├── guess.tsx
│   │   ├── match.tsx
│   │   └── truefalse.tsx
│   └── profile/
│       ├── history.tsx             # Історія активності
│       ├── achievements.tsx
│       ├── account.tsx
│       ├── language.tsx
│       ├── notifications.tsx
│       ├── privacy.tsx
│       └── about.tsx
├── components/
│   ├── ui/                         # Card, Button, StarBackground, WebSidebar,
│   │                               # FormattedText, CardOfDayBlock, EnergyBadge,
│   │                               # PremiumLockOverlay, AIGuideButton,
│   │                               # AIConsentModal, GameInstructions,
│   │                               # GameResultsAnimation, AnimatedPressable
│   ├── matrix/                     # MatrixDiagram (SVG-октагон)
│   └── tarot/                      # TarotCardFlip
├── constants/
│   ├── theme.ts                    # Colors, Spacing, FontSize, BorderRadius
│   ├── energies.ts                 # 22 енергії (Великі Аркани)
│   ├── tarotData.ts                # 22 Великих Арканів
│   ├── minorArcana.ts              # 56 Молодших Арканів (Wands/Cups/Swords/Pentacles)
│   ├── tarotImages.ts              # Маппінг cardId → require() до `/assets/tarot/*.jpg`
│   ├── meditations.ts              # Типи медитацій
│   └── matrixTexts.ts              # Тексти інтерпретацій матриці
├── lib/
│   ├── matrix-calc.ts              # Алгоритм Матриці Долі (14 позицій)
│   ├── claude.ts                   # Клієнт до /api/claude
│   ├── firebaseAuth.ts             # Google/Apple/Email auth + ID-token
│   ├── purchases.ts                # RevenueCat wrapper
│   ├── analytics.ts                # Firebase Analytics events
│   ├── crashlytics.ts              # Firebase Crashlytics
│   ├── notifications.ts            # Push + локальні сповіщення
│   ├── chatDb.ts / chatDb.web.ts   # SQLite (native) / indexedDB (web)
│   ├── storage.ts / .native.ts / .web.ts  # AsyncStorage / localStorage абстракція
│   ├── persistStorage.ts           # Zustand persist middleware
│   ├── passwordHash.ts
│   ├── syncSchema.ts               # Zod схема серверного state
│   ├── i18n.tsx                    # Контекст локалізації
│   ├── fallbackData.ts             # Локальні копії 22 карт / 22 енергій / меди
│   ├── staticData.ts               # Склеює Major + Minor = 78 карт
│   ├── matrixDocument.ts           # Експорт у PDF
│   └── tabState.ts                 # Detect double-tap на табах
├── stores/
│   └── useAppStore.ts              # Zustand (~900 LOC), AsyncStorage persist
├── locales/
│   ├── uk.ts                       # Українська (default)
│   └── en.ts                       # English
├── hooks/
│   └── useResponsive.ts            # Mobile / Tablet / Desktop
├── plugins/
│   └── withModularHeaders.ts       # Expo config plugin (iOS modular headers)
├── assets/
│   ├── tarot/                      # 78 JPG карт
│   ├── audio/                      # MP3 медитацій
│   ├── avatar_start.mp4            # Анімація аватара (старт)
│   ├── avatar_loop.mp4             # Анімація аватара (цикл)
│   ├── welcome_bg_opt.mp4          # Фон Welcome
│   ├── crystal_btn.mp4             # Кристал у greeting
│   └── *.png                       # Іконки
├── api/                            # Node.js бекенд
│   ├── server.js                   # Express: sync, claude proxy, RC webhook
│   ├── Dockerfile
│   └── serviceAccountKey.json      # Firebase Admin (для verify ID-tokens)
├── android/                        # Згенеровано Expo prebuild
├── scripts/
│   ├── generate_meditations.py     # ElevenLabs TTS → MP3
│   ├── deploy.sh
│   └── server-setup.sh
├── supabase/migrations/            # SQL (001-005: init → tarot expanded)
├── seo-website/                    # Next.js маркетинговий сайт (SEO)
├── website/                        # Статичний HTML-лендинг
├── docker-compose.yml              # api (3100) + seo-website (3005) + landing (3015)
├── deploy.py / deploy_merged.py / deploy_seo.py
├── upload_dist.py                  # Web-білд → сервер
├── app.json                        # Expo config
├── eas.json                        # EAS Build профілі
├── google-services.json            # Firebase Android
├── GoogleService-Info.plist        # Firebase iOS
└── CLAUDE.md                       # Інструкції для Claude Code
```

---

## Аутентифікація

### 4 способи входу (`app/auth/login.tsx`, `lib/firebaseAuth.ts`)

| Метод | Платформи | Firebase провайдер |
|---|---|---|
| Google Sign-In | iOS, Android | `google.com` |
| Apple Sign-In | iOS only | `apple.com` |
| Email + Password | iOS, Android | `password` |
| Guest (гість) | всі | `userId = "guest_<timestamp>"` |

### Google Sign-In

- Пакет: `@react-native-google-signin/google-signin`
- Конфіг: `lib/firebaseAuth.ts:36-43`
  - `webClientId`: `113578995852-q3q4pvclfgctr8sgeof3olblm7tchhve.apps.googleusercontent.com`
  - `iosClientId`: `113578995852-djgn7a9n3ideromo4k19rbkb51d02kcu.apps.googleusercontent.com`
- Expo plugin: `app.json:59-64` з `iosUrlScheme`

### Apple Sign-In

- Пакет: `expo-apple-authentication`
- Scopes: FULL_NAME + EMAIL
- Entitlement: `com.apple.developer.applesignin` → `app.json:20`

### Guest → зареєстрований користувач

- Гостьовий `userId` = `guest_<timestamp>`
- При реєстрації: `useAppStore.migrateGuestData(newFirebaseUid)` мігрує **всі дані** на новий Firebase UID (матриці, розклади, історія карт)
- Profile UI показує **"Увійти в акаунт"** замість "Вийти" для гостя

### Backend auth

- Усі захищені ендпоінти перевіряють Firebase ID-token:
  ```js
  admin.auth().verifyIdToken(req.headers.authorization.split('Bearer ')[1])
  ```
- Credentials: `api/serviceAccountKey.json`

### Test-account (для Apple/Google review)

- Email: `reviewer@matrixofdestinytarot.com`
- При вході автоматично отримує `isPremium: true` (`lib/purchases.ts:187`)

---

## Монетизація (RevenueCat)

### Налаштування (`lib/purchases.ts`)

| Параметр | Значення |
|---|---|
| iOS API Key | `appl_hJrxoQgGEcZqkGfSrtEKvYjgcFb` |
| Android API Key | `goog_VQRGrDajmesTXEdvwCYKEuuCGyJ` |
| Entitlement | `Matrix of Destiny & Tarot Pro` |
| Packages | `$rc_weekly`, `$rc_monthly`, `$rc_annual` |

### Життєвий цикл

1. **Старт додатку** → `initPurchases()` → `checkSubscriptionStatus()` → `addCustomerInfoListener()` *(`app/_layout.tsx:228`)*
2. **Логін/реєстрація** → `syncPurchasesUser(firebaseUid)` — прив'язує UID у RevenueCat
3. **Покупка** (`app/paywall.tsx`) → `Purchases.purchasePackage()` → `useAppStore.setPremium(true, plan)`
4. **Listener** оновлює `isPremium` у стані при будь-якій зміні (renewal, cancel, billing issue)

### Webhook (сервер)

- Endpoint: `POST /api/revenuecat-webhook`
- Auth: `Authorization: <WEBHOOK_SECRET>` (env)
- Обробляє події: `INITIAL_PURCHASE`, `RENEWAL`, `PRODUCT_CHANGE`, `UNCANCELLATION`, `EXPIRATION`, `BILLING_ISSUE`, `CANCELLATION`
- Оновлює `user_sync.state.isPremium` у Postgres

### Плани у Paywall

| План | Опис | Badge |
|---|---|---|
| Yearly | `$rc_annual` | "Best price" |
| Monthly | `$rc_monthly` | — |
| Weekly | `$rc_weekly` | "Try it" |

Реальні ціни тягнуться з `Purchases.getOfferings()` (локалізовані), fallback — жорсткі рядки з `locales/`.

### Crystal-економіка (внутрішня валюта)

| Дія | Кристали |
|---|---|
| Стартовий баланс | 10 |
| Щоденний gift | +5 (кінчаються до кінця доби) |
| AI-повідомлення | −1 |
| AI-аналіз Матриці дня | −3 |
| AI-розклад Таро | −5 |
| Premium підписка | безлімітний доступ до всіх фіч |

---

## Бекенд API

### Інфраструктура

| Компонент | Порт / Адреса |
|---|---|
| Caddy reverse proxy | `:443` → `matrixofdestinytarot.com` |
| Docker `api` (Node/Express) | `:3100` (локально) |
| Docker `seo-website` (Next.js) | `:3005` |
| Docker `landing` (Nginx) | `:3015` |
| PostgreSQL | схема `app_matrixofsoul` |

**SSH:** `ssh -i deploy_key -o StrictHostKeyChecking=no deployer@89.167.40.15`

### Ендпоінти (`api/server.js`)

| Метод | Шлях | Auth | Опис |
|---|---|---|---|
| GET | `/health` | — | Heartbeat |
| GET | `/api/sync/:userId` | Firebase ID-token | Завантажити state користувача |
| POST | `/api/sync/:userId` | Firebase ID-token | Зберегти state (upsert) |
| POST | `/api/claude` | — *(має бути захищений!)* | Proxy до Anthropic API |
| POST | `/api/revenuecat-webhook` | `Authorization: <SECRET>` | Webhook від RevenueCat |

### Стратегія синхронізації

- Ключ: `user_sync.user_id` (= Firebase UID)
- `state` — JSONB колонка з усім Zustand-стейтом
- Merge-стратегія в клієнті (`stores/useAppStore.ts::syncWithServer`):
  - масиви → union за id
  - числа → max (XP, streak, tokens)
  - булеві → OR

### Claude proxy

- Retry на 500/502/529 (overload)
- Timeout 90 с
- API-ключ `CLAUDE_API_KEY` у env на сервері (не в клієнтському бандлі)

### Env на сервері

```bash
DATABASE_URL=postgres://...
CLAUDE_API_KEY=sk-ant-...
WEBHOOK_SECRET=<...>
```

---

## Дані Таро

### Повна колода — 78 карт (`lib/staticData.ts`)

```ts
export const TAROT_CARDS = [...FALLBACK_TAROT_CARDS, ...MINOR_ARCANA];
```

| Група | ID | Карт |
|---|---|---|
| Великі Аркани | 1–22 | 22 (Блазень = ID 0, ділить зображення з ID 22) |
| Жезли (Wands) | 23–36 | 14 |
| Кубки (Cups) | 37–50 | 14 |
| Мечі (Swords) | 51–64 | 14 |
| Пентаклі (Pentacles) | 65–78 | 14 |

### Структура карти (з fallbackData.ts)

```typescript
{
  id: number;
  nameUk: string; nameEn: string;
  keywords: string[]; keywordsEn: string[];
  description: string; descriptionEn: string;
  upright: string; uprightEn: string;
  reversed: string; reversedEn: string;
  advice: string; adviceEn: string;
  loveAdvice: string; loveAdviceEn: string;
  careerAdvice: string; careerAdviceEn: string;
  financeAdvice: string; financeAdviceEn: string;
  healthAdvice: string; healthAdviceEn: string;
  spiritualAdvice: string; spiritualAdviceEn: string;
  yesNo: 'yes' | 'no' | 'maybe';
  element: string; elementEn: string;
  planet: string; planetEn: string;
}
```

### Зображення

- Рідер-Вейт колода (public domain, 1909)
- Файли: `assets/tarot/1.jpg … 78.jpg` (~50 КБ/карта)
- Маппінг: `constants/tarotImages.ts` → `require()` для bundler'а

---

## Функціональність

### 1. Головна — «Сьогодні» (`app/(tabs)/index.tsx`)

- Привітання з ім'ям та датою (локалізована)
- Кристали + бейдж сповіщень
- **Щоденний подарунок** (з 2-го дня використання): +5 кристалів, зникають наприкінці доби
- **Кнопка Матриця дня** → модалка з анімованим аватаром + SVG-матриця + AI-підсумок (−3 кристали або premium)
- **Карта дня** (`<CardOfDayBlock>`) — детерміновано від дати, зображення + значення
- **Енергія дня** — число 1–22 + назва + ключові слова + порада
- **Блок медитацій** → `/meditation`

### 2. Матриця Долі

**Алгоритм** (`lib/matrix-calc.ts`):
- Вхід: дата народження
- 14 позицій: особистість, душа, призначення, духовне/матеріальне, таланти (Бог/рід/реалізація), карма (хвіст/батьки), чоловіче/жіноче, центр

**Візуалізація** (`components/matrix/MatrixDiagram.tsx`):
- SVG-октагон з 21 вузлом
- Колірне кодування, інтерактивні вузли

**Екрани:**
- `/matrix/create` — створення (модальне)
- `/matrix/[id]` — перегляд з AI-інтерпретацією
- `/matrix/daily` — матриця сьогоднішнього дня
- `/matrix/compatibility` — сумісність двох людей
- `/matrix/referral` — реферальна програма

### 3. Таро-розклади

| Тип | Карт | Premium | Екран |
|---|---|---|---|
| 3 карти | 3 | — | `/tarot/spread?type=three` |
| Кельтський хрест | 10 | — | `/tarot/spread?type=celtic_cross` |
| Класичний | 5 | ✓ | `/tarot/spread?type=classic` |
| Так/Ні | 1 | — | `/tarot/yesno` |
| На людину | 5 | ✓ | `/tarot/person` |
| На період (тиждень/місяць/рік) | 5 | ✓ | `/tarot/period` |
| Астро-розклад | 12 | ✓ | `/tarot/astro` |
| Любов | 5 | ✓ | `/tarot/spread?type=love` |
| Кар'єра | 5 | ✓ | `/tarot/spread?type=career` |
| AI Chat Spread | динамічно | ✓ | вбудовано в `/ai/chat` |

**AI-інтерпретація** — Claude генерує трактування з урахуванням щоденної енергії та матриці користувача.

### 4. AI-функції

- `/ai/chat` — мультисесійний чат (персистенція в SQLite на native, IndexedDB на web)
- `/ai/conflict` — аналіз конфлікту двох людей через нумерологію
- `/ai/history` — архів сесій

**Вартість:** 1 кристал/повідомлення (або безлім з Premium).

### 5. Медитації

- Аудіо (MP3) згенероване ElevenLabs (голос Sarah, `eleven_multilingual_v2`)
- Плеєр (`app/meditation/player.tsx`): play/pause, seek ±15s, waveform, like, `playsInSilentModeIOS`, `staysActiveInBackground`
- Фільтри: **настрій** (стрес, тривога, смуток, втома, радість…) · **ціль** (сон, фокус, енергія, зцілення…)
- Premium: 5 кристалів за медитацію або безлім

### 6. Навчання — 10 модулів

| ID | Тип | Опис |
|---|---|---|
| tarot | енциклопедія | 22 Великих Арканів |
| chakras | енциклопедія | 7 чакр |
| planets | енциклопедія | 10 планет |
| signs | енциклопедія | 12 знаків зодіаку |
| matrix-guide | путівник | Як читати матрицю |
| quiz | гра | Вікторина по 22 карт |
| memory | гра | Парна гра |
| guess | гра | Вгадай карту |
| match | гра | Зіставлення |
| truefalse | гра | Правда/брехня |

### 7. Профіль

- Аватар, ім'я, рівень/ранг (20 рангів), прогрес XP
- Статистика: streak, розклади, матриці, досягнення (14 шт)
- Crystal-баланс, Premium-статус
- Реферальна програма
- Мова (uk/en), сповіщення, приватність, "Про додаток"
- **Історія** (`/profile/history`): карти дня · матриці дня · розклади · збережені матриці
- **Увійти в акаунт** (для гостя) або **Вийти** + **Видалити акаунт** (для зареєстрованих)

---

## Гейміфікація

### XP та рівні

- **500 XP = 1 рівень** (до 20)
- Відкриття додатку: +20 XP
- Завершення медитації: +15 XP
- Досягнення: +30…1000 XP

### 20 рангів (`locales/*.ts::ranks`)

1 → 20: Мандрівник → Учень → Шукач → Адепт → Містик → … → Майстер Езотерики

### 14 досягнень (`stores/useAppStore.ts:ALL_ACHIEVEMENTS`)

| ID | Назва | Умова | XP |
|---|---|---|---|
| first_matrix | Перший крок | Створити матрицю | 50 |
| first_tarot | Оракул | 1 розклад | 30 |
| tarot_5 | Учень Таро | 5 розкладів | 80 |
| tarot_15 | Знавець Таро | 15 розкладів | 150 |
| tarot_50 | Гуру Таро | 50 розкладів | 500 |
| tarot_love | Серцевід | 5 розкладів на кохання | 100 |
| tarot_career | Кар'єрист | 5 розкладів на кар'єру | 100 |
| tarot_yesno | Так чи Ні? | 10 Так/Ні | 80 |
| streak_3 | 3 дні поспіль | Серія 3 дні | 100 |
| streak_7 | Тиждень практики | Серія 7 днів | 250 |
| streak_30 | Місяць мудрості | Серія 30 днів | 1000 |
| first_ai | Діалог з Всесвітом | 1-е AI-питання | 40 |
| quiz_master | Майстер Таро | Quiz 100% | 200 |
| invite_1 | Перший реферал | Запросити 1 друга | 150 |
| meditation_5 | Медитатор | 5 медитацій | 100 |

### Щоденна серія (streak)

- Логіка у `checkAndUpdateStreak()` у `_layout.tsx`
- Порівнюється `lastVisitDate` з сьогоднішньою датою
- Новий день: якщо вчора → `streak++`, інакше → `streak = 1`
- Toast-сповіщення з полум'ям

---

## Стейт-менеджмент (Zustand, ~900 LOC)

**Файл:** `stores/useAppStore.ts`
**Персистенція:** `AsyncStorage` (native) / `localStorage` (web), ключ `matrix-of-soul-v1`

### Секції стейту

```typescript
// Auth
isAuthenticated, userId, userName, userBirthDate

// Onboarding
onboardingCompleted, knowledgeLevel, lifeFocus, dailyCardEnabled

// Матриці
savedMatrices: SavedMatrix[]
personalMatrix, dailyMatrixUsedFree

// Таро
tarotSpreads: TarotSpread[]

// AI-чат (плюс SQLite для повідомлень)
chatSessions: AIChatSession[]
activeSessionId

// Преміум / Кристали
tokens, isPremium, premiumPlan
purchasedMeditationIds

// Реферали
referralCode, referralCount

// Гейміфікація
xp, level, streak, lastVisitDate
achievements (14), unlockedAchievementIds
meditationCount, likedMeditations
notifications

// Щоденні
dailyCardHistory, dailyMatrixHistory
firstOpenDate, lastGiftClaimedDate

// Sync
isSyncing, lastSyncedAt
```

### Ключові методи

```typescript
// Auth/Profile
setUserProfile(name, birthDate); logout(); migrateGuestData(newUserId)

// Data
addMatrix; removeMatrix; addTarotSpread
addChatSession; addMessageToSession; renameChatSession; setActiveSession

// Premium / Crystals
setPremium(val, plan); addTokens; useToken
spendCrystals(amount); purchaseMeditation(id, cost)
canClaimGift(); claimDailyGift(amount); clearExpiredGifts()

// Gamification
addXP; checkAndUpdateStreak; unlockAchievement; checkAchievements
incrementMeditationCount; toggleLikedMeditation

// Daily
recordDailyCard(cardId, nameUk); recordDailyMatrix(...)

// Notifications
addNotification; markNotificationRead

// Sync
syncWithServer(); pushToServer()

// AI Cache
setAiCache(key, value); getAiCache(key)
```

---

## База даних

### PostgreSQL — схема `app_matrixofsoul`

| Таблиця | Призначення |
|---|---|
| `user_profiles` | Метадані користувачів |
| `user_sync` | `state JSONB` — повний Zustand-стейт (одна строчка/користувач) |
| `tarot_cards` | Картки Таро (seed для SSR/SEO) |
| `energies` | 22 енергії |
| `meditations` | Метадані медитацій |
| `tarot_spreads` | Історія розкладів (опціонально) |
| `matrices` | Збережені матриці |
| `compatibility` | Сумісності |

**Міграції:** `supabase/migrations/001_init.sql` … `005_tarot_cards_expanded.sql`

### SQLite (локально на пристрої, `lib/chatDb.ts`)

- `chat_sessions` (id, title, context, createdAt)
- `chat_messages` (id, sessionId, role, content, createdAt)
- PRAGMA `journal_mode = WAL`

---

## UI / Тема

### Палітра

```
bg:          #0D0B1E (космічний темний)
bgCard:      #141428
primary:     #8B5CF6 (фіолет)
primaryLight:#A78BFA
accent:      #F5C542 (золото)
accentMuted: rgba(245,197,66,0.15)

text:        #FFFFFF
secondary:   rgba(255,255,255,0.75)
muted:       rgba(255,255,255,0.45)

success:     #A78BFA / #22C55E
error:       #EF4444 / #C026D3
border:      rgba(139,92,246,0.20)
```

### Spacing / BorderRadius

| Токен | Значення |
|---|---|
| xs/sm/md/lg/xl/xxl | 4 / 8 / 16 / 24 / 32 / 48 px |
| BorderRadius sm/md/lg/xl/full | 8 / 12 / 16 / 24 / 999 px |

### Шрифти (платформо-залежні)

| Токен | Web | Mobile |
|---|---|---|
| xs | 13 | 12 |
| sm | 15 | 14 |
| md | 17 | 15 |
| lg | 20 | 17 |
| xl | 26 | 22 |
| xxl | 32 | 28 |

---

## Адаптивний дизайн

**Hook:** `hooks/useResponsive.ts`

| Клас | Ширина | Поведінка |
|---|---|---|
| Mobile | < 768 | Табова навігація внизу, 1 колонка |
| Tablet | 768–1024 | Sidebar зліва (web), 2 колонки |
| Desktop | ≥ 1024 | Sidebar зліва (web), 3-4 колонки |

---

## Локалізація

- **uk** (default) — `locales/uk.ts`
- **en** — `locales/en.ts`
- API: `useI18n()` → `{ t, locale, setLocale }`
- Автовизначення: `expo-localization`

---

## Push та локальні сповіщення

- `expo-notifications` (крім Expo Go)
- Типи: `affirmation`, `streak`, `achievement`, `tarot`, `energy`
- Дефолтний канал: `default`, колір `#7C3AED`

---

## Аналітика та крашлог

- `lib/analytics.ts` — `trackFeatureUsed`, `trackPaywallShown/Dismissed`, `trackEarnCurrency`, `trackPushLandingView`, `trackAchievementUnlocked`, тощо
- `lib/crashlytics.ts` — `recordError(err, context)`
- Працює тільки в dev-build / production (не в Expo Go)

---

## Деплой

### Mobile

```bash
# Dev build
eas build --profile development --platform android
eas build --profile development --platform ios

# Store (preview → production)
eas build --profile preview --platform android     # APK для internal testing
eas build --profile production --platform ios      # TestFlight / App Store
eas submit --platform ios / android
```

### Web-лендинг (`website/`)

```bash
npx expo export --platform web --output-dir dist
python upload_dist.py
```

### SEO-сайт (Next.js, `seo-website/`)

```bash
python deploy_seo.py
```

### Бекенд

```bash
ssh -i deploy_key deployer@89.167.40.15
cd /srv/matrix
docker compose up -d --build api
```

---

## Скрипти

| Скрипт | Призначення |
|---|---|
| `scripts/generate_meditations.py` | ElevenLabs TTS → `/assets/audio/*.mp3` |
| `scripts/deploy.sh` | Shell-деплой бекенду |
| `scripts/server-setup.sh` | Ініціалізація сервера (nginx/docker/caddy) |
| `deploy.py`, `deploy_merged.py`, `deploy_seo.py` | Python-деплой скрипти |
| `upload_dist.py` | SCP web-dist → server + nginx reload |
| `check_server.py`, `test_ssh.py` | Діагностика |
| `build-android.ps1`, `build-android-apk.ps1` | Локальний білд Android |

---

## Ключові флоу

### Старт додатку (`app/_layout.tsx`)

1. Firebase init (Auth + Analytics + Crashlytics)
2. `initPurchases()` → `checkSubscriptionStatus()` → listener
3. `initializeNotifications(locale)`
4. `clearExpiredGifts()` (на новий день)
5. Зчитати `onboarding_done` → показати онбординг / welcome / tabs
6. Перевірити streak та афірмацію дня

### Login/Register → RevenueCat

1. Email/Google/Apple → Firebase `signInWithCredential`
2. `useAppStore.setState({ isAuthenticated, userId: firebaseUid })`
3. `syncPurchasesUser(firebaseUid)` → прив'язка у RC
4. `checkSubscriptionStatus()` → відновлює premium
5. `syncWithServer()` → стягує state з Postgres

### Покупка Premium

1. Paywall → `Purchases.purchasePackage(rcPkg)`
2. RC показує нативний Apple/Google UI
3. Успіх → `useAppStore.setPremium(true, plan)`
4. Listener оновлює стан при renewal/cancel
5. **Webhook → сервер** оновлює `user_sync.state.isPremium`

### Вихід для Guest vs User

- Guest (userId починається з `guest_`) → показує "Увійти в акаунт" → `/auth/login`
- User → показує "Вийти з акаунта" (confirmation) + "Видалити акаунт"

---

## Тестові акаунти

| Акаунт | Призначення |
|---|---|
| `reviewer@matrixofdestinytarot.com` (будь-який пароль) | Автопреміум для Apple/Google review |

---

## Відомі умовні конвенції

- **Усі зміни в main-гілці** (без feature branch, без worktree) — див. `CLAUDE.md`
- **Bundle ID iOS з дефісом у кінці** — `com.matrixofsoul.myapp-` (не виправляти!)
- **Expo Go не підтримується** для нативних фіч (Firebase, RevenueCat, Apple/Google auth) — потрібен dev build або production build

---

*Оновлено: 2026-04-23*
