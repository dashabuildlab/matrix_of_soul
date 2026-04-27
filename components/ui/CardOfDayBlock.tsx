import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image,
  Dimensions, Animated, Easing, Vibration, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getTarotImageSource } from '@/constants/tarotImages';
import type { TarotCard } from '@/constants/tarotData';
import { Spacing, FontSize, BorderRadius } from '@/constants/theme';

const { width } = Dimensions.get('window');
const CARD_W  = Math.min(width * 0.50, 215);
const CARD_H  = CARD_W * 1.65;
const SCENE_W = width;

// ── Component ───────────────────────────────────────────────────────────────
interface Props { card: TarotCard; isUk: boolean }

export function CardOfDayBlock({ card, isUk }: Props) {
  const router  = useRouter();
  const opened  = useRef(false);
  const [isOpen, setIsOpen] = useState(false);

  const cardName = isUk ? card.nameUk : card.name;
  const keywords = (isUk ? card.keywords : card.keywordsEn ?? card.keywords).slice(0, 3).join(' · ');
  const advice   = isUk ? card.advice  : card.adviceEn  ?? card.advice;

  // ── Animation values (all native driver) ─────────────────────────────
  const glowOpacity   = useRef(new Animated.Value(0.55)).current;
  const ctaOpacity    = useRef(new Animated.Value(0)).current;
  const ctaScale      = useRef(new Animated.Value(1)).current;
  const tapScale      = useRef(new Animated.Value(1)).current;
  const sceneOpacity  = useRef(new Animated.Value(0)).current;
  const cardScaleX    = useRef(new Animated.Value(0)).current;  // scaleX flip
  const titleOpacity  = useRef(new Animated.Value(0)).current;
  const titleScale    = useRef(new Animated.Value(0.85)).current;
  const textOpacity   = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(12)).current;

  // ── Idle animation ────────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(ctaOpacity, {
      toValue: 1, duration: 800, delay: 400,
      easing: Easing.out(Easing.ease), useNativeDriver: true,
    }).start(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(ctaScale, { toValue: 1.06, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(ctaScale, { toValue: 1.0,  duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  // ── Open animations ───────────────────────────────────────────────────
  const runOpenAnimations = () => {
    // Scene fade in
    Animated.timing(sceneOpacity, {
      toValue: 1, duration: 300, useNativeDriver: true,
    }).start();

    // scaleX reveal: 0 → 1 (replaces rotateY flip — much lighter on GPU)
    Animated.sequence([
      Animated.delay(150),
      Animated.spring(cardScaleX, {
        toValue: 1, tension: 70, friction: 9, useNativeDriver: true,
      }),
    ]).start();

    // Title fade+scale
    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, duration: 500, delay: 450, useNativeDriver: true }),
      Animated.spring(titleScale,   { toValue: 1, tension: 60, friction: 9, delay: 450, useNativeDriver: true }),
    ]).start();

    // Text slide up
    Animated.parallel([
      Animated.timing(textOpacity,   { toValue: 1, duration: 500, delay: 700, useNativeDriver: true }),
      Animated.spring(textTranslate, { toValue: 0, tension: 50, friction: 10, delay: 700, useNativeDriver: true }),
    ]).start();
  };

  // ── Handle tap on closed card ─────────────────────────────────────────
  const handlePress = () => {
    if (opened.current) return;
    opened.current = true;

    if (Platform.OS === 'android') {
      Vibration.vibrate(40);
    } else {
      Vibration.vibrate();
    }

    Animated.parallel([
      Animated.sequence([
        Animated.timing(tapScale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
        Animated.timing(tapScale, { toValue: 1.0,  duration: 150, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      ]),
      Animated.timing(glowOpacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => {
      setIsOpen(true);
      runOpenAnimations();
    });
  };

  // ── Render ───────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>

      {/* ══════════════════════════════════════════
          CLOSED STATE — levitating card + glow + CTA
          ══════════════════════════════════════════ */}
      {!isOpen && (
        <TouchableOpacity onPress={handlePress} activeOpacity={1}>
          <View style={styles.idleWrap}>

            {/* Glow ring — GPU cached */}
            <Animated.View
              renderToHardwareTextureAndroid
              shouldRasterizeIOS
              style={[styles.glowRing, { opacity: glowOpacity }]}
            />

            {/* Card back face */}
            <Animated.View
              renderToHardwareTextureAndroid
              shouldRasterizeIOS
              style={[styles.cardFace, { transform: [{ scale: tapScale }] }]}
            >
              <LinearGradient
                colors={['#0A0520', '#1E0A50', '#2D1070', '#1E0A50', '#0A0520']}
                locations={[0, 0.25, 0.5, 0.75, 1]}
                style={styles.backGradient}
              >
                <Text style={styles.backTopStar}>✦</Text>
                <Text style={styles.backSymbol}>⊛</Text>
                <Text style={styles.backMoon}>☽</Text>
                <Text style={styles.backSymbol}>⊛</Text>
                <Text style={styles.backBotStar}>✦</Text>
              </LinearGradient>
              <View style={styles.backFrameTL} />
              <View style={styles.backFrameTR} />
              <View style={styles.backFrameBL} />
              <View style={styles.backFrameBR} />
            </Animated.View>

            {/* CTA text */}
            <Animated.Text style={[styles.ctaText, { opacity: ctaOpacity, transform: [{ scale: ctaScale }] }]}>
              {isUk ? '✦  Відкрити карту дня  ✦' : '✦  Open card of the day  ✦'}
            </Animated.Text>
          </View>
        </TouchableOpacity>
      )}

      {/* ══════════════════════════════════════════
          OPEN STATE — scaleX reveal, no rotateY
          ══════════════════════════════════════════ */}
      {isOpen && (
        <Animated.View style={[styles.openWrap, { opacity: sceneOpacity }]}>

          {/* Static glow */}
          <View style={styles.glowBehind} pointerEvents="none" />

          {/* Title */}
          <Animated.View style={[styles.titleWrap, { opacity: titleOpacity, transform: [{ scale: titleScale }] }]}>
            <Text style={styles.cardTitle}>
              {isUk ? 'Карта дня' : 'Card of the Day'}
            </Text>
            <Text style={styles.cardSubtitle}>✦ · ✦ · ✦</Text>
          </Animated.View>

          {/* Card — scaleX reveal (lightweight 2D, replaces rotateY 3D) */}
          <Animated.View
            style={[styles.cardFace, styles.cardWrap, { transform: [{ scaleX: cardScaleX }] }]}
            renderToHardwareTextureAndroid
          >
            <Image
              source={getTarotImageSource(card.id)}
              style={styles.cardImage}
              resizeMode="cover"
            />
            <Text style={[styles.corner, styles.cTL]}>☽</Text>
            <Text style={[styles.corner, styles.cTR]}>☾</Text>
            <Text style={[styles.corner, styles.cBL]}>✦</Text>
            <Text style={[styles.corner, styles.cBR]}>✦</Text>
          </Animated.View>

          {/* Info */}
          <Animated.View style={[styles.infoBlock, {
            opacity: textOpacity,
            transform: [{ translateY: textTranslate }],
          }]}>
            <Text style={styles.nameBelow}>{cardName}</Text>
            <Text style={styles.keywords}>{keywords}</Text>
            <Text style={styles.advice}>{advice}</Text>
          </Animated.View>

          {/* Button */}
          <Animated.View style={[styles.btnWrap, {
            opacity: textOpacity,
            transform: [{ translateY: textTranslate }],
          }]}>
            <TouchableOpacity activeOpacity={0.82} onPress={() => router.push('/(tabs)/tarot' as any)}>
              <LinearGradient
                colors={['#4C1D95', '#7C3AED']}
                style={styles.spreadGradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Ionicons name="layers-outline" size={20} color="#E9D5FF" />
                <Text style={styles.spreadText}>
                  {isUk ? 'Зробити розклад' : 'Make a spread'}
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#E9D5FF" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        </Animated.View>
      )}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const MARGIN = Spacing.lg;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: -MARGIN,
    paddingBottom: Spacing.md,
  },

  // ── Closed (idle) state ──
  idleWrap: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  glowRing: {
    position: 'absolute',
    width: CARD_W + 28,
    height: CARD_H + 28,
    borderRadius: BorderRadius.xl + 6,
    borderWidth: 2,
    borderColor: '#A78BFA',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 14,
    elevation: 8,
    alignSelf: 'center',
    top: Spacing.lg - 14,
  },
  ctaText: {
    marginTop: Spacing.lg,
    fontSize: 13,
    fontWeight: '600',
    color: '#C4B5FD',
    letterSpacing: 1.5,
    textShadowColor: 'rgba(167,139,250,0.8)',
    textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },

  // ── Open state ──
  openWrap: {
    alignItems: 'center',
    width: SCENE_W,
    paddingBottom: Spacing.md,
  },
  glowBehind: {
    position: 'absolute',
    width: CARD_W + 80,
    height: CARD_H + 80,
    borderRadius: CARD_W,
    backgroundColor: 'rgba(124,58,237,0.18)',
    alignSelf: 'center',
    top: 60,
  },

  titleWrap: {
    marginTop: 6,
    marginBottom: Spacing.md,
    alignItems: 'center',
    zIndex: 2,
  },
  cardTitle: {
    fontSize: 22, fontWeight: '700', color: '#E9D5FF', letterSpacing: 3,
    textShadowColor: 'rgba(167,139,250,0.6)', textShadowRadius: 6,
    textShadowOffset: { width: 0, height: 0 },
  },
  cardSubtitle: {
    fontSize: 11, color: 'rgba(196,181,253,0.65)', letterSpacing: 6, marginTop: 4,
  },

  // Card face — shared between idle back + open front
  cardFace: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(196,181,253,0.80)',
    shadowColor: '#A78BFA',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.80,
    shadowRadius: 16,
    elevation: 8,
  },

  cardWrap: {
    marginBottom: Spacing.lg,
    zIndex: 2,
  },

  cardImage: { flex: 1, width: '100%' },

  corner: { position: 'absolute', color: 'rgba(220,210,255,0.90)', fontSize: 14 },
  cTL: { top: 20, left: 6 }, cTR: { top: 20, right: 6 },
  cBL: { bottom: 20, left: 6 }, cBR: { bottom: 20, right: 6 },

  backGradient: { flex: 1, alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 16 },
  backTopStar: { fontSize: 14, color: 'rgba(196,181,253,0.50)' },
  backSymbol:  { fontSize: 20, color: 'rgba(167,139,250,0.60)' },
  backMoon:    { fontSize: 58, color: 'rgba(196,181,253,0.88)' },
  backBotStar: { fontSize: 14, color: 'rgba(196,181,253,0.50)' },
  backFrameTL: { position: 'absolute', top: 10, left: 10, width: 22, height: 22, borderTopWidth: 1.5, borderLeftWidth: 1.5, borderColor: 'rgba(196,181,253,0.40)', borderTopLeftRadius: 4 },
  backFrameTR: { position: 'absolute', top: 10, right: 10, width: 22, height: 22, borderTopWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(196,181,253,0.40)', borderTopRightRadius: 4 },
  backFrameBL: { position: 'absolute', bottom: 10, left: 10, width: 22, height: 22, borderBottomWidth: 1.5, borderLeftWidth: 1.5, borderColor: 'rgba(196,181,253,0.40)', borderBottomLeftRadius: 4 },
  backFrameBR: { position: 'absolute', bottom: 10, right: 10, width: 22, height: 22, borderBottomWidth: 1.5, borderRightWidth: 1.5, borderColor: 'rgba(196,181,253,0.40)', borderBottomRightRadius: 4 },

  infoBlock: { alignItems: 'center', paddingHorizontal: Spacing.xl, marginBottom: Spacing.md, zIndex: 2 },
  nameBelow: {
    fontSize: FontSize.xl + 2, fontWeight: '700', color: '#FFFFFF', marginBottom: 6,
    textShadowColor: 'rgba(167,139,250,0.70)', textShadowRadius: 10,
    textShadowOffset: { width: 0, height: 0 },
  },
  keywords: { fontSize: FontSize.sm, color: '#C4B5FD', marginBottom: 10, letterSpacing: 0.5 },
  advice:   { fontSize: FontSize.md, color: 'rgba(255,255,255,0.88)', lineHeight: 24, textAlign: 'center' },

  btnWrap: { width: width - MARGIN * 2, borderRadius: BorderRadius.lg, overflow: 'hidden', zIndex: 2 },
  spreadGradient: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
  },
  spreadText: { flex: 1, color: '#E9D5FF', fontSize: FontSize.md, fontWeight: '600' },
});
