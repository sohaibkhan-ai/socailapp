import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, MIN_BODY_FONT } from '@/theme';

export default function TextField({ label, error, secure, value, onChangeText, multiline = false, ...rest }) {
  const t = useTheme();
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, { color: t.colors.textMuted }]} numberOfLines={1}>{label}</Text> : null}
      <View style={[styles.row, multiline && styles.multiline, { borderColor: error ? t.colors.error : t.colors.border, backgroundColor: t.colors.surface }]}>
        <TextInput
          style={[styles.input, { color: t.colors.text }]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={hidden}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          scrollEnabled={multiline}
          autoCorrect={secure ? false : undefined}
          textContentType={secure ? 'password' : undefined}
          autoCapitalize={secure ? 'none' : undefined}
          accessibilityLabel={label}
          accessibilityRole="text"
          placeholderTextColor={t.colors.textMuted}
          {...rest}
        />
        {secure ? (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={hidden ? 'Show password' : 'Hide password'} onPress={() => setHidden(!hidden)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name={hidden ? 'eye-off' : 'eye'} size={20} color={t.colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>
      {error ? <Text accessibilityRole="alert" style={[styles.error, { color: t.colors.error }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 14 },
  label: { fontSize: 13, marginBottom: 6, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, minHeight: 48 },
  multiline: { alignItems: 'flex-start', paddingVertical: 10, minHeight: 110 },
  // fontSize >= 16 stops iOS Safari-style auto-zoom when the field is focused.
  input: { flex: 1, fontSize: MIN_BODY_FONT, paddingVertical: 12 },
  error: { fontSize: 12, marginTop: 6 },
});
