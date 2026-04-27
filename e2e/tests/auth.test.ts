import { device, expect as detoxExpect } from 'detox';
import { LoginPage } from '../pages/LoginPage';

const login = new LoginPage();

beforeAll(async () => {
  await device.launchApp({ newInstance: true });
});

beforeEach(async () => {
  await device.reloadReactNative();
  await login.waitForScreen();
});

// ── Happy Path ───────────────────────────────────────────────────────────────

describe('Auth — happy path', () => {
  it('shows login screen on cold start', async () => {
    await login.assertScreenVisible();
  });

  it('guest access — skip login navigates to main tabs', async () => {
    await login.tapSkip();
    await login.waitForText('Сьогодні');
  });

  it('register link navigates to register screen', async () => {
    await login.tapRegisterLink();
    await login.waitForText('Зареєструватися');
  });

  it('Google sign-in button is visible', async () => {
    await login.assertVisible(login.googleBtn);
  });

  it('Apple sign-in button is visible on iOS', async () => {
    if (device.getPlatform() === 'ios') {
      await login.assertVisible(login.appleBtn);
    }
  });
});

// ── Negative / Validation ────────────────────────────────────────────────────

describe('Auth — validation', () => {
  it('login with empty fields shows error alert', async () => {
    await login.tapLogin();
    await login.assertErrorVisible('Заповніть всі поля');
  });

  it('login with empty email shows error', async () => {
    await login.fillPassword('somepassword');
    await login.tapLogin();
    await login.assertErrorVisible('Заповніть всі поля');
  });

  it('login with empty password shows error', async () => {
    await login.fillEmail('test@example.com');
    await login.tapLogin();
    await login.assertErrorVisible('Заповніть всі поля');
  });

  it('login with wrong credentials shows auth error', async () => {
    await login.loginWith('wrong@example.com', 'wrongpassword');
    await login.assertErrorVisible('Помилка входу', login.LONG_TIMEOUT);
  });
});

// ── Edge Cases ───────────────────────────────────────────────────────────────

describe('Auth — edge cases', () => {
  it('password field masks input by default', async () => {
    await login.fillPassword('secret123');
    // secureTextEntry masks it — we verify by checking that text is not visible as-is
    await detoxExpect(login.el(login.passwordInput)).not.toHaveText('secret123');
  });

  it('email field is case-insensitive (autoCapitalize=none)', async () => {
    await login.fillEmail('Test@Example.com');
    await detoxExpect(login.el(login.emailInput)).toHaveText('Test@Example.com');
  });

  it('offline — login attempt shows network error', async () => {
    await login.goOffline();
    await login.loginWith('test@test.com', 'pass123');
    await login.assertErrorVisible('мережі');
    await login.goOnline();
  });
});
