import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { useAppStore } from '../../stores/useAppStore';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const XP_PER_LEVEL = 500;

export default function ProfileScreen() {
  const isPremium = useAppStore((s) => s.isPremium);
  const userName = useAppStore((s) => s.userName);
  const userBirthDate = useAppStore((s) => s.userBirthDate);
  const xp = useAppStore((s) => s.xp);
  const level = useAppStore((s) => s.level);
  const streak = useAppStore((s) => s.streak);
  const tokens = useAppStore((s) => s.tokens);
  const unlockedIds = useAppStore((s) => s.unlockedAchievementIds);
  const savedMatrices = useAppStore((s) => s.savedMatrices);
  const tarotSpreads = useAppStore((s) => s.tarotSpreads);
  const notifications = useAppStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;

  const xpInLevel = xp % XP_PER_LEVEL;
  const progressPercent = xpInLevel / XP_PER_LEVEL;

  const SETTINGS = [
    { icon: 'trophy-outline' as const, label: 'Досягнення та нагороди', badge: `${unlockedIds.length}`, route: '/profile/achievements' },
    { icon: 'diamond-outline' as const, label: 'Кристали та Premium', badge: `${tokens}`, route: '/paywall' },
    { icon: 'gift-outline' as const, label: 'Реферальна програма', badge: null, route: '/matrix/referral' },
    { icon: 'headset-outline' as const, label: 'Медитації', badge: null, route: '/meditation' },
    { icon: 'share-social-outline' as const, label: 'Поділитись', badge: null, route: '/share' },
  ];

  const APP_SETTINGS = [
    { icon: 'notifications-outline' as const, label: 'Сповіщення', badge: unreadCount > 0 ? `${unreadCount}` : null, route: null },
    { icon: 'person-outline' as const, label: 'Акаунт', badge: null, route: null },
    { icon: 'language-outline' as const, label: 'Мова', badge: null, route: null },
    { icon: 'shield-outline' as const, label: 'Конфіденційність', badge: null, route: null },
    { icon: 'help-circle-outline' as const, label: 'Допомога', badge: null, route: null },
    { icon: 'information-circle-outline' as const, label: 'Про додаток', badge: null, route: null },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Profile hero */}
      <LinearGradient colors={['#1E1B4B', '#312E81']} style={styles.hero}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {userName ? userName[0].toUpperCase() : '✨'}
            </Text>
          </View>
          {isPremium && (
            <View style={styles.premiumAvatarBadge}>
              <Ionicons name="star" size={12} color={Colors.bg} />
            </View>
          )}
        </View>
        <Text style={styles.heroName}>{userName ?? 'Мандрівник'}</Text>
        {userBirthDate && <Text style={styles.heroBirthDate}>{userBirthDate}</Text>}

        {/* Level & XP */}
        <View style={styles.levelContainer}>
          <View style={styles.levelRow}>
            <Text style={styles.levelText}>Рівень {level}</Text>
            <Text style={styles.xpText}>{xpInLevel}/{XP_PER_LEVEL} XP</Text>
          </View>
          <View style={styles.xpBar}>
            <View style={[styles.xpFill, { width: `${progressPercent * 100}%` }]} />
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{streak}</Text>
            <Text style={styles.statLabel}>Серія</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🃏</Text>
            <Text style={styles.statValue}>{tarotSpreads.length}</Text>
            <Text style={styles.statLabel}>Розкладів</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🌟</Text>
            <Text style={styles.statValue}>{savedMatrices.length}</Text>
            <Text style={styles.statLabel}>Матриць</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statEmoji}>🏆</Text>
            <Text style={styles.statValue}>{unlockedIds.length}</Text>
            <Text style={styles.statLabel}>Нагород</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Daily affirmation */}
      {notifications.filter((n) => n.type === 'affirmation').length > 0 && (
        <Card style={styles.affirmationCard}>
          <Text style={styles.affirmationEmoji}>✨</Text>
          <View style={styles.affirmationContent}>
            <Text style={styles.affirmationLabel}>Афірмація дня</Text>
            <Text style={styles.affirmationText}>
              {notifications.find((n) => n.type === 'affirmation')?.body}
            </Text>
          </View>
        </Card>
      )}

      {/* Premium Banner */}
      {!isPremium && (
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/paywall')}>
          <LinearGradient
            colors={['#78350F', '#D97706', '#F59E0B']}
            style={styles.premiumBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.premiumEmoji}>💎</Text>
            <View style={styles.premiumInfo}>
              <Text style={styles.premiumTitle}>Отримати Premium</Text>
              <Text style={styles.premiumSubtitle}>Необмежений AI · Всі медитації · Без реклами</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="rgba(255,255,255,0.8)" />
          </LinearGradient>
        </TouchableOpacity>
      )}

      {isPremium && (
        <Card style={styles.premiumActiveCard}>
          <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
          <Text style={styles.premiumActiveText}>Premium активний</Text>
          <Ionicons name="diamond" size={20} color={Colors.accent} />
        </Card>
      )}

      {/* Feature shortcuts */}
      <Text style={styles.sectionTitle}>Швидкий доступ</Text>
      {SETTINGS.map((item) => (
        <TouchableOpacity
          key={item.label}
          activeOpacity={0.7}
          onPress={() => item.route && router.push(item.route as any)}
        >
          <Card style={styles.settingItem}>
            <Ionicons name={item.icon} size={22} color={Colors.primary} />
            <Text style={styles.settingLabel}>{item.label}</Text>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Card>
        </TouchableOpacity>
      ))}

      {/* App Settings */}
      <Text style={styles.sectionTitle}>Налаштування</Text>
      {APP_SETTINGS.map((item) => (
        <TouchableOpacity
          key={item.label}
          activeOpacity={0.7}
          onPress={() => item.route && router.push(item.route as any)}
        >
          <Card style={styles.settingItem}>
            <Ionicons name={item.icon} size={22} color={Colors.textSecondary} />
            <Text style={styles.settingLabel}>{item.label}</Text>
            {item.badge && (
              <View style={[styles.badge, { backgroundColor: Colors.error }]}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </Card>
        </TouchableOpacity>
      ))}

      {/* Logout */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => {
          Alert.alert('Вихід', 'Ви впевнені що хочете вийти?', [
            { text: 'Скасувати', style: 'cancel' },
            {
              text: 'Вийти',
              style: 'destructive',
              onPress: async () => {
                await supabase.auth.signOut();
                router.replace('/auth/login');
              },
            },
          ]);
        }}
      >
        <Card style={[styles.settingItem, { marginTop: Spacing.md }]}>
          <Ionicons name="log-out-outline" size={22} color={Colors.error} />
          <Text style={[styles.settingLabel, { color: Colors.error }]}>Вийти з акаунту</Text>
        </Card>
      </TouchableOpacity>

      <Text style={styles.version}>Matrix of Soul v1.0.0 · Зроблено з ❤️ в Україні</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 120 },

  hero: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  avatarContainer: { position: 'relative' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 3,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: Colors.text, fontSize: 36, fontWeight: '800' },
  premiumAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  heroName: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '800' },
  heroBirthDate: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.sm },

  levelContainer: { width: '100%', gap: 6 },
  levelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  levelText: { color: Colors.primaryLight, fontSize: FontSize.sm, fontWeight: '700' },
  xpText: { color: 'rgba(255,255,255,0.5)', fontSize: FontSize.xs },
  xpBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: Colors.accent,
    borderRadius: BorderRadius.full,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    width: '100%',
    marginTop: Spacing.xs,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 4 },
  statEmoji: { fontSize: 18 },
  statValue: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  statDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)' },

  affirmationCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderColor: Colors.accentMuted,
  },
  affirmationEmoji: { fontSize: 28 },
  affirmationContent: { flex: 1, gap: 2 },
  affirmationLabel: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  affirmationText: { color: Colors.text, fontSize: FontSize.sm, lineHeight: 18, fontStyle: 'italic' },

  premiumBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    margin: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  premiumEmoji: { fontSize: 32 },
  premiumInfo: { flex: 1, gap: 3 },
  premiumTitle: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '800' },
  premiumSubtitle: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm },

  premiumActiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    margin: Spacing.lg,
    marginBottom: Spacing.sm,
    paddingVertical: Spacing.md,
    borderColor: Colors.success,
  },
  premiumActiveText: { flex: 1, color: Colors.success, fontSize: FontSize.md, fontWeight: '700' },

  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },

  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    paddingVertical: Spacing.md,
  },
  settingLabel: { flex: 1, color: Colors.text, fontSize: FontSize.md, fontWeight: '500' },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: FontSize.xs, fontWeight: '700' },

  version: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
});
