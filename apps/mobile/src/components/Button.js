import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

const BG = {
  primary: (t) => t.colors.primary,
  secondary: (t) => t.colors.primarySoft,
  ghost: (t) => 'transparent',
  danger: (t) => t.colors.error,
};
const FG = {
  primary: (t) => t.colors.onPrimary,
  secondary: (t) => t.colors.primary,
  ghost: (t) => t.colors.primary,
  danger: (t) => '#FFFFFF',
};

export default function Button({ title, onPress, variant = 'primary', loading = false, disabled = false, style, icon, ...rest }) {
  const t = useTheme();
  const isDisabled = disabled || loading;
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[
        styles.btn,
        { backgroundColor: isDisabled ? t.colors.surfaceAlt : BG[variant](t), minHeight: 48 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={FG[variant](t)} />
      ) : (
        <Text style={[{ color: isDisabled ? t.colors.textMuted : FG[variant](t), fontWeight: '600', fontSize: 16 }, icon && { marginRight: 8 }]}>
          {icon ? `${icon} ` : ''}{title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 12 },
});
