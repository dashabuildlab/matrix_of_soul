import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { Card } from '../components/ui/Card';
import { TAROT_CARDS, drawRandomCards } from '../constants/tarotData';
import { useAppStore } from '../stores/useAppStore';
import { getEnergyById } from '../constants/energies';
import { getDailyEnergy } from '../lib/matrix-calc';

const { width } = Dimensions.get('window');
const CARD_W = width - Spacing.lg * 2;

const CARD_TYPES = [
  { id: 'energy', label: 'Енергія Дня', icon: 'flash-outline' as const, gradient: ['#1E1B4B', '#4338CA'] as [string, string] },
  { id: 'tarot', label: 'Карта Таро', icon: 'layers-outline' as const, gradient: ['#3B0764', '#7C3AED'] as [string, string] },
  { id: 'affirmation', label: 'Афірмація', icon: 'heart-outline' as const, gradient: ['#831843', '#BE185D'] as [string, string] },
  { id: 'matrix', label: 'Матриця', icon: 'grid-outline' as const, gradient: ['#064E3B', '#059669'] as [string, string] },
];

const AFFIRMATIONS = [
  'Я відкритий до всіх можливостей, які несе цей день',
  'Я живу у гармонії з собою та Всесвітом',
  'Мої таланти та здібності приносять користь світу',
  'Я достатній, щоб здійснити свої мрії',
  'Любов і достаток течуть у моє життя природно',
  'Я відпускаю минуле та приймаю нові можливості',
  'Кожен день — це подарунок та новий початок',
  'Я сильний, мудрий та повний любові',
];

