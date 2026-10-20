import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

jest.mock('@/services/api', () => ({
  api: { post: jest.fn(), get: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } },
  unwrap: jest.fn((r) => r?.data?.data ?? r?.data),
  extractMessage: jest.fn((e, f) => f || 'error'),
  API_BASE_URL: 'http://localhost:3000/api/v1',
}));

jest.mock('@/components/Toast', () => ({
  showToast: jest.fn(),
  ToastHost: () => null,
}));

import LoginScreen from '@/screens/LoginScreen';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/authStore';

const flush = () => new Promise((r) => setTimeout(r, 0));

function renderLogin() {
  return render(<LoginScreen navigation={{ navigate: jest.fn(), goBack: jest.fn() }} />);
}

describe('LoginScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthStore.setState({ user: null, tokens: null, isBootstrapping: false, login: jest.fn() });
  });

  // react-hook-form resolves async zod validation after fireEvent returns;
  // let those continuations settle before the next test's render.
  afterEach(async () => {
    await flush();
  });

  it('shows validation errors on empty submit', async () => {
    await renderLogin();
    await fireEvent.press(screen.getByText('Log in'));
    expect(await screen.findByText('Enter a valid email')).toBeTruthy();
  });

  it('calls login on valid submit', async () => {
    const login = jest.fn().mockResolvedValue({});
    useAuthStore.setState({ login });
    await renderLogin();
    await fireEvent.changeText(screen.getByPlaceholderText('you@example.com'), 'a@b.co');
    await fireEvent.changeText(screen.getByPlaceholderText('Your password'), 'password1');
    await fireEvent.press(screen.getByText('Log in'));
    for (let i = 0; i < 50 && login.mock.calls.length === 0; i++) {
      await flush();
    }
    expect(login).toHaveBeenCalledWith({ email: 'a@b.co', password: 'password1' });
    await flush();
  });

  it('shows API error on login failure', async () => {
    useAuthStore.setState({ login: jest.fn().mockRejectedValue({}) });
    await renderLogin();
    await fireEvent.changeText(await screen.findByPlaceholderText('you@example.com'), 'a@b.co');
    await fireEvent.changeText(screen.getByPlaceholderText('Your password'), 'password1');
    await fireEvent.press(screen.getByText('Log in'));
    expect(await screen.findByText('Login failed')).toBeTruthy();
  });
});
