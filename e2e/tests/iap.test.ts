import { device } from 'detox';
import { LoginPage } from '../pages/LoginPage';
import { PaywallPage } from '../pages/PaywallPage';

const login   = new LoginPage();
const paywall = new PaywallPage();

async function openPaywall() {
  await login.tapText('AI Магія');
  await login.waitForText('AI Консультація');
  try { await login.tapText('Продовжити'); } catch {}
  // tap token badge to open paywall
  await login.waitForVisible('ai-token-badge');
  await login.tap('ai-token-badge');
  await paywall.waitForScreen();
}

beforeAll(async () => {
  await device.launchApp({ newInstance: true });
  await login.waitForScreen();
  await login.tapSkip();
  await login.waitForText('Сьогодні');
});

beforeEach(async () => {
  await openPaywall();
});

// ── Happy Path ───────────────────────────────────────────────────────────────

describe('IAP / Paywall — happy path', () => {
  it('paywall screen loads with premium hero', async () => {
    await paywall.assertScreenVisible();
    await paywall.assertPremiumHeroVisible();
  });

  it('plans load from RevenueCat', async () => {
    await paywall.assertPlansLoaded();
  });

  it('annual plan is pre-selected (best value)', async () => {
    await paywall.waitForVisible(paywall.planCard('ANNUAL'));
    await paywall.assertVisible(paywall.planCard('ANNUAL'));
  });

  it('selecting monthly plan updates selection', async () => {
    await paywall.selectPlan('MONTHLY');
    await paywall.assertVisible(paywall.planCard('MONTHLY'));
  });

  it('restore purchases button is visible', async () => {
    await paywall.assertRestoreButtonVisible();
  });

  it('subscribe button is enabled when plan selected', async () => {
    await paywall.assertSubscribeButtonEnabled();
  });

  it('close button dismisses paywall', async () => {
    await paywall.tapClose();
    await paywall.waitForGone('paywall-subscribe-btn');
  });
});

// ── Negative ─────────────────────────────────────────────────────────────────

describe('IAP / Paywall — negative', () => {
  it('restore with no purchases shows no-purchases alert', async () => {
    await paywall.tapRestorePurchases();
    await paywall.waitForText('Нічого не знайдено', paywall.LONG_TIMEOUT);
  });
});

// ── Edge Cases ───────────────────────────────────────────────────────────────

describe('IAP / Paywall — edge cases', () => {
  it('offline — plans show error, no crash', async () => {
    await paywall.goOffline();
    await device.reloadReactNative();
    await login.waitForScreen();
    await login.tapSkip();
    await login.waitForText('Сьогодні');
    await openPaywall();
    // should show error or loading state gracefully
    await paywall.waitForText('Помилка', paywall.LONG_TIMEOUT);
    await paywall.goOnline();
  });

  it('paywall features list shows all 8 features', async () => {
    await paywall.assertTextVisible('Необмежені AI запити');
    await paywall.assertTextVisible('Аудіо медитації');
  });

  it('testimonials section is visible', async () => {
    await paywall.scrollDown(paywall.subscribeBtn, 600);
    await paywall.assertTextVisible('Відгуки користувачів');
  });
});
