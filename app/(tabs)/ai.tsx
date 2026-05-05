import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { useAppStore } from '../../stores/useAppStore';

export default function AIScreen() {
  const router = useRouter();
  const isPremium = useAppStore((s) => s.isPremium);
  const chatSessions = useAppStore((s) => s.chatSessions);
  const aiConsentGiven = useAppStore((s) => s.aiConsentGiven);

  const navigateToChat = () => {
    if (!isPremium) {
      router.push('/paywall');
      return;
    }
    if (!aiConsentGiven) {
      router.push(('/ai/disclosure?next=%2Fai%2Fchat') as any);
    } else {
      router.push('/ai/chat' as any);
    }
  };

  const navigateToConflict = () => {
    if (!isPremium) {
      router.push('/paywall');
      return;
    }
    if (!aiConsentGiven) {
      router.push(('/ai/disclosure?next=%2Fai%2Fconflict') as any);
    } else {
      router.push('/ai/conflict' as any);
    }
  };

  return (
    <View style={styles.root}>
      <AnimatedBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>AI Магія</Text>
          <Text style={styles.pageSubtitle}>Ваш особистий езотерик та провідник</Text>
        </View>

        {/* Premium banner for non-premium users */}
        {!isPremium && (
          <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/paywall')}>
            <LinearGradient
              colors={['#3B0764', '#7C3AED']}
              style={styles.premiumBanner}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Ionicons name="lock-closed" size={20} color={Colors.accent} />
              <View style={{ flex: 1 }}>
                <Text style={styles.premiumBannerTitle}>AI Магія — Premium</Text>
                <Text style={styles.premiumBannerSub}>Оформіть підписку для доступу до всіх AI функцій</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.6)" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Premium badge */}
        {isPremium && (
          <View style={styles.premiumActive}>
            <Ionicons name="star" size={14} color={Colors.accent} />
            <Text style={styles.premiumActiveText}>Premium активний · Безлімітний AI</Text>
          </View>
        )}

        {/* Main hero: AI Єзотерик */}
        <TouchableOpacity
          style={styles.heroBtn}
          activeOpacity={0.85}
          onPress={navigateToChat}
        >
          <LinearGradient
            colors={['#1E1B4B', '#4338CA', '#6D28D9']}
            style={styles.heroBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.heroBtnTop}>
              <View style={styles.heroBtnIconWrap}>
                <Ionicons name="sparkles" size={32} color="#A5B4FC" />
              </View>
              {!isPremium && (
                <View style={styles.lockBadge}>
                  <Ionicons name="lock-closed" size={12} color={Colors.accent} />
                </View>
              )}
            </View>
            <Text style={styles.heroBtnTitle}>AI Єзотерик</Text>
            <Text style={styles.heroBtnSubtitle}>
              Чат з вашою матрицею, картами Таро та езотеричними практиками
            </Text>
            <View style={styles.heroBtnAction}>
              <Text style={styles.heroBtnActionText}>Почати розмову</Text>
              <Ionicons name="arrow-forward" size={16} color="#A5B4FC" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Conflict analysis feature */}
        <Text style={styles.sectionTitle}>Інструменти</Text>
        <TouchableOpacity
          style={styles.conflictCard}
          activeOpacity={0.8}
          onPress={navigateToConflict}
        >
          <LinearGradient
            colors={['#3B0764', '#7C3AED']}
            style={styles.conflictGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.conflictLeft}>
              <View style={styles.conflictIcon}>
                <Ionicons name="people-outline" size={26} color="#C4B5FD" />
              </View>
              <View style={styles.conflictInfo}>
                <Text style={styles.conflictTitle}>Аналіз конфлікту</Text>
                <Text style={styles.conflictSubtitle}>
                  Об'єктивна оцінка ситуацій та рекомендації для вирішення
                </Text>
              </View>
            </View>
            <View style={styles.conflictRight}>
              {!isPremium ? (
                <Ionicons name="lock-closed" size={18} color={Colors.accent} />
              ) : (
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.6)" />
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Recent Chats — only for premium */}
        {isPremium && chatSessions.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Останні чати</Text>
            {chatSessions.slice(0, 5).map((session) => (
              <TouchableOpacity
                key={session.id}
                activeOpacity={0.7}
                onPress={() => {
                  if (aiConsentGiven) {
                    router.push((`/ai/chat?sessionId=${session.id}`) as any);
                  } else {
                    router.push((`/ai/disclosure?next=${encodeURIComponent(`/ai/chat?sessionId=${session.id}`)}`) as any);
                  }
                }}
              >
                <Card style={styles.chatItem}>
                  <View style={styles.chatItemIcon}>
                    <Ionicons
                      name={session.context === 'tarot' ? 'layers-outline' : 'chatbubble-ellipses-outline'}
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 120 },

  pageHeader: {
    paddingTop: 56,
    paddingBottom: Spacing.lg,
  },
  pageTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  pageSubtitle: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginTop: 4,
  },

  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  premiumBannerTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  premiumBannerSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FontSize.xs,
    marginTop: 2,
  },

  premiumActive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  premiumActiveText: {
    color: Colors.accent,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },

  heroBtn: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  heroBtnGradient: {
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  heroBtnTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroBtnIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(165,180,252,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBadge: {
    backgroundColor: 'rgba(0,0,0,0.35)',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBtnTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.xxl,
    fontWeight: '800',
    marginTop: Spacing.sm,
  },
  heroBtnSubtitle: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  heroBtnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  heroBtnActionText: {
    color: '#A5B4FC',
    fontSize: FontSize.md,
    fontWeight: '700',
  },

  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.sm,
  },

  conflictCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
  },
  conflictGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  conflictLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  conflictIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(196,181,253,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  conflictInfo: { flex: 1 },
  conflictTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  conflictSubtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: FontSize.sm,
    lineHeight: 18,
    marginTop: 3,
  },
  conflictRight: {
    paddingLeft: Spacing.sm,
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
});
