import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { Card } from '../components/ui/Card';

const { width } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'all', label: 'Всі' },
  { id: 'morning', label: 'Ранок' },
  { id: 'sleep', label: 'Сон' },
  { id: 'chakra', label: 'Чакри' },
  { id: 'manifest', label: 'Маніфест' },
  { id: 'healing', label: 'Зцілення' },
];

const MEDITATIONS = [
  {
    id: '1',
    title: 'Ранкова Активація',
    subtitle: 'Налаштуйте себе на продуктивний день',
    category: 'morning',
    duration: '10 хв',
    durationSec: 600,
    icon: '☀️',
    gradient: ['#78350F', '#D97706'] as [string, string],
    isPremium: false,
    frequency: '528 Гц',
    description: 'Пробудіть свою внутрішню силу та встановіть позитивний намір на день.',
  },
  {
    id: '2',
    title: 'Чакра Серця',
    subtitle: 'Відкрийте серцевий центр',
    category: 'chakra',
    duration: '15 хв',
    durationSec: 900,
    icon: '💚',
    gradient: ['#064E3B', '#059669'] as [string, string],
    isPremium: true,
    frequency: '639 Гц',
    description: 'Медитація для відкриття Анахата чакри — центру любові та гармонії.',
  },
  {
    id: '3',
    title: 'Глибокий Сон',
    subtitle: 'Підготовка до відновного сну',
    category: 'sleep',
    duration: '20 хв',
    durationSec: 1200,
    icon: '🌙',
    gradient: ['#1E1B4B', '#4338CA'] as [string, string],
    isPremium: true,
    frequency: '432 Гц',
    description: 'Розслабте тіло та розум для глибокого, відновного сну.',
  },
  {
    id: '4',
    title: 'Маніфестація Мрій',
    subtitle: 'Притягніть бажане у своє життя',
    category: 'manifest',
    duration: '12 хв',
    durationSec: 720,
    icon: '✨',
    gradient: ['#3B0764', '#7C3AED'] as [string, string],
    isPremium: true,
    frequency: '963 Гц',
    description: 'Потужна медитація для маніфестації, заснована на законі тяжіння.',
  },
  {
    id: '5',
    title: 'Захист Аури',
    subtitle: 'Очищення та захист енергетичного поля',
    category: 'healing',
    duration: '8 хв',
    durationSec: 480,
    icon: '🛡️',
    gradient: ['#1E3A5F', '#2563EB'] as [string, string],
    isPremium: false,
    frequency: '741 Гц',
    description: 'Очистіть ауру від чужих енергій та встановіть захисний щит.',
  },
  {
    id: '6',
    title: 'Коренева Чакра',
    subtitle: 'Заземлення та безпека',
    category: 'chakra',
    duration: '10 хв',
    durationSec: 600,
    icon: '🔴',
    gradient: ['#450A0A', '#B91C1C'] as [string, string],
    isPremium: true,
    frequency: '396 Гц',
    description: 'Зміцніть Муладхара чакру для відчуття стабільності та безпеки.',
  },
  {
    id: '7',
    title: 'Вдячність',
    subtitle: 'Практика вдячності для серця',
    category: 'morning',
    duration: '7 хв',
    durationSec: 420,
    icon: '🙏',
    gradient: ['#831843', '#BE185D'] as [string, string],
    isPremium: false,
    frequency: '528 Гц',
    description: 'Наповніться вдячністю та притягніть більше благ у своє життя.',
  },
  {
    id: '8',
    title: 'Зцілення Тіла',
    subtitle: 'Медитація для фізичного відновлення',
    category: 'healing',
    duration: '25 хв',
    durationSec: 1500,
    icon: '💙',
    gradient: ['#0C4A6E', '#0284C7'] as [string, string],
    isPremium: true,
    frequency: '285 Гц',
    description: 'Активуйте природний процес зцілення тіла через свідоме дихання.',
  },
];

interface PlayerState {
  meditationId: string | null;
  isPlaying: boolean;
  progress: number; // 0-1
  elapsed: number; // seconds
}

