import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '@/constants/theme';
import { useI18n } from '@/lib/i18n';

interface QuestionHintModalProps {
  visible: boolean;
  onClose: () => void;
}

export function QuestionHintModal({ visible, onClose }: QuestionHintModalProps) {
  const { locale } = useI18n();
  const isUk = locale === 'uk';

  const tips = isUk ? [
    { icon: 'checkmark-circle' as const, text: 'Чи варто мені змінити роботу цього року?', good: true },
    { icon: 'checkmark-circle' as const, text: 'Що мені потрібно знати про мої стосунки з Олексієм?', good: true },
    { icon: 'close-circle' as const, text: 'агвафвфва', good: false },
    { icon: 'close-circle' as const, text: 'що', good: false },
  ] : [
    { icon: 'checkmark-circle' as const, text: 'Should I change my job this year?', good: true },
    { icon: 'checkmark-circle' as const, text: 'What do I need to know about my relationship?', good: true },
    { icon: 'close-circle' as const, text: 'asdfghjk', good: false },
    { icon: 'close-circle' as const, text: 'what', good: false },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <LinearGradient colors={['#1E1B4B', '#0D0B1E']} style={styles.gradient}>
            <View style={styles.iconWrap}>
              <Ionicons name="sparkles" size={28} color={Colors.accent} />
            </View>

            <Text style={styles.title}>
              {isUk ? 'Карти чують ваше запитання' : 'The cards hear your question'}
            </Text>

            <Text style={styles.desc}>
              {isUk
                ? 'Чим точніше сформульоване запитання — тим точнішою буде відповідь карт. Задайте конкретне питання про ситуацію, яка вас хвилює.'
                : 'The more precisely you phrase your question, the more accurate the cards\' answer will be. Ask a specific question about a situation that concerns you.'}
            </Text>

            <View style={styles.tipsBlock}>
              {tips.map((tip, i) => (
                <View key={i} style={styles.tipRow}>
                  <Ionicons
                    name={tip.icon}
                    size={16}
                    color={tip.good ? '#22C55E' : '#FB923C'}
                  />
                  <Text style={[styles.tipText, !tip.good && styles.tipBad]}>
                    {tip.good ? '' : ''}"{tip.text}"
                  </Text>
                </View>
              ))}
            </View>

            <TouchableOpacity onPress={onClose} activeOpacity={0.85}>
              <LinearGradient
                colors={['#C8901A', '#F5C542', '#C8901A']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.btn}
              >
                <Text style={styles.btnText}>
                  {isUk ? 'Зрозуміло, спробую ще' : 'Got it, I\'ll try again'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.lg,
  },
  card: {
    width: '100%', maxWidth: 380, borderRadius: BorderRadius.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(139,92,246,0.3)',
  },
  gradient: { padding: Spacing.xl, alignItems: 'center' },
  iconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(245,197,66,0.12)',
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    borderWidth: 1, borderColor: 'rgba(245,197,66,0.25)',
  },
  title: {
    color: Colors.text, fontSize: FontSize.lg, fontWeight: '800',
    textAlign: 'center', marginBottom: Spacing.sm,
  },
  desc: {
    color: Colors.textSecondary, fontSize: FontSize.sm,
    textAlign: 'center', lineHeight: 20, marginBottom: Spacing.lg,
  },
  tipsBlock: { width: '100%', gap: Spacing.sm, marginBottom: Spacing.lg },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  tipText: { color: Colors.text, fontSize: FontSize.sm, flex: 1, lineHeight: 20 },
  tipBad: { color: Colors.textMuted, textDecorationLine: 'line-through' },
  btn: {
    height: 48, paddingHorizontal: 32, borderRadius: BorderRadius.full,
    alignItems: 'center', justifyContent: 'center',
  },
  btnText: { color: '#1A0A3E', fontSize: FontSize.md, fontWeight: '800' },
});
