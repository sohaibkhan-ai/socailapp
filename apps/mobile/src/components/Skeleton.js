import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Easing } from 'react-native';
import { useTheme } from '@/theme';

export function SkeletonRow({ height = 20, width = '100%', style }) {
  const t = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 700, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0.4, duration: 700, easing: Easing.linear, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return <Animated.View style={[{ height, width, borderRadius: 8, backgroundColor: t.colors.surfaceAlt, opacity }, style]} />;
}

export default function SkeletonList({ rows = 3 }) {
  return (
    <View style={{ padding: 16 }}>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <SkeletonRow height={40} width={40} style={{ borderRadius: 20 }} />
            <View style={{ flex: 1 }}>
              <SkeletonRow height={14} width="40%" />
            </View>
          </View>
          <SkeletonRow height={14} width="90%" style={{ marginBottom: 8 }} />
          <SkeletonRow height={14} width="60%" />
        </View>
      ))}
    </View>
  );
}
