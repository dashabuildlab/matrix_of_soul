import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { MEDITATIONS } from '../lib/staticData';
import { useAppStore } from '../stores/useAppStore';

const CATEGORIES = [
  { id: 'all',      label: 'Всі'      },
  { id: 'morning',  label: 'Ранок'    },
  { id: 'sleep',    label: 'Сон'      },
  { id: 'chakra',   label: 'Чакри'    },
  { id: 'manifest', label: 'Маніфест' },
  { id: 'healing',  label: 'Зцілення' },
];

// Map meditation id → category for filtering
const CATEGORY_MAP: Record<string, string> = {
  '1': 'morning',
  '2': 'chakra',
  '3': 'sleep',
  '4': 'manifest',
  '5': 'healing',
  '6': 'chakra',
  '7': 'morning',
  '8': 'healing',
};

// Map meditation id → Ionicons name
const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  '1': 'sunny-outline',
  '2': 'heart-outline',
  '3': 'moon-outline',
  '4': 'sparkles-outline',
  '5': 'shield-outline',
  '6': 'radio-button-on-outline',
  '7': 'heart-circle-outline',
  '8': 'bulb-outline',
};

export default function MeditationScreen() {
  const router = useRouter();
  const [activeCategory, setActiveCategory] = useState('all');
  const likedMeditations = useAppStore((s) => s.likedMeditations);

  const favorites = MEDITATIONS.filter((m) => likedMeditations.includes(m.id));

  const filtered = activeCategory === 'all'
    ? MEDITATIONS
    : MEDITATIONS.filter((m) => CATEGORY_MAP[m.id] === activeCategory);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Favorites */}
      {favorites.length > 0 && (
        <View style={styles.favSection}>
          <View style={styles.favHeader}>
            <Ionicons name="heart" size={16} color="#F472B6" />
            <Text style={styles.favTitle}>Улюблені</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.favRow}>
              {favorites.map((med) => {
                const icon = ICON_MAP[med.id] ?? 'musical-notes-outline';
                const gradient = med.artwork.gradient as [string, string, string];
                return (
                  <TouchableOpacity
                    key={med.id}
                    style={styles.favCard}
                    activeOpacity={0.8}
                    onPress={() => router.push(`/meditation/player?id=${med.id}`)}
                  >
                    <LinearGradient
                      colors={[gradient[0], gradient[1]]}
                      style={styles.favIconWrap}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    >
                      <Ionicons name={icon} size={22} color="rgba(255,255,255,0.9)" />
                    </LinearGradient>
                    <Text style={styles.favCardTitle} numberOfLines={2}>{med.title}</Text>
                    <Text style={styles.favCardDur}>{med.duration}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Categories */}
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

      {/* All free banner */}
      <Card style={styles.freeBanner}>
        <Ionicons name="gift-outline" size={20} color={Colors.success} />
        <Text style={styles.freeBannerText}>Всі медитації безкоштовні</Text>
      </Card>

      {/* List */}
      <View style={styles.list}>
        {filtered.map((med) => {
          const icon = ICON_MAP[med.id] ?? 'musical-notes-outline';
          const gradient = med.artwork.gradient as [string, string, string];

          return (
            <TouchableOpacity
              key={med.id}
              activeOpacity={0.8}
              onPress={() => router.push(`/meditation/player?id=${med.id}`)}
            >
              <LinearGradient
                colors={['#141428', '#1C1C3A']}
                style={styles.medCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.medContent}>
                  <LinearGradient
                    colors={[gradient[0], gradient[1]]}
                    style={styles.medIconWrap}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name={icon} size={26} color="rgba(255,255,255,0.9)" />
                  </LinearGradient>
                  <View style={styles.medInfo}>
                    <Text style={styles.medTitle}>{med.title}</Text>
                    <Text style={styles.medSubtitle}>{med.subtitle}</Text>
                    <View style={styles.medMeta}>
                      <Text style={styles.medDuration}>{med.duration}</Text>
                      <Text style={styles.medDot}>·</Text>
                      <Text style={styles.medFreq}>{med.frequency}</Text>
                    </View>
                  </View>
                  <View style={styles.playBtn}>
                    <Ionicons name="play-outline" size={20} color={Colors.primary} />
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 20 },

  favSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  favHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  favTitle: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  favRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingRight: Spacing.lg,
  },
  favCard: {
    width: 110,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    gap: 6,
    alignItems: 'flex-start',
  },
  favIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  favCardTitle: {
    color: Colors.text,
    fontSize: FontSize.xs,
    fontWeight: '600',
    lineHeight: 16,
  },
  favCardDur: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },

  categoryScroll: { marginTop: Spacing.md },
  categoryRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
  },
  catChip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: Colors.bgCard,
  },
  catChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  catLabel: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: '600' },
  catLabelActive: { color: Colors.text },

  freeBanner: {
    marginHorizontal: Spacing.lg, marginBottom: Spacing.sm,
    flexDirection: 'row', alignItems: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.sm,
  },
  freeBannerText: { color: Colors.success, fontSize: FontSize.sm, fontWeight: '600' },

  list: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },
  medCard: {
    borderRadius: BorderRadius.xl, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border,
  },
  medContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  medIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  medInfo: { flex: 1, gap: 3 },
  medTitle: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  medSubtitle: { color: Colors.textSecondary, fontSize: FontSize.sm },
  medMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  medDuration: { color: Colors.textMuted, fontSize: FontSize.xs, fontWeight: '600' },
  medDot: { color: Colors.textMuted, fontSize: FontSize.xs },
  medFreq: { color: Colors.primaryLight, fontSize: FontSize.xs },
  playBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.primary,
  },
});
