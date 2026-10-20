import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, makeTheme } from '@/theme';
import { useSettingsStore } from '@/store/settingsStore';
import { useAuthStore } from '@/store/authStore';
import RootNavigator from '@/navigation/RootNavigator';
import ToastHost from '@/components/Toast';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  const themePref = useSettingsStore((s) => s.theme);
  const loadSettings = useSettingsStore((s) => s.load);
  const bootstrap = useAuthStore((s) => s.bootstrap);

  useEffect(() => {
    loadSettings();
    bootstrap();
  }, [loadSettings, bootstrap]);

  return (
    <GestureHandlerRootView style={styles.fill}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <ThemeGate themePref={themePref} />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

function ThemeGate({ themePref }) {
  const [scheme, setScheme] = React.useState('light');
  React.useEffect(() => {
    try {
      const { Appearance } = require('react-native');
      const sub = Appearance.addChangeListener(({ colorScheme }) => setScheme(colorScheme || 'light'));
      setScheme(Appearance.getColorScheme() || 'light');
      return () => sub.remove();
    } catch {}
  }, []);
  const isDark = themePref === 'dark' || (themePref === 'system' && scheme === 'dark');
  const theme = React.useMemo(() => makeTheme(isDark), [isDark]);
  return <ThemeProvider value={theme}><RootNavigator /><ToastHost /></ThemeProvider>;
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
