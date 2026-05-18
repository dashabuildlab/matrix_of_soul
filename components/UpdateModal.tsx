import React from 'react';
import {
  Modal, View, Text, TouchableOpacity, StyleSheet, Linking, Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Ionicons from '@/components/ui/Ionicons';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useI18n } from '@/lib/i18n';

interface Props {
  visible: boolean;
  latestVersion: string;
  storeUrl: string;
  onDismiss: () => void;
}

export function UpdateModal({ visible, latestVersion, storeUrl, onDismiss }: Props) {
  const { locale } = useI18n();
  const uk = locale === 'uk';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Icon */}
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark ?? '#6D28D9']}
            style={styles.iconWrap}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Ionicons name="sparkles" size={28} color="#fff" />
          </LinearGradient>

          {/* Text */}
          <Text style={styles.title}>
            {uk ? 'Доступне оновлення' : 'Update available'}
          </Text>
          <Text style={styles.version}>v{latestVersion}</Text>
          <Text style={styles.body}>
            {uk
              ? 'Нова версія застосунку вже в магазині. Оновіть, щоб отримати покращення та нові функції.'
              : 'A new version is available in the store. Update to get improvements and new features.'}
          </Text>

          {/* Update button */}
          <TouchableOpacity
            style={styles.updateBtn}
            activeOpacity={0.85}
            onPress={() => { Linking.openURL(storeUrl); onDismiss(); }}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark ?? '#6D28D9']}
              style={styles.updateBtnGradient}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Ionicons name="download-outline" size={18} color="#fff" />
              <Text style={styles.updateBtnText}>
                {uk ? 'Оновити' : 'Update'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Later */}
          <TouchableOpacity onPress={onDismiss} style={styles.laterBtn} activeOpacity={0.7}>
            <Text style={styles.laterText}>
              {uk ? 'Пізніше' : 'Later'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: '#1A1033',
    borderRadius: BorderRadius.xl ?? 20,
    borderWidth: 1,
    borderColor: 'rgba(139,92,246,0.3)',
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35, shadowRadius: 12, elevation: 8,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xl ?? 20,
    fontWeight: '800',
    marginBottom: 4,
    textAlign: 'center',
  },
  version: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '700',
    marginBottom: Spacing.md,
  },
  body: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  updateBtn: { width: '100%', marginBottom: Spacing.sm },
  updateBtnGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: BorderRadius.lg, paddingVertical: Spacing.md,
  },
  updateBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },
  laterBtn: { paddingVertical: Spacing.sm },
  laterText: { color: Colors.textMuted, fontSize: FontSize.sm },
});
