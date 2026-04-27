import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, KeyboardAvoidingView,
  Platform, ScrollView, TouchableOpacity, Alert, Animated, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Button } from '../../components/ui/Button';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../stores/useAppStore';

const { width, height } = Dimensions.get('window');

const DOTS = Array.from({ length: 18 }, (_, i) => ({
  x: (i * 79 + (i % 4) * 30) % (width - 10),
  y: (i * 103 + (i % 3) * 45) % (height - 10),
  r: 1.5 + (i % 3) * 0.5,
  o: 0.07 + (i % 4) * 0.025,
}));

GoogleSignin.configure({
  webClientId: '113578995852-gphg055rh0mopfnub9iosj9d7crfujh1.apps.googleusercontent.com',
  iosClientId: '113578995852-djgn7a9n3ideromo4k19rbkb51d02kcu.apps.googleusercontent.com',
  scopes: ['email', 'profile'],
});

export default function LoginScreen() {
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [loadingApple, setLoadingApple]   = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [showPassword, setShowPassword]   = useState(false);
  const setUserProfile = useAppStore((s) => s.setUserProfile);

  const logoAnim  = useRef(new Animated.Value(0)).current;
  const formAnim  = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoPulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoAnim,  { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
      Animated.timing(formAnim,  { toValue: 1, duration: 500, delay: 200, useNativeDriver: true }),
    ]).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoPulse, { toValue: 1.08, duration: 2400, useNativeDriver: true }),
        Animated.timing(logoPulse, { toValue: 1,    duration: 2400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const formTranslate = formAnim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] });

  const handleSkip = () => {
    useAppStore.setState({ isAuthenticated: true, userId: 'guest-user' });
    setUserProfile('Гість', '');
    router.replace('/(tabs)');
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Помилка', 'Заповніть всі поля');
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) Alert.alert('Помилка входу', error.message ?? 'Невідома помилка');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Помилка мережі. Перевірте з\'єднання.';
      Alert.alert('Помилка', msg);
    } finally {
      setLoading(false);
    }
  };

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
      await GoogleSignin.hasPlayServices();
      await GoogleSignin.signIn();
      const { idToken } = await GoogleSignin.getTokens();
      if (idToken) {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: idToken,
        });
        if (error) throw error;
      }
    } catch (e: any) {
      if (e.code !== statusCodes.SIGN_IN_CANCELLED) {
        Alert.alert('Помилка', e.message ?? 'Не вдалось увійти через Google');
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={['rgba(196,181,253,0.4)', 'transparent']}
          style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, top: -60, right: -70 }}
        />
        <LinearGradient
          colors={['rgba(167,139,250,0.25)', 'transparent']}
          style={{ position: 'absolute', width: 220, height: 220, borderRadius: 110, bottom: height * 0.18, left: -80 }}
        />
        <LinearGradient
          colors={['rgba(221,214,254,0.3)', 'transparent']}
          style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, bottom: -30, right: -30 }}
        />
        <View style={[styles.bgRing, { width: 160, height: 160, top: -40, right: -40, opacity: 0.07 }]} />
        <View style={[styles.bgRing, { width: 110, height: 110, top: -15, right: -15, opacity: 0.09 }]} />
        <View style={[styles.bgRing, { width: 150, height: 150, bottom: 60, left: -60, opacity: 0.07 }]} />
        {DOTS.map((d, i) => (
          <View key={i} style={{
            position: 'absolute',
            width: d.r * 2, height: d.r * 2, borderRadius: d.r,
            backgroundColor: `rgba(139,92,246,${d.o})`,
            top: d.y, left: d.x,
          }} />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Animated.View style={{ opacity: logoAnim, transform: [{ scale: logoScale }] }}>
            <Animated.View style={{ transform: [{ scale: logoPulse }] }}>
              <LinearGradient
                colors={[Colors.primaryDark, Colors.primary]}
                style={styles.logoRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.logoInner}>
                  <Ionicons name="sparkles" size={36} color="#FFFFFF" />
                </View>
              </LinearGradient>
            </Animated.View>
          </Animated.View>
          <Animated.View style={{ opacity: logoAnim, transform: [{ translateY: formTranslate }] }}>
            <Text style={styles.appName}>Matrix of Soul</Text>
            <Text style={styles.appTagline}>Відкрий свою долю</Text>
          </Animated.View>
        </View>

        <Animated.View style={[styles.form, { opacity: formAnim, transform: [{ translateY: formTranslate }] }]}>
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

          <Button title="Увійти" onPress={handleLogin} loading={loading} />

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn} activeOpacity={0.7}>
            <Text style={styles.skipText}>Зареєструватися пізніше</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>або</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Apple Sign In — показуємо тільки на iOS */}
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.socialButton, loadingApple && { opacity: 0.6 }]}
              activeOpacity={0.7}
              onPress={handleAppleSignIn}
              disabled={loadingApple}
            >
              <Ionicons name="logo-apple" size={22} color={Colors.text} />
              <Text style={styles.socialText}>
                {loadingApple ? 'Вхід...' : 'Продовжити з Apple'}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.socialButton, { marginTop: Spacing.sm }, loadingGoogle && { opacity: 0.6 }]}
            activeOpacity={0.7}
            onPress={handleGoogleSignIn}
            disabled={loadingGoogle}
          >
            <Ionicons name="logo-google" size={22} color="#A78BFA" />
            <Text style={styles.socialText}>
              {loadingGoogle ? 'Вхід...' : 'Продовжити з Google'}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Немає акаунту? </Text>
          <TouchableOpacity onPress={() => router.push('/auth/register')}>
            <Text style={styles.footerLink}>Зареєструватися</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scrollContent: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: Spacing.xl, paddingVertical: Spacing.xxl },
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  logoRing: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    shadowColor: '#6D28D9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
  },
  logoInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  appName: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, textAlign: 'center' },
  appTagline: { fontSize: FontSize.md, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  form: { gap: Spacing.md },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bgInput, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.border, paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, color: Colors.text, fontSize: FontSize.md, paddingVertical: Spacing.md },
  eyeIcon: { padding: Spacing.sm },
  skipBtn: { alignItems: 'center', paddingVertical: Spacing.sm },
  skipText: { color: Colors.textMuted, fontSize: FontSize.sm, textDecorationLine: 'underline' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { color: Colors.textMuted, fontSize: FontSize.sm, marginHorizontal: Spacing.md },
  socialButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingVertical: Spacing.md, gap: Spacing.sm,
    shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  socialText: { color: Colors.text, fontSize: FontSize.md, fontWeight: '500' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  footerText: { color: Colors.textSecondary, fontSize: FontSize.md },
  footerLink: { color: Colors.primary, fontSize: FontSize.md, fontWeight: '700' },
  bgRing: { position: 'absolute', borderRadius: 999, borderWidth: 1, borderColor: '#8B5CF6' },
});
