const request = require('supertest');

let app;
let prisma;

beforeAll(async () => {
  const { PrismaService } = require('../src/common/prisma.service');
  prisma = new PrismaService();
  await prisma.$connect();
  await prisma.refreshToken.deleteMany();
  await prisma.commentLike.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.report.deleteMany();
  await prisma.user.deleteMany();

  const { bootstrapForTest } = require('../src/test-bootstrap');
  app = await bootstrapForTest();
});

afterAll(async () => {
  if (prisma) await prisma.$disconnect();
});

const register = (email, password = 'Password1!', displayName = 'Test User') =>
  request(app.getHttpServer()).post('/api/v1/auth/register').send({ email, password, displayName });

const login = (email, password = 'Password1!') =>
  request(app.getHttpServer()).post('/api/v1/auth/login').send({ email, password });

describe('health', () => {
  test('GET /health returns ok with envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.db).toBe(true);
  });
});

describe('auth flow', () => {
  const email = 'flow@example.com';
  let tokens;

  test('register -> login -> me -> refresh -> logout -> refresh after logout fails', async () => {
    const reg = await register(email);
    expect(reg.status).toBe(201);
    expect(reg.body.success).toBe(true);
    expect(reg.body.data.user.passwordHash).toBeUndefined();
    tokens = reg.body.data;

    const me1 = await request(app.getHttpServer())
      .get('/api/v1/auth/me').set('Authorization', `Bearer ${tokens.accessToken}`);
    expect(me1.status).toBe(200);
    expect(me1.body.data.email).toBe(email);

    const ref1 = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh').send({ refreshToken: tokens.refreshToken });
    expect(ref1.status).toBe(201);
    expect(ref1.body.data.refreshToken).not.toBe(tokens.refreshToken);

    const refOld = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh').send({ refreshToken: tokens.refreshToken });
    expect(refOld.status).toBe(401);

    const out = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${ref1.body.data.accessToken}`)
      .send({ refreshToken: ref1.body.data.refreshToken });
    expect(out.status).toBe(201);

    const refAfter = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh').send({ refreshToken: ref1.body.data.refreshToken });
    expect(refAfter.status).toBe(401);
  });

  test('register validation failures: short password, bad email -> 400', async () => {
    const short = await register('short@example.com', 'Pa1');
    expect(short.status).toBe(400);
    expect(short.body.success).toBe(false);
    expect(short.body.error.code).toBe('VALIDATION_ERROR');
    const badEmail = await register('not-an-email');
    expect(badEmail.status).toBe(400);
  });

  test('duplicate email -> 409 CONFLICT', async () => {
    const dup = await register('flow@example.com');
    expect(dup.status).toBe(409);
    expect(dup.body.error.code).toBe('CONFLICT');
  });

  test('login wrong password -> 401 envelope', async () => {
    const res = await login('flow@example.com', 'WrongPass1');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('forgot-password always 200; reset with invalid token -> 401', async () => {
    const fp = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password').send({ email: 'flow@example.com' });
    expect(fp.status).toBe(201);
    const fp2 = await request(app.getHttpServer())
      .post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.com' });
    expect(fp2.status).toBe(201);
    const bad = await request(app.getHttpServer())
      .post('/api/v1/auth/reset-password').send({ token: 'x'.repeat(64), newPassword: 'NewPass123' });
    expect(bad.status).toBe(401);
  });

  test('unauthorized access -> 401 envelope', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

describe('posts CRUD, pagination, search, ownership', () => {
  let alice, bob, admin, postA;

  beforeAll(async () => {
    await register('posts-alice@example.com', 'Password1!', 'Alice P').catch(() => {});
    await register('posts-bob@example.com', 'Password1!', 'Bob P').catch(() => {});
    await register('admin@socialhub.dev', 'Admin123!', 'Admin').catch(() => {});
    // register() creates the admin via the public endpoint, which always assigns
    // the USER role — promote it so moderation/admin tests see an ADMIN token.
    await prisma.user.update({ where: { email: 'admin@socialhub.dev' }, data: { role: 'ADMIN' } });
    alice = (await login('posts-alice@example.com')).body.data;
    bob = (await login('posts-bob@example.com')).body.data;
    admin = (await login('admin@socialhub.dev', 'Admin123!')).body.data;
  });

  test('create/read/update/delete lifecycle', async () => {
    const created = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({ title: 'Hello World', content: 'First post body', tags: ['Testing', 'DEV'] });
    expect(created.status).toBe(201);
    expect(created.body.data.tags).toEqual(['testing', 'dev']);
    postA = created.body.data;

    const got = await request(app.getHttpServer()).get(`/api/v1/posts/${postA.id}`);
    expect(got.status).toBe(200);

    const patched = await request(app.getHttpServer())
      .patch(`/api/v1/posts/${postA.id}`)
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({ title: 'Hello Edited' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.title).toBe('Hello Edited');

    const other = await request(app.getHttpServer())
      .patch(`/api/v1/posts/${postA.id}`)
      .set('Authorization', `Bearer ${bob.accessToken}`)
      .send({ title: 'Hacked Title' });
    expect(other.status).toBe(403);
    expect(other.body.error.code).toBe('FORBIDDEN');

    const adminPatch = await request(app.getHttpServer())
      .patch(`/api/v1/posts/${postA.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ title: 'Admin Edited' });
    expect(adminPatch.status).toBe(200);

    const del = await request(app.getHttpServer())
      .delete(`/api/v1/posts/${postA.id}`)
      .set('Authorization', `Bearer ${alice.accessToken}`);
    expect(del.status).toBe(200);
    const gone = await request(app.getHttpServer()).get(`/api/v1/posts/${postA.id}`);
    expect(gone.status).toBe(404);
  });

  test('validation: title too short, too many tags -> 400', async () => {
    const bad = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({ title: 'ab', content: 'x' });
    expect(bad.status).toBe(400);
    const manyTags = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({ title: 'Valid Title', content: 'x', tags: ['a', 'b', 'c', 'd', 'e', 'f'] });
    expect(manyTags.status).toBe(400);
  });

  test('pagination, search, tag filter, sort', async () => {
    const mk = (title, tags) => request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({ title, content: `body of ${title}`, tags });
    await mk('Alpha Post One', ['news']);
    await mk('Beta Post Two', ['tech']);
    await mk('Gamma Search Term', ['news']);

    const paged = await request(app.getHttpServer()).get('/api/v1/posts?page=1&limit=2');
    expect(paged.status).toBe(200);
    expect(paged.body.data.items.length).toBeLessThanOrEqual(2);
    expect(paged.body.data.total).toBeGreaterThanOrEqual(3);

    const bigLimit = await request(app.getHttpServer()).get('/api/v1/posts?limit=9999');
    expect(bigLimit.body.data.limit).toBe(50);

    const searched = await request(app.getHttpServer()).get('/api/v1/posts?search=Gamma');
    expect(searched.body.data.items.some((p) => p.title.includes('Gamma'))).toBe(true);

    const tagged = await request(app.getHttpServer()).get('/api/v1/posts?tag=tech');
    expect(tagged.body.data.items.length).toBeGreaterThan(0);
    expect(tagged.body.data.items.every((p) => p.tags.includes('tech'))).toBe(true);

    const oldest = await request(app.getHttpServer()).get('/api/v1/posts?sort=oldest&limit=50');
    const dates = oldest.body.data.items.map((p) => new Date(p.createdAt).getTime());
    expect([...dates].sort((a, b) => a - b)).toEqual(dates);
  });
});

