import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

export default function Card({ children, style }) {
  const t = useTheme();
  return <View style={[styles.card, { backgroundColor: t.colors.surface, borderColor: t.colors.border }, style]}>{children}</View>;
}
const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, padding: 16, marginBottom: 12 },
});
