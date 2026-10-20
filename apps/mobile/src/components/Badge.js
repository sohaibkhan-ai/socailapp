import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

export default function Badge({ children, color, style }) {
  const t = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: color || t.colors.primarySoft }, style]}>
      <Text style={{ color: color ? '#fff' : t.colors.primary, fontSize: 12, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}
const styles = StyleSheet.create({ badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' } });
