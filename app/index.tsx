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
      const onboardingDone = await SecureStore.getItemAsync('onboarding_done');
      if (onboardingDone !== 'true') {
        setRoute('/onboarding');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setRoute('/auth/login');
        return;
      }

      setRoute('/(tabs)/matrix');
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
