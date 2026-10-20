import React from 'react';
import { TextInput, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

export default function SearchBar({ value, onChangeText, placeholder = 'Search', ...rest }) {
  const t = useTheme();
  return (
    <View style={[styles.row, { backgroundColor: t.colors.surface, borderColor: t.colors.border }]}>
      <Ionicons name="search" size={18} color={t.colors.textMuted} />
      <TextInput
        style={[styles.input, { color: t.colors.text }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={t.colors.textMuted}
        accessibilityLabel={placeholder}
        returnKeyType="search"
        {...rest}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, minHeight: 48 },
  input: { flex: 1, fontSize: 16, paddingVertical: 12 },
});
