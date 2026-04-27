import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { useAppStore } from '../../stores/useAppStore';

const { width } = Dimensions.get('window');

const AI_FEATURES = [
  {
    icon: 'chatbubble-ellipses-outline' as const,
    title: 'AI Езотерик',
    subtitle: 'Чат зі своєю матрицею або картами',
    gradient: ['#1E1B4B', '#4338CA'] as [string, string],
    route: '/ai/chat',
    tokens: 1,
  },
  {
    icon: 'people-outline' as const,
    title: 'Аналіз Конфлікту',
    subtitle: 'Об\'єктивна оцінка ситуацій',
    gradient: ['#3B0764', '#7C3AED'] as [string, string],
    route: '/ai/conflict',
    tokens: 2,
  },
  {
    icon: 'bulb-outline' as const,
    title: 'Рекомендації',
    subtitle: 'Поради по вашій матриці',
    gradient: ['#064E3B', '#047857'] as [string, string],
    route: '/ai/chat',
    tokens: 1,
  },
  {
    icon: 'heart-half-outline' as const,
    title: 'Любовний прогноз',
    subtitle: 'Аналіз стосунків через Таро + AI',
    gradient: ['#831843', '#BE185D'] as [string, string],
    route: '/ai/chat',
    tokens: 1,
  },
];

const ENCYCLOPEDIA_SECTIONS = [
  { icon: 'layers-outline' as const, title: '22 Аркани Таро', count: 22, route: '/tarot/history' },
  { icon: 'sparkles-outline' as const, title: '22 Енергії', count: 22, route: '/learn' },
  { icon: 'planet-outline' as const, title: 'Планети та знаки', count: 10, route: '/tarot/astro' },
  { icon: 'flower-outline' as const, title: 'Чакри', count: 7, route: '/matrix/daily' },
];

export default function AIScreen() {
  const router = useRouter();
  const tokens = useAppStore((s) => s.tokens);
  const isPremium = useAppStore((s) => s.isPremium);
  const chatSessions = useAppStore((s) => s.chatSessions);
  const aiConsentGiven = useAppStore((s) => s.aiConsentGiven);

  const navigateToAI = (route: string) => {
    if (!aiConsentGiven) {
      router.push((`/ai/disclosure?next=${encodeURIComponent(route)}`) as any);
    } else {
      router.push(route as any);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Token Balance */}
      <Card style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View style={styles.balanceLeft}>
            <Ionicons name="diamond-outline" size={24} color={Colors.accent} />
            <View>
              <Text style={styles.balanceLabel}>Кристали</Text>
              <Text style={styles.balanceValue}>
                {isPremium ? '∞' : tokens}
              </Text>
            </View>
          </View>
          {!isPremium && (
            <TouchableOpacity
              style={styles.buyTokensBtn}
              onPress={() => router.push('/paywall')}
            >
              <Text style={styles.buyTokensText}>+ Поповнити</Text>
            </TouchableOpacity>
          )}
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={12} color={Colors.accent} />
              <Text style={styles.premiumBadgeText}>PREMIUM</Text>
            </View>
          )}
        </View>
        {!isPremium && (
          <Text style={styles.balanceHint}>
            1 кристал = 1 AI запит · Преміум — безлімітно
          </Text>
        )}
      </Card>

      {/* AI Features Grid */}
      <Text style={styles.sectionTitle}>AI Функції</Text>
      <View style={styles.featuresGrid}>
        {AI_FEATURES.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.featureItem}
            activeOpacity={0.7}
            onPress={() => navigateToAI(item.route)}
          >
            <LinearGradient
              colors={item.gradient}
              style={styles.featureGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name={item.icon} size={28} color="#FFFFFF" />
              <Text style={styles.featureTitle}>{item.title}</Text>
              <Text style={styles.featureSubtitle}>{item.subtitle}</Text>
              {!isPremium && (
                <View style={styles.tokenCost}>
                  <Ionicons name="diamond" size={10} color={Colors.accent} />
                  <Text style={styles.tokenCostText}>{item.tokens}</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Recent Chats */}
      {chatSessions.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Нещодавні чати</Text>
          {chatSessions.slice(0, 3).map((session) => (
            <TouchableOpacity
              key={session.id}
              activeOpacity={0.7}
              onPress={() => {
                useAppStore.getState().setActiveSession(session.id);
                navigateToAI('/ai/chat');
              }}
            >
              <Card style={styles.chatItem}>
                <View style={styles.chatItemIcon}>
                  <Ionicons
                    name={session.context === 'tarot' ? 'layers-outline' : 'grid-outline'}
                    size={20}
                    color={Colors.primary}
                  />
                </View>
                <View style={styles.chatItemInfo}>
                  <Text style={styles.chatItemTitle} numberOfLines={1}>
                    {session.title}
                  </Text>
                  <Text style={styles.chatItemLast} numberOfLines={1}>
                    {session.messages.at(-1)?.content ?? 'Розпочніть розмову...'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
              </Card>
            </TouchableOpacity>
          ))}
        </>
      )}

      {/* Encyclopedia */}
      <Text style={styles.sectionTitle}>Довідник</Text>
      <View style={styles.encyclopediaGrid}>
        {ENCYCLOPEDIA_SECTIONS.map((item) => (
          <TouchableOpacity
            key={item.title}
            style={styles.encyclopediaItem}
            activeOpacity={0.7}
            onPress={() => router.push(item.route as any)}
          >
            <Card style={styles.encyclopediaCard}>
              <Ionicons name={item.icon} size={24} color={Colors.primary} />
              <Text style={styles.encyclopediaTitle}>{item.title}</Text>
              <Text style={styles.encyclopediaCount}>{item.count} записів</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Conflict Resolution CTA */}
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigateToAI('/ai/conflict')}
      >
        <LinearGradient
          colors={['#2D1B69', '#4C1D95', '#6D28D9']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.conflictBanner}
        >
          <Ionicons name="shield-checkmark-outline" size={36} color="#DDD6FE" />
          <View style={styles.conflictInfo}>
            <Text style={styles.conflictTitle}>Вирішення Конфлікту</Text>
            <Text style={styles.conflictText}>
              Отримайте об\'єктивну оцінку ситуації та конкретні рекомендації
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={28} color="#A78BFA" />
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 120 },

  balanceCard: {
    marginBottom: Spacing.md,
    borderColor: Colors.accentMuted,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  balanceLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceValue: {
    color: Colors.accent,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  buyTokensBtn: {
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  buyTokensText: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  premiumBadgeText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  balanceHint: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    marginTop: Spacing.sm,
  },

  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },

  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featureItem: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  featureGradient: {
    padding: Spacing.md,
    minHeight: 130,
    gap: Spacing.xs,
    position: 'relative',
  },
  featureTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
    marginTop: Spacing.sm,
  },
  featureSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
    lineHeight: 16,
    flex: 1,
  },
  tokenCost: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  tokenCostText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  chatItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatItemInfo: { flex: 1 },
  chatItemTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
  chatItemLast: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 1,
  },

  encyclopediaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  encyclopediaItem: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2,
  },
  encyclopediaCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.xs,
  },
  encyclopediaTitle: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  encyclopediaCount: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },

  conflictBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  conflictInfo: { flex: 1 },
  conflictTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  conflictText: {
    color: '#DDD6FE',
    fontSize: FontSize.sm,
    lineHeight: 18,
  },
});
