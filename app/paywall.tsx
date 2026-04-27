import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Dimensions, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage, PACKAGE_TYPE } from 'react-native-purchases';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';
import { useAppStore } from '../stores/useAppStore';
import { getOfferings, purchasePackage, restorePurchases } from '../lib/purchases';

const { width } = Dimensions.get('window');

const FEATURES = [
  { icon: 'infinite-outline' as const, label: 'Необмежені AI запити' },
  { icon: 'chatbubbles-outline' as const, label: 'Всі режими AI чату' },
  { icon: 'layers-outline' as const, label: 'Необмежені розклади Таро' },
  { icon: 'people-outline' as const, label: 'Аналіз конфліктів' },
  { icon: 'headset-outline' as const, label: 'Аудіо медитації (50+)' },
  { icon: 'share-social-outline' as const, label: 'Створення карток для Stories' },
  { icon: 'grid-outline' as const, label: 'Матриця на будь-яку людину' },
  { icon: 'heart-outline' as const, label: 'Детальний аналіз сумісності' },
];

const TESTIMONIALS = [
  { name: 'Оксана', avatar: '🌸', text: 'Зрозуміла себе набагато краще! AI аналіз матриці — просто вау!', stars: 5 },
  { name: 'Дмитро', avatar: '⭐', text: 'Конфлікт на роботі вирішився після аналізу. Рекомендую всім!', stars: 5 },
  { name: 'Марія', avatar: '💫', text: 'Медитації допомагають зранку налаштуватись. Дякую за додаток!', stars: 5 },
];

function packageLabel(pkg: PurchasesPackage): string {
  switch (pkg.packageType) {
    case PACKAGE_TYPE.ANNUAL: return 'Рік';
    case PACKAGE_TYPE.MONTHLY: return 'Місяць';
    case PACKAGE_TYPE.WEEKLY: return 'Тиждень';
    default: return pkg.product.title;
  }
}

function packageSavings(pkg: PurchasesPackage, packages: PurchasesPackage[]): string | null {
  if (pkg.packageType !== PACKAGE_TYPE.ANNUAL) return null;
  const monthly = packages.find((p) => p.packageType === PACKAGE_TYPE.MONTHLY);
  if (!monthly) return null;
  const annualMonthly = pkg.product.price / 12;
  const pct = Math.round((1 - annualMonthly / monthly.product.price) * 100);
  return pct > 0 ? `Економія ${pct}%` : null;
}

function packagePerMonth(pkg: PurchasesPackage): string | null {
  if (pkg.packageType === PACKAGE_TYPE.ANNUAL) {
    const monthly = pkg.product.price / 12;
    return `${pkg.product.currencyCode} ${monthly.toFixed(0)}/міс`;
  }
  if (pkg.packageType === PACKAGE_TYPE.WEEKLY) {
    const monthly = pkg.product.price * 4.33;
    return `${pkg.product.currencyCode} ${monthly.toFixed(0)}/міс`;
  }
  return null;
}

