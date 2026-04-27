import { BasePage } from '../helpers/BasePage';

export class LoginPage extends BasePage {
  // ── Locators ───────────────────────────────────────────────────────────────

  readonly emailInput    = 'login-email-input';
  readonly passwordInput = 'login-password-input';
  readonly submitBtn     = 'login-submit-btn';
  readonly skipBtn       = 'login-skip-btn';
  readonly appleBtn      = 'login-apple-btn';
  readonly googleBtn     = 'login-google-btn';
  readonly registerLink  = 'login-register-link';

  // ── Actions ────────────────────────────────────────────────────────────────

  async waitForScreen() {
    await this.waitForVisible(this.emailInput);
  }

  async fillEmail(email: string) {
    await this.typeText(this.emailInput, email);
  }

  async fillPassword(password: string) {
    await this.typeText(this.passwordInput, password);
  }

  async tapLogin() {
    await this.tap(this.submitBtn);
  }

  async tapSkip() {
    await this.tap(this.skipBtn);
  }

  async tapAppleSignIn() {
    await this.tap(this.appleBtn);
  }

  async tapGoogleSignIn() {
    await this.tap(this.googleBtn);
  }

  async tapRegisterLink() {
    await this.tap(this.registerLink);
  }

  async loginWith(email: string, password: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.tapLogin();
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertScreenVisible() {
    await this.assertVisible(this.emailInput);
    await this.assertVisible(this.passwordInput);
    await this.assertVisible(this.submitBtn);
  }

  async assertErrorVisible(errorText: string) {
    await this.waitForText(errorText, this.LONG_TIMEOUT);
  }
}
