/**
 * app/matrix/analysis.tsx — the Analysis Ready screen.
 *
 * Navigation: /matrix/analysis?id=<matrixId>
 *   • Opens from AnalysisReadyToast tap,
 *   • Opens from analysis-ready local notification (see app/_layout.tsx),
 *   • Opens from AnalysisProgressBanner (while generating).
 *
 * Behaviour per pendingAnalysis.status:
 *   generating  → "Generation in progress" hero + progress readout,
 *                 user can cancel or leave; banner follows them on other screens.
 *   ready       → "Your analysis is ready" hero + big download CTA;
 *                 tap Download → fullscreen video overlay (~5–15 s) while HTML
 *                 is rendered to PDF by expo-print, then native Share Sheet.
 *   error       → error message + Retry button.
 *   (no state)  → fallback "Nothing to show" with back button.
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Platform, Dimensions, ActivityIndicator,
} from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { StarBackground } from '@/components/ui/StarBackground';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import { useI18n } from '@/lib/i18n';
import { cancelAnalysis, startAnalysis } from '@/lib/analysisGenerator';
import { buildDocumentHTML } from '@/lib/matrixDocument';
import { trackFeatureUsed, FEATURES } from '@/lib/analytics';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// Safe wrapper — native video-player objects can be released while JS still
// holds the reference (same pattern used in DownloadAnalysisButton).
const safePlayer = (fn: () => void) => { try { fn(); } catch {} };

export default function AnalysisScreen() {
  const { t, locale } = useI18n();
  const isUk = locale === 'uk';
  const { id } = useLocalSearchParams<{ id?: string }>();

  const pending = useAppStore((s) => s.pendingAnalysis);
  const savedMatrices = useAppStore((s) => s.savedMatrices);
  const clearPendingAnalysis = useAppStore((s) => s.clearPendingAnalysis);

  // The screen is driven by pendingAnalysis if the matrixId matches.
  const analysis = pending && (!id || pending.matrixId === id) ? pending : null;

  // Short video overlay — only while the PDF is being rendered (5–15 s).
  const [pdfVideoVisible, setPdfVideoVisible] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  const videoPlayer = useVideoPlayer(require('../../assets/matrix_create.mp4'), (p) => {
    p.loop = true;
    p.muted = true;
    p.volume = 0.2;
  });

  // Wait flag for video-end (so we don't abruptly cut the video once PDF is done).
  const pdfStartedAtRef = useRef<number>(0);

  const handleDownload = async () => {
    if (!analysis || analysis.status !== 'ready') return;

    setPdfError(null);
    setPdfVideoVisible(true);
    pdfStartedAtRef.current = Date.now();
    safePlayer(() => {
      videoPlayer.currentTime = 0;
      videoPlayer.play();
    });

    try {
      const html = buildDocumentHTML(
        analysis.matrixName,
        analysis.matrixBirthDate,
        analysis.matrixData,
        analysis.completedSections.map((s) => s.text),
      );
      const { uri } = await Print.printToFileAsync({ html, base64: false });

      // Rename to a meaningful filename
      const safeName = analysis.matrixName.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ0-9]/g, '_').replace(/_+/g, '_');
      const pdfName = `Матриця_Долі_${safeName}.pdf`;
      let finalUri = uri;
      try {
        const FileSystem = require('expo-file-system') as typeof import('expo-file-system');
        const dir = uri.substring(0, uri.lastIndexOf('/') + 1);
        const newUri = dir + pdfName;
        await FileSystem.moveAsync({ from: uri, to: newUri });
        finalUri = newUri;
      } catch {}

      // Ensure video plays at least ~2 s for a calm UX (feels less flash-y)
      const elapsed = Date.now() - pdfStartedAtRef.current;
      if (elapsed < 2000) await new Promise((r) => setTimeout(r, 2000 - elapsed));

      // Close video BEFORE opening share sheet — avoids overlap on iOS
      safePlayer(() => videoPlayer.pause());
      setPdfVideoVisible(false);

      // Small delay so the modal finishes dismissing before the share sheet
      await new Promise((r) => setTimeout(r, 250));

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(finalUri, {
          mimeType: 'application/pdf',
          dialogTitle: `Матриця Долі — ${analysis.matrixName}`,
          UTI: 'com.adobe.pdf',
        });
      }

      trackFeatureUsed(FEATURES.PDF_ANALYSIS, 'matrix', 'premium');
    } catch (err: any) {
      safePlayer(() => videoPlayer.pause());
      setPdfVideoVisible(false);
      setPdfError(err?.message ?? String(err));
    }
  };

  // ── Retry after error ────────────────────────────────────────────────────
  const handleRetry = () => {
    if (!analysis) return;
    // Re-kick generation from the start (or from whatever sections already exist)
    startAnalysis({
      matrixId: analysis.matrixId,
      matrixName: analysis.matrixName,
      matrixBirthDate: analysis.matrixBirthDate,
      matrixData: analysis.matrixData,
      locale: analysis.locale,
    });
  };

  const handleCancel = () => {
    cancelAnalysis();
    setTimeout(() => clearPendingAnalysis(), 400);
    router.back();
  };

  const handleClose = () => router.back();

  // ── No analysis for this matrix: fallback ────────────────────────────────
  if (!analysis) {
    return (
      <StarBackground style={styles.root}>
        <ScrollView contentContainerStyle={styles.contentCenter}>
          <View style={styles.hero}>
            <View style={styles.iconCircleMuted}>
              <Ionicons name="document-text-outline" size={44} color="rgba(255,255,255,0.5)" />
            </View>
            <Text style={styles.heroTitle}>
              {isUk ? 'Немає активного аналізу' : 'No active analysis'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {isUk
                ? 'Запустіть генерацію з екрану матриці.'
                : 'Start a generation from the matrix screen.'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.secondaryBtnWrap}>
              <Text style={styles.secondaryBtnText}>
                {isUk ? 'Назад' : 'Go back'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </StarBackground>
    );
  }

  // ── Ready state — main happy path ───────────────────────────────────────
  if (analysis.status === 'ready') {
    return (
      <StarBackground style={styles.root}>
        <TouchableOpacity onPress={handleClose} style={styles.closeTopBtn}>
          <Ionicons name="close" size={22} color={Colors.textMuted} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.heroReady}>
            <View style={styles.iconCircleAccent}>
              <Ionicons name="sparkles" size={44} color={Colors.accent} />
            </View>
            <Text style={styles.heroLabel}>
              {isUk ? 'ГОТОВО' : 'READY'}
            </Text>
            <Text style={styles.heroTitle}>
              {isUk ? 'Ваш детальний аналіз' : 'Your detailed analysis'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {isUk
                ? `Персональний AI-розбір вашої Матриці Долі з ${analysis.total} розділів, для "${analysis.matrixName}".`
                : `Personal AI breakdown of your Destiny Matrix across ${analysis.total} sections, for "${analysis.matrixName}".`}
            </Text>
          </View>

          {/* Sections preview */}
          <View style={styles.sectionsCard}>
            <Text style={styles.sectionsTitle}>
              {isUk ? 'Розділи документу' : 'Document sections'}
            </Text>
            {analysis.completedSections.map((sec, i) => (
              <View key={sec.key} style={styles.sectionRow}>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{i + 1}</Text>
                </View>
                <Text style={styles.sectionLabel}>{sec.title}</Text>
                <Ionicons name="checkmark" size={16} color="#4ADE80" />
              </View>
            ))}
          </View>

          <View style={styles.hintCard}>
            <Ionicons name="information-circle-outline" size={18} color={Colors.accent} />
            <Text style={styles.hintText}>
              {isUk
                ? 'Це великий документ (~25-35 сторінок) — глибокий персональний погляд на те, ким ти є. Збережи на пристрій або поділись.'
                : 'This is a large document (~25-35 pages) — a deep personal view of who you are. Save it to your device or share.'}
            </Text>
          </View>

          {pdfError && (
            <View style={styles.errorHint}>
              <Ionicons name="alert-circle-outline" size={16} color="#F87171" />
              <Text style={styles.errorHintText}>
                {isUk ? `Помилка: ${pdfError}` : `Error: ${pdfError}`}
              </Text>
            </View>
          )}

          {/* Download button */}
          <TouchableOpacity activeOpacity={0.82} onPress={handleDownload} style={styles.primaryBtnWrap}>
            <LinearGradient
              colors={['#C8901A', '#F5C542', '#C8901A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Ionicons name="download-outline" size={20} color="#1A0A00" />
              <Text style={styles.primaryBtnText}>
                {isUk ? 'Завантажити PDF' : 'Download PDF'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>

        {/* PDF rendering overlay (short ~5–15 s) */}
        <Modal visible={pdfVideoVisible} transparent={false} animationType="fade" statusBarTranslucent>
          <View style={styles.videoOverlay}>
            <VideoView
              player={videoPlayer}
              style={styles.videoFull}
              contentFit="cover"
              nativeControls={false}
            />
            <LinearGradient
              colors={['rgba(5,2,20,0.35)', 'rgba(5,2,20,0.7)', 'rgba(5,2,20,0.95)']}
              locations={[0, 0.6, 1]}
              style={styles.videoFull}
            />
            <View style={styles.videoLabelWrap}>
              <ActivityIndicator size="large" color={Colors.accent} style={{ marginBottom: 16 }} />
              <Text style={styles.videoTitle}>
                {isUk ? 'Формуємо документ...' : 'Preparing document...'}
              </Text>
              <Text style={styles.videoSubtitle}>
                {isUk
                  ? 'Ще кілька секунд і відкриється меню збереження'
                  : 'Just a few seconds, then the save menu will open'}
              </Text>
            </View>
          </View>
        </Modal>
      </StarBackground>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (analysis.status === 'error') {
    return (
      <StarBackground style={styles.root}>
        <TouchableOpacity onPress={handleClose} style={styles.closeTopBtn}>
          <Ionicons name="close" size={22} color={Colors.textMuted} />
        </TouchableOpacity>

        <ScrollView contentContainerStyle={styles.contentCenter}>
          <View style={styles.hero}>
            <View style={styles.iconCircleError}>
              <Ionicons name="alert-circle" size={44} color="#F87171" />
            </View>
            <Text style={styles.heroTitle}>
              {isUk ? 'Не вдалося згенерувати' : 'Generation failed'}
            </Text>
            <Text style={styles.heroSubtitle}>
              {analysis.error || (isUk
                ? 'Сталася помилка. Перевір інтернет і спробуй ще раз.'
                : 'An error occurred. Check your connection and try again.')}
            </Text>

            <TouchableOpacity onPress={handleRetry} activeOpacity={0.82} style={[styles.primaryBtnWrap, { marginTop: Spacing.lg }]}>
              <LinearGradient
                colors={['#C8901A', '#F5C542', '#C8901A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <Ionicons name="refresh" size={18} color="#1A0A00" />
                <Text style={styles.primaryBtnText}>
                  {isUk ? 'Спробувати знову' : 'Try again'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { clearPendingAnalysis(); router.back(); }} style={styles.secondaryBtnWrap}>
              <Text style={styles.secondaryBtnText}>
                {isUk ? 'Відхилити' : 'Dismiss'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </StarBackground>
    );
  }

  // ── Generating / cancelled — progress view ───────────────────────────────
  const done = analysis.progress;
  const total = analysis.total;
  const ratio = total > 0 ? done / total : 0;

  return (
    <StarBackground style={styles.root}>
      <TouchableOpacity onPress={handleClose} style={styles.closeTopBtn}>
        <Ionicons name="close" size={22} color={Colors.textMuted} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.iconCircleAccent}>
            <ActivityIndicator size="large" color={Colors.accent} />
          </View>
          <Text style={styles.heroLabel}>
            {isUk ? 'ГОТУЄТЬСЯ' : 'IN PROGRESS'}
          </Text>
          <Text style={styles.heroTitle}>
            {isUk ? 'Ваш аналіз формується' : 'Your analysis is generating'}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isUk
              ? 'Це триває до 10 хвилин. Можна закрити цей екран або весь застосунок — ми сповістимо, коли буде готово.'
              : 'This takes up to 10 minutes. Feel free to close this screen or the app — we\'ll notify you when ready.'}
          </Text>
        </View>

        {/* Progress */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {isUk ? 'Прогрес' : 'Progress'}
            </Text>
            <Text style={styles.progressCounter}>{done}/{total}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${ratio * 100}%` }]} />
          </View>
          {analysis.currentSectionTitle && (
            <Text style={styles.progressCurrent}>
              {isUk ? 'Зараз: ' : 'Now: '}
              <Text style={styles.progressCurrentAccent}>{analysis.currentSectionTitle}</Text>
            </Text>
          )}
        </View>

        {/* Section checklist */}
        <View style={styles.sectionsCard}>
          {analysis.completedSections.map((sec, i) => (
            <View key={sec.key} style={styles.sectionRow}>
              <View style={[styles.sectionBadge, styles.sectionBadgeDone]}>
                <Ionicons name="checkmark" size={12} color="#1A0A00" />
              </View>
              <Text style={[styles.sectionLabel, styles.sectionLabelDone]}>{sec.title}</Text>
            </View>
          ))}
          {analysis.completedSections.length < total && analysis.currentSectionTitle && (
            <View style={styles.sectionRow}>
              <View style={[styles.sectionBadge, styles.sectionBadgeActive]}>
                <ActivityIndicator size="small" color={Colors.accent} />
              </View>
              <Text style={[styles.sectionLabel, styles.sectionLabelActive]}>
                {analysis.currentSectionTitle}
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity onPress={handleCancel} style={styles.cancelBtn}>
          <Ionicons name="close-circle-outline" size={18} color="#F87171" />
          <Text style={styles.cancelBtnText}>
            {isUk ? 'Скасувати генерацію' : 'Cancel generation'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </StarBackground>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  closeTopBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 18,
    right: Spacing.md,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 100,
    paddingBottom: 40,
  },
  contentCenter: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
  },

  // Hero
  hero: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroReady: {
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  iconCircleAccent: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(245,197,66,0.12)',
    borderWidth: 2,
    borderColor: 'rgba(245,197,66,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F5C542',
    shadowOpacity: 0.35,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 0 },
  },
  iconCircleMuted: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleError: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(248,113,113,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: -Spacing.xs,
  },
  heroTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
    lineHeight: 34,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
  },

  // Sections card (list of titles)
  sectionsCard: {
    backgroundColor: 'rgba(25,12,55,0.6)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    marginBottom: Spacing.md,
  },
  sectionsTitle: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  sectionBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBadgeDone: {
    backgroundColor: '#F5C542',
    borderColor: '#F5C542',
  },
  sectionBadgeActive: {
    backgroundColor: 'rgba(245,197,66,0.15)',
    borderColor: Colors.accent,
  },
  sectionBadgeText: {
    color: Colors.accent,
    fontSize: 11,
    fontWeight: '800',
  },
  sectionLabel: {
    flex: 1,
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  sectionLabelDone: {
    color: 'rgba(255,255,255,0.5)',
  },
  sectionLabelActive: {
    color: Colors.text,
    fontWeight: '600',
  },

  // Hint card
  hintCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: 'rgba(245,197,66,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,197,66,0.2)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  hintText: {
    flex: 1,
    color: 'rgba(255,255,255,0.75)',
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  // Progress card
  progressCard: {
    backgroundColor: 'rgba(25,12,55,0.6)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(245,197,66,0.2)',
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  progressCounter: {
    color: Colors.accent,
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: Colors.accent,
  },
  progressCurrent: {
    marginTop: Spacing.sm,
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
  },
  progressCurrentAccent: {
    color: Colors.accent,
    fontWeight: '700',
  },

  // Error hint
  errorHint: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: 'rgba(248,113,113,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  errorHintText: {
    flex: 1,
    color: '#FCA5A5',
    fontSize: FontSize.sm,
  },

  // Buttons
  primaryBtnWrap: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#F5C542',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: Spacing.xl,
  },
  primaryBtnText: {
    color: '#1A0A00',
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  secondaryBtnWrap: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  secondaryBtnText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    textDecorationLine: 'underline',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    alignSelf: 'center',
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    marginTop: Spacing.md,
  },
  cancelBtnText: {
    color: '#F87171',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  // PDF overlay video
  videoOverlay: {
    flex: 1,
    width: SCREEN_W,
    height: SCREEN_H,
    backgroundColor: '#050214',
  },
  videoFull: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_W,
    height: SCREEN_H,
  },
  videoLabelWrap: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  videoTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
    textShadowColor: 'rgba(139,92,246,0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  videoSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    textAlign: 'center',
  },
});
