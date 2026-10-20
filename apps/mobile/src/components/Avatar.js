import React from 'react';
import { Image, Text, View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

function initials(name = '') {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() || '').join('') || '?';
}

export default function Avatar({ uri, name, size = 40, style }) {
  const t = useTheme();
  return uri ? (
    <Image source={{ uri }} style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.colors.surfaceAlt }, style]} />
  ) : (
    <View accessibilityRole="image" accessibilityLabel={`${name || 'User'} avatar`} style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: t.colors.primary, alignItems: 'center', justifyContent: 'center' }, style]}>
      <Text style={{ color: t.colors.onPrimary, fontWeight: '700', fontSize: size * 0.38 }}>{initials(name)}</Text>
    </View>
  );
}