export default function ShareScreen() {
  const [selectedType, setSelectedType] = useState('energy');
  const [tarotCard] = useState(() => drawRandomCards(1)[0]);
  const [affirmation] = useState(() => AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)]);
  const userName = useAppStore((s) => s.userName);
  const dailyEnergyId = getDailyEnergy();
  const energy = getEnergyById(dailyEnergyId);
  const savedMatrices = useAppStore((s) => s.savedMatrices);
  const myMatrix = savedMatrices[0];

  const handleShare = async () => {
    let message = '';
    switch (selectedType) {
      case 'energy':
        message = `✨ Енергія дня: ${dailyEnergyId}. ${energy?.name}\n\n"${energy?.advice}"\n\n🔮 Matrix of Soul App`;
        break;
      case 'tarot':
        message = `🃏 Карта дня: ${tarotCard.nameUk}\n\n${tarotCard.upright}\n\n💡 ${tarotCard.advice}\n\n🔮 Matrix of Soul App`;
        break;
      case 'affirmation':
        message = `💫 Афірмація дня:\n\n"${affirmation}"\n\n🔮 Matrix of Soul App`;
        break;
      case 'matrix':
        message = myMatrix
          ? `🌟 Моя матриця долі — число особистості ${myMatrix.data.personality}\n\nВідкрий свою матрицю в Matrix of Soul!`
          : `🌟 Дізнайся свою матрицю долі в Matrix of Soul!`;
        break;
    }
    try {
      await Share.share({ message, title: 'Matrix of Soul' });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  const renderCard = () => {
    switch (selectedType) {
      case 'energy':
        return (
          <LinearGradient colors={['#1E1B4B', '#4338CA', '#6D28D9']} style={styles.shareCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.shareCardBrand}>Matrix of Soul</Text>
            <View style={styles.energyNumber}>
              <Text style={styles.energyNumText}>{dailyEnergyId}</Text>
            </View>
            <Text style={styles.shareCardTitle}>{energy?.name}</Text>
            <Text style={styles.shareCardSubtitle}>Енергія дня</Text>
            <Text style={styles.shareCardText}>"{energy?.advice}"</Text>
            <View style={styles.shareCardKeywords}>
              {energy?.keywords.slice(0, 3).map((kw) => (
                <View key={kw} style={styles.shareKeyword}>
                  <Text style={styles.shareKeywordText}>{kw}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.shareCardDate}>{new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </LinearGradient>
        );

      case 'tarot':
        return (
          <LinearGradient colors={['#3B0764', '#7C3AED', '#8B5CF6']} style={styles.shareCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.shareCardBrand}>Matrix of Soul</Text>
            <View style={styles.tarotCardBox}>
              <Text style={styles.tarotCardNum}>{tarotCard.id}</Text>
              <Ionicons name="star" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.shareCardTitle}>{tarotCard.nameUk}</Text>
            <Text style={styles.shareCardSubtitle}>{tarotCard.name} · {tarotCard.element}</Text>
            <Text style={styles.shareCardText}>{tarotCard.advice}</Text>
            <View style={styles.shareCardKeywords}>
              {tarotCard.keywords.slice(0, 3).map((kw) => (
                <View key={kw} style={styles.shareKeyword}>
                  <Text style={styles.shareKeywordText}>{kw}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.shareCardDate}>{new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </LinearGradient>
        );

      case 'affirmation':
        return (
          <LinearGradient colors={['#831843', '#BE185D', '#EC4899']} style={styles.shareCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.shareCardBrand}>Matrix of Soul</Text>
            <Text style={styles.affirmationEmoji}>💫</Text>
            <Text style={styles.affirmationLabel}>Афірмація дня</Text>
            <Text style={styles.affirmationText}>"{affirmation}"</Text>
            <Text style={styles.shareCardDate}>{new Date().toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
          </LinearGradient>
        );

      case 'matrix':
        return (
          <LinearGradient colors={['#064E3B', '#047857', '#059669']} style={styles.shareCard} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.shareCardBrand}>Matrix of Soul</Text>
            <Ionicons name="grid-outline" size={48} color="rgba(255,255,255,0.6)" />
            {myMatrix ? (
              <>
                <Text style={styles.shareCardTitle}>{myMatrix.name}</Text>
                <View style={styles.matrixNumbers}>
                  <View style={styles.matrixNumItem}>
                    <Text style={styles.matrixNumValue}>{myMatrix.data.personality}</Text>
                    <Text style={styles.matrixNumLabel}>Особистість</Text>
                  </View>
                  <View style={styles.matrixNumItem}>
                    <Text style={styles.matrixNumValue}>{myMatrix.data.purpose}</Text>
                    <Text style={styles.matrixNumLabel}>Призначення</Text>
                  </View>
                  <View style={styles.matrixNumItem}>
                    <Text style={styles.matrixNumValue}>{myMatrix.data.talentFromGod}</Text>
                    <Text style={styles.matrixNumLabel}>Талант</Text>
                  </View>
                </View>
              </>
            ) : (
              <Text style={styles.shareCardText}>Дізнайся свою матрицю долі!</Text>
            )}
            <Text style={styles.shareCardDate}>matrixofsoul.app</Text>
          </LinearGradient>
        );
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Card type selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeScroll}>
        <View style={styles.typeRow}>
          {CARD_TYPES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.typeChip, selectedType === t.id && styles.typeChipActive]}
              onPress={() => setSelectedType(t.id)}
            >
              <Ionicons name={t.icon} size={16} color={selectedType === t.id ? Colors.text : Colors.textMuted} />
              <Text style={[styles.typeChipText, selectedType === t.id && styles.typeChipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Preview card */}
      <View style={styles.preview}>{renderCard()}</View>

      {/* Info */}
      <Card style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
        <Text style={styles.infoText}>
          Натисніть "Поділитись" щоб відкрити меню для публікації в Instagram, TikTok та інших соцмережах
        </Text>
      </Card>

      {/* Share options */}
      <View style={styles.shareOptions}>
        {[
          { label: 'Instagram Stories', icon: '📸', color: '#E1306C' },
          { label: 'TikTok', icon: '🎵', color: '#FF0050' },
          { label: 'Telegram', icon: '✈️', color: '#0088CC' },
          { label: 'WhatsApp', icon: '💬', color: '#25D366' },
          { label: 'Інше', icon: '📤', color: Colors.primary },
        ].map((opt) => (
          <TouchableOpacity key={opt.label} style={styles.shareOptionBtn} onPress={handleShare}>
            <Text style={styles.shareOptionIcon}>{opt.icon}</Text>
            <Text style={[styles.shareOptionLabel, { color: opt.color }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.mainShareBtn} onPress={handleShare} activeOpacity={0.8}>
        <LinearGradient
          colors={[Colors.primary, Colors.primaryDark]}
          style={styles.mainShareGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Ionicons name="share-social-outline" size={22} color="#FFFFFF" />
          <Text style={styles.mainShareText}>Поділитися</Text>
        </LinearGradient>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 100 },

  typeScroll: { marginTop: Spacing.md },
  typeRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  typeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.bgCard,
  },
  typeChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryMuted,
  },
  typeChipText: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  typeChipTextActive: { color: Colors.text },

  preview: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  shareCard: {
    width: CARD_W,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    minHeight: 380,
    justifyContent: 'center',
  },
  shareCardBrand: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    position: 'absolute',
    top: Spacing.lg,
    left: Spacing.lg,
  },
  energyNumber: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  energyNumText: {
    color: Colors.accent,
    fontSize: FontSize.title,
    fontWeight: '900',
  },
  shareCardTitle: {
    color: '#FFFFFF',
    fontSize: FontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
  shareCardSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  shareCardText: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  shareCardKeywords: {
    flexDirection: 'row',
    gap: Spacing.xs,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  shareKeyword: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  shareKeywordText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: FontSize.xs,
  },
  shareCardDate: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: FontSize.xs,
    position: 'absolute',
    bottom: Spacing.lg,
    right: Spacing.lg,
  },

  tarotCardBox: {
    width: 80,
    height: 120,
    borderRadius: BorderRadius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  tarotCardNum: {
    color: Colors.accent,
    fontSize: FontSize.xxl,
    fontWeight: '900',
  },

  affirmationEmoji: { fontSize: 56 },
  affirmationLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  affirmationText: {
    color: '#FFFFFF',
    fontSize: FontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
    fontStyle: 'italic',
  },

  matrixNumbers: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.sm,
  },
  matrixNumItem: { alignItems: 'center', gap: 4 },
  matrixNumValue: {
    color: Colors.accent,
    fontSize: FontSize.xxl,
    fontWeight: '900',
  },
  matrixNumLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.xs,
  },

  infoCard: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  infoText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    flex: 1,
  },

  shareOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    justifyContent: 'center',
  },
  shareOptionBtn: {
    alignItems: 'center',
    gap: 4,
    width: 68,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shareOptionIcon: { fontSize: 24 },
  shareOptionLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },

  mainShareBtn: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  mainShareGradient: {
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  mainShareText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
});
