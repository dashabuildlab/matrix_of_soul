import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, FontSize } from '../../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function TarotHistoryScreen() {
  return (
    <View style={styles.container}>
      <Ionicons name="time-outline" size={48} color={Colors.textMuted} />
      <Text style={styles.title}>Історія Розкладів</Text>
      <Text style={styles.hint}>
        Тут з'являться ваші збережені розклади
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: FontSize.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  hint: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
});
