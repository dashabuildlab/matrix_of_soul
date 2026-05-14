import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View, Text, Animated, TouchableOpacity } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { Colors } from '../constants/theme';
import { initializePurchases } from '../lib/purchases';
import { onAuthStateChanged } from '../lib/firebaseAuth';
import { initializeNotifications } from '../lib/notifications';
import { useAppStore, Achievement } from '../stores/useAppStore';
import { I18nProvider, useI18n } from '../lib/i18n';

// Keep the native splash visible until icon fonts have loaded — prevents
// the brief moment where icons are missing/blank after the JS bundle starts.
// Without this, every <Ionicons name=…/> renders as an empty box on first paint.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Already hidden or unavailable (e.g. on web) — safe to ignore.
});

function AchievementToast({ achievement, onHide }: { achievement: Achievement; onHide: () => void }) {
  const { t } = useI18n();
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
          {t.layout.newReward}
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
  const { t } = useI18n();
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
          {t.layout.streakUpdated}
        </Text>
        <Text style={{ color: '#1A0A35', fontSize: 16, fontWeight: '700' }}>
          {t.layout.daysInRow(streak)}
        </Text>
        <Text style={{ color: '#9B87C0', fontSize: 12 }}>{t.layout.xpForDailyLogin}</Text>
      </View>
    </Animated.View>
  );
}

