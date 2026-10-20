// Unit tests for AuthService with a mocked Prisma + mocked JwtService.
const { AuthService } = require('../src/auth/auth.service');

function makeService(prismaMock) {
  const jwtMock = { sign: jest.fn().mockReturnValue('access-token') };
  return new AuthService(prismaMock, jwtMock);
}

describe('AuthService (unit, mocked Prisma)', () => {
  const hash = '$2a$12$C6UzMDM.H6dfI/f/IKcEeO7Z7pVeG8FtL9mXlSbIYuiVh0dQlM3Wu'; // bcrypt of "Password1!"
  const baseUser = { id: 'u1', email: 'a@b.co', passwordHash: hash, role: 'USER', isBanned: false, displayName: 'A' };

  function prismaMock(overrides = {}) {
    return {
      user: {
        findUnique: jest.fn(async ({ where }) => overrides.user || null),
        create: jest.fn(async ({ data }) => ({ id: 'u2', ...data, passwordHash: undefined })),
        update: jest.fn(async () => baseUser),
      },
      refreshToken: {
        create: jest.fn(async ({ data }) => data),
        findUnique: jest.fn(async ({ where }) => overrides.token || null),
        update: jest.fn(async () => ({})),
        updateMany: jest.fn(async () => ({ count: 1 })),
      },
    };
  }

  test('register: duplicate email -> ConflictException with CONFLICT code', async () => {
    const svc = makeService(prismaMock({ user: baseUser }));
    await expect(svc.register({ email: 'a@b.co', password: 'Password1!', displayName: 'X' }))
      .rejects.toMatchObject({ status: 409, response: { code: 'CONFLICT' } });
  });

  test('login: wrong password -> UnauthorizedException UNAUTHORIZED', async () => {
    const svc = makeService(prismaMock({ user: baseUser }));
    await expect(svc.login('a@b.co', 'wrongpass1'))
      .rejects.toMatchObject({ status: 401, response: { code: 'UNAUTHORIZED' } });
  });

  test('login: banned user -> UnauthorizedException', async () => {
    const svc = makeService(prismaMock({ user: { ...baseUser, isBanned: true } }));
    await expect(svc.login('a@b.co', 'Password1!'))
      .rejects.toMatchObject({ status: 401 });
  });

  test('refresh: rotates — old token revoked, new issued', async () => {
    const oldToken = 'a'.repeat(64);
    const pm = prismaMock({
      token: { id: 't1', tokenHash: null, revokedAt: null, expiresAt: new Date(Date.now() + 864e5), userId: 'u1', user: baseUser },
    });
    pm.refreshToken.findUnique.mockImplementation(async ({ where }) =>
      where.tokenHash ? { id: 't1', revokedAt: null, expiresAt: new Date(Date.now() + 864e5), userId: 'u1', user: baseUser } : null);
    const svc = makeService(pm);
    const result = await svc.refresh(oldToken);
    expect(pm.refreshToken.update).toHaveBeenCalledWith({ where: { id: 't1' }, data: { revokedAt: expect.any(Date) } });
    expect(pm.refreshToken.create).toHaveBeenCalled();
    expect(result.refreshToken).not.toBe(oldToken);
  });

  test('refresh: revoked token rejected', async () => {
    const pm = prismaMock({});
    pm.refreshToken.findUnique.mockResolvedValue({ id: 't1', revokedAt: new Date(), expiresAt: new Date(Date.now() + 864e5), user: baseUser });
    const svc = makeService(pm);
    await expect(svc.refresh('b'.repeat(64))).rejects.toMatchObject({ status: 401 });
  });
});
