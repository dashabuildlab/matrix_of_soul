import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { useAppStore } from '../stores/useAppStore';

const { width } = Dimensions.get('window');

const PLANS = [
  {
    id: 'yearly' as const,
    label: 'Рік',
    price: '₴1 299',
    pricePerMonth: '₴108/міс',
    badge: '🔥 Найкраща ціна',
    badgeColor: Colors.accent,
    savings: 'Економія 64%',
    gradient: ['#1E1B4B', '#4338CA'] as [string, string],
    popular: true,
  },
  {
    id: 'monthly' as const,
    label: 'Місяць',
    price: '₴299',
    pricePerMonth: '₴299/міс',
    badge: null,
    badgeColor: null,
    savings: null,
    gradient: ['#141428', '#1C1C3A'] as [string, string],
    popular: false,
  },
  {
    id: 'weekly' as const,
    label: 'Тиждень',
    price: '₴99',
    pricePerMonth: '₴396/міс',
    badge: 'Спробувати',
    badgeColor: Colors.primary,
    savings: null,
    gradient: ['#141428', '#1C1C3A'] as [string, string],
    popular: false,
  },
];

const FEATURES = [
  { icon: 'infinite-outline' as const, label: 'Необмежені AI запити', premium: true },
  { icon: 'chatbubbles-outline' as const, label: 'Всі режими AI чату', premium: true },
  { icon: 'layers-outline' as const, label: 'Необмежені розклади Таро', premium: true },
  { icon: 'people-outline' as const, label: 'Аналіз конфліктів', premium: true },
  { icon: 'headset-outline' as const, label: 'Аудіо медитації (50+)', premium: true },
  { icon: 'share-social-outline' as const, label: 'Створення карток для Stories', premium: true },
  { icon: 'grid-outline' as const, label: 'Матриця на будь-яку людину', premium: true },
  { icon: 'heart-outline' as const, label: 'Детальний аналіз сумісності', premium: true },
  { icon: 'notifications-outline' as const, label: 'Щоденні натхненні нагадування', premium: true },
  { icon: 'cloud-offline-outline' as const, label: 'Робота без інтернету', premium: true },
];

const TESTIMONIALS = [
  { name: 'Оксана', avatar: '🌸', text: 'Зрозуміла себе набагато краще! AI аналіз матриці — просто вау!', stars: 5 },
  { name: 'Дмитро', avatar: '⭐', text: 'Конфлікт на роботі вирішився після аналізу. Рекомендую всім!', stars: 5 },
  { name: 'Марія', avatar: '💫', text: 'Медитації допомагають зранку налаштуватись. Дякую за додаток!', stars: 5 },
];

