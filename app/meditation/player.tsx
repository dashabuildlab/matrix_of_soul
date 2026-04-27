import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Animated,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useAppStore } from '@/stores/useAppStore';
import { useI18n } from '@/lib/i18n';
import { trackFeatureUsed, FEATURES } from '@/lib/analytics';
import { MEDITATIONS } from '@/lib/staticData';

// ── Audio file mapping ─────────────────────────────────────────────
const AUDIO_FILES: Record<string, any> = {
  '1': require('../../assets/audio/meditation_1.mp3'),
  '2': require('../../assets/audio/meditation_2.mp3'),
  '3': require('../../assets/audio/meditation_3.mp3'),
  '4': require('../../assets/audio/meditation_4.mp3'),
  '5': require('../../assets/audio/meditation_5.mp3'),
  '6': require('../../assets/audio/meditation_6.mp3'),
  '7': require('../../assets/audio/meditation_7.mp3'),
  '8': require('../../assets/audio/meditation_8.mp3'),
};

const { width, height } = Dimensions.get('window');

// Waveform: 40 bars із фіксованими висотами (синусоїдний патерн)
const WAVE_HEIGHTS = [
  0.4, 0.6, 0.9, 0.5, 0.8, 0.35, 1.0, 0.6, 0.4, 0.75,
  0.5, 0.9, 0.3, 0.8, 0.55, 0.7, 0.4, 1.0, 0.6, 0.35,
  0.85, 0.5, 0.7, 0.4, 0.9, 0.6, 0.3, 0.8, 0.5, 0.65,
  0.9, 0.4, 0.7, 0.55, 1.0, 0.4, 0.8, 0.35, 0.6, 0.5,
];
const MAX_BAR_HEIGHT = 44;
const BAR_WIDTH = (width - Spacing.lg * 2 - 32) / WAVE_HEIGHTS.length - 2;

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec) % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function MeditationPlayerScreen() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();

  const med = MEDITATIONS.find((m) => m.id === id) ?? MEDITATIONS[0] ?? null;

  const audioSource = med ? AUDIO_FILES[med.id] : null;

  // ── expo-audio hooks ────────────────────────────────────────────
  const player = useAudioPlayer(audioSource, 0.25); // 250ms updates for smooth progress bar
  const status = useAudioPlayerStatus(player);
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;

    // Дозволяємо аудіо грати у фоні (коли застосунок згорнутий)
    setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldRouteThroughEarpiece: false,
    }).catch(() => {});

    return () => {
      isMountedRef.current = false;
      try { player.pause(); } catch {}
      // Вимикаємо фоновий режим при виході з плеєра
      setAudioModeAsync({
        staysActiveInBackground: false,
      }).catch(() => {});
    };
  }, []);

  const isPlaying = status.playing;
  const elapsed = status.currentTime ?? 0;
  const audioDuration = status.duration ?? 0;
  const totalDuration = audioDuration > 0 ? audioDuration : (med?.durationSec ?? 0);
  const progress = totalDuration > 0 ? elapsed / totalDuration : 0;

  const likedMeditations = useAppStore((s) => s.likedMeditations);
  const toggleLikedMeditation = useAppStore((s) => s.toggleLikedMeditation);
  const isFavorite = med ? likedMeditations.includes(med.id) : false;
  const [isMuted, setIsMuted] = useState(false);

  // ── Анімація waveform (3 фази) ──────────────────────────
  const phase1 = useRef(new Animated.Value(0.5)).current;
  const phase2 = useRef(new Animated.Value(0.5)).current;
  const phase3 = useRef(new Animated.Value(0.5)).current;
  const loopsRef = useRef<Animated.CompositeAnimation[]>([]);

  useEffect(() => {
    if (isPlaying) {
      const makeLoop = (anim: Animated.Value, delay: number) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, { toValue: 1.0, duration: 500, useNativeDriver: false }),
            Animated.timing(anim, { toValue: 0.25, duration: 500, useNativeDriver: false }),
          ])
        );
      const l1 = makeLoop(phase1, 0);
      const l2 = makeLoop(phase2, 170);
      const l3 = makeLoop(phase3, 340);
      loopsRef.current = [l1, l2, l3];
      l1.start(); l2.start(); l3.start();
    } else {
      loopsRef.current.forEach((l) => l.stop());
      Animated.parallel([
        Animated.timing(phase1, { toValue: 0.5, duration: 300, useNativeDriver: false }),
        Animated.timing(phase2, { toValue: 0.5, duration: 300, useNativeDriver: false }),
        Animated.timing(phase3, { toValue: 0.5, duration: 300, useNativeDriver: false }),
      ]).start();
    }
    return () => loopsRef.current.forEach((l) => l.stop());
  }, [isPlaying]);

  // ── Play / Pause ─────────────────────────────────────────
  const safePlayerCall = useCallback((fn: () => void) => {
    if (!isMountedRef.current) return;
    try { fn(); } catch {}
  }, []);

  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      safePlayerCall(() => player.pause());
    } else {
      safePlayerCall(() => player.play());
    }
  }, [isPlaying, player, safePlayerCall]);

  // Debounce refs — prevent track overlap from rapid tapping
  const skipDebounceRef = useRef(0);

  const skipBack = useCallback(() => {
    const now = Date.now();
    if (now - skipDebounceRef.current < 500) return;
    skipDebounceRef.current = now;
    const newPos = Math.max(0, elapsed - 15);
    safePlayerCall(() => player.seekTo(newPos));
  }, [elapsed, player, safePlayerCall]);

  const skipForward = useCallback(() => {
    const now = Date.now();
    if (now - skipDebounceRef.current < 500) return;
    skipDebounceRef.current = now;
    const newPos = Math.min(totalDuration, elapsed + 15);
    safePlayerCall(() => player.seekTo(newPos));
  }, [elapsed, totalDuration, player, safePlayerCall]);

  // ── Scrubbing ─────────────────────────────────────────────
  const trackWidthRef = useRef(0);
  const wasPlayingRef = useRef(false);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const seekTo = useCallback((locationX: number) => {
    const ratio = Math.max(0, Math.min(1, locationX / trackWidthRef.current));
    const newSec = Math.round(ratio * totalDuration);
    safePlayerCall(() => player.seekTo(newSec));
  }, [totalDuration, player, safePlayerCall]);

  const scrubResponder = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (e: any) => {
      wasPlayingRef.current = isPlaying;
      if (isPlaying) safePlayerCall(() => player.pause());
      setIsScrubbing(true);
      seekTo(e.nativeEvent.locationX);
    },
    onResponderMove: (e: any) => {
      seekTo(e.nativeEvent.locationX);
    },
    onResponderRelease: () => {
      setIsScrubbing(false);
      if (wasPlayingRef.current) safePlayerCall(() => player.play());
    },
  };

  // XP за завершену медитацію
  const addXP = useAppStore((s) => s.addXP);
  const xpAwardedRef = useRef(false);
  useEffect(() => {
    if (status.didJustFinish && !xpAwardedRef.current) {
      xpAwardedRef.current = true;
      addXP(15);
      trackFeatureUsed(FEATURES.MEDITATION, 'meditation', useAppStore.getState().isPremium ? 'premium' : 'free');
    }
  }, [status.didJustFinish]);

  const phases = [phase1, phase2, phase3];

  if (!med) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#06030F' }}>
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 16 }}>{locale === 'uk' ? 'Завантаження...' : 'Loading...'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* ── Космічний фон ── */}
      <LinearGradient
        colors={['#06030F', '#0D0720', '#130A2A']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Декоративні сфери фону */}
      <View style={[styles.bgOrb, { top: -80, left: -80, width: 220, height: 220, backgroundColor: med.artwork.accentColor + '12' }]} />
      <View style={[styles.bgOrb, { bottom: 100, right: -60, width: 180, height: 180, backgroundColor: med.artwork.accentColor + '10' }]} />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.85)" />
        </TouchableOpacity>
        <Text style={styles.headerLabel}>{t.meditationExtra.playing}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Основна картка (glassmorphism) ── */}
      <View style={styles.card}>
        {/* Золота рамка */}
        <LinearGradient
          colors={[med.artwork.accentColor + '60', 'transparent', med.artwork.accentColor + '30']}
          style={styles.cardBorder}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Artwork — унікальне на кожну медитацію */}
        <LinearGradient
          colors={med.artwork.gradient}
          style={styles.artwork}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Декоративний верхній орб */}
          <View style={[styles.artOrb, { backgroundColor: 'rgba(255,255,255,0.08)' }]} />

          {/* Декоративні зірки */}
          <View style={styles.sparkleTopLeft}>
            <Ionicons name="sparkles" size={14} color="rgba(255,255,255,0.5)" />
          </View>
          <View style={styles.sparkleTopRight}>
            <Ionicons name="star-outline" size={10} color="rgba(255,255,255,0.4)" />
          </View>

          {/* Головна ілюстрація */}
          <Text style={styles.artworkEmoji}>{med.artwork.emoji}</Text>

          {/* Декоративне кільце */}
          <View style={[styles.artRing, { borderColor: med.artwork.accentColor + '50' }]} />
        </LinearGradient>

        {/* Назва та опис */}
        <View style={styles.titleBlock}>
          <Text style={styles.medTitle}>{med.title.toUpperCase()}</Text>
          <Text style={styles.medSubtitle}>{med.subtitle}</Text>
          <Text style={styles.medGuide}>{t.meditationExtra.guidedBy(med.guide)}</Text>
        </View>

        {/* ── Waveform ── */}
        <View style={styles.waveformContainer}>
          <View style={styles.waveform}>
            {WAVE_HEIGHTS.map((h, i) => {
              const phaseAnim = phases[i % 3];
              const opacity = phaseAnim.interpolate({
                inputRange: [0.25, 1.0],
                outputRange: [isPlaying ? 0.25 : 0.5, 1.0],
              });
              const isBehindProgress = i / WAVE_HEIGHTS.length <= progress;
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.waveBar,
                    {
                      height: h * MAX_BAR_HEIGHT,
                      backgroundColor: isBehindProgress ? med.artwork.accentColor : 'rgba(255,255,255,0.25)',
                      opacity,
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* Прогрес лінія + повзунок — велика touch area */}
          <View
            style={styles.progressRow}
            onLayout={(e) => { trackWidthRef.current = e.nativeEvent.layout.width; }}
            {...scrubResponder}
          >
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(100, progress * 100)}%` as any,
                    backgroundColor: med.artwork.accentColor,
                  },
                ]}
              />
              <View
                style={[
                  styles.progressThumb,
                  {
                    left: `${Math.min(98, progress * 100)}%` as any,
                    backgroundColor: med.artwork.accentColor,
                    shadowColor: med.artwork.accentColor,
                    transform: [{ scale: isScrubbing ? 1.4 : 1 }],
                  },
                ]}
              />
            </View>
          </View>

          {/* Час */}
          <View style={styles.timeRow}>
            <Text style={styles.timeText}>{formatTime(elapsed)}</Text>
            <Text style={styles.timeText}>{formatTime(totalDuration)}</Text>
          </View>
        </View>

        {/* ── Контролі ── */}
        <View style={styles.controls}>
          {/* -15с */}
          <TouchableOpacity style={styles.skipBtn} onPress={skipBack}>
            <Ionicons name="play-back-outline" size={20} color="rgba(255,255,255,0.75)" />
            <Text style={styles.skipLabel}>15s</Text>
          </TouchableOpacity>

          {/* Play / Pause (велика золота кнопка) */}
          <TouchableOpacity
            style={styles.playBtnWrapper}
            onPress={togglePlayback}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[med.artwork.accentColor + 'DD', med.artwork.accentColor]}
              style={styles.playBtn}
            >
              <View style={styles.playBtnInner}>
                <Ionicons
                  name={isPlaying ? 'pause' : 'play'}
                  size={32}
                  color="#1A0A30"
                />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* +15с */}
          <TouchableOpacity style={styles.skipBtn} onPress={skipForward}>
            <Ionicons name="play-forward-outline" size={20} color="rgba(255,255,255,0.75)" />
            <Text style={styles.skipLabel}>15s</Text>
          </TouchableOpacity>
        </View>

        {/* ── Допоміжні дії ── */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => {
            const newMuted = !isMuted;
            setIsMuted(newMuted);
            try {
              if (player) {
                player.muted = newMuted;
                player.volume = newMuted ? 0.0 : 1.0;
              }
            } catch (e) {
              // Fallback: expo-audio v2 uses setVolume
              try { (player as any).setVolume?.(newMuted ? 0 : 1); } catch {}
            }
          }}>
            <Ionicons name={isMuted ? 'volume-mute-outline' : 'volume-medium-outline'} size={22} color="rgba(255,255,255,0.55)" />
          </TouchableOpacity>
          <View style={styles.freqBadge}>
            <Text style={styles.freqText}>{med.frequency}</Text>
          </View>
          <TouchableOpacity style={styles.actionBtn} onPress={() => med && toggleLikedMeditation(med.id)}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={22}
              color={isFavorite ? '#F472B6' : 'rgba(255,255,255,0.55)'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const CARD_WIDTH = width - Spacing.lg * 2;
const ARTWORK_SIZE = CARD_WIDTH - 48;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#06030F',
    paddingTop: 48,
  },

  bgOrb: {
    position: 'absolute',
    borderRadius: 999,
  },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.sm,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },

  // ── Card ─────────────────────────────────────────────────
  card: {
    marginHorizontal: Spacing.lg,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    overflow: 'hidden',
    padding: 24,
    gap: Spacing.lg,
    // Glassmorphism shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 12,
  },
  cardBorder: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: 28,
    opacity: 0.6,
  },

  // ── Artwork ───────────────────────────────────────────────
  artwork: {
    width: '100%',
    height: ARTWORK_SIZE * 0.55,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  artOrb: {
    position: 'absolute',
    top: -40,
    left: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  artRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1,
  },
  sparkleTopLeft: {
    position: 'absolute',
    top: 12,
    left: 16,
  },
  sparkleTopRight: {
    position: 'absolute',
    top: 16,
    right: 20,
  },
  artworkEmoji: {
    fontSize: 72,
    zIndex: 1,
  },

  // ── Title block ───────────────────────────────────────────
  titleBlock: {
    alignItems: 'center',
    gap: 4,
  },
  medTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  medSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    textAlign: 'center',
  },
  medGuide: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FontSize.xs,
    textAlign: 'center',
  },

  // ── Waveform ──────────────────────────────────────────────
  waveformContainer: {
    gap: 10,
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: MAX_BAR_HEIGHT,
    paddingHorizontal: 2,
  },
  waveBar: {
    width: BAR_WIDTH,
    borderRadius: 2,
    minHeight: 4,
  },
  progressRow: {
    position: 'relative',
    height: 32,          // велика touch area
    marginTop: 4,
    justifyContent: 'center',
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'visible',
    position: 'relative',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    top: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: -6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  timeText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  // ── Controls ──────────────────────────────────────────────
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  skipBtn: {
    alignItems: 'center',
    gap: 2,
  },
  skipLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 10,
    fontWeight: '700',
  },
  playBtnWrapper: {
    borderRadius: 36,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    // No elevation — card has overflow:hidden which conflicts with elevation
    // on Android, causing a persistent ripple artifact in the bottom-right corner
  },
  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBtnInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3, // optical center for play icon
  },

  // ── Actions row ───────────────────────────────────────────
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.xs,
  },
  actionBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  freqBadge: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  freqText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
