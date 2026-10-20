import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ListItem({ title, subtitle, left, right, onPress, chevron = true }) {
  const t = useTheme();
  const Comp = onPress ? TouchableOpacity : View;
  return (
    <Comp accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={typeof title === 'string' ? title : undefined} onPress={onPress} style={[styles.row, { minHeight: 48, borderBottomColor: t.colors.border }]}>
      {left}
      <View style={{ flex: 1 }}>
        {typeof title === 'string' ? <Text style={{ color: t.colors.text, fontSize: 16 }}>{title}</Text> : title}
        {subtitle ? <Text style={{ color: t.colors.textMuted, fontSize: 13, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {right}
      {chevron && onPress ? <Ionicons name="chevron-forward" size={18} color={t.colors.textMuted} /> : null}
    </Comp>
  );
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 12, borderBottomWidth: StyleSheet.hairlineWidth } });
