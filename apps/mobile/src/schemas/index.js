import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
});

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
});

export const postCreateSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(120),
  content: z.string().min(1, 'Content is required'),
  tags: z.array(z.string().min(1).max(30)).max(10).optional().default([]),
});

export const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(50),
  bio: z.string().max(300, 'Bio must be 300 characters or fewer').optional().or(z.literal('')),
});

export const commentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000),
});

export const reportSchema = z.object({
  targetType: z.enum(['post', 'comment', 'user']),
  targetId: z.string().min(1),
  reason: z.string().min(3, 'Please describe the reason').max(500),
});
