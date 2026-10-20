import React, { useEffect, useRef } from 'react';
import { Modal, View, Animated, Easing, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useTheme } from '@/theme';

export default function BottomSheet({ visible, onClose, children }) {
  const t = useTheme();
  const y = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    if (visible) Animated.timing(y, { toValue: 0, duration: 260, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    else y.setValue(400);
  }, [visible, y]);
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: 'rgba(0,0,0,0.4)' }]}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View style={[styles.sheet, { backgroundColor: t.colors.surface, transform: [{ translateY: y }] }]}>
            <View style={[styles.handle, { backgroundColor: t.colors.border }]} />
            {children}
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '85%' },
  handle: { alignSelf: 'center', width: 40, height: 5, borderRadius: 3, marginBottom: 12 },
});
