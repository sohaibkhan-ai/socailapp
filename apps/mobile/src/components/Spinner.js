import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '@/theme';

export default function Spinner({ size = 'large', style }) {
  const t = useTheme();
  return <View style={[{ padding: 24 }, style]}><ActivityIndicator size={size} color={t.colors.primary} /></View>;
}
