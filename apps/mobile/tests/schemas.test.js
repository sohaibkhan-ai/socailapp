import { registerSchema, loginSchema, postCreateSchema, commentSchema, reportSchema, changePasswordSchema } from '@/schemas';

describe('zod schemas', () => {
  it('registerSchema rejects bad email and short password', () => {
    expect(registerSchema.safeParse({ email: 'nope', password: '12345678', displayName: 'Jo' }).success).toBe(false);
    expect(registerSchema.safeParse({ email: 'a@b.co', password: 'short', displayName: 'Jo' }).success).toBe(false);
    expect(registerSchema.safeParse({ email: 'a@b.co', password: '12345678', displayName: 'Jane' }).success).toBe(true);
  });
  it('loginSchema requires email + password', () => {
    expect(loginSchema.safeParse({ email: '', password: '' }).success).toBe(false);
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true);
  });
  it('postCreateSchema enforces min title length', () => {
    expect(postCreateSchema.safeParse({ title: 'ab', content: 'hi' }).success).toBe(false);
    expect(postCreateSchema.safeParse({ title: 'Hello', content: 'hi' }).success).toBe(true);
  });
  it('commentSchema rejects empty content', () => {
    expect(commentSchema.safeParse({ content: '' }).success).toBe(false);
    expect(commentSchema.safeParse({ content: 'hey' }).success).toBe(true);
  });
  it('reportSchema validates targetType', () => {
    expect(reportSchema.safeParse({ targetType: 'bogus', targetId: '1', reason: 'spam' }).success).toBe(false);
    expect(reportSchema.safeParse({ targetType: 'post', targetId: '1', reason: 'spam content' }).success).toBe(true);
  });
  it('changePasswordSchema enforces min length', () => {
    expect(changePasswordSchema.safeParse({ currentPassword: 'a', newPassword: 'short' }).success).toBe(false);
    expect(changePasswordSchema.safeParse({ currentPassword: 'a', newPassword: '12345678' }).success).toBe(true);
  });
});
