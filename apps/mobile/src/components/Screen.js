import React from 'react';
import { ScrollView, View, RefreshControl, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, useResponsive, MAX_CONTENT_WIDTH } from '@/theme';

// Screen: the app's page container. Handles safe areas, keyboard avoidance,
// pull-to-refresh, and — on tablets / landscape — centers content in a
// readable column instead of stretching edge to edge.
export default function Screen({ children, scroll = false, refresh = null, refreshing = false, keyboard = false, style, contentStyle, centered = false }) {
  const t = useTheme();
  const r = useResponsive();
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 16 };
  const isWide = r.isTablet || r.isLandscape;
  // Constrain content into a centered column on wide screens.
  const frame = isWide
    ? { alignSelf: 'center', width: '100%', maxWidth: MAX_CONTENT_WIDTH }
    : null;
  const hpad = { paddingHorizontal: r.s(16) };

  if (keyboard) {
    return (
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.fill, { backgroundColor: t.colors.background }]}>
        {scroll ? (
          <ScrollView
            contentContainerStyle={[pad, hpad, frame, centered && styles.centered, contentStyle]}
            keyboardShouldPersistTaps="handled"
            contentInsetAdjustmentBehavior="automatic"
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[pad, hpad, styles.fill, frame, centered && styles.centered, style, contentStyle]}>{children}</View>
        )}
      </KeyboardAvoidingView>
    );
  }
  if (scroll) {
    return (
      <View style={[styles.fill, { backgroundColor: t.colors.background }]}>
        <ScrollView
          contentContainerStyle={[pad, hpad, frame, contentStyle]}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
          refreshControl={refresh ? <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={t.colors.primary} /> : undefined}
        >
          {children}
        </ScrollView>
      </View>
    );
  }
  return <View style={[styles.fill, pad, hpad, { backgroundColor: t.colors.background }, frame, style, contentStyle]}>{children}</View>;
}
const styles = StyleSheet.create({
  fill: { flex: 1 },
  centered: { justifyContent: 'center' },
});
