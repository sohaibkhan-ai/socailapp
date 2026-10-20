import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';
import Button from './Button';

export default function ConfirmDialog({ visible, title, message, confirmLabel = 'Confirm', destructive = false, onConfirm, onCancel }) {
  const t = useTheme();
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
        <View accessibilityRole="alert" style={[styles.sheet, { backgroundColor: t.colors.surface }]}>
          <Text style={[styles.title, { color: t.colors.text }]}>{title}</Text>
          {message ? <Text style={[styles.msg, { color: t.colors.textMuted }]}>{message}</Text> : null}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
            <Button title="Cancel" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
            <Button title={confirmLabel} variant={destructive ? 'danger' : 'primary'} onPress={onConfirm} style={{ flex: 1 }} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { borderRadius: 16, padding: 24, width: '100%' },
  title: { fontSize: 18, fontWeight: '700' },
  msg: { fontSize: 14, marginTop: 8, lineHeight: 20 },
});
