import { BasePage } from '../helpers/BasePage';

export class TarotPage extends BasePage {
  // ── Locators ───────────────────────────────────────────────────────────────

  readonly drawCardBtn  = 'tarot-draw-card-btn';
  readonly revealedCard = 'tarot-revealed-card';
  readonly historyBtn   = 'tarot-history-btn';

  // AI spread testIDs match route: tarot-spread-yesno, tarot-spread-person, etc.
  spreadBtn(route: 'yesno' | 'person' | 'period' | 'astro') {
    return `tarot-spread-${route}`;
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async waitForScreen() {
    await this.waitForVisible(this.drawCardBtn);
  }

  async tapDrawCard() {
    await this.tap(this.drawCardBtn);
  }

  async waitForRevealedCard() {
    await this.waitForVisible(this.revealedCard, this.LONG_TIMEOUT);
  }

  async tapSpread(route: 'yesno' | 'person' | 'period' | 'astro') {
    await this.tap(this.spreadBtn(route));
  }

  async tapHistory() {
    await this.tap(this.historyBtn);
  }

  async tapClassicSpread(name: string) {
    await this.tapText(name);
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertDrawButtonVisible() {
    await this.assertVisible(this.drawCardBtn);
  }

  async assertCardRevealed() {
    await this.assertVisible(this.revealedCard);
  }

  async assertSpreadButtonsVisible() {
    await this.assertVisible(this.spreadBtn('yesno'));
    await this.assertVisible(this.spreadBtn('person'));
  }
}
