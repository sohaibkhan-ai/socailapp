import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'socialhub.settings';

export const useSettingsStore = create((set, get) => ({
  theme: 'system',
  hydrated: false,
  async load() {
    try {
      const raw = await AsyncStorage.getItem(KEY);
      if (raw) set({ theme: JSON.parse(raw).theme || 'system' });
    } catch {}
    set({ hydrated: true });
  },
  async setTheme(theme) {
    set({ theme });
    try { await AsyncStorage.setItem(KEY, JSON.stringify({ theme })); } catch {}
  },
}));
