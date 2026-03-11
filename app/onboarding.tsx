import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  ViewToken,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
  StyleSheet as RN,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { Spacing, FontSize, BorderRadius } from '../constants/theme';

const { width, height } = Dimensions.get('window');
const HERO_HEIGHT = height * 0.36;

// ── Pre-computed background dot positions ────────────────────────────────────
const BG_DOTS = Array.from({ length: 24 }, (_, i) => ({
  x: (i * 83 + (i % 3) * 40) % (width - 12),
  y: (i * 113 + (i % 4) * 55) % (height - 12),
  r: 1.5 + (i % 3) * 0.5,
  o: 0.08 + (i % 4) * 0.03,
}));

interface Feature {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
}

interface Slide {
  id: string;
  heroGradient: readonly [string, string, string];
  centerIcon: keyof typeof Ionicons.glyphMap;
  preTitle?: string;
  title: string;
  titleHighlight?: string;
  tagline: string;
  features?: Feature[];
  ctaText: string;
}

const slides: Slide[] = [
  {
    id: '1',
    heroGradient: ['#DDD6FE', '#C4B5FD', '#A78BFA'],
    centerIcon: 'infinite-outline',
    title: 'Матриця Долі',
    titleHighlight: '& Таро',
    tagline: 'Відкрий свою унікальну долю',
    ctaText: 'Продовжити',
  },
  {
    id: '2',
    heroGradient: ['#EDE9FE', '#C4B5FD', '#9F7AEA'],
    centerIcon: 'apps-outline',
    preTitle: '22 Енергії',
    title: 'Матриця Долі',
    titleHighlight: '& Таро',
    tagline: 'Пізнай себе глибше',
    features: [
      { icon: 'grid-outline', title: 'Матриця Долі', subtitle: 'за датою народження' },
      { icon: 'layers-outline', title: 'Розклади Таро', subtitle: 'з ШІ інтерпретацією' },
      { icon: 'heart-circle-outline', title: 'Сумісність', subtitle: 'і кармічний зв\'язок' },
      { icon: 'book-outline', title: 'Значення Арканів', subtitle: 'та рекомендації' },
    ],
    ctaText: 'Продовжити',
  },
  {
    id: '3',
    heroGradient: ['#F3E8FF', '#D8B4FE', '#A855F7'],
    centerIcon: 'chatbubble-ellipses-outline',
    preTitle: 'ШІ Астролог',
    title: 'Завжди поруч',
    tagline: 'Задавай будь-які питання',
    features: [
      { icon: 'chatbubble-ellipses-outline', title: 'AI Чат', subtitle: 'відповіді 24/7' },
      { icon: 'journal-outline', title: 'Журнал Душі', subtitle: 'зберігай відкриття' },
      { icon: 'flame-outline', title: 'Щоденна Серія', subtitle: 'та нагороди' },
      { icon: 'sunny-outline', title: 'Прогноз Дня', subtitle: 'енергія кожного дня' },
    ],
    ctaText: 'Продовжити',
  },
  {
    id: '4',
    heroGradient: ['#EDE9FE', '#C4B5FD', '#7C3AED'],
    centerIcon: 'diamond-outline',
    title: 'Почни свій шлях',
    titleHighlight: 'сьогодні',
    tagline: 'Безкоштовно та без реєстрації',
    ctaText: 'Почати',
  },
];

