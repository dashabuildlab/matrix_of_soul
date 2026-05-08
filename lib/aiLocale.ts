/**
 * lib/aiLocale.ts — language injection for AI system prompts.
 *
 * Single source of truth for telling Claude which language to respond in,
 * based on the user's selected app locale.
 *
 * USAGE:
 *   import { getLanguageInstruction, getLanguageName } from './aiLocale';
 *   const sysPrompt = `${baseSystemPrompt}\n\n${getLanguageInstruction(locale)}`;
 */

export type AppLocale =
  | 'en' | 'en-GB' | 'uk' | 'es' | 'zh' | 'ar' | 'de' | 'fr' | 'pt-BR';

/** Human-readable language names — what we tell Claude. */
const LANGUAGE_NAMES: Record<string, string> = {
  'en':    'English (American)',
  'en-GB': 'English (British)',
  'uk':    'Ukrainian (українська)',
  'es':    'Spanish — Latin American (español latinoamericano)',
  'zh':    'Simplified Chinese (简体中文)',
  'ar':    'Modern Standard Arabic (العربية الفصحى)',
  'de':    'German (Deutsch)',
  'fr':    'French (français)',
  'pt-BR': 'Brazilian Portuguese (português brasileiro)',
};

/**
 * Strict language instruction — used as the FINAL line of the system prompt
 * to override any prior hardcoded language hints in legacy prompts.
 *
 * Claude follows the most-recent and most-emphatic instruction, so we
 * append this to every system prompt. Bilingual fallback rule allows the
 * user to switch language mid-conversation by writing in another language.
 */
export function getLanguageInstruction(locale: string): string {
  const name = LANGUAGE_NAMES[locale] ?? LANGUAGE_NAMES['en'];

  return `CRITICAL LANGUAGE REQUIREMENT (overrides all prior instructions):
You MUST respond in ${name} for ALL responses, regardless of any other language hints earlier in this prompt.
The only exception: if the user explicitly writes their question in a different language, you may match THEIR language for that single response. Otherwise default to ${name}.
Do not mix languages within a single response. Do not include translations or parenthetical clarifications in other languages unless asked.`;
}

/** Short language name for UI/logging. */
export function getLanguageName(locale: string): string {
  return LANGUAGE_NAMES[locale] ?? LANGUAGE_NAMES['en'];
}

/** Native-language fallback strings used when an AI call fails — these go to the chat as the assistant message. */
export const AI_FALLBACK_MESSAGES: Record<string, string> = {
  'en':    'The Universe is silent. Please try rephrasing your question.',
  'en-GB': 'The Universe is silent. Please try rephrasing your question.',
  'uk':    'Всесвіт мовчить. Спробуйте перефразувати питання.',
  'es':    'El Universo está en silencio. Intenta reformular tu pregunta.',
  'zh':    '宇宙暂时沉默。请尝试换一种方式提问。',
  'ar':    'الكون صامت. حاول إعادة صياغة سؤالك.',
  'de':    'Das Universum schweigt. Versuche, deine Frage umzuformulieren.',
  'fr':    "L'Univers est silencieux. Essaie de reformuler ta question.",
  'pt-BR': 'O Universo está em silêncio. Tente reformular sua pergunta.',
};

export function getAIFallbackMessage(locale: string): string {
  return AI_FALLBACK_MESSAGES[locale] ?? AI_FALLBACK_MESSAGES['en'];
}

/** AI error alert title localized. */
export const AI_ERROR_TITLES: Record<string, string> = {
  'en':    'AI Error',
  'en-GB': 'AI Error',
  'uk':    'Помилка AI',
  'es':    'Error de IA',
  'zh':    'AI 错误',
  'ar':    'خطأ في الذكاء الاصطناعي',
  'de':    'KI-Fehler',
  'fr':    'Erreur IA',
  'pt-BR': 'Erro da IA',
};

export function getAIErrorTitle(locale: string): string {
  return AI_ERROR_TITLES[locale] ?? AI_ERROR_TITLES['en'];
}

