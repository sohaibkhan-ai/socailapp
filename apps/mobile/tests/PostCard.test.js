import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';

import PostCard from '@/components/PostCard';

const post = {
  id: '1',
  title: 'Hello world',
  content: 'Some longer content that gets truncated maybe',
  likeCount: 2,
  likedByMe: false,
  commentsCount: 1,
  author: { displayName: 'Jane Doe', avatarUrl: null },
  tags: ['intro'],
  createdAt: '2026-01-01T00:00:00Z',
};

describe('PostCard', () => {
  it('renders title, author and counts', async () => {
    await render(<PostCard post={post} />);
    expect(screen.getByText('Hello world')).toBeTruthy();
    expect(screen.getByText('Jane Doe')).toBeTruthy();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('fires like press', async () => {
    const onLike = jest.fn();
    await render(<PostCard post={post} onLike={onLike} />);
    fireEvent.press(screen.getByLabelText('Like post'));
    expect(onLike).toHaveBeenCalled();
  });

  it('fires open press', async () => {
    const onPress = jest.fn();
    await render(<PostCard post={post} onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Open post Hello world'));
    expect(onPress).toHaveBeenCalled();
  });
});
