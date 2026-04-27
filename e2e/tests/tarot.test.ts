import { device } from 'detox';
import { LoginPage } from '../pages/LoginPage';
import { TarotPage } from '../pages/TarotPage';

const login = new LoginPage();
const tarot = new TarotPage();

beforeAll(async () => {
  await device.launchApp({ newInstance: true });
  await login.waitForScreen();
  await login.tapSkip();
  await login.waitForText('Сьогодні');
  await login.tapText('Таро');
  await tarot.waitForScreen();
});

beforeEach(async () => {
  await login.tapText('Таро');
  await tarot.waitForScreen();
});

// ── Happy Path ───────────────────────────────────────────────────────────────

describe('Tarot — happy path', () => {
  it('tarot screen loads with draw button', async () => {
    await tarot.assertDrawButtonVisible();
  });

  it('draw daily card reveals a card', async () => {
    await tarot.tapDrawCard();
    await tarot.waitForRevealedCard();
    await tarot.assertCardRevealed();
  });

  it('yes/no spread navigates to yes/no screen', async () => {
    await tarot.tapSpread('yesno');
    await tarot.waitForText('Так чи Ні');
  });

  it('person spread navigates to person reading screen', async () => {
    await tarot.tapSpread('person');
    await tarot.waitForText('На Людину');
  });

  it('period spread navigates to period screen', async () => {
    await tarot.tapSpread('period');
    await tarot.waitForText('Прогноз');
  });

  it('astro spread navigates to astro screen', async () => {
    await tarot.tapSpread('astro');
    await tarot.waitForText('Астро');
  });

  it('three-card classic spread opens spread screen', async () => {
    await tarot.tapClassicSpread('Три Карти');
    await tarot.waitForText('Три Карти');
  });

  it('history button navigates to history screen', async () => {
    await tarot.tapHistory();
    await tarot.waitForText('Історія');
  });
});

// ── Edge Cases ───────────────────────────────────────────────────────────────

describe('Tarot — edge cases', () => {
  it('draw card button shows loading state during animation', async () => {
    await tarot.tapDrawCard();
    await tarot.waitForText('Відкриваю...');
  });

  it('after revealing card, new card button resets to draw state', async () => {
    await tarot.tapDrawCard();
    await tarot.waitForRevealedCard();
    await tarot.tapText('Нова Карта');
    await tarot.assertDrawButtonVisible();
  });

  it('all AI spread buttons are visible', async () => {
    await tarot.assertSpreadButtonsVisible();
  });

  it('learn tarot banner is visible', async () => {
    await tarot.scrollDown('tarot-draw-card-btn', 500);
    await tarot.assertTextVisible('Вивчити значення карт');
  });
});
