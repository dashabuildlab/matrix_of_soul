import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, FontSize } from '../../constants/theme';
import { getEnergyById } from '../../constants/energies';

interface EnergyBadgeProps {
  energyId: number;
  size?: 'sm' | 'md' | 'lg';
  onPress?: () => void;
  showName?: boolean;
}

export function EnergyBadge({
  energyId,
  size = 'md',
  onPress,
  showName = false,
}: EnergyBadgeProps) {
  const energy = getEnergyById(energyId);
  const dim = size === 'sm' ? 36 : size === 'md' ? 48 : 64;

  const content = (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
          },
        ]}
      >
        <Text
          style={[
            styles.number,
            { fontSize: size === 'sm' ? FontSize.sm : size === 'md' ? FontSize.lg : FontSize.xl },
          ]}
        >
          {energyId}
        </Text>
      </View>
      {showName && energy && (
        <Text style={styles.name} numberOfLines={1}>
          {energy.name}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    backgroundColor: Colors.primaryMuted,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    color: Colors.primaryLight,
    fontWeight: '700',
  },
  name: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    maxWidth: 80,
    textAlign: 'center',
  },
});
