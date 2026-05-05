import React, { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Image,
  Modal,
  Dimensions,
  Easing,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Asset } from 'expo-asset';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { AnimatedBackground } from '../../components/ui/AnimatedBackground';
import { MatrixDiagram } from '../../components/matrix/MatrixDiagram';
import { getDailyEnergy, calculateMatrix } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';
import { TAROT_CARDS } from '../../constants/tarotData';
import { TAROT_IMAGES } from '../../constants/tarotImages';
import { useAppStore } from '../../stores/useAppStore';
import { GIFT_DIAMONDS } from '../../lib/notifications';
import { askClaude } from '../../lib/claude';

const { height: SCREEN_H } = Dimensions.get('window');
const MODAL_SUMMARY_COST = 3;

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
    Animated.spring(flipAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }).start(() => setRevealed(true));
  };

  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate  = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });
  const frontOpacity = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 0, 0] });
  const backOpacity  = flipAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 0, 1] });
  const cardImage = TAROT_IMAGES[card.id];

  return (
    <View style={cardStyles.container}>
      <Text style={cardStyles.sectionTitle}>Карта Дня</Text>
      <View style={cardStyles.flipWrapper}>
        <Animated.View style={[cardStyles.cardFace, { transform: [{ perspective: 1200 }, { rotateY: frontRotate }], opacity: frontOpacity }]}>
          <LinearGradient colors={['#1A1040', '#2D1B69', '#4C1D95']} style={cardStyles.cardBack} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={cardStyles.cardBackPattern}>✦  ✧  ✦</Text>
            <Ionicons name="sparkles" size={40} color="rgba(245,197,66,0.7)" />
            <Text style={cardStyles.cardBackPattern}>✧  ✦  ✧</Text>
          </LinearGradient>
        </Animated.View>
        <Animated.View style={[cardStyles.cardFace, cardStyles.cardFaceAbsolute, { transform: [{ perspective: 1200 }, { rotateY: backRotate }], opacity: backOpacity }]}>
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
      {!revealed && (
        <TouchableOpacity activeOpacity={0.8} onPress={handleReveal} style={cardStyles.revealBtn}>
          <LinearGradient colors={['#4C1D95', '#7C3AED']} style={cardStyles.revealGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Ionicons name="sparkles" size={18} color={Colors.accent} />
            <Text style={cardStyles.revealBtnText}>Відкрити карту</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}
      {revealed && (
        <Card style={cardStyles.infoCard}>
          <View style={cardStyles.infoHeader}>
            <Text style={cardStyles.cardName}>{card.nameUk}</Text>
            <Text style={cardStyles.cardNameEn}>{card.name}</Text>
          </View>
          <Text style={cardStyles.cardReading} numberOfLines={5}>{card.upright}</Text>
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
  sectionTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.md, marginTop: Spacing.md },
  flipWrapper: { alignSelf: 'center', width: 160, height: 270, marginBottom: Spacing.md },
  cardFace: { width: 160, height: 270, borderRadius: BorderRadius.lg, overflow: 'hidden', backfaceVisibility: 'hidden' },
  cardFaceAbsolute: { position: 'absolute', top: 0, left: 0 },
  cardBack: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md, borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.5)', borderRadius: BorderRadius.lg },
  cardBackPattern: { color: 'rgba(245,197,66,0.5)', fontSize: 18, letterSpacing: 6 },
  cardFallbackNum: { color: Colors.accent, fontSize: 48, fontWeight: '900' },
  cardImage: { width: 160, height: 270, borderRadius: BorderRadius.lg },
  infoCard: { gap: Spacing.sm },
  infoHeader: { gap: 2 },
  cardName: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '800' },
  cardNameEn: { color: Colors.textMuted, fontSize: FontSize.sm },
  cardReading: { color: Colors.textSecondary, fontSize: FontSize.md, lineHeight: 22 },
  keywordsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: 4 },
  keyword: { backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderWidth: 1, borderColor: Colors.primary },
  keywordText: { color: Colors.primaryLight, fontSize: FontSize.xs, fontWeight: '600' },
  revealBtn: { alignSelf: 'center', marginTop: Spacing.md, borderRadius: BorderRadius.full, overflow: 'hidden' },
  revealGradient: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md },
  revealBtnText: { color: '#FFFFFF', fontSize: FontSize.md, fontWeight: '700' },
});

