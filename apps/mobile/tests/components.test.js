import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';

jest.mock('@/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } } },
  unwrap: jest.fn((r) => r?.data?.data ?? r?.data),
  extractMessage: jest.fn(() => 'error'),
}));

import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';

describe('Button', () => {
  it('renders title and fires press', async () => {
    const onPress = jest.fn();
    await render(<Button title="Save" onPress={onPress} />);
    fireEvent.press(screen.getByText('Save'));
    expect(onPress).toHaveBeenCalled();
  });
  it('disabled buttons do not fire press', async () => {
    const onPress = jest.fn();
    await render(<Button title="Save" onPress={onPress} disabled />);
    fireEvent.press(screen.getByText('Save'));
    expect(onPress).not.toHaveBeenCalled();
  });
  it('loading state shows spinner instead of title', async () => {
    await render(<Button title="Save" loading />);
    expect(screen.queryByText('Save')).toBeNull();
  });
});

describe('EmptyState', () => {
  it('renders title, message and retry button', async () => {
    const onRetry = jest.fn();
    await render(<EmptyState title="Nothing here" message="Check back later" onRetry={onRetry} />);
    expect(screen.getByText('Nothing here')).toBeTruthy();
    expect(screen.getByText('Check back later')).toBeTruthy();
    fireEvent.press(screen.getByText('Try again'));
    expect(onRetry).toHaveBeenCalled();
  });
});
