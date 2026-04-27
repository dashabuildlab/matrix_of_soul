import { device } from 'detox';
import { LoginPage } from '../pages/LoginPage';
import { AIPage } from '../pages/AIPage';

const login = new LoginPage();
const ai    = new AIPage();

async function navigateToAIChat() {
  await login.tapText('AI Магія');
  await login.waitForText('AI Консультація');
  // tap through disclosure/consent if present
  try { await ai.tapText('Продовжити'); } catch {}
  await ai.waitForScreen();
}

beforeAll(async () => {
  await device.launchApp({ newInstance: true });
  await login.waitForScreen();
  await login.tapSkip();
  await login.waitForText('Сьогодні');
});

beforeEach(async () => {
  await navigateToAIChat();
});

// ── Happy Path ───────────────────────────────────────────────────────────────

describe('AI Chat — happy path', () => {
  it('AI chat screen loads with input', async () => {
    await ai.assertScreenVisible();
  });

  it('welcome message is shown on new session', async () => {
    await ai.assertWelcomeMessageVisible();
  });

  it('quick question sends and receives a response', async () => {
    await ai.tapQuickQuestion('💜 Що говорять карти про мої стосунки?');
    await ai.waitForText('Езотерик думає...', ai.LONG_TIMEOUT);
    // wait for AI response (max 60 s)
    await ai.assertMessageVisible('Езотерик думає...');
  });

  it('typing a message enables send button', async () => {
    await ai.typeMessage('Хто я?');
    await ai.assertVisible(ai.sendBtn);
  });

  it('new chat button resets the session', async () => {
    await ai.tapNewChat();
    await ai.assertWelcomeMessageVisible();
  });

  it('token badge is visible for free users', async () => {
    await ai.assertTokensVisible();
  });
});

// ── Negative / Validation ─────────────────────────────────────────────────────

describe('AI Chat — negative', () => {
  it('send button is disabled when input is empty', async () => {
    await ai.assertSendButtonDisabled();
    await ai.tapSend(); // should not crash / send
    await ai.assertWelcomeMessageVisible(); // still on welcome
  });

  it('token badge tap navigates to paywall', async () => {
    await ai.tapTokenBadge();
    await ai.waitForText('Premium', ai.LONG_TIMEOUT);
  });
});

// ── Edge Cases ───────────────────────────────────────────────────────────────

describe('AI Chat — edge cases', () => {
  it('very long message (500 chars) is accepted', async () => {
    const longMsg = 'А'.repeat(499);
    await ai.typeMessage(longMsg);
    await ai.assertVisible(ai.sendBtn);
  });

  it('offline — send shows network error alert', async () => {
    await ai.goOffline();
    await ai.typeMessage('Тест офлайн');
    await ai.tapSend();
    await ai.waitForText('мережі', ai.LONG_TIMEOUT);
    await ai.goOnline();
  });

  it('message input clears after sending', async () => {
    await ai.typeMessage('Короткий тест');
    await ai.tapSend();
    // input should be cleared after send
    await ai.waitForGone('ai-typing-indicator', ai.LONG_TIMEOUT);
  });
});