describe('likes and comments', () => {
  let alice, bob, post;

  beforeAll(async () => {
    alice = (await login('posts-alice@example.com')).body.data;
    bob = (await login('posts-bob@example.com')).body.data;
    const created = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({ title: 'Like Target', content: 'like me', tags: ['fun'] });
    post = created.body.data;
  });

  test('like toggle is idempotent (double like = one like)', async () => {
    await request(app.getHttpServer()).post(`/api/v1/posts/${post.id}/like`).set('Authorization', `Bearer ${bob.accessToken}`);
    await request(app.getHttpServer()).post(`/api/v1/posts/${post.id}/like`).set('Authorization', `Bearer ${bob.accessToken}`);
    const after = await request(app.getHttpServer()).get(`/api/v1/posts/${post.id}`);
    expect(after.body.data._count.likes).toBe(1);
    await request(app.getHttpServer()).delete(`/api/v1/posts/${post.id}/like`).set('Authorization', `Bearer ${bob.accessToken}`);
    await request(app.getHttpServer()).delete(`/api/v1/posts/${post.id}/like`).set('Authorization', `Bearer ${bob.accessToken}`);
    const after2 = await request(app.getHttpServer()).get(`/api/v1/posts/${post.id}`);
    expect(after2.body.data._count.likes).toBe(0);
  });

  test('comments CRUD + likes', async () => {
    const created = await request(app.getHttpServer())
      .post(`/api/v1/posts/${post.id}/comments`)
      .set('Authorization', `Bearer ${bob.accessToken}`)
      .send({ content: 'Nice post!' });
    expect(created.status).toBe(201);
    const comment = created.body.data;

    const listed = await request(app.getHttpServer()).get(`/api/v1/posts/${post.id}/comments`);
    expect(listed.body.data.some((c) => c.id === comment.id)).toBe(true);

    const patched = await request(app.getHttpServer())
      .patch(`/api/v1/comments/${comment.id}`)
      .set('Authorization', `Bearer ${bob.accessToken}`)
      .send({ content: 'Edited comment' });
    expect(patched.status).toBe(200);
    expect(patched.body.data.content).toBe('Edited comment');

    await request(app.getHttpServer()).post(`/api/v1/comments/${comment.id}/like`).set('Authorization', `Bearer ${alice.accessToken}`);
    await request(app.getHttpServer()).post(`/api/v1/comments/${comment.id}/like`).set('Authorization', `Bearer ${alice.accessToken}`);
    const detail = await request(app.getHttpServer()).get(`/api/v1/comments/${comment.id}`);
    expect(detail.body.data._count.likes).toBe(1);

    const otherDelete = await request(app.getHttpServer())
      .delete(`/api/v1/comments/${comment.id}`)
      .set('Authorization', `Bearer ${alice.accessToken}`);
    expect(otherDelete.status).toBe(403);

    const del = await request(app.getHttpServer())
      .delete(`/api/v1/comments/${comment.id}`)
      .set('Authorization', `Bearer ${bob.accessToken}`);
    expect(del.status).toBe(200);
  });
});