// Inner component — has access to I18nProvider context
function AppInit() {
  const { t } = useI18n();

  // Load icon fonts BEFORE first render of any screen — otherwise every
  // <Ionicons name=…/> shows as an empty box.
  // `Ionicons.font` resolves to { Ionicons: require('…/Ionicons.ttf') }.
  // useFonts() returns [loaded, error]. We block render until loaded.
  const [fontsLoaded, fontsError] = useFonts({ ...Ionicons.font });

  const [firebaseUser, setFirebaseUser] = useState<{ uid: string } | null>(null);
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [achievementToast, setAchievementToast] = useState<Achievement | null>(null);
  const [streakToast, setStreakToast] = useState<number | null>(null);

  const checkAndUpdateStreak = useAppStore((s) => s.checkAndUpdateStreak);
  const checkAchievements = useAppStore((s) => s.checkAchievements);
  const addNotification = useAppStore((s) => s.addNotification);
  const storeAuthenticated = useAppStore((s) => s.isAuthenticated);
  const storeOnboardingCompleted = useAppStore((s) => s.onboardingCompleted);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    const init = async () => {
      // Clear expired push gifts from previous days
      useAppStore.getState().clearExpiredGifts();

      // Read stored locale for notifications — I18nProvider also reads it asynchronously,
      // but we need it synchronously here for push notification scheduling
      const storedLocale = (await AsyncStorage.getItem('app_language')) ?? 'en';
      initializeNotifications(storedLocale).catch(() => {});

      try {
        const val = await SecureStore.getItemAsync('onboarding_done');
        setOnboardingDone(val === 'true');
      } catch {
        setOnboardingDone(false);
      }

      setLoading(false);
    };

    init();

    // Firebase auth state listener — fires immediately with current user,
    // then on every sign-in / sign-out event.
    const firstCall = { done: false };
    const unsubFirebase = onAuthStateChanged((user) => {
      setFirebaseUser(user);
      useAppStore.setState({ isAuthenticated: !!user, userId: user?.uid ?? null });
      initializePurchases(user?.uid ?? null);

      // On the very first callback (app startup) run streak / achievement checks
      if (!firstCall.done) {
        firstCall.done = true;
        if (user) {
          const result = checkAndUpdateStreak();
          if (result.isNewDay) {
            if (!result.streakBroken && result.newStreak > 1) {
              const streakTimer = setTimeout(() => setStreakToast(result.newStreak), 800);
              timers.push(streakTimer);
            }
            const delay = result.newStreak > 1 ? 4500 : 800;
            const achTimer = setTimeout(() => {
              const newAchievements = checkAchievements();
              newAchievements.forEach((ach, idx) => {
                const at = setTimeout(() => setAchievementToast(ach), idx * 3000);
                timers.push(at);
              });
            }, delay);
            timers.push(achTimer);

            const affirmation = t.affirmations[new Date().getDay() % t.affirmations.length];
            addNotification({
              id: `affirmation_${Date.now()}`,
              title: t.screens.affirmationOfDay,
              body: affirmation,
              type: 'affirmation',
              read: false,
              createdAt: new Date().toISOString(),
            });
          }
        }
      }
    });

    // Handle push notification taps
    let notifSub: { remove: () => void } | null = null;
    (async () => {
      try {
        const { Platform } = await import('react-native');
        if (Platform.OS === 'web') return;
        const Constants = (await import('expo-constants')).default;
        // SDK 52+: executionEnvironment === 'storeClient'; older: appOwnership === 'expo'
        const isExpoGo =
          (Constants as any).executionEnvironment === 'storeClient' ||
          Constants.appOwnership === 'expo';
        if (isExpoGo) return;
        const Notifications = await import('expo-notifications');
        notifSub = Notifications.addNotificationResponseReceivedListener((response) => {
          const data = response.notification.request.content.data as any;
          if (data?.type === 'daily-gift') {
            const today = new Date().toISOString().split('T')[0];
            useAppStore.getState().setPendingGift({ type: 'tarot-spread', date: today });
          }
        });
      } catch { /* Expo Go or web — ignore */ }
    })();

    return () => {
      timers.forEach(clearTimeout);
      unsubFirebase();
      notifSub?.remove();
    };
  }, []);

  // Hide splash once fonts are ready (or errored — don't block app forever).
  // Done in an effect so it runs after commit, not during render.
  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontsError]);

  // Block first paint until icon fonts are loaded — prevents all <Ionicons>
  // from rendering as empty boxes. If fonts fail to load (rare), proceed
  // anyway after the error so the user isn't stuck on a blank screen.
  if (!fontsLoaded && !fontsError) {
    return null; // native splash is still visible (preventAutoHideAsync above)
  }

  if (loading || onboardingDone === null) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '600' },
        contentStyle: { backgroundColor: Colors.bg },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}>
        <Stack.Screen name="welcome" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} redirect={onboardingDone && storeOnboardingCompleted} />
        <Stack.Screen name="auth/login" options={{ headerShown: false }} redirect={!!firebaseUser || storeAuthenticated} />
        <Stack.Screen name="auth/register" options={{ title: '' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} redirect={!firebaseUser && !storeAuthenticated} />

        {/* Matrix */}
        <Stack.Screen name="matrix/create" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="matrix/[id]" options={{ title: '' }} />
        <Stack.Screen name="matrix/compatibility" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="matrix/daily" options={{ title: '' }} />
        <Stack.Screen name="matrix/analysis" options={{ title: '' }} />

        {/* Tarot */}
        <Stack.Screen name="tarot/spread" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="tarot/history" options={{ title: '' }} />
        <Stack.Screen name="tarot/yesno" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="tarot/person" options={{ title: '', presentation: 'modal' }} />
        <Stack.Screen name="tarot/period" options={{ title: '', presentation: 'modal' }} />

        {/* AI */}
        <Stack.Screen name="ai/disclosure" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="ai/chat" options={{ headerShown: false }} />
        <Stack.Screen name="ai/conflict" options={{ headerShown: false, presentation: 'modal' }} />

        {/* Learn */}
        <Stack.Screen name="learn/tarot" options={{ headerShown: false }} />
        <Stack.Screen name="learn/signs" options={{ title: '' }} />
        <Stack.Screen name="learn/planets" options={{ title: '' }} />
        <Stack.Screen name="learn/chakras" options={{ title: '' }} />

        {/* Profile */}
        <Stack.Screen name="profile/achievements" options={{ title: '' }} />
        <Stack.Screen name="profile/account" options={{ title: '' }} />
        <Stack.Screen name="profile/history" options={{ title: '' }} />
        <Stack.Screen name="profile/notifications" options={{ title: '' }} />
        <Stack.Screen name="profile/language" options={{ title: '' }} />
        <Stack.Screen name="profile/about" options={{ headerShown: false }} />

        {/* Utility */}
        <Stack.Screen name="paywall" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="meditation" options={{ title: '' }} />
        <Stack.Screen name="meditation/player" options={{ headerShown: false }} />
        <Stack.Screen name="share" options={{ title: '', presentation: 'modal' }} />

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

// Root layout — wraps everything in I18nProvider so all screens have access to translations
export default function RootLayout() {
  return (
    <I18nProvider>
      <AppInit />
    </I18nProvider>
  );
}
