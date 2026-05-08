/**
 * Onboarding — step-based flow.
 * welcome → intent → focus → gender → dob → generating → aha → registration → home
 */
import React, { useRef, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Platform, Animated, Easing, TextInput,
  ScrollView, Alert, Keyboard,
  TouchableWithoutFeedback, Vibration,
} from 'react-native';
// No react-native-reanimated — replaced with native Animated to avoid worklets version mismatch in Expo Go
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Spacing, FontSize, BorderRadius, Colors } from '../constants/theme';
import { StarBackground } from '../components/ui/StarBackground';
import { useAppStore } from '../stores/useAppStore';
import { MatrixDiagram } from '../components/matrix/MatrixDiagram';
import { calculateMatrix } from '../lib/matrix-calc';
import { getEnergyById } from '../constants/energies';
import { getPositionText } from '../constants/matrixTexts';
import { askClaude } from '../lib/claude';
import { useI18n } from '../lib/i18n';
import { supabase } from '../lib/supabase';

// ─── Types ─────────────────────────────────────────────────────────────────────
type Step = 'welcome' | 'intent' | 'focus' | 'gender' | 'dob' | 'generating' | 'aha' | 'registration';

/** Steps shown in the top progress bar */
const PROGRESS_STEPS: Step[] = ['welcome', 'intent', 'focus', 'gender', 'dob'];

// ─── Data ──────────────────────────────────────────────────────────────────────
const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const YEARS  = Array.from({ length: 71 }, (_, i) => String(1940 + i));

// ─── Wheel Picker ──────────────────────────────────────────────────────────────
const ITEM_H  = 48;

