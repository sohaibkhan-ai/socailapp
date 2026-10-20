import axios from 'axios';
import { useAuthStore } from '@/store/authStore';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

export function extractMessage(error, fallback = 'Something went wrong') {
  if (error?.response?.data) {
    const body = error.response.data;
    if (body.success === false && body.error?.message) return body.error.message;
    if (body.error?.message) return body.error.message;
    if (typeof body.message === 'string') return body.message;
  }
  if (error?.message === 'Network Error') return 'Network error — check your connection';
  return fallback;
}

export function unwrap(response) {
  const body = response?.data;
  if (body && typeof body === 'object' && 'success' in body) {
    if (body.success === false) {
      const err = new Error(body.error?.message || 'Request failed');
      err.code = body.error?.code;
      err.details = body.error?.details;
      throw err;
    }
    return body.data;
  }
  return body;
}

// The API returns media paths relative to its origin (e.g. "/static/x.jpg");
// convert them to absolute URLs the phone can actually load.
export function mediaUrl(path) {
  if (!path || typeof path !== 'string') return null;
  if (/^https?:\/\//.test(path)) return path;
  const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().tokens?.accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;

async function doRefresh() {
  const rt = useAuthStore.getState().tokens?.refreshToken;
  if (!rt) throw new Error('No refresh token');
  const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken: rt });
  const payload = data?.data || data;
  const tokens = { accessToken: payload.accessToken, refreshToken: payload.refreshToken || rt };
  useAuthStore.getState().setTokens(tokens);
  await useAuthStore.getState().updateUser(useAuthStore.getState().user || {});
  return tokens.accessToken;
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const code = error.response?.data?.error?.code;
    if (status === 401 && code === 'UNAUTHORIZED' && original && !original._retried) {
      original._retried = true;
      try {
        refreshing = refreshing || doRefresh();
        const token = await refreshing;
        refreshing = null;
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch (e) {
        refreshing = null;
        useAuthStore.getState().logout();
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);

export async function request(config) {
  const res = await api(config);
  return unwrap(res);
}
