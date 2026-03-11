import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { ENERGIES } from '../../constants/energies';

export default function LearnScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>22 Енергії</Text>
      <Text style={styles.subtitle}>
        Вивчайте значення кожної енергії та їх вплив на ваше життя
      </Text>

      {ENERGIES.map((energy) => (
        <TouchableOpacity key={energy.id} activeOpacity={0.7}>
          <Card style={styles.energyCard}>
            <View style={styles.energyHeader}>
              <EnergyBadge energyId={energy.id} size="md" />
              <View style={styles.energyInfo}>
                <Text style={styles.energyName}>
                  {energy.id}. {energy.name}
                </Text>
                <Text style={styles.energyArcana}>{energy.arcana}</Text>
                <Text style={styles.energyPlanet}>{energy.planet}</Text>
              </View>
            </View>
            <View style={styles.keywordsRow}>
              {energy.keywords.map((kw) => (
                <View key={kw} style={styles.keywordBadge}>
                  <Text style={styles.keywordText}>{kw}</Text>
                </View>
              ))}
            </View>
          </Card>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  sectionTitle: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  subtitle: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  energyCard: { marginBottom: Spacing.sm },
  energyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  energyInfo: { flex: 1 },
  energyName: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  energyArcana: {
    color: Colors.primaryLight,
    fontSize: FontSize.sm,
  },
  energyPlanet: {
    color: Colors.textMuted,
    fontSize: FontSize.sm,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  keywordBadge: {
    backgroundColor: Colors.primaryMuted,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  keywordText: {
    color: Colors.primaryLight,
    fontSize: FontSize.xs,
    fontWeight: '500',
  },
});
