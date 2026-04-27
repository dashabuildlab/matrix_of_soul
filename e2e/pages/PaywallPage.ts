import { BasePage } from '../helpers/BasePage';

export class PaywallPage extends BasePage {
  // ── Locators ───────────────────────────────────────────────────────────────

  readonly closeBtn      = 'paywall-close-btn';
  readonly subscribeBtn  = 'paywall-subscribe-btn';
  readonly restoreBtn    = 'paywall-restore-btn';

  planCard(packageType: 'ANNUAL' | 'MONTHLY' | 'WEEKLY') {
    return `paywall-plan-${packageType}`;
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  async waitForScreen() {
    await this.waitForVisible(this.subscribeBtn, this.LONG_TIMEOUT);
  }

  async tapClose() {
    await this.tap(this.closeBtn);
  }

  async tapSubscribe() {
    await this.tap(this.subscribeBtn);
  }

  async tapRestorePurchases() {
    await this.tap(this.restoreBtn);
  }

  async selectPlan(packageType: 'ANNUAL' | 'MONTHLY' | 'WEEKLY') {
    await this.tap(this.planCard(packageType));
  }

  async scrollToSubscribeButton() {
    await this.scrollDown(this.subscribeBtn, 400);
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertScreenVisible() {
    await this.assertVisible(this.subscribeBtn);
  }

  async assertPremiumHeroVisible() {
    await this.assertTextVisible('PREMIUM');
  }

  async assertPlansLoaded() {
    await this.waitForVisible(this.planCard('ANNUAL'), this.LONG_TIMEOUT);
  }

  async assertRestoreButtonVisible() {
    await this.assertVisible(this.restoreBtn);
  }

  async assertSubscribeButtonEnabled() {
    await this.assertVisible(this.subscribeBtn);
  }
}
