# SocialHub

A social feed application: Expo React Native mobile app, NestJS REST API,
PostgreSQL via Prisma, in a JavaScript monorepo.

```
apps/
  mobile/   Expo (SDK 52) app — React Navigation, Zustand, React Query, Zod
  api/      NestJS API — JWT auth with refresh rotation, RBAC, moderation
packages/
  shared/   Shared constants and error codes
docs/       Architecture, schema, API, testing, deployment guides
```

## Quick start

```bash
npm install                      # install all workspaces

# 1. Database (choose one)
docker compose up -d db          # Docker
# or a local PostgreSQL; create the DB:
createdb socialhub

# 2. Configure
cp .env.example apps/api/.env    # then edit secrets

# 3. Migrate + seed
cd apps/api
npx prisma migrate dev
node prisma/seed.js              # admin@socialhub.dev / Admin123!

# 4. Run
npm run api --workspace socialhub     # API on http://localhost:3000/api/v1
npm run mobile --workspace socialhub  # Expo dev server
```

- API base URL: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/api/v1/docs`
- Health: `GET /api/v1/health`

## Test accounts (seeded, dev only)

| Email | Password | Role |
|---|---|---|
| admin@socialhub.dev | Admin123! | ADMIN |
| moderator@socialhub.dev | Moderator123! | MODERATOR |
| demo@socialhub.dev | Demo123! | USER |

## Scripts

```bash
npm run test     # all workspaces
npm run lint     # all workspaces
cd apps/api && npm run test:e2e          # API integration tests
cd apps/mobile && npm test               # mobile unit tests
```

## Features

- Email/password auth, bcrypt (cost 12), JWT access (15 min) + rotating refresh
  tokens (7 d, stored hashed, reuse detection)
- Roles: USER / MODERATOR / ADMIN with a guard-enforced RBAC
- Posts with tags/images, likes, nested comments, search, pagination
- Reporting + moderation queue (hide content, ban users)
- Response envelope `{ success, data?, error: { code, message, details } }`
- Rate limiting, helmet, graceful shutdown

See `docs/` for details. Full phase-by-phase plan: `docs/architecture.md`.
