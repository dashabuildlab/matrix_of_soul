import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  View,
  Image,
  StyleSheet,
} from 'react-native';
import { Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BorderRadius } from '@/constants/theme';

export const CARD_W = 140;
export const CARD_H = 230;

interface Props {
  imageUri: string;
  isReversed?: boolean;
  cardNumber?: number;
  /** Call once the full reveal animation completes */
  onRevealDone?: () => void;
}

/**
 * TarotCardFlip
 * Phase 1 – Card slides up from below (spring, ~500 ms)
 * Phase 2 – Card flips: back shrinks (scaleX 1→0), front grows (scaleX 0→1)
 */
export function TarotCardFlip({
  imageUri,
  isReversed = false,
  cardNumber,
  onRevealDone,
}: Props) {
  // ── Animation values ────────────────────────────────────────
  const slideY  = useRef(new Animated.Value(300)).current;
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const backScale = useRef(new Animated.Value(1)).current;  // 1 → 0
  const frontScale = useRef(new Animated.Value(0)).current; // 0 → 1

  const [showFront, setShowFront] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);

  // Shimmer pulse for placeholder while image loads
  const shimmer = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 0.75, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  // Start prefetching as soon as the URI is known — by the time the
  // slide+pause+flip animation finishes (~1.2 s) the image is likely cached
  useEffect(() => {
    if (imageUri) Image.prefetch(imageUri).catch(() => {});
  }, [imageUri]);

  useEffect(() => {
    // Phase 1: slide up
    Animated.parallel([
      Animated.spring(slideY, {
        toValue: 0,
        tension: 55,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Pause before flip
      setTimeout(() => {
        // Phase 2a: shrink back
        Animated.timing(backScale, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }).start(() => {
          setShowFront(true);
          // Phase 2b: grow front
          Animated.spring(frontScale, {
            toValue: 1,
            tension: 80,
            friction: 7,
            useNativeDriver: true,
          }).start(() => {
            onRevealDone?.();
          });
        });
      }, 350);
    });
  }, []);

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { transform: [{ translateY: slideY }], opacity: fadeIn },
      ]}
    >
      {/* ── Card Back ── */}
      {!showFront && (
        <Animated.View
          style={[styles.card, { transform: [{ scaleX: backScale }] }]}
        >
          <LinearGradient
            colors={['#0D0526', '#1E0B55', '#0D0526']}
            style={styles.cardBack}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            {/* Border frame */}
            <View style={styles.backFrame}>
              <Text style={styles.backTopDec}>✦  ·  ✦</Text>
              <Text style={styles.backMoon}>☽</Text>
              {cardNumber !== undefined && (
                <Text style={styles.backNum}>{cardNumber}</Text>
              )}
              <Text style={styles.backBotDec}>✦  ·  ✦</Text>
            </View>
          </LinearGradient>
        </Animated.View>
      )}

      {/* ── Card Front ── */}
      {showFront && (
        <Animated.View
          style={[styles.card, { transform: [{ scaleX: frontScale }] }]}
        >
          <View style={[styles.cardFront, isReversed && styles.reversed]}>
            {!imgLoaded && !imgError && (
              <Animated.View style={[styles.placeholder, { opacity: shimmer }]}>
                <LinearGradient
                  colors={['#1E0B55', '#2D1577', '#1E0B55']}
                  style={StyleSheet.absoluteFillObject}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <Text style={styles.backMoon}>☽</Text>
              </Animated.View>
            )}
            {imgError ? (
              /* Fallback: styled gradient card if image fails */
              <LinearGradient
                colors={['#1E0B55', '#4338CA']}
                style={styles.fallbackFront}
              >
                <Text style={styles.backMoon}>☽</Text>
                {cardNumber !== undefined && (
                  <Text style={styles.backNum}>{cardNumber}</Text>
                )}
              </LinearGradient>
            ) : (
              <Image
                source={{ uri: imageUri }}
                style={styles.cardImage}
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                resizeMode="cover"
              />
            )}
          </View>
        </Animated.View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: CARD_W,
    height: CARD_H,
    alignSelf: 'center',
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 10,
  },

  // ── Back ─────────────────────────────────────────────────────
  cardBack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245,197,66,0.55)',
    borderRadius: BorderRadius.lg,
  },
  backFrame: {
    width: CARD_W - 24,
    height: CARD_H - 24,
    borderWidth: 1,
    borderColor: 'rgba(245,197,66,0.28)',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  backTopDec: {
    color: 'rgba(245,197,66,0.60)',
    fontSize: 10,
    letterSpacing: 4,
  },
  backMoon: {
    color: 'rgba(245,197,66,0.90)',
    fontSize: 36,
    lineHeight: 40,
  },
  backNum: {
    color: 'rgba(245,197,66,0.75)',
    fontSize: 22,
    fontWeight: '900',
  },
  backBotDec: {
    color: 'rgba(245,197,66,0.45)',
    fontSize: 10,
    letterSpacing: 4,
  },

  // ── Front ─────────────────────────────────────────────────────
  cardFront: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(245,197,66,0.55)',
    overflow: 'hidden',
    backgroundColor: '#0D0526',
  },
  reversed: {
    transform: [{ rotate: '180deg' }],
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fallbackFront: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
});
