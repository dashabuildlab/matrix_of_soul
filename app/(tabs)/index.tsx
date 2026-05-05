import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { getDailyEnergy, calculateMatrix } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';
import { TAROT_CARDS } from '../../constants/tarotData';
import { TAROT_IMAGES } from '../../constants/tarotImages';
import { useAppStore } from '../../stores/useAppStore';
import { GIFT_DIAMONDS } from '../../lib/notifications';

// ── Deterministic card of the day (same card all day) ────────────────────────
function getDailyCard() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
  const majorArcana = TAROT_CARDS.filter((c) => c.id >= 0 && c.id <= 21);
  return majorArcana[dayOfYear % majorArcana.length];
}


// ── Card flip component ───────────────────────────────────────────────────────
function DailyCardFlip() {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [revealed, setRevealed] = useState(false);
  const card = getDailyCard();

  const handleReveal = () => {
    if (revealed) return;
    Animated.spring(flipAnim, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start(() => setRevealed(true));
  };

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const backOpacity  = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });

  const cardImage = TAROT_IMAGES[card.id];

  return (
    <View style={cardStyles.container}>
      <Text style={cardStyles.sectionTitle}>Карта Дня</Text>

      <View style={cardStyles.flipWrapper}>
        {/* Card BACK */}
        <Animated.View
          style={[
            cardStyles.cardFace,
            { transform: [{ perspective: 1200 }, { rotateY: frontRotate }], opacity: frontOpacity },
          ]}
        >
          <LinearGradient
            colors={['#1A1040', '#2D1B69', '#4C1D95']}
            style={cardStyles.cardBack}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={cardStyles.cardBackPattern}>✦  ✧  ✦</Text>
            <Ionicons name="sparkles" size={40} color="rgba(245,197,66,0.7)" />
            <Text style={cardStyles.cardBackPattern}>✧  ✦  ✧</Text>
          </LinearGradient>
        </Animated.View>

        {/* Card FRONT (image) */}
        <Animated.View
          style={[
            cardStyles.cardFace,
            cardStyles.cardFaceAbsolute,
            { transform: [{ perspective: 1200 }, { rotateY: backRotate }], opacity: backOpacity },
          ]}
        >
          {cardImage ? (
            <Image source={cardImage} style={cardStyles.cardImage} resizeMode="cover" />
          ) : (
            <LinearGradient colors={['#2D1B69', '#4C1D95']} style={cardStyles.cardBack}>
              <Text style={cardStyles.cardFallbackNum}>{card.id}</Text>
              <Ionicons name="star" size={32} color={Colors.accent} />
            </LinearGradient>
          )}
        </Animated.View>
      </View>

      {/* Reveal button — shown until card is flipped */}
      {!revealed && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleReveal}
          style={cardStyles.revealBtn}
        >
          <LinearGradient
            colors={['#4C1D95', '#7C3AED']}
            style={cardStyles.revealGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="sparkles" size={18} color={Colors.accent} />
            <Text style={cardStyles.revealBtnText}>Відкрити карту</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Card info — shown after reveal */}
      {revealed && (
        <Card style={cardStyles.infoCard}>
          <View style={cardStyles.infoHeader}>
            <Text style={cardStyles.cardName}>{card.nameUk}</Text>
            <Text style={cardStyles.cardNameEn}>{card.name}</Text>
          </View>

          <Text style={cardStyles.cardReading} numberOfLines={5}>
            {card.upright}
          </Text>
          <View style={cardStyles.keywordsRow}>
            {card.keywords.slice(0, 3).map((kw) => (
              <View key={kw} style={cardStyles.keyword}>
                <Text style={cardStyles.keywordText}>{kw}</Text>
              </View>
            ))}
          </View>
        </Card>
      )}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  container: { marginBottom: Spacing.lg },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },
  flipWrapper: {
    alignSelf: 'center',
    width: 160,
    height: 270,
    marginBottom: Spacing.md,
  },
  cardFace: {
    width: 160,
    height: 270,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
  },
  cardFaceAbsolute: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  cardBack: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    borderWidth: 1.5,
    borderColor: 'rgba(139,92,246,0.5)',
    borderRadius: BorderRadius.lg,
  },
  cardBackPattern: {
    color: 'rgba(245,197,66,0.5)',
    fontSize: 18,
    letterSpacing: 6,
  },
  cardFallbackNum: {
    color: Colors.accent,
    fontSize: FontSize.title,
    fontWeight: '900',
  },
  cardImage: {
    width: 160,
    height: 270,
    borderRadius: BorderRadius.lg,
  },
  infoCard: {
    gap: Spacing.sm,
  },
  infoHeader: { gap: 2 },
  cardName: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  cardNameEn: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  divider: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
    textAlign: 'center',
    letterSpacing: 4,
  },
  cardReading: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: 4,
  },
  keyword: {
    backgroundColor: Colors.primaryMuted,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  keywordText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  revealBtn: {
    alignSelf: 'center',
    marginTop: Spacing.md,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  revealGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  revealBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
});

