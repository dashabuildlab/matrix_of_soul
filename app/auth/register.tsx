import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { registerWithEmail } from '../../lib/firebaseAuth';
import { getAuthErrorMessage } from '../../lib/firebaseAuthErrors';
import { useAppStore } from '../../stores/useAppStore';

// ── Date wheel data ──────────────────────────────────────────────────────────
const DAYS   = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));
const MONTHS = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const YEARS  = Array.from({ length: 71 }, (_, i) => String(1940 + i));

const ITEM_H = 44;

// ── Wheel Picker ─────────────────────────────────────────────────────────────
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
    <View style={wheelStyles.outer}>
      <LinearGradient
        colors={['rgba(13,11,30,1)', 'rgba(13,11,30,0)']}
        style={wheelStyles.fadeTop}
        pointerEvents="none"
      />
      <View style={wheelStyles.highlight} pointerEvents="none" />
      <LinearGradient
        colors={['rgba(13,11,30,0)', 'rgba(13,11,30,1)']}
        style={wheelStyles.fadeBottom}
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
          <View key={i} style={wheelStyles.item}>
            <Text style={wheelStyles.itemText}>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  outer: {
    height: ITEM_H * 5,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  fadeTop: {
    position: 'absolute', top: 0, left: 0, right: 0,
    height: ITEM_H * 2, zIndex: 2,
  },
  fadeBottom: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: ITEM_H * 2, zIndex: 2,
  },
  highlight: {
    position: 'absolute',
    top: ITEM_H * 2, height: ITEM_H,
    left: 0, right: 0, zIndex: 1,
    borderTopWidth: 1, borderBottomWidth: 1,
    borderColor: 'rgba(245,197,66,0.4)',
    backgroundColor: 'rgba(139,92,246,0.08)',
  },
  item: {
    height: ITEM_H, alignItems: 'center', justifyContent: 'center',
  },
  itemText: {
    color: '#fff', fontSize: FontSize.md, fontWeight: '500',
  },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function RegisterScreen() {
  const existingBirthDate = useAppStore((s) => s.userBirthDate);
  const setUserProfile    = useAppStore((s) => s.setUserProfile);

  const [name,            setName]            = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading,         setLoading]         = useState(false);
  const [showPassword,    setShowPassword]    = useState(false);

  // Parse existing birth date from store (DD.MM.YYYY) into wheel indices
  function parseStoredDate() {
    if (!existingBirthDate) return { dayIdx: 14, monthIdx: 5, yearIdx: YEARS.indexOf('1990') };
    const parts = existingBirthDate.split('.');
    if (parts.length !== 3) return { dayIdx: 14, monthIdx: 5, yearIdx: YEARS.indexOf('1990') };
    const d = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const y = parts[2];
    return {
      dayIdx:   Math.max(0, d - 1),
      monthIdx: Math.max(0, m - 1),
      yearIdx:  Math.max(0, YEARS.indexOf(y)),
    };
  }

  const initial = parseStoredDate();
  const [day,   setDay]   = useState(DAYS[initial.dayIdx]);
  const [month, setMonth] = useState(MONTHS[initial.monthIdx]);
  const [year,  setYear]  = useState(YEARS[initial.yearIdx === -1 ? YEARS.indexOf('1990') : initial.yearIdx]);

  // Entrance animation
  const fadeIn    = useRef(new Animated.Value(0)).current;
  const slideUp   = useRef(new Animated.Value(20)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeIn,  { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(slideUp, { toValue: 0, duration: 400, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, []);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Помилка', 'Заповніть всі поля');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Помилка', 'Паролі не співпадають');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Помилка', 'Пароль має бути мінімум 6 символів');
      return;
    }

    const mm = String(MONTHS.indexOf(month) + 1).padStart(2, '0');
    const birthDateStr = `${day}.${mm}.${year}`;

    try {
      setLoading(true);
      const user = await registerWithEmail(email.trim(), password);
      setUserProfile(name.trim(), birthDateStr);
      useAppStore.setState({ isAuthenticated: true, userId: user.uid });
      router.replace('/(tabs)');
    } catch (err: any) {
      const msg = getAuthErrorMessage(err?.code ?? '', true) || err?.message || 'Помилка мережі. Перевірте з\'єднання.';
      Alert.alert('Помилка реєстрації', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeIn, transform: [{ translateY: slideUp }] }}>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconWrap}>
              <LinearGradient colors={['#4C1D95', '#7C3AED']} style={styles.iconGradient}>
                <Ionicons name="person-add-outline" size={28} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Створити акаунт</Text>
            <Text style={styles.subtitle}>
              Зареєструйтесь, щоб зберігати матриці та розклади
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>

            {/* Name */}
            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ваше ім'я"
                placeholderTextColor={Colors.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            {/* Birth date — wheel picker */}
            <View style={styles.sectionBlock}>
              <View style={styles.sectionHeader}>
                <Ionicons name="calendar-outline" size={16} color={Colors.accent} />
                <Text style={styles.sectionLabel}>Дата народження</Text>
              </View>
              <View style={styles.wheelsRow}>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <WheelPicker
                    data={DAYS}
                    initialIdx={initial.dayIdx}
                    onChange={setDay}
                  />
                  <Text style={styles.wheelLabel}>ДЕНЬ</Text>
                </View>
                <View style={styles.wheelsDivider} />
                <View style={{ flex: 2, alignItems: 'center' }}>
                  <WheelPicker
                    data={MONTHS}
                    initialIdx={initial.monthIdx}
                    onChange={setMonth}
                  />
                  <Text style={styles.wheelLabel}>МІСЯЦЬ</Text>
                </View>
                <View style={styles.wheelsDivider} />
                <View style={{ flex: 1.3, alignItems: 'center' }}>
                  <WheelPicker
                    data={YEARS}
                    initialIdx={initial.yearIdx === -1 ? YEARS.indexOf('1990') : initial.yearIdx}
                    onChange={setYear}
                  />
                  <Text style={styles.wheelLabel}>РІК</Text>
                </View>
              </View>
              <View style={styles.dobHint}>
                <Ionicons name="lock-closed-outline" size={10} color="rgba(245,197,66,0.6)" />
                <Text style={styles.dobHintText}>Зберігається тільки на вашому пристрої</Text>
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Пароль"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Confirm password */}
            <View style={styles.inputContainer}>
              <Ionicons name="shield-checkmark-outline" size={20} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Підтвердіть пароль"
                placeholderTextColor={Colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>

            <Button title="Зареєструватися" onPress={handleRegister} loading={loading} />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Вже є акаунт? </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>Увійти</Text>
            </TouchableOpacity>
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
    paddingBottom: 48,
  },

  header: { alignItems: 'center', marginBottom: Spacing.xl },
  iconWrap: { marginBottom: Spacing.md },
  iconGradient: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  title: {
    fontSize: FontSize.xxl, fontWeight: '800',
    color: Colors.text, marginBottom: Spacing.sm, textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    lineHeight: 20, textAlign: 'center',
  },

  form: { gap: Spacing.md },

  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1, color: Colors.text,
    fontSize: FontSize.md, paddingVertical: Spacing.md,
  },
  eyeIcon: { padding: Spacing.sm },

  // Birth date block
  sectionBlock: {
    backgroundColor: 'rgba(22,10,55,0.7)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.25)',
    overflow: 'hidden',
    paddingBottom: Spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  sectionLabel: {
    color: Colors.accent, fontSize: FontSize.sm, fontWeight: '700', letterSpacing: 0.5,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  wheelsDivider: {
    width: 1, alignSelf: 'stretch',
    backgroundColor: 'rgba(139,92,246,0.2)',
    marginVertical: 8,
  },
  wheelLabel: {
    color: Colors.accent, fontSize: 9, fontWeight: '800',
    letterSpacing: 1.5, marginTop: 4, marginBottom: 2,
  },
  dobHint: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md,
  },
  dobHintText: {
    color: 'rgba(245,197,66,0.6)', fontSize: 9,
  },

  footer: {
    flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl,
  },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.md },
  footerLink: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '600' },
});
