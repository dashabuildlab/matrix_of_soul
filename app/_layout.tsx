import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { Colors } from '../constants/theme';
import { supabase } from '../lib/supabase';
import { useAppStore, Achievement } from '../stores/useAppStore';
import type { Session } from '@supabase/supabase-js';

// Daily affirmations shown in-app on first visit each day
const DAILY_AFFIRMATIONS = [
  'Ти сповнений сили та мудрості для цього дня',
  'Всесвіт підтримує твій шлях',
  'Твої таланти унікальні та потрібні світу',
  'Кожен день — це нова можливість для росту',
  'Любов та достаток течуть у твоє життя',
  'Ти достатній саме таким, яким є',
  'Твоя інтуїція — найнадійніший провідник',
  'Всі твої мрії стають реальністю крок за кроком',
  'Ти захищений та спрямований вищою силою',
  'Сьогодні відкрий щось нове в собі',
];

function AchievementToast({ achievement, onHide }: { achievement: Achievement; onHide: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: -80, duration: 400, useNativeDriver: true }),
      ]).start(onHide);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', top: 56, left: 16, right: 16, zIndex: 9999,
      opacity, transform: [{ translateY }],
      backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderWidth: 1.5, borderColor: Colors.accent,
      shadowColor: '#8B5CF6', shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.18, shadowRadius: 16, elevation: 12,
    }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245,159,11,0.12)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="trophy" size={24} color={Colors.accent} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: Colors.accent, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
          Нова нагорода
        </Text>
        <Text style={{ color: '#1A0A35', fontSize: 15, fontWeight: '700' }}>{achievement.title}</Text>
        <Text style={{ color: '#9B87C0', fontSize: 12 }}>{achievement.description} · +{achievement.xp} XP</Text>
      </View>
      <TouchableOpacity onPress={onHide}>
        <Ionicons name="close" size={20} color="#9B87C0" />
      </TouchableOpacity>
    </Animated.View>
  );
}

function StreakToast({ streak, onHide }: { streak: number; onHide: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(opacity, { toValue: 1, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, tension: 50, friction: 7, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(onHide);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', top: 56, left: 16, right: 16, zIndex: 9999,
      opacity, transform: [{ scale }],
      backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16,
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderWidth: 1.5, borderColor: '#F97316',
      shadowColor: '#F97316', shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.15, shadowRadius: 16, elevation: 12,
    }}>
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(249,115,22,0.12)', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="flame" size={24} color="#F97316" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#F97316', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 }}>
          Серія оновлена
        </Text>
        <Text style={{ color: '#1A0A35', fontSize: 16, fontWeight: '700' }}>
          {streak} {streak === 1 ? 'день' : streak < 5 ? 'дні' : 'днів'} поспіль
        </Text>
        <Text style={{ color: '#9B87C0', fontSize: 12 }}>+20 XP за щоденний вхід</Text>
      </View>
    </Animated.View>
  );
}

export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [streakToast, setStreakToast] = useState<number | null>(null);

  const checkAndUpdateStreak = useAppStore((s) => s.checkAndUpdateStreak);
  const checkAchievements = useAppStore((s) => s.checkAchievements);
  const addNotification = useAppStore((s) => s.addNotification);
  const storeAuthenticated = useAppStore((s) => s.isAuthenticated);

  useEffect(() => {
    SecureStore.getItemAsync('onboarding_done').then((val) => {
      setOnboardingDone(val === 'true');
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        useAppStore.setState({ isAuthenticated: true, userId: session.user.id });

        // Check streak & gamification on session load
        const result = checkAndUpdateStreak();
        if (result.isNewDay) {
          if (!result.streakBroken && result.newStreak > 1) {
            setTimeout(() => setStreakToast(result.newStreak), 800);
          }
          // Check achievements
          setTimeout(() => {
            const newAchievements = checkAchievements();
            if (newAchievements.length > 0) {
              setAchievementToast(newAchievements[0]);
            }
          }, result.newStreak > 1 ? 4500 : 800);

          // Add daily affirmation in-app notification
          const affirmation = DAILY_AFFIRMATIONS[new Date().getDay() % DAILY_AFFIRMATIONS.length];
          addNotification({
            id: `affirmation_${Date.now()}`,
            title: 'Афірмація дня',
            body: affirmation,
            type: 'affirmation',
            read: false,
            createdAt: new Date().toISOString(),
          });
        }
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      useAppStore.setState({ isAuthenticated: !!session, userId: session?.user.id ?? null });
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || onboardingDone === null) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: Colors.bg },
        headerShadowVisible: false,
      }}>
        <Stack.Screen name="onboarding" options={{ headerShown: false }} redirect={onboardingDone} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} redirect={!!session || storeAuthenticated} />
        <Stack.Screen name="auth/register" options={{ title: '', headerBackTitle: 'Назад' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} redirect={!session && !storeAuthenticated} />

        {/* Matrix */}
        <Stack.Screen name="matrix/create" options={{ title: 'Створити Матрицю', presentation: 'modal' }} />
        <Stack.Screen name="matrix/[id]" options={{ title: 'Матриця' }} />
        <Stack.Screen name="matrix/compatibility" options={{ title: 'Сумісність', presentation: 'modal' }} />
        <Stack.Screen name="matrix/daily" options={{ title: 'Матриця Дня' }} />
        <Stack.Screen name="matrix/referral" options={{ title: 'Реферальна програма' }} />

        {/* Tarot */}
        <Stack.Screen name="tarot/spread" options={{ title: 'Розклад Таро', presentation: 'modal' }} />
        <Stack.Screen name="tarot/history" options={{ title: 'Історія Розкладів' }} />
        <Stack.Screen name="tarot/yesno" options={{ title: 'Так чи Ні', presentation: 'modal' }} />
        <Stack.Screen name="tarot/person" options={{ title: 'Розклад на Людину', presentation: 'modal' }} />
        <Stack.Screen name="tarot/period" options={{ title: 'Прогноз Таро', presentation: 'modal' }} />
        <Stack.Screen name="tarot/astro" options={{ title: 'Астропрогноз' }} />

        {/* AI */}
        <Stack.Screen name="ai/chat" options={{ headerShown: false }} />
        <Stack.Screen name="ai/conflict" options={{ title: 'Аналіз Конфлікту', presentation: 'modal' }} />

        {/* Learn */}
        <Stack.Screen name="learn/tarot" options={{ title: 'Вивчення Таро' }} />

        {/* Profile */}
        <Stack.Screen name="profile/achievements" options={{ title: 'Досягнення та нагороди' }} />

        {/* Utility */}
        <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="meditation" options={{ title: 'Медитації' }} />
        <Stack.Screen name="share" options={{ title: 'Поділитись', presentation: 'modal' }} />

        {/* Journal */}
        <Stack.Screen name="journal/new" options={{ title: 'Новий Запис', presentation: 'modal' }} />
        <Stack.Screen name="journal/[id]" options={{ title: 'Запис' }} />
      </Stack>

      {achievementToast && (
        <AchievementToast achievement={achievementToast} onHide={() => setAchievementToast(null)} />
      )}
      {streakToast !== null && !achievementToast && (
        <StreakToast streak={streakToast} onHide={() => setStreakToast(null)} />
      )}
    </>
  );
}