export default function MeditationScreen() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [player, setPlayer] = useState<PlayerState>({
    meditationId: null,
    isPlaying: false,
    progress: 0,
    elapsed: 0,
  });

  // Simulate playback timer
  useEffect(() => {
    if (!player.isPlaying || !player.meditationId) return;
    const med = MEDITATIONS.find((m) => m.id === player.meditationId);
    if (!med) return;

    const interval = setInterval(() => {
      setPlayer((prev) => {
        const newElapsed = prev.elapsed + 1;
        if (newElapsed >= med.durationSec) {
          clearInterval(interval);
          return { ...prev, isPlaying: false, progress: 1, elapsed: med.durationSec };
        }
        return { ...prev, elapsed: newElapsed, progress: newElapsed / med.durationSec };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [player.isPlaying, player.meditationId]);

  const filtered = activeCategory === 'all'
    ? MEDITATIONS
    : MEDITATIONS.filter((m) => m.category === activeCategory);

  const activeMed = MEDITATIONS.find((m) => m.id === player.meditationId);

  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const playMeditation = (med: (typeof MEDITATIONS)[0]) => {
    if (player.meditationId === med.id) {
      setPlayer((prev) => ({ ...prev, isPlaying: !prev.isPlaying }));
    } else {
      setPlayer({ meditationId: med.id, isPlaying: true, progress: 0, elapsed: 0 });
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <LinearGradient
          colors={['#0F0820', '#1E1B4B']}
          style={styles.header}
        >
          <Text style={styles.headerTitle}>🎧 Медитації</Text>
          <Text style={styles.headerSubtitle}>
            Звукові ванни · Бінауральні ритми · Частоти зцілення
          </Text>
        </LinearGradient>

        {/* Category filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catChip, activeCategory === cat.id && styles.catChipActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text style={[styles.catLabel, activeCategory === cat.id && styles.catLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* Free meditations banner */}
        <Card style={styles.freeBanner}>
          <Ionicons name="gift-outline" size={20} color={Colors.success} />
          <Text style={styles.freeBannerText}>
            {MEDITATIONS.filter((m) => !m.isPremium).length} безкоштовних медитацій доступно
          </Text>
        </Card>

        {/* Meditations list */}
        <View style={styles.list}>
          {filtered.map((med) => {
            const isActive = player.meditationId === med.id;
            const isPlaying = isActive && player.isPlaying;

            return (
              <TouchableOpacity
                key={med.id}
                activeOpacity={0.8}
                onPress={() => playMeditation(med)}
              >
                <LinearGradient
                  colors={isActive ? med.gradient : ['#141428', '#1C1C3A']}
                  style={[styles.medCard, isActive && styles.medCardActive]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Premium badge */}
                  {med.isPremium && (
                    <View style={styles.premiumBadge}>
                      <Ionicons name="lock-closed" size={10} color={Colors.accent} />
                      <Text style={styles.premiumBadgeText}>Premium</Text>
                    </View>
                  )}

                  <View style={styles.medContent}>
                    <Text style={styles.medEmoji}>{med.icon}</Text>
                    <View style={styles.medInfo}>
                      <Text style={styles.medTitle}>{med.title}</Text>
                      <Text style={styles.medSubtitle}>{med.subtitle}</Text>
                      <View style={styles.medMeta}>
                        <Text style={styles.medDuration}>{med.duration}</Text>
                        <Text style={styles.medDot}>·</Text>
                        <Text style={styles.medFreq}>{med.frequency}</Text>
                      </View>
                    </View>
                    <View style={[styles.playBtn, isActive && styles.playBtnActive]}>
                      <Ionicons
                        name={isPlaying ? 'pause' : 'play'}
                        size={22}
                        color={isActive ? '#FFFFFF' : Colors.primary}
                      />
                    </View>
                  </View>

                  {/* Progress bar for active */}
                  {isActive && (
                    <View style={styles.progressContainer}>
                      <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${player.progress * 100}%` }]} />
                      </View>
                      <View style={styles.timeRow}>
                        <Text style={styles.timeText}>{formatTime(player.elapsed)}</Text>
                        <Text style={styles.timeText}>{med.duration}</Text>
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: activeMed ? 120 : 100 }} />
      </ScrollView>

      {/* Sticky Player (when playing) */}
      {activeMed && (
        <View style={styles.stickyPlayer}>
          <LinearGradient
            colors={activeMed.gradient}
            style={styles.stickyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.stickyEmoji}>{activeMed.icon}</Text>
            <View style={styles.stickyInfo}>
              <Text style={styles.stickyTitle} numberOfLines={1}>{activeMed.title}</Text>
              <View style={styles.stickyProgress}>
                <View style={styles.stickyProgressTrack}>
                  <View style={[styles.stickyProgressFill, { width: `${player.progress * 100}%` }]} />
                </View>
                <Text style={styles.stickyTime}>
                  {formatTime(player.elapsed)} / {activeMed.duration}
                </Text>
              </View>
            </View>
            <View style={styles.stickyControls}>
              <TouchableOpacity
                onPress={() => setPlayer((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))}
                style={styles.stickyPlayBtn}
              >
                <Ionicons
                  name={player.isPlaying ? 'pause-circle' : 'play-circle'}
                  size={40}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setPlayer({ meditationId: null, isPlaying: false, progress: 0, elapsed: 0 })}
              >
                <Ionicons name="close-circle-outline" size={28} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 20 },

  header: {
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#A78BFA',
    fontSize: FontSize.md,
  },

  categoryScroll: { marginTop: Spacing.md },
  categoryRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  catChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  catChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  catLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  catLabelActive: {
    color: Colors.text,
  },

  freeBanner: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  freeBannerText: {
    color: Colors.success,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  list: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  medCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  medCardActive: {
    borderColor: 'transparent',
  },
  premiumBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  premiumBadgeText: {
    color: Colors.accent,
    fontSize: 10,
    fontWeight: '700',
  },
  medContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  medEmoji: { fontSize: 36 },
  medInfo: { flex: 1, gap: 3 },
  medTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  medSubtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  medMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  medDuration: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  medDot: { color: Colors.textMuted, fontSize: FontSize.xs },
  medFreq: { color: Colors.primaryLight, fontSize: FontSize.xs },
  playBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  playBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderColor: 'rgba(255,255,255,0.5)',
  },

  progressContainer: {
    marginTop: Spacing.md,
    gap: 6,
  },
  progressTrack: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.xs,
  },

  stickyPlayer: {
    position: 'absolute',
    bottom: 90,
    left: Spacing.md,
    right: Spacing.md,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  stickyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  stickyEmoji: { fontSize: 28 },
  stickyInfo: { flex: 1, gap: 6 },
  stickyTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  stickyProgress: { gap: 4 },
  stickyProgressTrack: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  stickyProgressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.full,
  },
  stickyTime: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  stickyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stickyPlayBtn: {},
});
