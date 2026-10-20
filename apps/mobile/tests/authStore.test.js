import { useAuthStore } from '@/store/authStore';
import * as SecureStore from 'expo-secure-store';

jest.mock('@/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn() },
  unwrap: (res) => res?.data?.data ?? res?.data ?? res,
}));

import { api } from '@/services/api';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({ user: null, tokens: null, isBootstrapping: true });
    jest.clearAllMocks();
  });

  it('bootstrap hydrates user from persisted state', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(JSON.stringify({ accessToken: 'a', refreshToken: 'r' }));
    const AsyncStorage = jest.requireMock('@react-native-async-storage/async-storage').default;
    AsyncStorage.getItem.mockResolvedValueOnce(JSON.stringify({ id: '1', displayName: 'Jane' }));    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().user).toEqual({ id: '1', displayName: 'Jane' });
    expect(useAuthStore.getState().tokens?.accessToken).toBe('a');
    expect(useAuthStore.getState().isBootstrapping).toBe(false);
  });

  it('login persists tokens and user', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true, data: { user: { id: '1', displayName: 'Jane' }, accessToken: 'at', refreshToken: 'rt' } } });
    await useAuthStore.getState().login({ email: 'a@b.co', password: 'passw0rd' });
    expect(useAuthStore.getState().user.displayName).toBe('Jane');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('socialhub.tokens', expect.any(String));
  });

  it('login failure leaves state unauthenticated', async () => {
    api.post.mockRejectedValueOnce(new Error('bad'));
    await expect(useAuthStore.getState().login({ email: 'a@b.co', password: 'x' })).rejects.toThrow('bad');
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('logout clears user and tokens', async () => {
    useAuthStore.setState({ user: { id: '1' }, tokens: { accessToken: 'a', refreshToken: 'r' } });
    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('socialhub.tokens');
  });
});