export default function PaywallScreen() {
  const router = useRouter();
  const setPremium = useAppStore((s) => s.setPremium);
  const addTokens = useAppStore((s) => s.addTokens);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly' | 'weekly'>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = () => {
    setIsLoading(true);
    // In real app: integrate with RevenueCat / purchases
    setTimeout(() => {
      setPremium(true, selectedPlan);
      addTokens(100);
      setIsLoading(false);
      Alert.alert(
        '🎉 Ласкаво просимо до Premium!',
        'Ваш преміум доступ активовано. Насолоджуйтесь всіма можливостями Matrix of Soul!',
        [{ text: 'Почати', onPress: () => router.back() }]
      );
    }, 1500);
  };

  const handleRestore = () => {
    Alert.alert('Відновлення', 'Перевіряємо ваші покупки...', [{ text: 'OK' }]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* Close button */}
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
        <Ionicons name="close" size={24} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Hero */}
      <LinearGradient
        colors={['#0F0820', '#1E1B4B', '#312E81']}
        style={styles.hero}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <Text style={styles.heroEmoji}>💎</Text>
        <Text style={styles.heroTitle}>Matrix of Soul</Text>
        <Text style={styles.heroBadge}>PREMIUM</Text>
        <Text style={styles.heroSubtitle}>
          Розкрийте повний потенціал вашої матриці долі та карт Таро
        </Text>

        {/* Social proof */}
        <View style={styles.socialProof}>
          <Text style={styles.socialProofText}>⭐⭐⭐⭐⭐</Text>
          <Text style={styles.socialProofCount}>12,400+ задоволених користувачів</Text>
        </View>
      </LinearGradient>

      {/* Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Що входить у Premium</Text>
        <View style={styles.featuresList}>
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={18} color={Colors.primary} />
              </View>
              <Text style={styles.featureLabel}>{f.label}</Text>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
            </View>
          ))}
        </View>
      </View>

      {/* Plans */}
      <View style={styles.plansSection}>
        <Text style={styles.sectionTitle}>Оберіть план</Text>
        {PLANS.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[styles.planCard, selectedPlan === plan.id && styles.planCardSelected]}
            onPress={() => setSelectedPlan(plan.id)}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={selectedPlan === plan.id ? plan.gradient : ['#141428', '#1C1C3A']}
              style={styles.planGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {plan.badge && (
                <View style={[styles.planBadge, { backgroundColor: plan.badgeColor ?? Colors.primary }]}>
                  <Text style={styles.planBadgeText}>{plan.badge}</Text>
                </View>
              )}
              <View style={styles.planContent}>
                <View>
                  <Text style={styles.planLabel}>{plan.label}</Text>
                  {plan.savings && (
                    <Text style={styles.planSavings}>{plan.savings}</Text>
                  )}
                </View>
                <View style={styles.planPriceGroup}>
                  <Text style={styles.planPrice}>{plan.price}</Text>
                  <Text style={styles.planPricePerMonth}>{plan.pricePerMonth}</Text>
                </View>
                <View style={[styles.planRadio, selectedPlan === plan.id && styles.planRadioSelected]}>
                  {selectedPlan === plan.id && <View style={styles.planRadioInner} />}
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      {/* Testimonials */}
      <View style={styles.testimonials}>
        <Text style={styles.sectionTitle}>Відгуки користувачів</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.testimonialsRow}>
            {TESTIMONIALS.map((t, i) => (
              <View key={i} style={styles.testimonialCard}>
                <Text style={styles.testimonialAvatar}>{t.avatar}</Text>
                <Text style={styles.testimonialName}>{t.name}</Text>
                <Text style={styles.testimonialStars}>{'⭐'.repeat(t.stars)}</Text>
                <Text style={styles.testimonialText}>{t.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* CTA */}
      <View style={styles.ctaSection}>
        <TouchableOpacity
          style={[styles.subscribeBtn, isLoading && { opacity: 0.7 }]}
          onPress={handleSubscribe}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7C3AED', '#6D28D9', '#5B21B6']}
            style={styles.subscribeBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.subscribeBtnText}>
              {isLoading ? 'Активація...' : `Спробувати ${PLANS.find((p) => p.id === selectedPlan)?.label}`}
            </Text>
            {!isLoading && <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Відновити покупки</Text>
        </TouchableOpacity>

        <Text style={styles.legalText}>
          Підписка автоматично поновлюється. Скасувати можна в налаштуваннях App Store/Google Play.
          Оформляючи підписку, ви погоджуєтесь з Умовами використання та Політикою конфіденційності.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { paddingBottom: 40 },

  closeBtn: {
    position: 'absolute',
    top: 48,
    right: Spacing.lg,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  hero: {
    padding: Spacing.xl,
    paddingTop: 64,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroBadge: {
    color: Colors.accent,
    fontSize: FontSize.sm,
    fontWeight: '900',
    letterSpacing: 4,
    backgroundColor: Colors.accentMuted,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  socialProof: {
    alignItems: 'center',
    marginTop: Spacing.md,
    gap: 4,
  },
  socialProofText: { fontSize: FontSize.md },
  socialProofCount: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FontSize.sm,
  },

  featuresSection: {
    padding: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  featuresList: { gap: Spacing.sm },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureLabel: {
    color: Colors.text,
    fontSize: FontSize.md,
    flex: 1,
  },

  plansSection: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  planCard: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  planCardSelected: {
    borderColor: Colors.primary,
  },
  planGradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    position: 'relative',
  },
  planBadge: {
    position: 'absolute',
    top: -1,
    right: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderBottomLeftRadius: BorderRadius.sm,
    borderBottomRightRadius: BorderRadius.sm,
  },
  planBadgeText: {
    color: Colors.bg,
    fontSize: FontSize.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  planContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingTop: Spacing.xs,
  },
  planLabel: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  planSavings: {
    color: Colors.success,
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  planPriceGroup: {
    flex: 1,
    alignItems: 'flex-end',
  },
  planPrice: {
    color: Colors.text,
    fontSize: FontSize.xl,
    fontWeight: '800',
  },
  planPricePerMonth: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
  },
  planRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioSelected: {
    borderColor: Colors.primary,
  },
  planRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },

  testimonials: {
    paddingLeft: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  testimonialsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingRight: Spacing.lg,
  },
  testimonialCard: {
    width: 200,
    backgroundColor: Colors.bgCard,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  testimonialAvatar: { fontSize: 28 },
  testimonialName: {
    color: Colors.text,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  testimonialStars: { fontSize: FontSize.sm },
  testimonialText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 18,
  },

  ctaSection: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  subscribeBtn: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  subscribeBtnGradient: {
    padding: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  subscribeBtnText: {
    color: '#FFFFFF',
    fontSize: FontSize.lg,
    fontWeight: '800',
  },

  restoreBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  restoreText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },

  legalText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    lineHeight: 16,
    textAlign: 'center',
    paddingBottom: Spacing.md,
  },
});