function WheelPicker({ data, initialIdx = 0, onChange }: {
  data: string[];
  initialIdx?: number;
  onChange: (val: string) => void;
}) {
  const scrollRef = useRef<ScrollView>(null);

  const commit = (offsetY: number) => {
    const idx = Math.round(offsetY / ITEM_H);
    const clamped = Math.max(0, Math.min(data.length - 1, idx));
    onChange(data[clamped]);
  };

  return (
    <View style={styles.wheelOuter}>
      <LinearGradient
        colors={['rgba(13,11,30,1)', 'rgba(13,11,30,0)']}
        style={styles.wheelFadeTop}
        pointerEvents="none"
      />
      <View style={styles.wheelHighlight} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(13,11,30,0)', 'rgba(13,11,30,1)']}
        style={styles.wheelFadeBottom}
        pointerEvents="none"
      />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_H}
        decelerationRate="fast"
        nestedScrollEnabled
        overScrollMode="always"
        contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
        onLayout={() => {
          setTimeout(() => {
            scrollRef.current?.scrollTo({ y: initialIdx * ITEM_H, animated: false });
          }, 50);
        }}
        onMomentumScrollEnd={(e) => commit(e.nativeEvent.contentOffset.y)}
        onScrollEndDrag={(e) => commit(e.nativeEvent.contentOffset.y)}
      >
        {data.map((item, i) => (
          <View key={i} style={styles.wheelItem}>
            <Text style={styles.wheelItemText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Entrance animation hook ───────────────────────────────────────────────────
function useEntrance() {
  const fadeIn  = useRef(new Animated.Value(0)).current;
  const slideUp = useRef(new Animated.Value(24)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return { fadeIn, slideUp };
}

// ─── Step 1: Welcome ───────────────────────────────────────────────────────────
function WelcomeStep({ onNext }: { onNext: () => void }) {
  const cosmosRot     = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleY       = useRef(new Animated.Value(14)).current;
  const line1Opacity  = useRef(new Animated.Value(0)).current;
  const line1Y        = useRef(new Animated.Value(12)).current;
  const line2Opacity  = useRef(new Animated.Value(0)).current;
  const line2Y        = useRef(new Animated.Value(12)).current;
  const line3Opacity  = useRef(new Animated.Value(0)).current;
  const line3Y        = useRef(new Animated.Value(12)).current;
  const descOpacity   = useRef(new Animated.Value(0)).current;
  const btnOpacity    = useRef(new Animated.Value(0)).current;
  const btnY          = useRef(new Animated.Value(28)).current;
  const btnScale      = useRef(new Animated.Value(1)).current;
  const btnGlow       = useRef(new Animated.Value(0.2)).current;

  const T = (val: Animated.Value, to: number, delay: number, dur = 380) =>
    Animated.timing(val, { toValue: to, duration: dur, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true });

  useEffect(() => {
    Animated.loop(
      Animated.timing(cosmosRot, { toValue: 1, duration: 80000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    Animated.parallel([
      T(subtitleOpacity, 1, 150),
      T(subtitleY,       0, 150),
      T(line1Opacity,    1, 350),
      T(line1Y,          0, 350),
      T(line2Opacity,    1, 480),
      T(line2Y,          0, 480),
      T(line3Opacity,    1, 610),
      T(line3Y,          0, 610),
      T(descOpacity,     1, 850),
      Animated.timing(btnOpacity, { toValue: 1, duration: 420, delay: 1050, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(btnY,       { toValue: 0, duration: 480, delay: 1050, easing: Easing.out(Easing.back(1.3)), useNativeDriver: true }),
    ]).start(() => {
      Animated.sequence([
        Animated.spring(btnScale, { toValue: 1.06, tension: 400, friction: 5, useNativeDriver: true }),
        Animated.spring(btnScale, { toValue: 1,    tension: 180, friction: 8, useNativeDriver: true }),
      ]).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(btnGlow, { toValue: 0.85, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(btnGlow, { toValue: 0.2,  duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, {
          transform: [{ rotate: cosmosRot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] }) }],
          alignItems: 'center', justifyContent: 'center',
        }]}
      >
        <View style={{
          width: 520, height: 520, borderRadius: 260,
          backgroundColor: 'transparent',
          shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25, shadowRadius: 120, opacity: 0.45,
        }} />
      </Animated.View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.lg }}>
        <Animated.Text style={{
          color: Colors.accent, fontSize: FontSize.xs, fontWeight: '800',
          letterSpacing: 4, marginBottom: Spacing.md,
          opacity: subtitleOpacity, transform: [{ translateY: subtitleY }],
        }}>
          {'МАТРИЦЯ ДОЛІ & ТАРО'}
        </Animated.Text>

        <Animated.Text style={[styles.welcomeTitle, { opacity: line1Opacity, transform: [{ translateY: line1Y }] }]}>
          Дізнайся, що
        </Animated.Text>
        <Animated.Text style={[styles.welcomeTitle, { opacity: line2Opacity, transform: [{ translateY: line2Y }] }]}>
          записано у твоїй
        </Animated.Text>
        <Animated.Text style={[styles.welcomeTitle, { opacity: line3Opacity, transform: [{ translateY: line3Y }], marginBottom: Spacing.lg }]}>
          даті народження
        </Animated.Text>

        <Animated.Text style={[styles.stepSub, { textAlign: 'center', color: 'rgba(255,255,255,0.78)', opacity: descOpacity }]}>
          Матриця Долі та Таро — AI-провідник для самопізнання, стосунків та життєвого шляху
        </Animated.Text>
      </View>

      <View style={[styles.bottomBtn, { paddingBottom: Platform.OS === 'ios' ? 48 : 56 }]}>
        <Animated.View style={{ opacity: btnOpacity, transform: [{ translateY: btnY }, { scale: btnScale }] }}>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
            borderRadius: BorderRadius.full + 4,
            backgroundColor: 'rgba(245,197,66,0.28)',
            opacity: btnGlow,
          }]} />
          <TouchableOpacity onPress={onNext} activeOpacity={0.85}>
            <LinearGradient
              colors={['#C8901A', '#F5C542', '#C8901A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.bigBtn}
            >
              <Text style={styles.bigBtnTextDark}>Продовжимо</Text>
              <Ionicons name="arrow-forward" size={18} color="#1A0800" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );
}

// ─── FadeUpView — replaces Reanimated FadeInUp to avoid worklets mismatch ─────
function FadeUpView({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity,    { toValue: 1, duration: 350, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 350, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      {children}
    </Animated.View>
  );
}

// ─── Option Row (reusable animated row) ───────────────────────────────────────
function OptionRow({
  id, icon, label, active, onToggle, enterDelay,
}: {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onToggle: (id: string) => void;
  enterDelay?: number;
}) {
  const tapScale   = useRef(new Animated.Value(1)).current;
  const checkScale = useRef(new Animated.Value(active ? 1 : 0)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(tapScale, { toValue: 0.96, tension: 400, friction: 6, useNativeDriver: true }),
      Animated.spring(tapScale, { toValue: 1,    tension: 200, friction: 8, useNativeDriver: true }),
    ]).start();
    if (!active) {
      Animated.spring(checkScale, { toValue: 1, tension: 350, friction: 5, useNativeDriver: true }).start();
    } else {
      Animated.timing(checkScale, { toValue: 0, duration: 100, useNativeDriver: true }).start();
    }
    Vibration.vibrate(20);
    onToggle(id);
  };

  return (
    <FadeUpView delay={enterDelay ?? 0}>
      <Animated.View style={{ transform: [{ scale: tapScale }] }}>
        <TouchableOpacity onPress={handlePress} activeOpacity={1} style={[styles.listRow, active && styles.listRowActive]}>
          {active && <LinearGradient colors={['rgba(139,92,246,0.22)', 'rgba(91,33,182,0.10)']} style={StyleSheet.absoluteFill} />}
          <View style={[styles.listIcon, active && styles.listIconActive]}>
            <Ionicons name={icon} size={22} color={active ? '#F5C542' : 'rgba(255,255,255,0.6)'} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.listLabel, active && styles.listLabelActive]}>{label}</Text>
          </View>
          <Animated.View style={[styles.radio, active && styles.radioActive, { transform: [{ scale: checkScale }] }]}>
            {active && <Ionicons name="checkmark" size={14} color="#F5C542" />}
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </FadeUpView>
  );
}

// ─── Step 2: Intent ────────────────────────────────────────────────────────────
function IntentStep({ onNext, onBack }: { onNext: (intent: string) => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const { fadeIn, slideUp } = useEntrance();
  const btnScale   = useRef(new Animated.Value(1)).current;
  const btnOpacity = useRef(new Animated.Value(0.45)).current;
  const prevCanContinue = useRef(false);

  const OPTIONS = [
    { id: 'self',      icon: 'person-circle-outline' as const, label: 'Краще зрозуміти себе' },
    { id: 'relations', icon: 'heart-outline'          as const, label: 'Стосунки та сумісність' },
    { id: 'path',      icon: 'navigate-outline'       as const, label: 'Життєвий шлях і призначення' },
    { id: 'daily',     icon: 'sunny-outline'          as const, label: 'Щоденні підказки' },
    { id: 'tarot',     icon: 'sparkles-outline'       as const, label: 'Таро та духовні практики' },
  ];
  const canContinue = selected.length > 0;

  useEffect(() => {
    if (canContinue && !prevCanContinue.current) {
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.sequence([
          Animated.spring(btnScale, { toValue: 1.06, tension: 300, friction: 5, useNativeDriver: true }),
          Animated.spring(btnScale, { toValue: 1,    tension: 180, friction: 8, useNativeDriver: true }),
        ]),
      ]).start();
    } else if (!canContinue) {
      Animated.timing(btnOpacity, { toValue: 0.45, duration: 200, useNativeDriver: true }).start();
    }
    prevCanContinue.current = canContinue;
  }, [canContinue]);

  const toggleOption = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Що тебе найбільше{'\n'}цікавить зараз?</Text>
        <Text style={styles.stepSub}>Ми підлаштуємо досвід під твій запит</Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg }}>
        {OPTIONS.map((o, i) => (
          <OptionRow
            key={o.id}
            id={o.id}
            icon={o.icon}
            label={o.label}
            active={selected.includes(o.id)}
            onToggle={toggleOption}
            enterDelay={i * 80}
          />
        ))}
      </View>
      <View style={styles.bottomBtn}>
        <Animated.View style={{ opacity: btnOpacity, transform: [{ scale: btnScale }] }}>
          <TouchableOpacity onPress={() => { if (canContinue) { Vibration.vibrate(30); onNext(selected.join(',')); } }} activeOpacity={canContinue ? 0.85 : 1}>
            <LinearGradient
              colors={canContinue ? ['#C8901A', '#F5C542', '#C8901A'] : ['#2a2240', '#3a2e5a']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.bigBtn}
            >
              <Text style={[styles.bigBtnTextDark, !canContinue && { color: 'rgba(255,255,255,0.35)' }]}>Продовжимо</Text>
              <Ionicons name="arrow-forward" size={18} color={canContinue ? '#1A0800' : 'rgba(255,255,255,0.35)'} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// ─── Step 3: Focus ─────────────────────────────────────────────────────────────
function FocusStep({ onNext, onBack }: { onNext: (focus: string) => void; onBack: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);
  const { fadeIn, slideUp } = useEntrance();

  const OPTIONS = [
    { id: 'clarity',   icon: 'bulb-outline'         as const, label: 'Хочу більше ясності у своєму житті' },
    { id: 'relations', icon: 'heart-outline'         as const, label: 'Мене хвилюють стосунки' },
    { id: 'strengths', icon: 'star-outline'          as const, label: 'Хочу зрозуміти свої сильні сторони' },
    { id: 'direction', icon: 'compass-outline'       as const, label: 'Не знаю, куди рухатись далі' },
    { id: 'daily',     icon: 'notifications-outline' as const, label: 'Хочу отримувати щоденні підказки' },
  ];
  const canContinue = selected.length > 0;

  const toggleOption = (id: string) =>
    setSelected((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Що хвилює{'\n'}тебе найбільше?</Text>
        <Text style={styles.stepSub}>Обери те, що зараз найближче</Text>
      </View>
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg }}>
        {OPTIONS.map((o, i) => (
          <OptionRow
            key={o.id}
            id={o.id}
            icon={o.icon}
            label={o.label}
            active={selected.includes(o.id)}
            onToggle={toggleOption}
            enterDelay={i * 80}
          />
        ))}
      </View>
      <View style={styles.bottomBtn}>
        <TouchableOpacity onPress={() => { if (canContinue) { Vibration.vibrate(30); onNext(selected.join(',')); } }} activeOpacity={canContinue ? 0.85 : 1}>
          <LinearGradient
            colors={canContinue ? ['#C8901A', '#F5C542', '#C8901A'] : ['#2a2240', '#3a2e5a']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.bigBtn}
          >
            <Text style={[styles.bigBtnTextDark, !canContinue && { color: 'rgba(255,255,255,0.35)' }]}>Продовжимо</Text>
            <Ionicons name="arrow-forward" size={18} color={canContinue ? '#1A0800' : 'rgba(255,255,255,0.35)'} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Step 4: Gender ────────────────────────────────────────────────────────────
function GenderStep({ onNext, onBack }: { onNext: (gender: 'male' | 'female') => void; onBack: () => void }) {
  const [selected, setSelected] = useState<'male' | 'female' | null>(null);
  const { fadeIn, slideUp } = useEntrance();

  const GENDERS = [
    { id: 'male' as const,   icon: 'male-outline'   as const, label: 'Чоловік' },
    { id: 'female' as const, icon: 'female-outline' as const, label: 'Жінка' },
  ];

  const renderOption = (g: typeof GENDERS[0]) => {
    const active = selected === g.id;
    return (
      <TouchableOpacity key={g.id} onPress={() => setSelected(g.id)} activeOpacity={0.8} style={[styles.listRow, active && styles.listRowActive]}>
        {active && <LinearGradient colors={['rgba(139,92,246,0.2)', 'rgba(91,33,182,0.1)']} style={StyleSheet.absoluteFill} />}
        <View style={[styles.listIcon, active && styles.listIconActive]}>
          <Ionicons name={g.icon} size={22} color={active ? '#F5C542' : 'rgba(255,255,255,0.6)'} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.listLabel, active && styles.listLabelActive]}>{g.label}</Text>
        </View>
        <View style={[styles.radio, active && styles.radioActive]}>
          {active && <View style={styles.radioDot} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      <View style={styles.stepHeader}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
        <Text style={styles.stepTitle}>Ваша стать</Text>
        <Text style={styles.stepSub}>Для точніших та персоналізованих тлумачень</Text>
      </View>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.lg }}>
        {GENDERS.map(renderOption)}
      </View>
      <View style={styles.bottomBtn}>
        <TouchableOpacity onPress={() => selected && onNext(selected)} activeOpacity={selected ? 0.85 : 0.5} disabled={!selected}>
          <LinearGradient
            colors={selected ? ['#C8901A', '#F5C542', '#C8901A'] : ['#333', '#444']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.bigBtn}
          >
            <Text style={[styles.bigBtnTextDark, !selected && { color: 'rgba(255,255,255,0.4)' }]}>Продовжимо</Text>
            <Ionicons name="arrow-forward" size={18} color={selected ? '#1A0800' : 'rgba(255,255,255,0.4)'} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Step 5: Date of Birth ─────────────────────────────────────────────────────
function BirthDateStep({ onNext, onBack }: {
  onNext: (birthDate: string, name: string) => void;
  onBack: () => void;
}) {
  const [userName, setUserName] = useState('');
  const [day,   setDay]   = useState('15');
  const [month, setMonth] = useState(MONTHS[5]);
  const [year,  setYear]  = useState('1990');
  const { fadeIn, slideUp } = useEntrance();

  const handleNext = () => {
    const mm = String(MONTHS.indexOf(month) + 1).padStart(2, '0');
    onNext(`${day}.${mm}.${year}`, userName.trim());
  };

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.stepHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
          <Text style={[styles.stepTitle, { fontSize: FontSize.xl }]}>Вкажи свою дату{'\n'}народження</Text>
          <Text style={[styles.stepSub, { color: 'rgba(255,255,255,0.85)', fontSize: FontSize.xs, marginBottom: 4 }]}>
            На основі дати народження ми розрахуємо твою персональну Матрицю Долі — 22 енергії, таланти, призначення та кармічні уроки
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="lock-closed-outline" size={10} color="rgba(245,197,66,0.75)" />
            <Text style={{ color: 'rgba(245,197,66,0.75)', fontSize: 10 }}>Зберігається тільки на твоєму пристрої</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <View style={{ flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm }}>
        <TextInput
          style={{
            backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: BorderRadius.lg,
            padding: Spacing.sm, color: Colors.text, fontSize: FontSize.md,
            textAlign: 'center', borderWidth: 1, borderColor: 'rgba(139,92,246,0.25)',
            marginBottom: Spacing.sm,
          }}
          placeholder="Ваше ім'я"
          placeholderTextColor={Colors.textMuted}
          value={userName}
          onChangeText={setUserName}
          autoCapitalize="words"
          maxLength={30}
        />
        <View style={styles.wheelsRow}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <WheelPicker data={DAYS} initialIdx={DAYS.indexOf('15')} onChange={setDay} />
            <Text style={styles.wheelLabel}>ДЕНЬ</Text>
          </View>
          <View style={styles.wheelsDivider} />
          <View style={{ flex: 2, alignItems: 'center' }}>
            <WheelPicker data={MONTHS} initialIdx={5} onChange={setMonth} />
            <Text style={styles.wheelLabel}>МІСЯЦЬ</Text>
          </View>
          <View style={styles.wheelsDivider} />
          <View style={{ flex: 1.3, alignItems: 'center' }}>
            <WheelPicker data={YEARS} initialIdx={YEARS.indexOf('1990')} onChange={setYear} />
            <Text style={styles.wheelLabel}>РІК</Text>
          </View>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.3)', fontSize: 9, textAlign: 'center', marginTop: 6 }}>
          Дата зберігається лише на твоєму пристрої та використовується тільки для розрахунку матриці
        </Text>
      </View>

      <View style={styles.bottomBtn}>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85} disabled={!userName.trim()}>
          <LinearGradient
            colors={userName.trim() ? ['#C8901A', '#F5C542', '#C8901A'] : ['#3A3A4A', '#4A4A5A', '#3A3A4A']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[styles.bigBtn, !userName.trim() && { opacity: 0.5 }]}
          >
            <Text style={styles.bigBtnTextDark}>Розрахувати мою матрицю</Text>
            <Ionicons name="arrow-forward" size={18} color="#1A0800" />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Step 6: Generating ────────────────────────────────────────────────────────
function GeneratingStep({ onDone }: { onDone: () => void }) {
  const GEN_STEPS = [
    'Зчитуємо вашу дату народження...',
    'Розраховуємо 22 енергії матриці...',
    'Визначаємо особистість та душу...',
    'Аналізуємо кармічні уроки...',
    'Матриця готова!',
  ];
  const [stepIdx, setStepIdx] = useState(0);
  const [done, setDone]       = useState(false);
  const progress   = useRef(new Animated.Value(0)).current;
  const fadeIn     = useRef(new Animated.Value(0)).current;
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkFade  = useRef(new Animated.Value(0)).current;
  const pulseScale = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.timing(fadeIn, { toValue: 1, duration: 500, useNativeDriver: true }).start();

    // Pulsing orb animation
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseScale,   { toValue: 1.15, duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 1,    duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(pulseScale,   { toValue: 1,    duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(pulseOpacity, { toValue: 0.6,  duration: 1000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ]),
      ])
    ).start();

    let idx = 0;
    const tick = () => {
      if (idx >= GEN_STEPS.length - 1) {
        setStepIdx(GEN_STEPS.length - 1);
        setDone(true);
        Animated.sequence([
          Animated.timing(checkFade,  { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.spring(checkScale, { toValue: 1, tension: 50, friction: 6, useNativeDriver: true }),
        ]).start();
        Animated.timing(progress, { toValue: 1, duration: 600, useNativeDriver: false }).start();
        setTimeout(onDone, 1800);
        return;
      }
      idx++;
      setStepIdx(idx);
      Animated.timing(progress, {
        toValue: idx / (GEN_STEPS.length - 1),
        duration: 500,
        useNativeDriver: false,
      }).start();
      setTimeout(tick, 900);
    };
    setTimeout(tick, 800);
  }, []);

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Animated.View style={[styles.planContainer, { opacity: fadeIn }]}>
      {/* Animated orb */}
      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        <View style={styles.sphereWrap}>
          <Animated.View style={[
            StyleSheet.absoluteFill,
            {
              borderRadius: 999,
              backgroundColor: 'rgba(139,92,246,0.15)',
              transform: [{ scale: pulseScale }],
              opacity: pulseOpacity,
            }
          ]} />
          <LinearGradient
            colors={['#7C3AED', '#5B21B6', '#3B0764']}
            style={{ width: '100%', height: '100%', borderRadius: 999, alignItems: 'center', justifyContent: 'center' }}
          >
            {done ? (
              <Animated.View style={{ opacity: checkFade, transform: [{ scale: checkScale }] }}>
                <Ionicons name="checkmark" size={56} color="#F5C542" />
              </Animated.View>
            ) : (
              <Ionicons name="infinite-outline" size={56} color="rgba(255,255,255,0.9)" />
            )}
          </LinearGradient>
          <View style={[StyleSheet.absoluteFill, { borderRadius: 999, borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)' }]} pointerEvents="none" />
        </View>
      </View>

      <Text style={styles.planTitle}>{done ? 'Готово!' : 'Розраховуємо матрицю...'}</Text>
      <Text style={styles.planSubtitle}>{done ? 'Ваша персональна матриця розрахована' : GEN_STEPS[stepIdx]}</Text>

      <View style={styles.progressTrack}>
        <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
      </View>

      <View style={styles.planStepsList}>
        {GEN_STEPS.slice(0, -1).map((s, i) => (
          <View key={i} style={styles.planStepRow}>
            <View style={[
              styles.planStepDot,
              i < stepIdx && styles.planStepDotDone,
              i === stepIdx && styles.planStepDotActive,
            ]}>
              {i < stepIdx
                ? <Ionicons name="checkmark" size={10} color="#fff" />
                : <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === stepIdx ? '#F5C542' : 'rgba(255,255,255,0.2)' }} />
              }
            </View>
            <Text style={[
              styles.planStepText,
              i < stepIdx  && { color: '#A78BFA' },
              i === stepIdx && { color: '#F5C542', fontWeight: '600' },
            ]}>{s}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

// ─── Step 7: Aha Teaser ────────────────────────────────────────────────────────
function AhaTeaserStep({ onNext, birthDate }: { onNext: () => void; birthDate: string }) {
  const { fadeIn, slideUp } = useEntrance();
  const { locale } = useI18n();
  const [aiTeaser, setAiTeaser]   = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(true);

  const matrixData = React.useMemo(() => {
    if (!birthDate) return null;
    try {
      const parts = birthDate.split('.');
      const dateStr = parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : birthDate;
      return calculateMatrix(dateStr);
    } catch { return null; }
  }, [birthDate]);

  // Shimmer + floating CTA
  const shimmerX = useRef(new Animated.Value(-200)).current;
  const floatY   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const runShimmer = () => {
      shimmerX.setValue(-200);
      Animated.timing(shimmerX, { toValue: 400, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: true })
        .start(() => setTimeout(runShimmer, 3000));
    };
    setTimeout(runShimmer, 1200);

    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -4, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue:  0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // AI teaser
  useEffect(() => {
    if (!matrixData) { setAiLoading(false); return; }
    const personalEnergy = getEnergyById(matrixData.personality);
    const soulEnergy = getEnergyById(matrixData.soul);
    const karmicEnergy = getEnergyById(matrixData.karmicTail);
    const prompt = `Матриця Долі людини: особистість=${matrixData.personality} (${personalEnergy?.name}, ${personalEnergy?.positive}), душа=${matrixData.soul} (${soulEnergy?.name}), кармічний хвіст=${matrixData.karmicTail} (${karmicEnergy?.name}).

Напиши коротку персональну записку (3-4 речення) за формулою:
1. Сильна сторона: конкретно похвали на основі числа Особистості
2. Прихована перешкода: м'яко вкажи що кармічний хвіст блокує щось конкретне (фінанси АБО стосунки АБО кар'єру)
3. Інтрига: закінчи тим що повний аналіз матриці покаже як зняти цей блок

Пиши тепло, впевнено. НЕ використовуй слова "Premium" чи "підписка". Відповідай УКРАЇНСЬКОЮ.`;

    askClaude(
      'You are a Destiny Matrix expert. Write concisely, accurately, and intriguingly. Every word should create the feeling "this is about me".',
      [],
      prompt,
      400,
      locale,
    )
      .then((text) => setAiTeaser(text))
      .catch(() => setAiTeaser('Your matrix reveals powerful potential as a leader and creator. But the karmic tail points to a hidden block that holds back growth. The full matrix analysis will reveal a concrete path to remove this limitation.'))
      .finally(() => setAiLoading(false));
  }, []);

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepHeader}>
          <Text style={[styles.stepTitle, { marginTop: 12 }]}>Ось, що ми вже{'\n'}бачимо про тебе</Text>
        </View>

        {/* Matrix preview with gradient overlay */}
        {matrixData && (
          <View style={styles.ahaMatrixWrap}>
            <MatrixDiagram data={matrixData} size={260} />
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <LinearGradient
                colors={['transparent', 'rgba(8,1,26,0.25)', 'rgba(8,1,26,0.6)', 'rgba(8,1,26,0.95)']}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              />
            </View>
            <View style={styles.ahaMatrixLock} pointerEvents="none">
              <Text style={{ color: Colors.accent, fontSize: FontSize.sm, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' }}>
                ✦ Твоя унікальна Матриця ✦
              </Text>
            </View>
          </View>
        )}

        {/* Personal matrix analysis */}
        {matrixData && (() => {
          const pText = getPositionText('personality', matrixData.personality, matrixData);
          const sText = getPositionText('soul', matrixData.soul, matrixData);
          const personality = getEnergyById(matrixData.personality);
          const soul = getEnergyById(matrixData.soul);
          const destiny = getEnergyById(matrixData.destiny);

          return (
            <View style={styles.ahaCard}>
              <Text style={{ color: Colors.accent, fontSize: FontSize.xs, fontWeight: '800', letterSpacing: 2, textTransform: 'uppercase', textAlign: 'center', marginBottom: Spacing.sm }}>
                ТВОЯ МАТРИЦЯ ДОЛІ
              </Text>

              {/* Personality — fully open */}
              <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="person-outline" size={18} color="#F59E0B" />
                  <Text style={{ color: Colors.text, fontSize: FontSize.sm, fontWeight: '600' }}>Особистість</Text>
                </View>
                <Text style={{ color: '#F59E0B', fontSize: FontSize.md, fontWeight: '800', marginTop: 6 }}>
                  {matrixData.personality}. {personality?.name}
                </Text>
                <Text style={{ color: Colors.textSecondary, fontSize: FontSize.md, marginTop: 6, lineHeight: 22 }}>
                  {pText?.full ?? personality?.positive}
                </Text>
              </View>

              {/* Soul — teaser */}
              <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="heart-outline" size={18} color="#818CF8" />
                  <Text style={{ color: Colors.text, fontSize: FontSize.sm, fontWeight: '600' }}>Душа</Text>
                </View>
                <Text style={{ color: '#818CF8', fontSize: FontSize.md, fontWeight: '800', marginTop: 6 }}>
                  {matrixData.soul}. {soul?.name}
                </Text>
                <View style={{ overflow: 'hidden', maxHeight: 48 }}>
                  <Text style={{ color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 20 }}>
                    {sText?.short ?? soul?.positive}
                  </Text>
                </View>
                <LinearGradient colors={['transparent', 'rgba(8,1,26,0.92)']} style={{ marginTop: -12, paddingTop: 12, paddingBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="lock-closed" size={12} color={Colors.accent} />
                    <Text style={{ color: Colors.accent, fontSize: FontSize.xs, fontWeight: '700' }}>Повний аналіз доступний у Premium</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Destiny — teaser */}
              <View style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name="compass-outline" size={18} color="#2563EB" />
                  <Text style={{ color: Colors.text, fontSize: FontSize.sm, fontWeight: '600' }}>Доля</Text>
                </View>
                <Text style={{ color: '#60A5FA', fontSize: FontSize.md, fontWeight: '800', marginTop: 6 }}>
                  {matrixData.destiny}. {destiny?.name}
                </Text>
                <LinearGradient colors={['transparent', 'rgba(8,1,26,0.92)']} style={{ paddingTop: 8, paddingBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="lock-closed" size={12} color={Colors.accent} />
                    <Text style={{ color: Colors.accent, fontSize: FontSize.xs, fontWeight: '700' }}>Повний аналіз доступний у Premium</Text>
                  </View>
                </LinearGradient>
              </View>

              {/* Locked items */}
              {[
                { icon: 'star-outline' as const, label: 'Талант від Бога',   color: '#0D9488', hint: 'Ваш унікальний дар та як його реалізувати' },
                { icon: 'cash-outline' as const, label: 'Фінансовий канал',  color: '#10B981', hint: 'Як розблокувати потік грошей та які професії підходять' },
                { icon: 'heart-circle-outline' as const, label: 'Стосунки та кохання', color: '#EC4899', hint: 'Який партнер підходить та чому не складаються відносини' },
                { icon: 'infinite-outline' as const, label: 'Кармічний урок', color: '#D97706', hint: 'Що блокує ваш розвиток та як це подолати' },
              ].map((item) => (
                <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)', opacity: 0.6 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: item.color + '15', alignItems: 'center', justifyContent: 'center' }}>
                    <Ionicons name={item.icon} size={16} color={item.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.text, fontSize: FontSize.sm, fontWeight: '600' }}>{item.label}</Text>
                    <Text style={{ color: Colors.textMuted, fontSize: FontSize.xs, marginTop: 2 }}>{item.hint}</Text>
                  </View>
                  <Ionicons name="lock-closed" size={14} color={Colors.textMuted} />
                </View>
              ))}
            </View>
          );
        })()}

        {/* AI teaser */}
        {!aiLoading && aiTeaser && (
          <View style={styles.ahaCard}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm }}>
              <Ionicons name="sparkles" size={16} color={Colors.accent} />
              <Text style={{ color: Colors.accent, fontSize: FontSize.sm, fontWeight: '700' }}>AI-аналіз для тебе</Text>
            </View>
            <Text style={[styles.ahaCardText, { lineHeight: 22 }]}>{aiTeaser}</Text>
          </View>
        )}
        {aiLoading && (
          <View style={[styles.ahaCard, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
            <Ionicons name="sparkles" size={24} color={Colors.accent} />
            <Text style={{ color: Colors.textMuted, fontSize: FontSize.sm, marginTop: Spacing.sm }}>Готуємо AI-аналіз...</Text>
          </View>
        )}
      </ScrollView>

      {/* Floating CTA */}
      <View style={[styles.bottomBtn, { paddingBottom: Platform.OS === 'ios' ? 48 : 56 }]}>
        <Animated.View style={{ transform: [{ translateY: floatY }] }}>
          <TouchableOpacity onPress={() => { Vibration.vibrate(35); onNext(); }} activeOpacity={0.88}>
            <LinearGradient
              colors={['#C8901A', '#F5C542', '#C8901A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={[styles.bigBtn, { overflow: 'hidden' }]}
            >
              <Text style={styles.bigBtnTextDark}>Розблокуй свою Матрицю</Text>
              <Ionicons name="arrow-forward" size={18} color="#1A0800" />
              <Animated.View
                pointerEvents="none"
                style={{
                  position: 'absolute', top: 0, bottom: 0, width: 80,
                  backgroundColor: 'rgba(255,255,255,0.22)',
                  transform: [{ translateX: shimmerX }, { skewX: '-18deg' }],
                }}
              />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

// ─── Google Sign-In helper ─────────────────────────────────────────────────────
function getGoogleSignin() {
  try {
    const { GoogleSignin, statusCodes } = require('@react-native-google-signin/google-signin');
    GoogleSignin.configure({
      webClientId: '113578995852-gphg055rh0mopfnub9iosj9d7crfujh1.apps.googleusercontent.com',
      iosClientId: '113578995852-djgn7a9n3ideromo4k19rbkb51d02kcu.apps.googleusercontent.com',
      scopes: ['email', 'profile'],
    });
    return { GoogleSignin, statusCodes };
  } catch {
    return null;
  }
}

// ─── Step 8: Registration ──────────────────────────────────────────────────────
function RegistrationStep({ onDone }: { onDone: (authenticated?: boolean) => void }) {
  const { fadeIn, slideUp } = useEntrance();
  const [loadingApple,  setLoadingApple]  = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const BULLETS = [
    { icon: 'grid-outline'  as const, label: 'Збережи свою матрицю назавжди' },
    { icon: 'time-outline'  as const, label: 'Доступ до розкладів Таро та персональних прогнозів' },
    { icon: 'sync-outline'  as const, label: 'Синхронізація між пристроями' },
  ];

  const handleAppleSignIn = async () => {
    setLoadingApple(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (credential.identityToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });
        if (error) throw error;
        onDone(true);
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Помилка', e.message ?? 'Не вдалось увійти через Apple');
      }
    } finally {
      setLoadingApple(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoadingGoogle(true);
    try {
      const gs = getGoogleSignin();
      if (!gs) {
        Alert.alert('Помилка', 'Google Sign-In недоступний у цьому середовищі');
        return;
      }
      const { GoogleSignin, statusCodes } = gs;
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) throw error;
        onDone(true);
      }
    } catch (e: any) {
      const CANCELLED = '12501';
      if (e.code !== CANCELLED && e.code !== 'SIGN_IN_CANCELLED') {
        Alert.alert('Помилка', e.message ?? 'Не вдалось увійти через Google');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <Animated.View style={[{ flex: 1 }, { opacity: fadeIn, transform: [{ translateY: slideUp }] }]}>
      <View style={{ flex: 1, paddingHorizontal: Spacing.lg }}>
        <View style={styles.stepHeader}>
          <Text style={[styles.stepTitle, { marginTop: 12 }]}>Збережи свій результат</Text>
          <Text style={styles.stepSub}>Зареєструйся, щоб не втратити матрицю та отримати повний доступ</Text>
        </View>

        <View style={{ gap: 14, marginBottom: Spacing.xl }}>
          {BULLETS.map((b, i) => (
            <View key={i} style={styles.regBullet}>
              <View style={styles.regBulletIcon}>
                <Ionicons name={b.icon} size={18} color="#F5C542" />
              </View>
              <Text style={styles.regBulletText}>{b.label}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: 12 }}>
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              onPress={handleAppleSignIn}
              activeOpacity={0.85}
              disabled={loadingApple || loadingGoogle}
              style={styles.socialBtn}
            >
              <Ionicons name="logo-apple" size={20} color="#fff" />
              <Text style={styles.socialBtnText}>
                {loadingApple ? 'Завантаження...' : 'Продовжити через Apple'}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={handleGoogleSignIn}
            activeOpacity={0.85}
            disabled={loadingApple || loadingGoogle}
            style={styles.socialBtn}
          >
            <Text style={{ fontSize: 18, color: '#fff', fontWeight: '700' }}>G</Text>
            <Text style={styles.socialBtnText}>
              {loadingGoogle ? 'Завантаження...' : 'Продовжити через Google'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/auth/register')}
            activeOpacity={0.85}
            style={[styles.socialBtn, { borderColor: 'rgba(255,255,255,0.15)', backgroundColor: 'rgba(255,255,255,0.05)' }]}
          >
            <Ionicons name="mail-outline" size={20} color="rgba(255,255,255,0.7)" />
            <Text style={[styles.socialBtnText, { color: 'rgba(255,255,255,0.7)' }]}>Зареєструватися через email</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={() => router.navigate('/auth/login' as any)} style={{ alignSelf: 'center', marginTop: Spacing.md }}>
          <Text style={{ color: Colors.primaryLight, fontSize: FontSize.sm }}>
            Вже маю акаунт — Увійти
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => onDone(false)} activeOpacity={0.85} style={{ marginTop: Spacing.md }}>
          <View style={{ height: 48, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.5)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(139,92,246,0.12)' }}>
            <Text style={{ color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: '600' }}>Продовжити без реєстрації</Text>
          </View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ step }: { step: Step }) {
  const idx = PROGRESS_STEPS.indexOf(step);
  const total = PROGRESS_STEPS.length;
  const progress = useRef(new Animated.Value(0)).current;
  const mounted  = useRef(false);

  useEffect(() => {
    if (idx < 0) return;
    const target = (idx + 1) / total;
    if (!mounted.current) {
      mounted.current = true;
      Animated.spring(progress, { toValue: target, tension: 55, friction: 9, useNativeDriver: false }).start();
    } else {
      Animated.spring(progress, { toValue: target, tension: 80, friction: 10, useNativeDriver: false }).start();
    }
  }, [idx]);

  const barWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  if (idx < 0) return null;

  return (
    <View style={styles.progressBarWrap} pointerEvents="none">
      <View style={styles.progressBarTrack}>
        <Animated.View style={[styles.progressBarFill, { width: barWidth }]} />
      </View>
    </View>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const [step,      setStep]      = useState<Step>('welcome');
  const [birthDate, setBirthDate] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [intent,    setIntent]    = useState('self');
  const [focus,     setFocus]     = useState('clarity');

  const setUserProfile         = useAppStore((s) => s.setUserProfile);
  const setOnboardingCompleted = useAppStore((s) => s.setOnboardingCompleted);

  const handleDone = async (authenticated = false) => {
    await SecureStore.setItemAsync('onboarding_done', 'true');
    setUserProfile(nameInput, birthDate);
    setOnboardingCompleted();

    if (!authenticated) {
      const guestId = 'guest_' + Date.now();
      useAppStore.setState({ isAuthenticated: true, userId: guestId });
    }

    // Compute and store matrix in zustand if birth date available
    if (birthDate) {
      try {
        const parts = birthDate.split('.');
        if (parts.length === 3) {
          const dateStr = `${parts[2]}-${parts[1]}-${parts[0]}`;
          calculateMatrix(dateStr); // validates the date
        }
      } catch {}
    }

    router.replace('/(tabs)');
  };

  return (
    <StarBackground style={{ flex: 1 }}>
      <View style={styles.onboardingContainer}>
        {step === 'welcome' && (
          <WelcomeStep onNext={() => setStep('intent')} />
        )}
        {step === 'intent' && (
          <IntentStep
            onNext={(i) => { setIntent(i); setStep('focus'); }}
            onBack={() => setStep('welcome')}
          />
        )}
        {step === 'focus' && (
          <FocusStep
            onNext={(f) => { setFocus(f); setStep('gender'); }}
            onBack={() => setStep('intent')}
          />
        )}
        {step === 'gender' && (
          <GenderStep
            onNext={() => setStep('dob')}
            onBack={() => setStep('focus')}
          />
        )}
        {step === 'dob' && (
          <BirthDateStep
            onNext={(bd, name) => { setBirthDate(bd); setNameInput(name); setStep('generating'); }}
            onBack={() => setStep('gender')}
          />
        )}
        {step === 'generating' && (
          <GeneratingStep onDone={() => setStep('aha')} />
        )}
        {step === 'aha' && (
          <AhaTeaserStep onNext={() => setStep('registration')} birthDate={birthDate} />
        )}
        {step === 'registration' && (
          <RegistrationStep onDone={handleDone} />
        )}

        <ProgressBar step={step} />
      </View>
    </StarBackground>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  onboardingContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  stepHeader: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 50,
    paddingBottom: Spacing.sm,
    alignItems: 'center',
  },
  backBtn: {
    marginBottom: Spacing.md,
    alignSelf: 'flex-start',
  },
  stepTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 6,
    lineHeight: 40,
    textAlign: 'center',
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#fff',
    lineHeight: 44,
    textAlign: 'center',
  },
  stepSub: {
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.80)',
    lineHeight: 20,
    textAlign: 'center',
  },
  bigBtn: {
    borderRadius: BorderRadius.full,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#F5C542',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 10,
  },
  bigBtnTextDark: {
    color: '#1A0800',
    fontSize: FontSize.md,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  bottomBtn: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : 48,
    paddingTop: Spacing.sm,
  },

  // List row (options)
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(22,10,55,0.7)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
    gap: 14,
  },
  listRowActive: {
    borderColor: 'rgba(139,92,246,0.6)',
  },
  listIcon: {
    width: 42, height: 42, borderRadius: 12,
    backgroundColor: 'rgba(139,92,246,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  listIconActive: {
    backgroundColor: 'rgba(139,92,246,0.28)',
  },
  listLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.md,
    fontWeight: '500',
    lineHeight: 22,
  },
  listLabelActive: {
    color: '#fff',
    fontWeight: '700',
  },
  radio: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: {
    borderColor: '#F5C542',
    backgroundColor: 'rgba(245,197,66,0.12)',
  },
  radioDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#F5C542',
  },

  // Wheel picker
  wheelOuter: {
    height: ITEM_H * 5,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  wheelFadeTop: {
    position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * 2, zIndex: 2,
  },
  wheelFadeBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * 2, zIndex: 2,
  },
  wheelHighlight: {
    position: 'absolute',
    top: ITEM_H * 2, height: ITEM_H,
    left: 0, right: 0, zIndex: 1,
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(245,197,66,0.4)',
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  wheelItem: {
    height: ITEM_H, alignItems: 'center', justifyContent: 'center',
  },
  wheelItemText: {
    color: '#fff', fontSize: FontSize.md, fontWeight: '500',
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(22,10,55,0.7)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.2)',
    overflow: 'hidden',
    paddingVertical: 4,
  },
  wheelsDivider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: 'rgba(139,92,246,0.2)',
    marginVertical: 8,
  },
  wheelLabel: {
    color: Colors.accent, fontSize: 9, fontWeight: '800',
    letterSpacing: 1.5, marginTop: 4, marginBottom: 4,
  },

  // Generating
  planContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  sphereWrap: {
    width: 160, height: 160, borderRadius: 80,
    overflow: 'hidden',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 30, elevation: 12,
  },
  planTitle: {
    color: '#fff', fontSize: FontSize.xl, fontWeight: '900',
    textAlign: 'center', marginBottom: Spacing.sm,
  },
  planSubtitle: {
    color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm,
    textAlign: 'center', marginBottom: Spacing.lg,
  },
  progressTrack: {
    width: '100%', height: 6, borderRadius: 3,
    backgroundColor: 'rgba(139,92,246,0.2)', marginBottom: Spacing.lg,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: '#F5C542',
  },
  planStepsList: {
    width: '100%', gap: Spacing.sm,
  },
  planStepRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  planStepDot: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(139,92,246,0.2)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  planStepDotDone: {
    backgroundColor: '#7C3AED', borderColor: '#7C3AED',
  },
  planStepDotActive: {
    backgroundColor: 'rgba(245,197,66,0.15)', borderColor: '#F5C542',
  },
  planStepText: {
    color: 'rgba(255,255,255,0.5)', fontSize: FontSize.sm, flex: 1,
  },

  // Aha step
  ahaMatrixWrap: {
    backgroundColor: 'rgba(22,10,55,0.6)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingVertical: Spacing.lg,
    marginBottom: Spacing.md,
    position: 'relative',
  },
  ahaMatrixLock: {
    position: 'absolute', bottom: 12, left: 0, right: 0,
    alignItems: 'center', justifyContent: 'center',
  },
  ahaCard: {
    backgroundColor: 'rgba(22,10,55,0.7)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.25)',
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  ahaCardText: {
    color: Colors.textSecondary, fontSize: FontSize.md,
  },

  // Registration
  regBullet: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
  },
  regBulletIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(245,197,66,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  regBulletText: {
    color: Colors.text, fontSize: FontSize.sm, fontWeight: '500', flex: 1,
  },
  socialBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 12, height: 52, borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(22,10,55,0.8)',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.4)',
  },
  socialBtnText: {
    color: '#fff', fontSize: FontSize.md, fontWeight: '600',
  },

  // Progress bar
  progressBarWrap: {
    position: 'absolute', top: 0, left: 0, right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 54 : 14,
  },
  progressBarTrack: {
    height: 3, borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', borderRadius: 2,
    backgroundColor: '#F5C542',
  },
});
