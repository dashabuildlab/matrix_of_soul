import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';

const { width: W, height: H } = Dimensions.get('window');

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  color: string;
}

const STAR_COLORS = ['#FFFFFF', '#E9D5FF', '#F5C542', '#A78BFA'];

// Generate stars deterministically so they don't re-randomize on each render
const STARS: Star[] = Array.from({ length: 28 }, (_, i) => {
  const seed = i * 137.508; // golden angle
  return {
    id: i,
    x: (Math.sin(seed) * 0.5 + 0.5) * W,
    y: (Math.cos(seed * 1.3) * 0.5 + 0.5) * H * 0.85,
    size: 1 + ((i * 7) % 3),
    duration: 2200 + ((i * 431) % 3000),
    delay: (i * 211) % 3500,
    color: STAR_COLORS[i % STAR_COLORS.length],
  };
});

// Nebula blobs — large, very faint colored orbs
const NEBULAS = [
  { id: 0, x: W * 0.1,  y: H * 0.15, r: 160, color: 'rgba(109,40,217,0.07)' },
  { id: 1, x: W * 0.85, y: H * 0.35, r: 200, color: 'rgba(139,92,246,0.06)' },
  { id: 2, x: W * 0.4,  y: H * 0.65, r: 180, color: 'rgba(245,197,66,0.04)' },
  { id: 3, x: W * 0.75, y: H * 0.75, r: 140, color: 'rgba(167,139,250,0.05)' },
];

function StarDot({ star }: { star: Star }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(star.delay),
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: star.duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.05,
          duration: star.duration,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: star.x,
        top: star.y,
        width: star.size,
        height: star.size,
        borderRadius: star.size / 2,
        backgroundColor: star.color,
        opacity,
      }}
    />
  );
}

export const AnimatedBackground = memo(function AnimatedBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Nebula blobs */}
      {NEBULAS.map((n) => (
        <View
          key={n.id}
          style={{
            position: 'absolute',
            left: n.x - n.r,
            top: n.y - n.r,
            width: n.r * 2,
            height: n.r * 2,
            borderRadius: n.r,
            backgroundColor: n.color,
          }}
        />
      ))}
      {/* Stars */}
      {STARS.map((star) => (
        <StarDot key={star.id} star={star} />
      ))}
    </View>
  );
});