// ─────────────────────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const router = useRouter();
  const today = new Date();
  const todayDate = today.toISOString().split('T')[0];
  const dailyEnergy = getDailyEnergy(today);
  const energy = getEnergyById(dailyEnergy);
  const dailyMatrix = useMemo(() => calculateMatrix(todayDate), [todayDate]);
  const userName = useAppStore((s) => s.userName);
  const isPremium = useAppStore((s) => s.isPremium);
  const streak = useAppStore((s) => s.streak);
  const notifications = useAppStore((s) => s.notifications);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const affirmation = notifications.find((n) => n.type === 'affirmation');

  // Gift state
  const canClaimGift    = useAppStore((s) => s.canClaimGift);
  const claimDailyGift  = useAppStore((s) => s.claimDailyGift);
  const firstOpenDate   = useAppStore((s) => s.firstOpenDate);
  const lastGiftClaimed = useAppStore((s) => s.lastGiftClaimedDate);
  const giftAvailable   = canClaimGift();
  const giftClaimedToday = lastGiftClaimed === todayDate;
  // Show block on day 2+ for non-premium users
  const showGiftBlock = !isPremium && !!firstOpenDate && firstOpenDate < todayDate && (giftAvailable || giftClaimedToday);

  const [giftAnimating, setGiftAnimating] = useState(false);
  const giftScale = useRef(new Animated.Value(1)).current;

  const handleClaimGift = () => {
    if (!giftAvailable || giftClaimedToday || giftAnimating) return;
    setGiftAnimating(true);
    Animated.sequence([
      Animated.spring(giftScale, { toValue: 1.18, tension: 200, friction: 5, useNativeDriver: true }),
      Animated.spring(giftScale, { toValue: 0.92, tension: 200, friction: 8, useNativeDriver: true }),
      Animated.spring(giftScale, { toValue: 1,    tension: 150, friction: 10, useNativeDriver: true }),
    ]).start(() => {
      claimDailyGift(GIFT_DIAMONDS);
      setGiftAnimating(false);
    });
  };

  const dateStr = today.toLocaleDateString('uk-UA', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={styles.root}>
      <AnimatedBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Greeting */}
        <View style={styles.greetingRow}>
          <View>
            <Text style={styles.greeting}>
              {userName ? `Привіт, ${userName}! 👋` : 'Добрий день! 👋'}
            </Text>
            <Text style={styles.dateText}>{dateStr}</Text>
          </View>
          <View style={styles.greetingRight}>
            {streak > 0 && (
              <TouchableOpacity
                style={styles.streakBadge}
                onPress={() => router.push('/profile/achievements' as any)}
              >
                <Text style={styles.streakEmoji}>🔥</Text>
                <Text style={styles.streakCount}>{streak}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => router.push('/paywall')}
            >
              <Ionicons name="diamond-outline" size={22} color={Colors.accent} />
              {unreadCount > 0 && <View style={styles.notifDot} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Affirmation */}
        {affirmation && (
          <Card style={styles.affirmationCard}>
            <Text style={styles.affirmationEmoji}>✨</Text>
            <Text style={styles.affirmationText}>{affirmation.body}</Text>
          </Card>
        )}

        {/* ── Daily Gift Banner ── */}
        {showGiftBlock && (
          <TouchableOpacity activeOpacity={giftClaimedToday ? 1 : 0.85} onPress={handleClaimGift} disabled={giftClaimedToday}>
            <Animated.View style={{ transform: [{ scale: giftScale }] }}>
              <LinearGradient
                colors={giftClaimedToday ? ['#14532D', '#166534', '#15803D'] : ['#4C1D95', '#6D28D9', '#7C3AED']}
                style={giftBannerStyles.banner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={giftBannerStyles.icon}>{giftClaimedToday ? '✅' : '🎁'}</Text>
                <View style={giftBannerStyles.info}>
                  <Text style={giftBannerStyles.title}>
                    {giftClaimedToday ? 'Подарунок зібрано!' : 'У тебе є подарунок!'}
                  </Text>
                  <Text style={giftBannerStyles.sub}>
                    {giftClaimedToday
                      ? `+${GIFT_DIAMONDS} кристалів додано на рахунок`
                      : `Забери ${GIFT_DIAMONDS} кристали — безкоштовний розклад Таро`}
                  </Text>
                </View>
                {!giftClaimedToday && (
                  <View style={giftBannerStyles.claimBtn}>
                    <Text style={giftBannerStyles.claimBtnText}>Забрати</Text>
                  </View>
                )}
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>
        )}

        {/* ── Матриця дня ── */}
        <TouchableOpacity activeOpacity={0.88} onPress={() => router.push('/matrix/daily' as any)}>
          <LinearGradient
            colors={['#3D1A78', '#6D28D9', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.matrixDayCard}
          >
            <Text style={styles.matrixDayLabel}>МАТРИЦЯ ДНЯ</Text>

            {/* 3 числа */}
            <View style={styles.matrixDayNums}>
              {[
                { val: dailyMatrix?.personality, label: 'ОСОБИСТІСТЬ' },
                { val: dailyMatrix?.soul,        label: 'ДУША' },
                { val: dailyMatrix?.destiny,     label: 'ДОЛЯ' },
              ].map((item) => (
                <View key={item.label} style={styles.matrixDayNumItem}>
                  <Text style={styles.matrixDayNumVal}>{item.val ?? '—'}</Text>
                  <Text style={styles.matrixDayNumLabel}>{item.label}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <View style={styles.matrixDayCta}>
              <Ionicons name="grid-outline" size={16} color="rgba(255,255,255,0.9)" />
              <Text style={styles.matrixDayCtaText}>Відкрити матрицю дня</Text>
              <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Card of the Day */}
        <DailyCardFlip />

        {/* Meditations Banner */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/meditation')}>
          <LinearGradient
            colors={['#0F2E2A', '#064E3B', '#065F46']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.meditationBanner}
          >
            <Text style={styles.meditationBannerEmoji}>🧘</Text>
            <View style={styles.meditationBannerInfo}>
              <Text style={styles.meditationBannerTitle}>Медитації</Text>
              <Text style={styles.meditationBannerSub}>Ранкові · Чакри · Сон · Маніфестація</Text>
            </View>
            <Ionicons name="arrow-forward-circle" size={28} color="#6EE7B7" />
          </LinearGradient>
        </TouchableOpacity>

        {/* AI Chat Promo */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push(isPremium ? '/ai/chat' : '/paywall' as any)}>
          <LinearGradient
            colors={['#1E1B4B', '#312E81', '#4338CA']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.aiPromoCard}
          >
            <Ionicons name="chatbubble-ellipses" size={32} color="#A5B4FC" />
            <View style={styles.aiPromoInfo}>
              <Text style={styles.aiPromoTitle}>AI Езотерик</Text>
              <Text style={styles.aiPromoText}>
                Задайте питання своїй матриці або картам Таро
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#A5B4FC" />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 120 },

  greetingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  greeting: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
  },
  dateText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  greetingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(249, 115, 22, 0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  streakEmoji: { fontSize: 16 },
  streakCount: { color: '#F97316', fontSize: FontSize.sm, fontWeight: '800' },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.error,
    borderWidth: 1,
    borderColor: Colors.bg,
  },

  affirmationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    borderColor: Colors.accentMuted,
    paddingVertical: Spacing.sm,
  },
  affirmationEmoji: { fontSize: 20 },
  affirmationText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
    flex: 1,
    fontStyle: 'italic',
  },

  // ── Матриця дня ──
  matrixDayCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  matrixDayLabel: {
    color: '#E9D5FF',
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: Spacing.md,
  },
  matrixDayNums: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  matrixDayNumItem: { alignItems: 'center', gap: 4, flex: 1 },
  matrixDayNumVal: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
    textShadowColor: 'rgba(245,197,66,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  matrixDayNumLabel: {
    color: 'rgba(233,213,255,0.7)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  matrixDayCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  matrixDayCtaText: {
    color: '#FFFFFF',
    fontSize: FontSize.sm,
    fontWeight: '700',
  },

  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },

  // Meditations banner
  meditationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  meditationBannerEmoji: { fontSize: 36 },
  meditationBannerInfo: { flex: 1, gap: 3 },
  meditationBannerTitle: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '700' },
  meditationBannerSub: { color: '#6EE7B7', fontSize: FontSize.sm },

  aiPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  aiPromoInfo: { flex: 1 },
  aiPromoTitle: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '700' },
  aiPromoText: { color: '#A5B4FC', fontSize: FontSize.sm, marginTop: 2 },
});

const giftBannerStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  icon: { fontSize: 36 },
  info: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: FontSize.md, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.sm, marginTop: 3, lineHeight: 18 },
  claimBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  claimBtnText: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: '700' },
});
