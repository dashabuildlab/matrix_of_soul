import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { supabase } from '../lib/supabase';
import { Colors } from '../constants/theme';

export default function Index() {
  const [route, setRoute] = useState<string | null>(null);

  useEffect(() => {
    const decide = async () => {
      try {
        // DEV: uncomment to reset all flags for testing
        // await SecureStore.deleteItemAsync('welcome_seen');
        // await SecureStore.deleteItemAsync('onboarding_done');

        // 1. Show welcome video screen on very first launch
        const welcomeSeen = await SecureStore.getItemAsync('welcome_seen');
        if (welcomeSeen !== 'true') {
          setRoute('/welcome');
          return;
        }

        // 2. Show onboarding if not completed
        const onboardingDone = await SecureStore.getItemAsync('onboarding_done');
        if (onboardingDone !== 'true') {
          setRoute('/onboarding');
          return;
        }

        // 3. Route by auth state
        const { data: { session } } = await supabase.auth.getSession();
        setRoute(session ? '/(tabs)/matrix' : '/auth/login');
      } catch {
        setRoute('/welcome');
      }
    };
    decide();
  }, []);

  if (!route) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href={route as any} />;
}
