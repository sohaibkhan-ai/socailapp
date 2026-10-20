import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

export default function Chip({ label, active = false, onPress, style }) {
  const t = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
      onPress={onPress}
      disabled={!onPress}
      style={[styles.chip, { backgroundColor: active ? t.colors.primary : t.colors.primarySoft, minHeight: 36 }, style]}
    >
      <Text style={{ color: active ? t.colors.onPrimary : t.colors.primary, fontWeight: '600', fontSize: 13 }}>{label}</Text>
    </TouchableOpacity>
  );
}
const styles = StyleSheet.create({ chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, marginRight: 8, marginBottom: 8, justifyContent: 'center' } });
