import React from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';

export default function KeyboardAvoiding({ children, style }) {
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.fill, style]}>
      {children}
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({ fill: { flex: 1 } });
