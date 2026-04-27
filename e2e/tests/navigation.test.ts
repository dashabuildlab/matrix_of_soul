import { device } from 'detox';
import { LoginPage } from '../pages/LoginPage';

const login = new LoginPage();

const TABS = [
  { label: 'Сьогодні',  title: 'Сьогодні' },
  { label: 'Матриця',   title: 'Матриця' },
  { label: 'Таро',      title: 'Таро' },
  { label: 'AI Магія',  title: 'AI Магія' },
  { label: 'Профіль',   title: 'Профіль' },
];

beforeAll(async () => {
  await device.launchApp({ newInstance: true });
  await login.waitForScreen();
  await login.tapSkip();
  await login.waitForText('Сьогодні');
});

// ── Tab Navigation ────────────────────────────────────────────────────────────

describe('Navigation — tabs', () => {
  for (const tab of TABS) {
    it(`navigates to ${tab.label} tab`, async () => {
      await login.tapText(tab.label);
      await login.waitForText(tab.title);
    });
  }
});

// ── Back Navigation ───────────────────────────────────────────────────────────

describe('Navigation — back navigation', () => {
  it('matrix create → back returns to matrix tab', async () => {
    await login.tapText('Матриця');
    await login.waitForVisible('matrix-create-btn');
    await login.tap('matrix-create-btn');
    await login.waitForVisible('matrix-calculate-btn');
    await device.pressBack();
    await login.waitForVisible('matrix-create-btn');
  });

  it('paywall → close returns to previous screen', async () => {
    await login.tapText('AI Магія');
    await login.waitForText('AI Консультація');
    try { await login.tapText('Продовжити'); } catch {}
    await login.waitForVisible('ai-token-badge');
    await login.tap('ai-token-badge');
    await login.waitForVisible('paywall-close-btn');
    await login.tap('paywall-close-btn');
    await login.waitForGone('paywall-close-btn');
  });
});

// ── Deep Links / Direct Routes ────────────────────────────────────────────────

describe('Navigation — profile routes', () => {
  it('profile tab loads user profile', async () => {
    await login.tapText('Профіль');
    await login.waitForText('Профіль');
  });
});

// ── Reload Recovery ───────────────────────────────────────────────────────────

describe('Navigation — reload recovery', () => {
  it('app survives reload and shows login screen', async () => {
    await device.reloadReactNative();
    await login.waitForScreen();
  });

  it('after reload — guest skip works again', async () => {
    await device.reloadReactNative();
    await login.waitForScreen();
    await login.tapSkip();
    await login.waitForText('Сьогодні');
  });
});
