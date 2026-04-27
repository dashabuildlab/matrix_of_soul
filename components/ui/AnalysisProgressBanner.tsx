/**
 * AnalysisProgressBanner — compact bottom banner shown while a Destiny-Matrix
 * PDF analysis is generating in the background.
 *
 * Mounted once in the root layout (`app/_layout.tsx`). Reads state from
 * `useAppStore.pendingAnalysis`. Only visible while `status === 'generating'`.
 *
 * Tap → navigates to the analysis screen (`/matrix/[id]/analysis`).
 * Cross → calls `analysisGenerator.cancelAnalysis()` with a confirm dialog.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View, TouchableOpacity, Alert, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAppStore } from '@/stores/useAppStore';
import { cancelAnalysis } from '@/lib/analysisGenerator';

export function AnalysisProgressBanner() {
  const pending = useAppStore((s) => s.pendingAnalysis);
  const clearPendingAnalysis = useAppStore((s) => s.clearPendingAnalysis);
  const insets = useSafeAreaInsets();

  const isActive = !!pending && pending.status === 'generating';
  const isError = !!pending && pending.status === 'error';

  // Animate in/out
  const translateY = useRef(new Animated.Value(120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isActive || isError) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(translateY, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(translateY, { toValue: 120, duration: 260, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start(() => setMounted(false));
    }
  }, [isActive, isError]);

  if (!mounted || !pending) return null;

  const isUk = pending.locale === 'uk';
  const total = pending.total;
  const done = pending.progress;
  const progressRatio = total > 0 ? done / total : 0;

  const handleOpen = () => {
    // @ts-ignore — expo-router typing is strict about dynamic routes
    router.push(`/matrix/${pending.matrixId}/analysis`);
  };

  const handleCancel = () => {
    const title = isUk ? 'Скасувати генерацію?' : 'Cancel generation?';
    const msg = isUk
      ? 'Прогрес буде втрачено. Ви зможете запустити новий аналіз пізніше.'
      : 'Progress will be lost. You can start a new analysis later.';
    const keep = isUk ? 'Продовжити' : 'Keep going';
    const cancel = isUk ? 'Скасувати' : 'Cancel';

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${msg}`)) {
        cancelAnalysis();
        setTimeout(() => clearPendingAnalysis(), 400);
      }
      return;
    }

    Alert.alert(title, msg, [
      { text: keep, style: 'cancel' },
      {
        text: cancel,
        style: 'destructive',
        onPress: () => {
          cancelAnalysis();
          setTimeout(() => clearPendingAnalysis(), 400);
        },
      },
    ]);
  };

  const handleDismissError = () => {
    clearPendingAnalysis();
  };

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          bottom: Math.max(insets.bottom, 10) + 70, // above tab bar
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable onPress={isError ? undefined : handleOpen} style={styles.pressable}>
        <LinearGradient
          colors={isError ? ['#3A1810', '#5A1B1B'] : ['#2A1458', '#1B0A55']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.iconWrap}>
            {isError
              ? <Ionicons name="alert-circle" size={20} color="#F87171" />
              : <Ionicons name="sparkles" size={20} color="#F5C542" />}
          </View>

          <View style={styles.textWrap}>
            {isError ? (
              <>
                <Text style={styles.title} numberOfLines={1}>
                  {isUk ? 'Не вдалося завершити' : 'Generation failed'}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {isUk ? 'Спробуйте ще раз' : 'Please try again'}
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.title} numberOfLines={1}>
                  {isUk ? 'Готуємо ваш аналіз' : 'Generating your analysis'}
                  {' '}
                  <Text style={styles.counter}>{done}/{total}</Text>
                </Text>
                {pending.currentSectionTitle ? (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {pending.currentSectionTitle}
                  </Text>
                ) : (
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {isUk ? 'Це займе ~7 хв. Натисни щоб відкрити' : 'Takes ~7 min. Tap to open'}
                  </Text>
                )}
                {/* Progress bar */}
                <View style={styles.pbarBg}>
                  <View style={[styles.pbarFill, { width: `${progressRatio * 100}%` }]} />
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            onPress={isError ? handleDismissError : handleCancel}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
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
    zIndex: 1000,
    elevation: 1000,
  },
  pressable: {
    borderRadius: 18,
    overflow: 'hidden',
    // shadow
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 14,
    elevation: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(245,197,66,0.25)',
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245,197,66,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245,197,66,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 3,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  counter: {
    color: '#F5C542',
    fontWeight: '800',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
  },
  pbarBg: {
    marginTop: 4,
    width: '100%',
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  pbarFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#F5C542',
  },
  closeBtn: {
    padding: 4,
  },
});