// ── Animated Hero ─────────────────────────────────────────────────────────────
function AnimatedHero({ slide }: { slide: Slide }) {
  const floatY    = useRef(new Animated.Value(0)).current;
  const pulseOuter = useRef(new Animated.Value(1)).current;
  const pulseGlow  = useRef(new Animated.Value(0.92)).current;
  const ringRot    = useRef(new Animated.Value(0)).current;
  const fadeIn     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -14, duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0,   duration: 3000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseOuter, { toValue: 1.10, duration: 2600, useNativeDriver: true }),
        Animated.timing(pulseOuter, { toValue: 1,    duration: 2600, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(pulseGlow, { toValue: 1.18, duration: 2200, useNativeDriver: true }),
        Animated.timing(pulseGlow, { toValue: 0.92, duration: 2200, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(ringRot, { toValue: 1, duration: 14000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, []);

  const rotation = ringRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <LinearGradient colors={slide.heroGradient} style={styles.heroSection} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      {/* ── Decorative pattern — corner rings ── */}
      <View style={[styles.cornerRing, { width: 220, height: 220, top: -70, right: -70 }]} />
      <View style={[styles.cornerRing, { width: 160, height: 160, top: -45, right: -45 }]} />
      <View style={[styles.cornerRing, { width: 100, height: 100, top: -20, right: -20 }]} />
      <View style={[styles.cornerRing, { width: 200, height: 200, bottom: -60, left: -80 }]} />
      <View style={[styles.cornerRing, { width: 130, height: 130, bottom: -35, left: -50 }]} />

      {/* ── Small scattered dots ── */}
      <View style={[styles.dotSmall, { top: 22, left: 32 }]} />
      <View style={[styles.dotSmall, { top: 48, right: 44 }]} />
      <View style={[styles.dotSmall, { bottom: 38, left: 56 }]} />
      <View style={[styles.dotSmall, { top: 70, left: 70 }]} />
      <View style={[styles.dotSmall, { bottom: 55, right: 38 }]} />
      <View style={[styles.dotSmall, { top: 36, right: 80 }]} />

      {/* ── Diamond shapes ── */}
      <View style={[styles.diamond, { top: 28, left: 55,  width: 10, height: 10 }]} />
      <View style={[styles.diamond, { bottom: 44, right: 28, width: 8, height: 8 }]} />
      <View style={[styles.diamond, { top: 65, right: 55,  width: 6, height: 6 }]} />

      {/* ── Animated centre ── */}
      <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: floatY }] }}>
        {/* Outer pulsing ring */}
        <Animated.View style={[styles.heroPulseOuter, { transform: [{ scale: pulseOuter }] }]}>
          {/* Rotating dashed ring */}
          <Animated.View style={[styles.heroRotatingRing, { transform: [{ rotate: rotation }] }]} />
          {/* Glow circle */}
          <Animated.View style={[styles.heroGlow, { transform: [{ scale: pulseGlow }] }]} />
          {/* Solid icon circle */}
          <View style={styles.heroCenterInner}>
            <Ionicons name={slide.centerIcon} size={56} color="white" />
          </View>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const contentFade = useRef(new Animated.Value(1)).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        // Fade content on slide change
        Animated.sequence([
          Animated.timing(contentFade, { toValue: 0, duration: 120, useNativeDriver: true }),
          Animated.timing(contentFade, { toValue: 1, duration: 280, useNativeDriver: true }),
        ]).start();
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleFinish();
    }
  };

  const handleFinish = async () => {
    await SecureStore.setItemAsync('onboarding_done', 'true');
    router.replace('/auth/login');
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={styles.slide}>
      <AnimatedHero slide={item} />

      {/* ── Content ── */}
      <Animated.View style={[styles.contentSection, { opacity: contentFade }]}>
        {item.preTitle ? <Text style={styles.preTitle}>{item.preTitle}</Text> : null}

        <Text style={styles.title}>
          {item.title}
          {item.titleHighlight
            ? <Text style={styles.titleHighlight}> {item.titleHighlight}</Text>
            : null}
        </Text>

        <Text style={styles.tagline}>{item.tagline}</Text>

        {item.features ? (
          <View style={styles.featuresGrid}>
            {item.features.map((feat, i) => (
              <View key={i} style={styles.featureCard}>
                <LinearGradient
                  colors={['#EDE8FF', '#F8F4FF']}
                  style={styles.featureIconBox}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Ionicons name={feat.icon} size={20} color="#8B5CF6" />
                </LinearGradient>
                <Text style={styles.featureTitle}>{feat.title}</Text>
                <Text style={styles.featureSubtitle}>{feat.subtitle}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.noFeaturesDecor}>
            <View style={styles.taglinePill}>
              <Text style={styles.taglinePillText}>Отримуй відповіді і міняй своє життя</Text>
            </View>
          </View>
        )}
      </Animated.View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* ── Full-screen background pattern ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Large soft orbs */}
        <LinearGradient
          colors={['rgba(196,181,253,0.35)', 'transparent']}
          style={{ position: 'absolute', width: 280, height: 280, borderRadius: 140, top: -80, right: -80 }}
        />
        <LinearGradient
          colors={['rgba(167,139,250,0.22)', 'transparent']}
          style={{ position: 'absolute', width: 240, height: 240, borderRadius: 120, bottom: height * 0.25, left: -90 }}
        />
        <LinearGradient
          colors={['rgba(221,214,254,0.28)', 'transparent']}
          style={{ position: 'absolute', width: 200, height: 200, borderRadius: 100, bottom: -40, right: -40 }}
        />
        {/* Dot grid */}
        {BG_DOTS.map((d, i) => (
          <View key={i} style={{
            position: 'absolute',
            width: d.r * 2,
            height: d.r * 2,
            borderRadius: d.r,
            backgroundColor: `rgba(139,92,246,${d.o})`,
            top: d.y,
            left: d.x,
          }} />
        ))}
        {/* Concentric rings in bottom-right */}
        <View style={[styles.bgRing, { width: 180, height: 180, bottom: 40, right: -50, opacity: 0.06 }]} />
        <View style={[styles.bgRing, { width: 130, height: 130, bottom: 65, right: -25, opacity: 0.08 }]} />
        <View style={[styles.bgRing, { width: 80,  height: 80,  bottom: 90, right: 0,   opacity: 0.10 }]} />
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        style={{ flex: 1 }}
      />

      {/* ── Bottom Controls ── */}
      <View style={styles.bottomArea}>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.88}>
          <LinearGradient
            colors={['#9F7AEA', '#6D28D9']}
            style={styles.ctaButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaText}>{slides[currentIndex].ctaText}</Text>
            <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.85)" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        {currentIndex < slides.length - 1 && (
          <TouchableOpacity onPress={handleFinish} style={styles.skipButton}>
            <Text style={styles.skipText}>Пропустити</Text>
          </TouchableOpacity>
        )}

        <View style={styles.dotsRow}>
          {slides.map((_, i) => (
            <TouchableOpacity
              key={i}
              onPress={() => flatListRef.current?.scrollToIndex({ index: i })}
              style={[styles.dot, i === currentIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const CARD_WIDTH = (width - Spacing.xl * 2 - Spacing.sm) / 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F4FF',
  },

  // ── Slide ────────────────────────────────────────────────
  slide: {
    width,
    flex: 1,
  },

  // ── Hero ─────────────────────────────────────────────────
  heroSection: {
    height: HERO_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },

  // Pattern elements
  cornerRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  dotSmall: {
    position: 'absolute',
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  diamond: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.45)',
    transform: [{ rotate: '45deg' }],
  },

  // Animated centre
  heroPulseOuter: {
    width: 148,
    height: 148,
    borderRadius: 74,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  heroRotatingRing: {
    position: 'absolute',
    width: 148,
    height: 148,
    borderRadius: 74,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
  },
  heroGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  heroCenterInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 20,
    elevation: 12,
  },

  // ── Content ───────────────────────────────────────────────
  contentSection: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  preTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: -0.3,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: '#1A0A35',
    lineHeight: 36,
    marginTop: 2,
  },
  titleHighlight: {
    color: '#8B5CF6',
  },
  tagline: {
    fontSize: FontSize.md,
    color: '#6B4FA0',
    marginTop: 6,
    marginBottom: Spacing.md,
  },

  // ── Feature Grid ─────────────────────────────────────────
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  featureCard: {
    width: CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(221,213,240,0.6)',
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: '#1A0A35',
    marginBottom: 2,
  },
  featureSubtitle: {
    fontSize: FontSize.xs,
    color: '#9B87C0',
    lineHeight: 16,
  },

  // ── No-features ───────────────────────────────────────────
  noFeaturesDecor: {
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  taglinePill: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: '#DDD5F0',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  taglinePillText: {
    fontSize: FontSize.md,
    color: '#6B4FA0',
    fontWeight: '500',
    textAlign: 'center',
  },

  // ── Bottom Area ───────────────────────────────────────────
  bottomArea: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xxl : Spacing.xl,
    paddingTop: Spacing.sm,
  },
  ctaButton: {
    borderRadius: BorderRadius.full,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: '#6D28D9',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.32,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  skipText: {
    color: '#9B87C0',
    fontSize: FontSize.sm,
  },

  // ── Dots ─────────────────────────────────────────────────
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#8B5CF6',
  },
  dotInactive: {
    width: 8,
    backgroundColor: '#C4B5FD',
  },

  // ── Background pattern ────────────────────────────────────
  bgRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
});
