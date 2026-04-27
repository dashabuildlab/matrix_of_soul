/**
 * Auth error → user-friendly message (UA/EN).
 * Shared between native (`firebaseAuth.ts`) and web (`firebaseAuth.web.ts`).
 */
export function getAuthErrorMessage(
  errorOrCode: string | { code?: string; message?: string } | null | undefined,
  isUk: boolean,
): string {
  const code = typeof errorOrCode === 'string'
    ? errorOrCode
    : errorOrCode?.code ?? '';
  const rawMessage = typeof errorOrCode === 'string'
    ? ''
    : errorOrCode?.message ?? '';

  const msgs: Record<string, { uk: string; en: string }> = {
    'auth/email-already-in-use':          { uk: 'Ця пошта вже зареєстрована',              en: 'This email is already registered' },
    'auth/invalid-email':                 { uk: 'Невірний формат email',                   en: 'Invalid email format' },
    'auth/weak-password':                 { uk: 'Пароль занадто слабкий (мін. 6 символів)', en: 'Password too weak (min. 6 chars)' },
    'auth/user-not-found':                { uk: 'Акаунт з такою поштою не знайдено',        en: 'No account found with this email' },
    'auth/wrong-password':                { uk: 'Невірний пароль',                          en: 'Incorrect password' },
    'auth/invalid-credential':            { uk: 'Невірний email або пароль',                en: 'Invalid email or password' },
    'auth/too-many-requests':             { uk: 'Забагато спроб. Спробуйте пізніше',        en: 'Too many attempts. Try again later' },
    'auth/network-request-failed':        { uk: 'Немає з\'єднання з інтернетом',            en: 'No internet connection' },
    'auth/user-disabled':                 { uk: 'Акаунт заблоковано',                       en: 'Account has been disabled' },
    'auth/operation-not-allowed':         { uk: 'Вхід через email/пароль не підтримується', en: 'Email/password sign-in is not enabled' },
    'auth/account-exists-with-different-credential': { uk: 'Ця пошта вже прив\'язана до іншого методу входу', en: 'This email is linked to a different sign-in method' },
    'auth/requires-recent-login':         { uk: 'Будь ласка, увійдіть знову',               en: 'Please sign in again to continue' },
    'auth/popup-closed-by-user':          { uk: 'Вікно входу було закрито',                  en: 'Sign-in window was closed' },
    'auth/popup-blocked':                 { uk: 'Браузер заблокував popup. Дозвольте pop-ups для сайту.', en: 'Browser blocked the popup. Allow pop-ups for this site.' },
    'auth/cancelled-popup-request':       { uk: 'Запит скасовано',                           en: 'Request was cancelled' },
    'auth/unauthorized-domain':           { uk: 'Домен не авторизований у Firebase. Додайте його в Authentication → Settings.', en: 'Domain not authorized in Firebase. Add it in Authentication → Settings.' },
    'auth/expired-action-code':           { uk: 'Посилання застаріло',                        en: 'Link has expired' },
    'auth/invalid-action-code':           { uk: 'Невірне посилання',                          en: 'Invalid link' },
    'auth/missing-email':                 { uk: 'Введіть email',                              en: 'Please enter an email' },
    'auth/quota-exceeded':                { uk: 'Перевищено ліміт запитів',                  en: 'Request quota exceeded' },
    'auth/app-not-authorized':            { uk: 'Додаток не авторизований',                  en: 'App not authorized for Firebase' },
    'auth/invalid-api-key':               { uk: 'Помилка конфігурації',                      en: 'Configuration error' },
    'auth/internal-error':                { uk: 'Внутрішня помилка. Спробуйте ще раз.',      en: 'Internal error. Please try again.' },
  };

  const found = msgs[code];
  if (found) return isUk ? found.uk : found.en;

  const detail = code || rawMessage || '';
  const suffix = detail ? `\n\n${detail}` : '';
  return isUk
    ? `Щось пішло не так. Спробуйте ще раз.${suffix}`
    : `Something went wrong. Please try again.${suffix}`;
}
