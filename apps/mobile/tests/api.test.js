import { unwrap, extractMessage } from '@/services/api';

describe('unwrap', () => {
  it('extracts envelope data on success', () => {
    expect(unwrap({ data: { success: true, data: { id: 1 } } })).toEqual({ id: 1 });
  });
  it('passes through non-envelope bodies defensively', () => {
    expect(unwrap({ data: { items: [] } })).toEqual({ items: [] });
  });
  it('throws a message-carrying error on failure envelope', () => {
    expect(() => unwrap({ data: { success: false, error: { code: 'NOT_FOUND', message: 'Nope' } } })).toThrow('Nope');
  });
});

describe('extractMessage', () => {
  it('reads backend error envelope', () => {
    const err = { response: { status: 400, data: { success: false, error: { code: 'VALIDATION_ERROR', message: 'Bad input' } } } };
    expect(extractMessage(err)).toBe('Bad input');
  });
  it('maps network errors', () => {
    expect(extractMessage({ message: 'Network Error' })).toBe('Network error — check your connection');
  });
  it('falls back to default message', () => {
    expect(extractMessage({}, 'Fallback')).toBe('Fallback');
  });
});