export default function PaywallScreen() {
  const router = useRouter();
  const setPremium = useAppStore((s) => s.setPremium);
  const addTokens = useAppStore((s) => s.addTokens);

  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    getOfferings()
      .then((offering) => {
        if (offering?.availablePackages.length) {
          const pkgs = offering.availablePackages;
          setPackages(pkgs);
          const annual = pkgs.find((p) => p.packageType === PACKAGE_TYPE.ANNUAL);
          setSelected(annual ?? pkgs[0]);
        }
      })
      .catch(() => Alert.alert('Помилка', 'Не вдалось завантажити плани підписки.'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async () => {
    if (!selected) return;
    setPurchasing(true);
    try {
      const { isActive } = await purchasePackage(selected);
      if (isActive) {
        const plan = selected.packageType === PACKAGE_TYPE.ANNUAL ? 'yearly'
          : selected.packageType === PACKAGE_TYPE.MONTHLY ? 'monthly' : 'weekly';
        setPremium(true, plan);
        addTokens(100);
        Alert.alert(
          '🎉 Ласкаво просимо до Premium!',
          'Ваш преміум доступ активовано. Насолоджуйтесь всіма можливостями Matrix of Soul!',
          [{ text: 'Почати', onPress: () => router.back() }]
        );
      }
    } catch (err: any) {
      if (!err?.userCancelled) {
        Alert.alert('Помилка', err?.message ?? 'Не вдалось оформити підписку. Спробуйте ще раз.');
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    try {
      const { isActive } = await restorePurchases();
      if (isActive) {
        setPremium(true);
        Alert.alert('Готово', 'Підписку відновлено!', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        Alert.alert('Нічого не знайдено', 'Активних підписок не знайдено для цього акаунту.');
      }
    } catch {
      Alert.alert('Помилка', 'Не вдалось відновити покупки.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
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
        <View style={styles.socialProof}>
          <Text style={styles.socialProofText}>⭐⭐⭐⭐⭐</Text>
          <Text style={styles.socialProofCount}>12,400+ задоволених користувачів</Text>
        </View>
      </LinearGradient>

      {/* Features */}
      <View style={styles.section}>
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
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Оберіть план</Text>

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={Colors.primary} size="large" />
            <Text style={styles.loadingText}>Завантаження планів...</Text>
          </View>
        ) : packages.length === 0 ? (
          <View style={styles.loadingBox}>
            <Text style={styles.loadingText}>Плани недоступні. Перевірте підключення.</Text>
          </View>
        ) : (
          packages.map((pkg) => {
            const isSelected = selected?.identifier === pkg.identifier;
            const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
            const savings = packageSavings(pkg, packages);
            const perMonth = packagePerMonth(pkg);

            return (
              <TouchableOpacity
                key={pkg.identifier}
                style={[styles.planCard, isSelected && styles.planCardSelected]}
                onPress={() => setSelected(pkg)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isSelected
                    ? (isAnnual ? ['#1E1B4B', '#4338CA'] : ['#1E1B4B', '#312E81'])
                    : ['#141428', '#1C1C3A']}
                  style={styles.planGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {isAnnual && (
                    <View style={[styles.planBadge, { backgroundColor: Colors.accent }]}>
                      <Text style={styles.planBadgeText}>🔥 Найкраща ціна</Text>
                    </View>
                  )}
                  <View style={styles.planContent}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.planLabel}>{packageLabel(pkg)}</Text>
                      {savings && <Text style={styles.planSavings}>{savings}</Text>}
                    </View>
                    <View style={styles.planPriceGroup}>
                      <Text style={styles.planPrice}>{pkg.product.priceString}</Text>
                      {perMonth && <Text style={styles.planPricePerMonth}>{perMonth}</Text>}
                    </View>
                    <View style={[styles.planRadio, isSelected && styles.planRadioSelected]}>
                      {isSelected && <View style={styles.planRadioInner} />}
                    </View>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      {/* Testimonials */}
      <View style={{ paddingLeft: Spacing.lg, marginBottom: Spacing.lg }}>
        <Text style={styles.sectionTitle}>Відгуки користувачів</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: Spacing.md, paddingRight: Spacing.lg }}>
            {TESTIMONIALS.map((t, i) => (
              <View key={i} style={styles.testimonialCard}>
                <Text style={{ fontSize: 28 }}>{t.avatar}</Text>
                <Text style={styles.testimonialName}>{t.name}</Text>
                <Text>{'⭐'.repeat(t.stars)}</Text>
                <Text style={styles.testimonialText}>{t.text}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* CTA */}
      <View style={styles.section}>
        <TouchableOpacity
          style={[styles.subscribeBtn, (purchasing || !selected || loading) && { opacity: 0.6 }]}
          onPress={handleSubscribe}
          disabled={purchasing || !selected || loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#7C3AED', '#6D28D9', '#5B21B6']}
            style={styles.subscribeBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {purchasing
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Text style={styles.subscribeBtnText}>
                    {selected ? `Спробувати ${packageLabel(selected)}` : 'Оберіть план'}
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </>
            }
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRestore} disabled={restoring} style={styles.restoreBtn}>
          {restoring
            ? <ActivityIndicator color={Colors.primary} size="small" />
            : <Text style={styles.restoreText}>Відновити покупки</Text>
          }
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
    position: 'absolute', top: 48, right: Spacing.lg, zIndex: 10,
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },

  hero: {
    padding: Spacing.xl, paddingTop: 64,
    alignItems: 'center', gap: Spacing.sm,
  },
  heroEmoji: { fontSize: 56 },
  heroTitle: { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '800', letterSpacing: 1 },
  heroBadge: {
    color: Colors.accent, fontSize: FontSize.sm, fontWeight: '900', letterSpacing: 4,
    backgroundColor: Colors.accentMuted, paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.accent,
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.7)', fontSize: FontSize.md, textAlign: 'center',
    lineHeight: 22, marginTop: Spacing.sm, paddingHorizontal: Spacing.md,
  },
  socialProof: { alignItems: 'center', marginTop: Spacing.md, gap: 4 },
  socialProofText: { fontSize: FontSize.md },
  socialProofCount: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.sm },

  section: { padding: Spacing.lg },
  sectionTitle: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '700', marginBottom: Spacing.md },

  featuresList: { gap: Spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xs },
  featureIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
  },
  featureLabel: { color: Colors.text, fontSize: FontSize.md, flex: 1 },

  loadingBox: { alignItems: 'center', paddingVertical: Spacing.xl, gap: Spacing.md },
  loadingText: { color: Colors.textMuted, fontSize: FontSize.sm },

  planCard: {
    borderRadius: BorderRadius.xl, overflow: 'hidden',
    borderWidth: 1.5, borderColor: Colors.border, marginBottom: Spacing.sm,
  },
  planCardSelected: { borderColor: Colors.primary },
  planGradient: { borderRadius: BorderRadius.xl, padding: Spacing.md, position: 'relative' },
  planBadge: {
    position: 'absolute', top: -1, right: Spacing.md,
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    borderBottomLeftRadius: BorderRadius.sm, borderBottomRightRadius: BorderRadius.sm,
  },
  planBadgeText: { color: Colors.bg, fontSize: FontSize.xs, fontWeight: '700', letterSpacing: 0.5 },
  planContent: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingTop: Spacing.xs },
  planLabel: { color: Colors.text, fontSize: FontSize.lg, fontWeight: '700' },
  planSavings: { color: Colors.success, fontSize: FontSize.xs, fontWeight: '600' },
  planPriceGroup: { alignItems: 'flex-end' },
  planPrice: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '800' },
  planPricePerMonth: { color: Colors.textMuted, fontSize: FontSize.xs },
  planRadio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  planRadioSelected: { borderColor: Colors.primary },
  planRadioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.primary },

  testimonialCard: {
    width: 200, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.xl,
    padding: Spacing.md, gap: 6, borderWidth: 1, borderColor: Colors.border,
  },
  testimonialName: { color: Colors.text, fontSize: FontSize.md, fontWeight: '700' },
  testimonialText: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18 },

  subscribeBtn: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  subscribeBtnGradient: {
    padding: Spacing.lg, alignItems: 'center',
    justifyContent: 'center', flexDirection: 'row', gap: Spacing.sm,
  },
  subscribeBtnText: { color: '#FFFFFF', fontSize: FontSize.lg, fontWeight: '800' },

  restoreBtn: { alignItems: 'center', paddingVertical: Spacing.md },
  restoreText: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: '600' },

  legalText: {
    color: Colors.textMuted, fontSize: FontSize.xs,
    lineHeight: 16, textAlign: 'center', paddingBottom: Spacing.md,
  },
});