describe('moderation', () => {
  let alice, admin, post;

  beforeAll(async () => {
    alice = (await login('posts-alice@example.com')).body.data;
    admin = (await login('admin@socialhub.dev', 'Admin123!')).body.data;
    const created = await request(app.getHttpServer())
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({ title: 'Reportable Post', content: 'questionable', tags: [] });
    post = created.body.data;
  });

  test('user reports post; admin resolves -> post hidden; non-admin 403', async () => {
    const rep = await request(app.getHttpServer())
      .post('/api/v1/reports')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({ targetType: 'POST', targetId: post.id, reason: 'spam content here' });
    expect(rep.status).toBe(201);
    expect(rep.body.data.status).toBe('PENDING');

    const nonMod = await request(app.getHttpServer())
      .patch(`/api/v1/moderation/reports/${rep.body.data.id}`)
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({ action: 'resolve' });
    expect(nonMod.status).toBe(403);

    const resolved = await request(app.getHttpServer())
      .patch(`/api/v1/moderation/reports/${rep.body.data.id}`)
      .set('Authorization', `Bearer ${admin.accessToken}`)
      .send({ action: 'resolve' });
    expect(resolved.status).toBe(200);
    expect(resolved.body.data.status).toBe('RESOLVED');

    const hidden = await request(app.getHttpServer()).get(`/api/v1/posts/${post.id}`);
    expect(hidden.status).toBe(404);

    const authorStillSees = await request(app.getHttpServer())
      .get(`/api/v1/posts/${post.id}`)
      .set('Authorization', `Bearer ${alice.accessToken}`);
    expect(authorStillSees.status).toBe(200);
  });

  test('moderation reports list and ban are mod/admin only', async () => {
    const denied = await request(app.getHttpServer())
      .get('/api/v1/moderation/reports')
      .set('Authorization', `Bearer ${alice.accessToken}`);
    expect(denied.status).toBe(403);

    const okRes = await request(app.getHttpServer())
      .get('/api/v1/moderation/reports?status=RESOLVED')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(okRes.status).toBe(200);

    const ban = await request(app.getHttpServer())
      .post('/api/v1/moderation/users/banned-target/ban')
      .set('Authorization', `Bearer ${admin.accessToken}`);
    expect(ban.status).toBe(404);
  });
});

describe('users / avatar', () => {
  let alice;

  beforeAll(async () => {
    alice = (await login('posts-alice@example.com')).body.data;
  });

  test('PATCH /users/me updates profile', async () => {
    const res = await request(app.getHttpServer())
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .send({ displayName: 'Alice Updated', bio: 'hello bio' });
    expect(res.status).toBe(200);
    expect(res.body.data.displayName).toBe('Alice Updated');
  });

  test('avatar: wrong mime rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/me/avatar')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .attach('file', Buffer.from('<svg>not an image</svg>'), { filename: 'evil.svg', contentType: 'image/svg+xml' });
    expect([400, 413, 415]).toContain(res.status);
    expect(res.body.success).toBe(false);
  });

  test('avatar: fake png (bad magic bytes) rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/me/avatar')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .attach('file', Buffer.from('definitely-not-a-png'), { filename: 'fake.png', contentType: 'image/png' });
    expect([400, 415]).toContain(res.status);
  });

  test('avatar: real png accepted', async () => {
    const png = Buffer.from(
      '89504e470d0a1a0a0000000d4948445200000001000000010806000000' +
      '1f15c4890000000d49444154789c63f8cfc000000301010' +
      '0c94fe3af0000000049454e44ae426082', 'hex');
    const res = await request(app.getHttpServer())
      .post('/api/v1/users/me/avatar')
      .set('Authorization', `Bearer ${alice.accessToken}`)
      .attach('file', png, { filename: 'a.png', contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.data.avatarUrl).toMatch(/^\/static\//);
  });
});
