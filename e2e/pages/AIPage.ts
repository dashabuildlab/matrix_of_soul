import { BasePage } from '../helpers/BasePage';

export class AIPage extends BasePage {
  // ── Locators ───────────────────────────────────────────────────────────────

  readonly messagesScroll = 'ai-messages-scroll';
  readonly chatInput      = 'ai-chat-input';
  readonly sendBtn        = 'ai-chat-send-btn';
  readonly newChatBtn     = 'ai-new-chat-btn';
  readonly tokenBadge     = 'ai-token-badge';

  // ── Actions ────────────────────────────────────────────────────────────────

  async waitForScreen() {
    await this.waitForVisible(this.chatInput, this.LONG_TIMEOUT);
  }

  async typeMessage(text: string) {
    await this.typeText(this.chatInput, text);
  }

  async tapSend() {
    await this.tap(this.sendBtn);
  }

  async sendMessage(text: string) {
    await this.typeMessage(text);
    await this.tapSend();
  }

  async tapNewChat() {
    await this.tap(this.newChatBtn);
  }

  async tapQuickQuestion(text: string) {
    await this.tapText(text);
  }

  async tapTokenBadge() {
    await this.tap(this.tokenBadge);
  }

  async waitForAIResponse(timeout = this.LONG_TIMEOUT) {
    await this.waitForGone('ai-typing-indicator', timeout);
  }

  // ── Assertions ─────────────────────────────────────────────────────────────

  async assertScreenVisible() {
    await this.assertVisible(this.chatInput);
    await this.assertVisible(this.messagesScroll);
  }

  async assertMessageVisible(text: string) {
    await this.waitForText(text, this.LONG_TIMEOUT);
  }

  async assertWelcomeMessageVisible() {
    await this.waitForText('AI Езотерик', this.LONG_TIMEOUT);
  }

  async assertTokensVisible() {
    await this.assertVisible(this.tokenBadge);
  }

  async assertSendButtonDisabled() {
    await this.assertVisible(this.sendBtn);
  }
}
