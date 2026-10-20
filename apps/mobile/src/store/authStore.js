import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api, unwrap } from '@/services/api';

const TOKEN_KEY = 'socialhub.tokens';
const USER_KEY = 'socialhub.user';
const PREFS_KEY = 'socialhub.prefs';

async function loadPersisted() {
  try {
    const [t, u] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]);
    const tokens = t ? JSON.parse(t) : null;
    const user = u ? JSON.parse(u) : null;
    return { tokens, user };
  } catch {
    return { tokens: null, user: null };
  }
}

async function persist(tokens, user) {
  try {
    if (tokens) await SecureStore.setItemAsync(TOKEN_KEY, JSON.stringify(tokens));
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
    if (user) await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    else await AsyncStorage.removeItem(USER_KEY);
  } catch {}
}

export const useAuthStore = create((set, get) => ({
  user: null,
  tokens: null,
  isBootstrapping: true,

  async bootstrap() {
    const { tokens, user } = await loadPersisted();
    set({ tokens, user, isBootstrapping: false });
    if (tokens?.accessToken) {
      try {
        const me = await api.get('/auth/me');
        const fresh = unwrap(me);
        if (fresh) {
          set({ user: fresh });
          await persist(get().tokens, fresh);
        }
      } catch {}
    }
  },

  async login(payload) {
    const data = unwrap(await api.post('/auth/login', payload));
    await persist({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
    set({ tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken }, user: data.user });
    return data.user;
  },

  async register(payload) {
    const data = unwrap(await api.post('/auth/register', payload));
    await persist({ accessToken: data.accessToken, refreshToken: data.refreshToken }, data.user);
    set({ tokens: { accessToken: data.accessToken, refreshToken: data.refreshToken }, user: data.user });
    return data.user;
  },

  async logout() {
    try { await api.post('/auth/logout'); } catch {}
    await persist(null, null);
    set({ tokens: null, user: null });
  },

  async updateUser(partial) {
    const user = { ...get().user, ...partial };
    set({ user });
    await persist(get().tokens, user);
  },

  setTokens(tokens) { set({ tokens }); },

  async setPref(key, value) {
    try {
      const raw = (await AsyncStorage.getItem(PREFS_KEY)) || '{}';
      const prefs = JSON.parse(raw);
      prefs[key] = value;
      await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {}
  },

  async getPref(key) {
    try {
      const raw = await AsyncStorage.getItem(PREFS_KEY);
      return raw ? JSON.parse(raw)[key] : undefined;
    } catch { return undefined; }
  },
}));
