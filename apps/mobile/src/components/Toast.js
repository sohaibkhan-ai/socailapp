import React, { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/theme';

let showToastRef = null;
export function showToast(message, type = 'info') { showToastRef?.(message, type); }

export default function ToastHost() {
  const t = useTheme();
  const [state, setState] = React.useState(null);
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    showToastRef = (message, type) => {
      setState({ message, type });
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(2200),
        Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
      ]).start(() => setState(null));
    };
    return () => { showToastRef = null; };
  }, [opacity]);

  if (!state) return null;
  const bg = state.type === 'error' ? t.colors.error : state.type === 'success' ? t.colors.success : t.colors.text;
  return (
    <Animated.View accessibilityRole="alert" accessibilityLiveRegion="polite" style={[styles.toast, { backgroundColor: bg, opacity }]} pointerEvents="none">
      <Text style={styles.text}>{state.message}</Text>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  toast: { position: 'absolute', bottom: 80, left: 24, right: 24, padding: 14, borderRadius: 12, zIndex: 1000 },
  text: { color: '#fff', textAlign: 'center', fontSize: 14, fontWeight: '600' },
});
