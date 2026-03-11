import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, FontSize } from '../../constants/theme';

function CenterTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={styles.centerIconWrapper}>
      <LinearGradient
        colors={focused ? ['#6D28D9', '#8B5CF6'] : ['#2A2A4A', '#1C1C3A']}
        style={styles.centerIconGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="sparkles" size={26} color={focused ? '#FFFFFF' : Colors.textMuted} />
      </LinearGradient>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.bg,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 88,
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
      <Tabs.Screen
        name="index"
        options={{
          title: 'Сьогодні',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sunny-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="matrix"
        options={{
          title: 'Матриця',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tarot"
        options={{
          title: 'Таро',
          tabBarIcon: ({ focused }) => <CenterTabIcon focused={focused} />,
          tabBarLabelStyle: {
            fontSize: FontSize.xs,
            fontWeight: '600',
            color: Colors.primaryLight,
          },
          tabBarStyle: {
            backgroundColor: Colors.bg,
            borderTopColor: Colors.border,
            borderTopWidth: 1,
            paddingBottom: 8,
            paddingTop: 8,
            height: 88,
          },
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Магія',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="color-wand-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профіль',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden tabs (still accessible as routes) */}
      <Tabs.Screen
        name="journal"
        options={{ href: null }}
      />
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
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