// ─────────────────────────────────────────────────────────────────────────────

export default function TodayScreen() {
  const router = useRouter();
  const today = new Date();
  const todayDate = today.toISOString().split('T')[0];
  const dailyEnergy = getDailyEnergy(today);
  const energy = getEnergyById(dailyEnergy);
  const dailyMatrix = useMemo(() => calculateMatrix(todayDate), [todayDate]);

  const userName       = useAppStore((s) => s.userName);
  const isPremium      = useAppStore((s) => s.isPremium);
  const streak         = useAppStore((s) => s.streak);
  const notifications  = useAppStore((s) => s.notifications);
  const tokens         = useAppStore((s) => s.tokens);
  const spendCrystals  = useAppStore((s) => s.spendCrystals);
  const dailyMatrixCache    = useAppStore((s) => s.dailyMatrixCache);
  const setDailyMatrixCache = useAppStore((s) => s.setDailyMatrixCache);
  const destinyMatrix  = useAppStore((s) => s.destinyMatrix);

  const unreadCount  = notifications.filter((n) => !n.read).length;
  const affirmation  = notifications.find((n) => n.type === 'affirmation');

  // Gift state
  const canClaimGift    = useAppStore((s) => s.canClaimGift);
  const claimDailyGift  = useAppStore((s) => s.claimDailyGift);
  const firstOpenDate   = useAppStore((s) => s.firstOpenDate);
  const lastGiftClaimed = useAppStore((s) => s.lastGiftClaimedDate);
  const giftAvailable    = canClaimGift();
  const giftClaimedToday = lastGiftClaimed === todayDate;
  const showGiftBlock = !isPremium && !!firstOpenDate && firstOpenDate < todayDate && (giftAvailable || giftClaimedToday);

  const [giftAnimating, setGiftAnimating] = useState(false);
  const giftScale = useRef(new Animated.Value(1)).current;

  // ── Modal state ──────────────────────────────────────────────────────────────
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarPhase, setAvatarPhase] = useState<'start' | 'loop'>('start');
  const [modalSummary, setModalSummary] = useState<string | null>(null);
  const [modalSummaryLoading, setModalSummaryLoading] = useState(false);

  // ── Animation values ─────────────────────────────────────────────────────────
  const bgScale      = useRef(new Animated.Value(1)).current;
  const bgDim        = useRef(new Animated.Value(0)).current;
  const modalScale   = useRef(new Animated.Value(0.92)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const matrixAnim   = useRef(new Animated.Value(0)).current;
  const matrixScale  = useRef(new Animated.Value(0.7)).current;

  // ── Video players ────────────────────────────────────────────────────────────
  const safePlay  = (p: any) => { try { p?.play?.();  } catch {} };
  const safePause = (p: any) => { try { p?.pause?.(); } catch {} };
  const safeSeek  = (p: any, t: number) => { try { if (p) p.currentTime = t; } catch {} };

  const startPlayer = useVideoPlayer(require('../../assets/avatar_start.mp4'), (player) => {
    player.muted = true;
    player.loop = false;
    if ('audioMixingMode' in player) (player as any).audioMixingMode = 'mixWithOthers';
  });
  const loopPlayer = useVideoPlayer(require('../../assets/avatar_loop.mp4'), (player) => {
    player.muted = true;
    player.loop = true;
    if ('audioMixingMode' in player) (player as any).audioMixingMode = 'mixWithOthers';
  });

  // Preload video assets
  useEffect(() => {
    Asset.loadAsync([
      require('../../assets/avatar_start.mp4'),
      require('../../assets/avatar_loop.mp4'),
    ]);
  }, []);

  // Switch start → loop on playToEnd
  useEffect(() => {
    const sub = startPlayer.addListener('playToEnd', () => {
      setAvatarPhase('loop');
      safeSeek(loopPlayer, 0);
      safePlay(loopPlayer);
    });
    return () => sub.remove();
  }, [startPlayer, loopPlayer]);

  const easeOut = Easing.bezier(0.25, 1, 0.5, 1);

  // ── AI summary for modal ─────────────────────────────────────────────────────
  const MODAL_CACHE_KEY = `home-modal-${todayDate}-${dailyEnergy}`;

  const generateModalSummary = useCallback(async () => {
    const cached = dailyMatrixCache[MODAL_CACHE_KEY];
    if (cached) { setModalSummary(cached); return; }

    if (!isPremium && tokens < MODAL_SUMMARY_COST) return;
    if (!isPremium) {
      if (!spendCrystals(MODAL_SUMMARY_COST)) return;
    }

    setModalSummaryLoading(true);
    try {
      const personalData = destinyMatrix
        ? `Матриця долі: особистість=${destinyMatrix.data.personality} (${getEnergyById(destinyMatrix.data.personality)?.name ?? ''}), душа=${destinyMatrix.data.soul} (${getEnergyById(destinyMatrix.data.soul)?.name ?? ''}), доля=${destinyMatrix.data.destiny} (${getEnergyById(destinyMatrix.data.destiny)?.name ?? ''}).`
        : '';

      const result = await askClaude(
        'Ти — AI Езотерик у застосунку "Matrix of Soul". Відповідай ТІЛЬКИ українською. Коротко, 3-4 речення.',
        [],
        `Енергія дня: ${dailyEnergy}. ${energy?.name ?? ''}.
Матриця дня: Загальна=${dailyMatrix?.personality}, Емоції=${dailyMatrix?.soul}, Дії=${dailyMatrix?.destiny}, Духовне=${dailyMatrix?.spiritual}.
${personalData}
${userName ? `Ім'я: ${userName}.` : ''}

Напиши підсумок матриці дня (3-4 речення). ${destinyMatrix ? 'Обов\'язково порівняй з матрицею долі користувача.' : 'Останнє речення: "Згенеруйте свою Матрицю долі, щоб побачити персональний резонанс."'} Без заголовків, без списків.`,
        800,
      );
      setModalSummary(result);
      setDailyMatrixCache(MODAL_CACHE_KEY, result);
    } catch {
      setModalSummary(`Сьогодні день під впливом енергії ${energy?.name ?? dailyEnergy}. ${energy?.positive ?? 'Прислухайтесь до свого серця.'}`);
    }
    setModalSummaryLoading(false);
  }, [dailyEnergy, dailyMatrix, destinyMatrix, isPremium, tokens, MODAL_CACHE_KEY]);

  // ── Open / close modal ───────────────────────────────────────────────────────
  const openModal = useCallback(() => {
    const cached = dailyMatrixCache[MODAL_CACHE_KEY];
    if (!isPremium && tokens < MODAL_SUMMARY_COST && !cached) {
      router.push('/paywall');
      return;
    }
    setAvatarModalVisible(true);
    Animated.parallel([
      Animated.timing(bgScale,      { toValue: 0.93, duration: 380, easing: easeOut, useNativeDriver: true }),
      Animated.timing(bgDim,        { toValue: 1,    duration: 350, useNativeDriver: true }),
      Animated.timing(modalScale,   { toValue: 1,    duration: 380, easing: easeOut, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 1,    duration: 320, useNativeDriver: true }),
    ]).start();
  }, [isPremium, tokens, MODAL_CACHE_KEY, dailyMatrixCache]);

  const closeModal = useCallback(() => {
    safePause(startPlayer);
    safePause(loopPlayer);
    const easeIn = Easing.in(Easing.ease);
    Animated.parallel([
      Animated.timing(bgScale,      { toValue: 1,    duration: 280, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(bgDim,        { toValue: 0,    duration: 260, easing: easeIn, useNativeDriver: true }),
      Animated.timing(modalScale,   { toValue: 0.92, duration: 240, easing: easeIn, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 0,    duration: 220, easing: easeIn, useNativeDriver: true }),
    ]).start(() => {
      setAvatarModalVisible(false);
      modalScale.setValue(0.92);
      modalOpacity.setValue(0);
    });
  }, [startPlayer, loopPlayer]);

  useEffect(() => {
    if (avatarModalVisible) {
      setAvatarPhase('start');
      safeSeek(startPlayer, 0);
      safePlay(startPlayer);
      // Fallback: якщо відео не завантажилось за 4с → перемикаємо на loop
      const fallback = setTimeout(() => {
        setAvatarPhase((p) => {
          if (p === 'start') { safeSeek(loopPlayer, 0); safePlay(loopPlayer); return 'loop'; }
          return p;
        });
      }, 4000);
      Animated.parallel([
        Animated.timing(matrixAnim,  { toValue: 1, duration: 700, delay: 200, useNativeDriver: true }),
        Animated.spring(matrixScale, { toValue: 1, tension: 60, friction: 8, delay: 200, useNativeDriver: true }),
      ]).start();
      if (!modalSummary) generateModalSummary();
      return () => clearTimeout(fallback);
    } else {
      matrixAnim.setValue(0);
      matrixScale.setValue(0.7);
      safePause(startPlayer);
      safePause(loopPlayer);
    }
  }, [avatarModalVisible]);

  // ── Gift handlers ────────────────────────────────────────────────────────────
  const handleClaimGift = () => {
    if (!giftAvailable || giftClaimedToday || giftAnimating) return;
    setGiftAnimating(true);
    Animated.sequence([
      Animated.spring(giftScale, { toValue: 1.18, tension: 200, friction: 5, useNativeDriver: true }),
      Animated.spring(giftScale, { toValue: 0.92, tension: 200, friction: 8, useNativeDriver: true }),
      Animated.spring(giftScale, { toValue: 1,    tension: 150, friction: 10, useNativeDriver: true }),
    ]).start(() => { claimDailyGift(GIFT_DIAMONDS); setGiftAnimating(false); });
  };

  const dateStr = today.toLocaleDateString('uk-UA', { weekday: 'long', day: 'numeric', month: 'long' });

  // ── Modal JSX ────────────────────────────────────────────────────────────────
  const avatarModal = (
    <Modal visible={avatarModalVisible} transparent animationType="none" onRequestClose={closeModal}>
      <View style={modalStyles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={closeModal} activeOpacity={1} />
        <Animated.View style={[modalStyles.box, { height: SCREEN_H * 0.68, opacity: modalOpacity, transform: [{ scale: modalScale }] }]}>
          {/* Close */}
          <TouchableOpacity style={modalStyles.closeBtn} onPress={closeModal}>
            <Ionicons name="close" size={22} color="#FFF" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled>
            {/* Avatar video */}
            <View style={modalStyles.videoWrap}>
              <VideoView player={startPlayer} style={[modalStyles.video, { opacity: avatarPhase === 'start' ? 1 : 0 }]} contentFit="cover" nativeControls={false} />
              <VideoView player={loopPlayer}  style={[modalStyles.video, { opacity: avatarPhase === 'loop'  ? 1 : 0 }]} contentFit="cover" nativeControls={false} />
              {Platform.OS === 'web' && (
                <style dangerouslySetInnerHTML={{ __html: '#avatarVid video { width:100%!important; height:100%!important; object-fit:cover!important; }' }} />
              )}
              <LinearGradient colors={['#0D0B1E', 'transparent']} style={modalStyles.fadeTop} pointerEvents="none" />
              <LinearGradient colors={['transparent', '#0D0B1E']} style={modalStyles.fadeBottom} pointerEvents="none" />
              <LinearGradient colors={['#0D0B1E', 'transparent', 'transparent', '#0D0B1E']} locations={[0, 0.15, 0.85, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={modalStyles.fadeSides} pointerEvents="none" />
            </View>

            {/* Title */}
            <View style={modalStyles.titleWrap}>
              <Text style={modalStyles.title}>Матриця Дня</Text>
            </View>

            {/* Matrix diagram */}
            <Animated.View style={[modalStyles.diagramWrap, { opacity: matrixAnim, transform: [{ scale: matrixScale }] }]}>
              {dailyMatrix && <MatrixDiagram data={dailyMatrix} size={260} />}
            </Animated.View>

            {/* AI Summary */}
            <View style={modalStyles.summaryWrap}>
              {modalSummaryLoading ? (
                <View style={modalStyles.summaryLoading}>
                  <ActivityIndicator size="small" color={Colors.accent} />
                  <Text style={modalStyles.summaryLoadingText}>AI аналізує матрицю...</Text>
                </View>
              ) : modalSummary ? (
                <Text style={modalStyles.summaryText}>{modalSummary}</Text>
              ) : null}
            </View>

            {/* CTA */}
            <View style={modalStyles.ctaWrap}>
              <TouchableOpacity
                style={modalStyles.ctaBtn}
                onPress={() => {
                  closeModal();
                  setTimeout(() => {
                    router.push(isPremium ? '/matrix/daily' : '/paywall' as any);
                  }, 320);
                }}
              >
                <Ionicons name={isPremium ? 'grid-outline' : 'lock-closed'} size={18} color={Colors.accent} />
                <Text style={modalStyles.ctaText}>
                  {isPremium ? 'Відкрити повну матрицю дня' : 'Розблокувати Матрицю Долі'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      <AnimatedBackground />
      {avatarModal}

      {/* Blur overlay behind modal */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { opacity: bgDim }]}>
        <BlurView intensity={55} tint="dark" style={StyleSheet.absoluteFillObject} />
      </Animated.View>

      {/* Content — scales back when modal opens */}
      <Animated.View style={[{ flex: 1 }, { transform: [{ scale: bgScale }] }]}>
        <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Greeting */}
          <View style={styles.greetingRow}>
            <View>
              <Text style={styles.greeting}>{userName ? `Привіт, ${userName}! 👋` : 'Добрий день! 👋'}</Text>
              <Text style={styles.dateText}>{dateStr}</Text>
            </View>
            <View style={styles.greetingRight}>
              {streak > 0 && (
                <TouchableOpacity style={styles.streakBadge} onPress={() => router.push('/profile/achievements' as any)}>
                  <Text style={styles.streakEmoji}>🔥</Text>
                  <Text style={styles.streakCount}>{streak}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.notifBtn} onPress={() => router.push('/paywall')}>
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

          {/* Daily Gift Banner */}
          {showGiftBlock && (
            <TouchableOpacity activeOpacity={giftClaimedToday ? 1 : 0.85} onPress={handleClaimGift} disabled={giftClaimedToday}>
              <Animated.View style={{ transform: [{ scale: giftScale }] }}>
                <LinearGradient
                  colors={giftClaimedToday ? ['#14532D', '#166534', '#15803D'] : ['#4C1D95', '#6D28D9', '#7C3AED']}
                  style={giftBannerStyles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                >
                  <Text style={giftBannerStyles.icon}>{giftClaimedToday ? '✅' : '🎁'}</Text>
                  <View style={giftBannerStyles.info}>
                    <Text style={giftBannerStyles.title}>{giftClaimedToday ? 'Подарунок зібрано!' : 'У тебе є подарунок!'}</Text>
                    <Text style={giftBannerStyles.sub}>{giftClaimedToday ? `+${GIFT_DIAMONDS} кристалів додано` : `Забери ${GIFT_DIAMONDS} кристали — безкоштовний розклад Таро`}</Text>
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

          {/* ── Матриця дня — відкриває модаль ── */}
          <TouchableOpacity activeOpacity={0.88} onPress={openModal}>
            <LinearGradient colors={['#3D1A78', '#6D28D9', '#8B5CF6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.matrixDayCard}>
              <Text style={styles.matrixDayLabel}>МАТРИЦЯ ДНЯ</Text>
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
            <LinearGradient colors={['#0F2E2A', '#064E3B', '#065F46']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.meditationBanner}>
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
            <LinearGradient colors={['#1E1B4B', '#312E81', '#4338CA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiPromoCard}>
              <Ionicons name="chatbubble-ellipses" size={32} color="#A5B4FC" />
              <View style={styles.aiPromoInfo}>
                <Text style={styles.aiPromoTitle}>AI Езотерик</Text>
                <Text style={styles.aiPromoText}>Задайте питання своїй матриці або картам Таро</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#A5B4FC" />
            </LinearGradient>
          </TouchableOpacity>

        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: 120 },

  greetingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  greeting: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700' },
  dateText: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2, textTransform: 'capitalize' },
  greetingRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(249,115,22,0.15)', paddingHorizontal: Spacing.sm, paddingVertical: 6, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: '#F97316' },
  streakEmoji: { fontSize: 16 },
  streakCount: { color: '#F97316', fontSize: FontSize.sm, fontWeight: '800' },
  notifBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.bgCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border, position: 'relative' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error, borderWidth: 1, borderColor: Colors.bg },

  affirmationCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.md, borderColor: Colors.accentMuted, paddingVertical: Spacing.sm },
  affirmationEmoji: { fontSize: 20 },
  affirmationText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18, flex: 1, fontStyle: 'italic' },

  matrixDayCard: { borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.lg },
  matrixDayLabel: { color: '#E9D5FF', fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 1.5, marginBottom: Spacing.md },
  matrixDayNums: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginBottom: Spacing.lg },
  matrixDayNumItem: { alignItems: 'center', gap: 4, flex: 1 },
  matrixDayNumVal: { color: '#FFFFFF', fontSize: 42, fontWeight: '800', textShadowColor: 'rgba(245,197,66,0.5)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  matrixDayNumLabel: { color: 'rgba(233,213,255,0.7)', fontSize: 9, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  matrixDayCta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: BorderRadius.full, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)' },
  matrixDayCtaText: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: '700' },

  sectionTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.md, marginTop: Spacing.md },

  meditationBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md },
  meditationBannerEmoji: { fontSize: 36 },
  meditationBannerInfo: { flex: 1, gap: 3 },
  meditationBannerTitle: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '700' },
  meditationBannerSub: { color: '#6EE7B7', fontSize: FontSize.sm },

  aiPromoCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginTop: Spacing.sm, marginBottom: Spacing.lg },
  aiPromoInfo: { flex: 1 },
  aiPromoTitle: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '700' },
  aiPromoText: { color: '#A5B4FC', fontSize: FontSize.sm, marginTop: 2 },
});

const modalStyles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, backgroundColor: 'rgba(5,3,18,0.82)' },
  box: { width: '92%', backgroundColor: '#0D0B1E', borderRadius: BorderRadius.xl, overflow: 'hidden' },
  closeBtn: { position: 'absolute', top: 12, right: 12, zIndex: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },

  videoWrap: { width: '100%', height: 160, backgroundColor: '#0D0B1E', overflow: 'hidden' },
  video: { position: 'absolute', top: 0, left: -20, width: '110%', height: '100%' },
  fadeTop:    { position: 'absolute', top: 0,    left: 0, width: '100%', height: 40, zIndex: 1 },
  fadeBottom: { position: 'absolute', bottom: 0, left: 0, width: '100%', height: 60, zIndex: 1 },
  fadeSides:  { position: 'absolute', top: 0,    left: 0, width: '100%', height: '100%', zIndex: 1 },

  titleWrap: { alignItems: 'center', paddingTop: Spacing.sm, paddingHorizontal: Spacing.md },
  title: { color: '#FFF', fontSize: FontSize.lg, fontWeight: '700' },

  diagramWrap: { alignItems: 'center', paddingVertical: Spacing.sm },

  summaryWrap: { paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  summaryLoading: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'center' },
  summaryLoadingText: { color: Colors.textMuted, fontSize: FontSize.xs },
  summaryText: { color: Colors.textSecondary, fontSize: 12, lineHeight: 17, textAlign: 'center' },

  ctaWrap: { padding: Spacing.md, paddingTop: 0 },
  ctaBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 8, backgroundColor: Colors.accentMuted, borderRadius: BorderRadius.lg, paddingVertical: 14, paddingHorizontal: Spacing.lg },
  ctaText: { color: Colors.accent, fontSize: FontSize.md, fontWeight: '700', flexShrink: 1, textAlign: 'center' },
});

const giftBannerStyles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: BorderRadius.xl, padding: Spacing.lg, marginBottom: Spacing.md },
  icon: { fontSize: 36 },
  info: { flex: 1 },
  title: { color: '#FFFFFF', fontSize: FontSize.md, fontWeight: '800' },
  sub: { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.sm, marginTop: 3, lineHeight: 18 },
  claimBtn: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  claimBtnText: { color: '#FFFFFF', fontSize: FontSize.sm, fontWeight: '700' },
});
