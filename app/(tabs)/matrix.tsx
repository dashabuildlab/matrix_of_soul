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
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { getDailyEnergy } from '../../lib/matrix-calc';
import { getEnergyById } from '../../constants/energies';
import { useAppStore } from '../../stores/useAppStore';

const { width } = Dimensions.get('window');

export default function MatrixScreen() {
  const router = useRouter();
  const savedMatrices = useAppStore((s) => s.savedMatrices);
  const dailyEnergy = getDailyEnergy();
  const energy = getEnergyById(dailyEnergy);
  const streak = useAppStore((s) => s.streak);
  const xp = useAppStore((s) => s.xp);
  const level = useAppStore((s) => s.level);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Gamification mini-bar */}
      <TouchableOpacity activeOpacity={0.8} onPress={() => router.push('/profile/achievements')}>
        <Card style={styles.gamifyBar}>
          <View style={styles.gamifyItem}>
            <Text style={styles.gamifyEmoji}>🔥</Text>
            <View>
              <Text style={styles.gamifyValue}>{streak}</Text>
              <Text style={styles.gamifyLabel}>Серія</Text>
            </View>
          </View>
          <View style={styles.gamifyDivider} />
          <View style={styles.gamifyItem}>
            <Text style={styles.gamifyEmoji}>⭐</Text>
            <View>
              <Text style={styles.gamifyValue}>{xp}</Text>
              <Text style={styles.gamifyLabel}>XP</Text>
            </View>
          </View>
          <View style={styles.gamifyDivider} />
          <View style={styles.gamifyItem}>
            <Text style={styles.gamifyEmoji}>🏆</Text>
            <View>
              <Text style={styles.gamifyValue}>{level}</Text>
              <Text style={styles.gamifyLabel}>Рівень</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </Card>
      </TouchableOpacity>

      {/* Daily Energy */}
      <Card style={styles.dailyCard}>
        <Text style={styles.sectionLabel}>Енергія Дня</Text>
        <View style={styles.dailyRow}>
          <EnergyBadge energyId={dailyEnergy} size="lg" showName />
          <View style={styles.dailyInfo}>
            <Text style={styles.dailyTitle}>{dailyEnergy}. {energy?.name}</Text>
            <Text style={styles.dailyKeywords}>{energy?.keywords.join(' · ')}</Text>
            <Text style={styles.dailyAdvice} numberOfLines={2}>{energy?.advice}</Text>
          </View>
        </View>
      </Card>

      {/* Actions */}
      <Text style={styles.sectionTitle}>Матриця</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7} onPress={() => router.push('/matrix/create')}>
          <LinearGradient colors={[Colors.primaryDark, Colors.primary]} style={styles.actionGradient}>
            <Ionicons name="add-circle-outline" size={32} color={Colors.text} />
            <Text style={styles.actionTitle}>Створити{'\n'}Матрицю</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionCard} activeOpacity={0.7} onPress={() => router.push('/matrix/compatibility')}>
          <LinearGradient colors={['#831843', '#BE185D']} style={styles.actionGradient}>
            <Ionicons name="heart-outline" size={32} color="#FCE7F3" />
            <Text style={[styles.actionTitle, { color: '#FCE7F3' }]}>Сумісність{'\n'}Пар</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Quick links */}
      <View style={styles.quickRow}>
        <TouchableOpacity style={styles.quickItem} activeOpacity={0.7} onPress={() => router.push('/matrix/daily')}>
          <Card style={styles.quickCard}>
            <Ionicons name="today-outline" size={22} color={Colors.primary} />
            <Text style={styles.quickLabel}>Матриця{'\n'}Дня</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickItem} activeOpacity={0.7} onPress={() => router.push('/tarot/astro')}>
          <Card style={styles.quickCard}>
            <Ionicons name="planet-outline" size={22} color={Colors.accent} />
            <Text style={styles.quickLabel}>Астро-{'\n'}прогноз</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickItem} activeOpacity={0.7} onPress={() => router.push('/meditation')}>
          <Card style={styles.quickCard}>
            <Ionicons name="headset-outline" size={22} color={Colors.success} />
            <Text style={styles.quickLabel}>Медита-{'\n'}ції</Text>
          </Card>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickItem} activeOpacity={0.7} onPress={() => router.push('/matrix/referral')}>
          <Card style={styles.quickCard}>
            <Ionicons name="gift-outline" size={22} color="#F9A8D4" />
            <Text style={styles.quickLabel}>Запро-{'\n'}сити</Text>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Saved Matrices */}
      {savedMatrices.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Мої Матриці</Text>
          {savedMatrices.slice(0, 5).map((m) => (
            <TouchableOpacity
              key={m.id}
              activeOpacity={0.7}
              onPress={() => router.push(`/matrix/${m.id}`)}
            >
              <Card style={styles.savedItem}>
                <View style={styles.savedLeft}>
                  <View style={styles.savedAvatar}>
                    <Ionicons name="person-outline" size={18} color={Colors.primary} />
                  </View>
                  <View>
                    <Text style={styles.savedName}>{m.name}</Text>
                    <Text style={styles.savedDate}>{m.birthDate}</Text>
                  </View>
                </View>
                <EnergyBadge energyId={m.data.personality} size="sm" />
              </Card>
            </TouchableOpacity>
          ))}
        </>
      )}

      {savedMatrices.length === 0 && (
        <Card style={styles.emptyCard}>
          <Ionicons name="grid-outline" size={40} color={Colors.primaryMuted} />
          <Text style={styles.emptyTitle}>Немає матриць</Text>
          <Text style={styles.emptyText}>Створіть свою першу матрицю долі і відкрийте своє призначення</Text>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 120 },

  gamifyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  gamifyItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  gamifyEmoji: { fontSize: 20 },
  gamifyValue: { color: Colors.text, fontSize: FontSize.md, fontWeight: '800' },
  gamifyLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '500' },
  gamifyDivider: { width: 1, height: 32, backgroundColor: Colors.border },

  dailyCard: { marginBottom: Spacing.lg },
  sectionLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '500',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  dailyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  dailyInfo: { flex: 1 },
  dailyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700', marginBottom: 4 },
  dailyKeywords: { color: Colors.primaryLight, fontSize: FontSize.sm, marginBottom: 4 },
  dailyAdvice: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18 },

  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
  },

  actionsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.md },
  actionCard: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden' },
  actionGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    minHeight: 130,
    borderRadius: BorderRadius.lg,
  },
  actionTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600', textAlign: 'center' },

  quickRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  quickItem: { flex: 1 },
  quickCard: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.xs,
  },
  quickLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },

  savedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  savedLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  savedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  savedDate: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },

  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  emptyTitle: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20 },
});
