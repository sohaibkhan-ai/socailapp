import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

export default function Divider({ style }) {
  const t = useTheme();
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: t.colors.border }, style]} />;
}
