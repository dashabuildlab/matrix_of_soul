/**
 * analysisGenerator — singleton background service that generates the full
 * AI PDF analysis of a Destiny Matrix section-by-section and stores the
 * progress in Zustand (survives app restart, tab switches, navigation).
 *
 * Design:
 *   • Only ONE generation runs at a time (guarded via `_running` flag).
 *   • Section texts are appended to `useAppStore.pendingAnalysis` as they
 *     complete. This lets the bottom banner show live progress and lets us
 *     resume generation after an app restart without re-calling Claude for
 *     sections already done.
 *   • Cancellation is cooperative — each section-attempt awaits Claude; we
 *     check the abort flag before scheduling the next one.
 *   • On success: status → 'ready' + local notification scheduled.
 *
 * Consumed by:
 *   • DownloadAnalysisButton    → calls `start(...)`
 *   • app/_layout.tsx           → calls `resume()` on app boot
 *   • AnalysisProgressBanner    → calls `cancel()` from the UI
 */

import { askClaude, ClaudeMessage } from './claude';
import {
  DOCUMENT_SECTIONS,
  getSystemPrompt,
} from './matrixDocument';
import { useAppStore } from '@/stores/useAppStore';
import { scheduleAnalysisReadyNotification } from './notifications';
import type { MatrixData } from './matrix-calc';

let _running = false;
let _cancelled = false;

/**
 * Whether a generation is currently running in this JS process.
 * Note: if the app was killed, this is `false` even if the Zustand
 * `pendingAnalysis.status === 'generating'` — that's what `resume()` handles.
 */
export function isGenerating(): boolean {
  return _running;
}

export interface StartAnalysisParams {
  matrixId: string;
  matrixName: string;
  matrixBirthDate: string;
  matrixData: MatrixData;
  locale: 'uk' | 'en';
}

/** Begin a fresh generation. If one is already running, this is a no-op. */
export async function startAnalysis(params: StartAnalysisParams): Promise<void> {
  if (_running) return;
  useAppStore.getState().startAnalysis({
    ...params,
    total: DOCUMENT_SECTIONS.length,
  });
  await _runLoop(0);
}

/**
 * Resume an in-progress generation after app restart. Looks at
 * `pendingAnalysis` in the store and continues from the first missing
 * section. No-op if:
 *   • nothing pending,
 *   • already ready/cancelled/error,
 *   • a generation is already running in this process.
 */
export async function resumeAnalysis(): Promise<void> {
  if (_running) return;
  const pending = useAppStore.getState().pendingAnalysis;
  if (!pending) return;
  if (pending.status !== 'generating') return;

  const startIndex = pending.completedSections.length;
  if (startIndex >= DOCUMENT_SECTIONS.length) {
    // All sections done but status was somehow still 'generating' — finalize.
    useAppStore.getState().markAnalysisReady();
    await scheduleAnalysisReadyNotification(pending.matrixId, pending.matrixName, pending.locale);
    return;
  }

  await _runLoop(startIndex);
}

/** Abort current generation. Safe to call even when nothing is running. */
export function cancelAnalysis(): void {
  _cancelled = true;
  useAppStore.getState().markAnalysisCancelled();
}

// ── Internal ───────────────────────────────────────────────────────────────

async function _runLoop(startIndex: number): Promise<void> {
  _running = true;
  _cancelled = false;
  const systemPrompt = getSystemPrompt();

  try {
    for (let i = startIndex; i < DOCUMENT_SECTIONS.length; i++) {
      if (_cancelled) return;

      const section = DOCUMENT_SECTIONS[i];

      // Read fresh pending on each iteration — the user could have cancelled
      // via the banner. Also needed for `matrixData`/`name` after restart.
      const pending = useAppStore.getState().pendingAnalysis;
      if (!pending || pending.status === 'cancelled') return;

      useAppStore.getState().setAnalysisCurrentSection(section.title);

      const prompt = section.buildPrompt(pending.matrixData, pending.matrixName);

      let text = '';
      let attempt = 0;
      // Per-section retry — up to 3 attempts with backoff
      while (true) {
        if (_cancelled) return;
        attempt++;
        try {
          text = await askClaude(
            systemPrompt,
            [] as ClaudeMessage[],
            prompt,
            section.maxTokens,
          );
          break;
        } catch (err: any) {
          const msg = err?.message ?? String(err);
          console.warn(`[analysisGenerator] section ${i + 1} attempt ${attempt} failed: ${msg}`);
          if (attempt >= 3) throw err;
          const backoff = attempt * 5000;
          await new Promise(r => setTimeout(r, backoff));
        }
      }

      if (_cancelled) return;

      useAppStore.getState().appendAnalysisSection({
        key: section.key,
        title: section.title,
        text,
      });
    }

    // All sections generated successfully
    useAppStore.getState().markAnalysisReady();

    const pending = useAppStore.getState().pendingAnalysis;
    if (pending) {
      await scheduleAnalysisReadyNotification(pending.matrixId, pending.matrixName, pending.locale);
    }
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.warn('[analysisGenerator] fatal error:', msg);
    useAppStore.getState().markAnalysisError(msg);
  } finally {
    _running = false;
  }
}
