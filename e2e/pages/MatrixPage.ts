import { BasePage } from '../helpers/BasePage';

export class MatrixPage extends BasePage {
  // ── Tab screen locators ────────────────────────────────────────────────────

  readonly tabScreen       = 'matrix-tab-screen';
  readonly createBtn       = 'matrix-create-btn';
  readonly compatibilityBtn= 'matrix-compatibility-btn';
  readonly dailyBtn        = 'matrix-daily-btn';
  readonly emptyState      = 'matrix-empty-state';

  // ── Create screen locators ─────────────────────────────────────────────────

  readonly nameInput       = 'matrix-name-input';
  readonly dayInput        = 'matrix-day-input';
  readonly monthInput      = 'matrix-month-input';
  readonly yearInput       = 'matrix-year-input';
  readonly calculateBtn    = 'matrix-calculate-btn';
  readonly resultSection   = 'matrix-result-section';
  readonly saveBtn         = 'matrix-save-btn';

  // ── Tab screen actions ─────────────────────────────────────────────────────

  async waitForTabScreen() {
    await this.waitForVisible(this.tabScreen);
  }

  async tapCreate() {
    await this.tap(this.createBtn);
  }

  async tapCompatibility() {
    await this.tap(this.compatibilityBtn);
  }

  async tapDailyMatrix() {
    await this.tap(this.dailyBtn);
  }

  // ── Create screen actions ──────────────────────────────────────────────────

  async waitForCreateScreen() {
    await this.waitForVisible(this.dayInput);
  }

  async fillDate(day: string, month: string, year: string) {
    await this.typeText(this.dayInput, day);
    await this.typeText(this.monthInput, month);
    await this.typeText(this.yearInput, year);
  }

  async fillName(name: string) {
    await this.typeText(this.nameInput, name);
  }

  async tapCalculate() {
    await this.tap(this.calculateBtn);
  }

  async tapSave() {
    await this.tap(this.saveBtn);
  }

  async waitForResult() {
    await this.waitForVisible(this.resultSection, this.LONG_TIMEOUT);
  }

  async createMatrix(name: string, day: string, month: string, year: string) {
    await this.fillName(name);
    await this.fillDate(day, month, year);
    await this.tapCalculate();
    await this.waitForResult();
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertTabScreenVisible() {
    await this.assertVisible(this.tabScreen);
  }

  async assertEmptyState() {
    await this.assertVisible(this.emptyState);
  }

  async assertResultVisible() {
    await this.assertVisible(this.resultSection);
  }

  async assertSavedMatrixVisible(name: string) {
    await this.assertTextVisible(name);
  }

  async assertValidationError() {
    await this.waitForText('Введіть коректну дату народження');
  }
}
