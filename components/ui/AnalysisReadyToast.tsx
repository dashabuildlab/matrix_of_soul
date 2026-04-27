/**
 * AnalysisReadyToast — anchored top banner that fires once when a background
 * PDF analysis transitions from 'generating' → 'ready'.
 *
 * Mounted at the root layout. Observes `pendingAnalysis` in the store; when
 * status becomes 'ready' AND `readyToastShown` is falsy, shows a dismissible
 * banner for ~8 seconds. Tap → navigates to `/matrix/[id]/analysis`.
 *
 * The "shown" flag is persisted in the store so the user doesn't see the
 * toast twice after an in-app navigation / app restart.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';

const AUTO_DISMISS_MS = 8000;

export function AnalysisReadyToast() {
  const pending = useAppStore((s) => s.pendingAnalysis);
  const markShown = useAppStore((s) => s.markReadyToastShown);
  const insets = useSafeAreaInsets();

  const shouldShow = !!pending
    && pending.status === 'ready'
    && !pending.readyToastShown;

  const [mounted, setMounted] = useState(false);
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (shouldShow) {
      setMounted(true);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();

      const t = setTimeout(() => hide(), AUTO_DISMISS_MS);
      return () => clearTimeout(t);
    }
  }, [shouldShow]);

  const hide = () => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: -120, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
    ]).start(() => {
      setMounted(false);
      markShown();
    });
  };

  const handleTap = () => {
    if (!pending) return;
    markShown();
    setMounted(false);
    // @ts-ignore — dynamic route
    router.push(`/matrix/${pending.matrixId}/analysis`);
  };

  if (!mounted || !pending) return null;

  const isUk = pending.locale === 'uk';

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          top: insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable onPress={handleTap} style={styles.pressable}>
        <LinearGradient
          colors={['#C8901A', '#F5C542', '#C8901A']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.card}
        >
          <View style={styles.iconWrap}>
            <Ionicons name="sparkles" size={24} color="#1A0A00" />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.title}>
              {isUk ? 'Ваш аналіз готовий ✨' : 'Your analysis is ready ✨'}
            </Text>
            <Text style={styles.subtitle}>
              {isUk ? 'Натисніть, щоб відкрити' : 'Tap to open'}
            </Text>
          </View>
          <TouchableOpacity
            onPress={(e) => { e.stopPropagation(); hide(); }}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={18} color="rgba(26,10,0,0.5)" />
          </TouchableOpacity>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 1100,
    elevation: 1100,
  },
  pressable: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#F5C542',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26,10,0,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: '#1A0A00',
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(26,10,0,0.7)',
    fontSize: 12,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 2,
  },
});