/** Default chat session title in user's language. */
export const AI_DEFAULT_SESSION_TITLES: Record<string, string> = {
  'en':    'AI Consultation',
  'en-GB': 'AI Consultation',
  'uk':    'AI Консультація',
  'es':    'Consulta de IA',
  'zh':    'AI 咨询',
  'ar':    'استشارة الذكاء الاصطناعي',
  'de':    'KI-Beratung',
  'fr':    'Consultation IA',
  'pt-BR': 'Consulta de IA',
};

export function getDefaultSessionTitle(locale: string): string {
  return AI_DEFAULT_SESSION_TITLES[locale] ?? AI_DEFAULT_SESSION_TITLES['en'];
}

/** Chat welcome message in user's language. */
export const AI_WELCOME_MESSAGES: Record<string, string> = {
  'en':    'Hello! I am your personal AI Esoteric guide.\n\nI can help you:\n• Interpret Tarot cards\n• Analyze your Destiny Matrix\n• Answer questions about the future\n• Give advice on relationships and career\n\nAsk your question or pick a topic below',
  'en-GB': 'Hello! I am your personal AI Esoteric guide.\n\nI can help you:\n• Interpret Tarot cards\n• Analyse your Destiny Matrix\n• Answer questions about the future\n• Give advice on relationships and career\n\nAsk your question or pick a topic below',
  'uk':    'Вітаю! Я ваш особистий AI Езотерик.\n\nЯ можу допомогти вам:\n• Розтлумачити карти Таро\n• Проаналізувати вашу Матрицю Долі\n• Відповісти на питання про майбутнє\n• Дати поради щодо стосунків та кар\'єри\n\nПоставте своє питання або оберіть тему нижче',
  'es':    '¡Hola! Soy tu guía esotérico de IA personal.\n\nPuedo ayudarte a:\n• Interpretar cartas del Tarot\n• Analizar tu Matriz del Destino\n• Responder preguntas sobre el futuro\n• Dar consejos sobre relaciones y carrera\n\nHaz tu pregunta o elige un tema abajo',
  'zh':    '您好！我是您的个人 AI 玄学向导。\n\n我可以帮助您：\n• 解读塔罗牌\n• 分析您的命运矩阵\n• 回答关于未来的问题\n• 提供关于关系和事业的建议\n\n请提出您的问题或选择下方的主题',
  'ar':    'مرحبًا! أنا مرشدك الشخصي للروحانيات بالذكاء الاصطناعي.\n\nيمكنني مساعدتك في:\n• تفسير بطاقات التاروت\n• تحليل مصفوفة قدرك\n• الإجابة عن أسئلة حول المستقبل\n• تقديم النصائح حول العلاقات والمهنة\n\nاطرح سؤالك أو اختر موضوعًا أدناه',
  'de':    'Hallo! Ich bin dein persönlicher KI-Esoterik-Guide.\n\nIch kann dir helfen:\n• Tarot-Karten zu deuten\n• Deine Schicksalsmatrix zu analysieren\n• Fragen über die Zukunft zu beantworten\n• Ratschläge zu Beziehungen und Karriere zu geben\n\nStelle deine Frage oder wähle ein Thema unten',
  'fr':    'Bonjour ! Je suis ton guide ésotérique IA personnel.\n\nJe peux t\'aider à :\n• Interpréter les cartes de Tarot\n• Analyser ta Matrice du Destin\n• Répondre aux questions sur l\'avenir\n• Donner des conseils sur les relations et la carrière\n\nPose ta question ou choisis un sujet ci-dessous',
  'pt-BR': 'Olá! Eu sou seu guia esotérico de IA pessoal.\n\nPosso ajudar você a:\n• Interpretar cartas de Tarot\n• Analisar sua Matriz do Destino\n• Responder perguntas sobre o futuro\n• Dar conselhos sobre relacionamentos e carreira\n\nFaça sua pergunta ou escolha um tema abaixo',
};

export function getAIWelcomeMessage(locale: string): string {
  return AI_WELCOME_MESSAGES[locale] ?? AI_WELCOME_MESSAGES['en'];
}
