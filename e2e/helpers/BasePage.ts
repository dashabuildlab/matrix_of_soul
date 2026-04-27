import { by, element, expect, waitFor, device } from 'detox';

/**
 * Base class for all Page Objects.
 * Wraps common Detox interactions with meaningful timeouts and helpers.
 */
export abstract class BasePage {
  protected readonly DEFAULT_TIMEOUT = 10_000;
  protected readonly LONG_TIMEOUT    = 30_000;

  // ── Element helpers ────────────────────────────────────────────────────────

  protected el(testId: string) {
    return element(by.id(testId));
  }

  protected elByText(text: string) {
    return element(by.text(text));
  }

  protected elByLabel(label: string) {
    return element(by.label(label));
  }

  // ── Wait helpers ───────────────────────────────────────────────────────────

  async waitForVisible(testId: string, timeout = this.DEFAULT_TIMEOUT) {
    await waitFor(this.el(testId)).toBeVisible().withTimeout(timeout);
  }

  async waitForText(text: string, timeout = this.DEFAULT_TIMEOUT) {
    await waitFor(this.elByText(text)).toBeVisible().withTimeout(timeout);
  }

  async waitForGone(testId: string, timeout = this.DEFAULT_TIMEOUT) {
    await waitFor(this.el(testId)).not.toBeVisible().withTimeout(timeout);
  }

  // ── Action helpers ─────────────────────────────────────────────────────────

  async tap(testId: string) {
    await this.el(testId).tap();
  }

  async tapText(text: string) {
    await this.elByText(text).tap();
  }

  async typeText(testId: string, text: string) {
    await this.el(testId).clearText();
    await this.el(testId).typeText(text);
  }

  async scrollDown(testId: string, pixels = 300) {
    await this.el(testId).scroll(pixels, 'down');
  }

  async swipeLeft(testId: string) {
    await this.el(testId).swipe('left', 'fast', 0.8);
  }

  async swipeRight(testId: string) {
    await this.el(testId).swipe('right', 'fast', 0.8);
  }

  // ── Assertion helpers ──────────────────────────────────────────────────────

  async assertVisible(testId: string) {
    await expect(this.el(testId)).toBeVisible();
  }

  async assertNotVisible(testId: string) {
    await expect(this.el(testId)).not.toBeVisible();
  }

  async assertTextVisible(text: string) {
    await expect(this.elByText(text)).toBeVisible();
  }

  async assertHasText(testId: string, text: string) {
    await expect(this.el(testId)).toHaveText(text);
  }

  // ── Device helpers ─────────────────────────────────────────────────────────

  async reloadApp() {
    await device.reloadReactNative();
  }

  async launchFresh() {
    await device.launchApp({ newInstance: true, delete: true });
  }

  /** Simulate no network (iOS only via Simulator) */
  async goOffline() {
    await device.setURLBlacklist(['.*']);
  }

  async goOnline() {
    await device.setURLBlacklist([]);
  }
}
