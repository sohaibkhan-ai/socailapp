/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const POSTS = [
  { title: 'Getting started with SocialHub', content: 'Welcome! This is the first post on SocialHub. Say hi in the comments.', tags: ['welcome', 'community'] },
  { title: 'Best practices for remote teams', content: 'Async-first communication changed how our team works. Here is what we learned.', tags: ['remote', 'productivity'] },
  { title: 'My favourite JavaScript patterns', content: 'Closures, currying and composition — a quick tour with examples.', tags: ['javascript', 'dev'] },
  { title: 'Why we built SocialHub', content: 'We wanted a calm, ad-free social space. This is our story.', tags: ['welcome', 'product'] },
  { title: 'Coffee around the world', content: 'From espresso to cold brew, a tour of coffee cultures.', tags: ['food', 'culture'] },
];

async function main() {
  const adminHash = await bcrypt.hash('Admin123!', 12);
  const userHash = await bcrypt.hash('Password1!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@socialhub.dev' },
    update: {},
    create: { email: 'admin@socialhub.dev', passwordHash: adminHash, displayName: 'Admin', role: 'ADMIN', emailVerified: true },
  });
  const alice = await prisma.user.upsert({
    where: { email: 'alice@socialhub.dev' },
    update: {},
    create: { email: 'alice@socialhub.dev', passwordHash: userHash, displayName: 'Alice', emailVerified: true },
  });
  const bob = await prisma.user.upsert({
    where: { email: 'bob@socialhub.dev' },
    update: {},
    create: { email: 'bob@socialhub.dev', passwordHash: userHash, displayName: 'Bob' },
  });

  const authors = [admin, alice, bob];
  const posts = [];
  for (let i = 0; i < POSTS.length; i++) {
    posts.push(
      await prisma.post.upsert({
        where: { id: `seedpost${i + 1}` },
        update: {},
        create: { id: `seedpost${i + 1}`, ...POSTS[i], authorId: authors[i % authors.length].id },
      }),
    );
  }

  await prisma.comment.upsert({
    where: { id: 'seedcomment1' },
    update: {},
    create: { id: 'seedcomment1', postId: posts[0].id, authorId: bob.id, content: 'Hi everyone, excited to be here!' },
  });
  for (const u of [bob, alice]) {
    await prisma.postLike.upsert({
      where: { userId_postId: { userId: u.id, postId: posts[0].id } },
      update: {},
      create: { userId: u.id, postId: posts[0].id },
    });
  }

  console.log('Seed complete: admin@socialhub.dev / Admin123!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
