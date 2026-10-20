import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import Button from './Button';

export default function EmptyState({ icon = 'chatbubbles-outline', title, message, onRetry }) {
  const t = useTheme();
  return (
    <View style={styles.wrap} accessibilityRole="text" accessibilityLabel={`${title}. ${message || ''}`}>
      <Ionicons name={icon} size={48} color={t.colors.textMuted} />
      <Text style={[styles.title, { color: t.colors.text }]} numberOfLines={2}>{title}</Text>
      {message ? <Text style={[styles.msg, { color: t.colors.textMuted }]}>{message}</Text> : null}
      {onRetry ? <Button title="Try again" variant="secondary" onPress={onRetry} style={{ marginTop: 16 }} /> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: 32, paddingVertical: 64 },
  title: { fontSize: 18, fontWeight: '600', marginTop: 12, textAlign: 'center' },
  msg: { fontSize: 14, marginTop: 6, textAlign: 'center' },
});
