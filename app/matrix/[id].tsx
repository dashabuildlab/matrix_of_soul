import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { Card } from '../../components/ui/Card';
import { EnergyBadge } from '../../components/ui/EnergyBadge';
import { getEnergyById } from '../../constants/energies';
import { useAppStore } from '../../stores/useAppStore';
import { MatrixDiagram } from '../../components/matrix/MatrixDiagram';

const { width } = Dimensions.get('window');

export default function MatrixDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const matrix = useAppStore((s) => s.savedMatrices.find((m) => m.id === id));
  const [selectedNode, setSelectedNode] = useState<string | undefined>();

  if (!matrix) {
    return (
      <View style={styles.container}>
        <Text style={styles.notFound}>Матрицю не знайдено</Text>
      </View>
    );
  }

  const { data } = matrix;
  const diagramSize = width - Spacing.lg * 2;

  const positions = [
    { label: 'Особистість', value: data.personality },
    { label: 'Душа', value: data.soul },
    { label: 'Доля', value: data.destiny },
    { label: 'Духовне', value: data.spiritual },
    { label: 'Матеріальне', value: data.material },
    { label: 'Талант від Бога', value: data.talentFromGod },
    { label: 'Талант від Роду', value: data.talentFromFamily },
    { label: 'Призначення', value: data.purpose },
    { label: 'Кармічний хвіст', value: data.karmicTail },
    { label: 'Батьківська карма', value: data.parentKarma },
    { label: 'Чоловіче/Жіноче', value: data.maleFemale },
    { label: 'Центр', value: data.center },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{matrix.name}</Text>
      <Text style={styles.date}>{matrix.birthDate}</Text>

      {/* Matrix Octagram Diagram */}
      <LinearGradient
        colors={['#1E1B4B', '#0A0A1A']}
        style={styles.diagramContainer}
      >
        <MatrixDiagram
          data={data}
          size={diagramSize}
          selectedNode={selectedNode}
          onNodePress={(key) => setSelectedNode(key === selectedNode ? undefined : key)}
        />
      </LinearGradient>

      {positions.map((pos) => {
        const energy = getEnergyById(pos.value);
        return (
          <Card key={pos.label} style={styles.posCard}>
            <View style={styles.posHeader}>
              <EnergyBadge energyId={pos.value} size="md" />
              <View style={styles.posInfo}>
                <Text style={styles.posLabel}>{pos.label}</Text>
                <Text style={styles.posName}>
                  {pos.value}. {energy?.name}
                </Text>
              </View>
            </View>
            <Text style={styles.posPositive}>+ {energy?.positive}</Text>
            <Text style={styles.posNegative}>- {energy?.negative}</Text>
            <Text style={styles.posAdvice}>{energy?.advice}</Text>
          </Card>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  content: { padding: Spacing.lg, paddingBottom: 120 },
  notFound: {
    color: Colors.textMuted,
    fontSize: FontSize.lg,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  title: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
  },
  date: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    marginBottom: Spacing.lg,
  },
  diagramContainer: {
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    overflow: 'hidden',
  },
  posCard: { marginBottom: Spacing.md },
  posHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  posInfo: { flex: 1 },
  posLabel: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  posName: {
    color: Colors.text,
    fontSize: FontSize.lg,
    fontWeight: '700',
  },
  posPositive: {
    color: Colors.success,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: 4,
  },
  posNegative: {
    color: Colors.error,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: 4,
  },
  posAdvice: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});
