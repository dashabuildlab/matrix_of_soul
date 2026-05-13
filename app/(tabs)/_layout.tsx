import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize } from '../../constants/theme';
import { useI18n } from '../../lib/i18n';

function CenterTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.centerIconWrapper}>
      <LinearGradient
        colors={focused ? ['#F5C542', '#F59E0B'] : ['#2A2A4A', '#1C1C3A']}
        style={styles.centerIconGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="sparkles" size={26} color={focused ? '#1A1633' : Colors.textMuted} />
      </LinearGradient>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 56 + insets.bottom;
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: insets.bottom + 4,
          paddingTop: 8,
          height: tabBarHeight,
        },
        tabBarLabelStyle: {
          fontSize: FontSize.xs,
          fontWeight: '500',
        },
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontWeight: '700', fontSize: FontSize.xl },
        headerShadowVisible: false,
        sceneStyle: { backgroundColor: Colors.bg },
      }}
    >
      {/* 1 — Today */}
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.today,
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sunny-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 2 — Tarot */}
      <Tabs.Screen
        name="tarot"
        options={{
          title: t.tabs.tarot,
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="layers-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 3 — Matrix (CENTER) */}
      <Tabs.Screen
        name="matrix"
        options={{
          title: t.tabs.matrix,
          headerShown: false,
          tabBarIcon: ({ focused }) => <CenterTabIcon focused={focused} />,
          tabBarLabelStyle: {
            fontSize: FontSize.xs,
            fontWeight: '600',
            color: Colors.accent,
          },
          tabBarStyle: {
            backgroundColor: Colors.bg,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            paddingBottom: insets.bottom + 4,
            paddingTop: 8,
            height: tabBarHeight,
          },
        }}
      />

      {/* 4 — AI Magic */}
      <Tabs.Screen
        name="ai"
        options={{
          title: t.tabs.ai,
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="color-wand-outline" size={size} color={color} />
          ),
        }}
      />

      {/* 5 — Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabs.profile,
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Hidden */}
      <Tabs.Screen
        name="learn"
        options={{ href: null }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centerIconWrapper: {
    top: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerIconGradient: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#F5C542',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
});
