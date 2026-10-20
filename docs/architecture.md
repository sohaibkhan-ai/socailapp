# SocialHub — Architecture

## Overview

SocialHub is a social feed application: users register, publish posts with tags and
optional images, comment, like, search, and manage their profile. Moderators and
admins review reports and hide/remove content. It is a JavaScript monorepo with two
apps and one shared package.

```
socialhub/
├── apps/
│   ├── mobile/     Expo React Native app (JavaScript/JSX)
│   └── api/        NestJS REST API + Prisma/PostgreSQL
├── packages/
│   └── shared/     Zod schemas + shared constants/types used by both apps
├── docs/
├── .github/workflows/ci.yml
├── docker-compose.yml
└── README.md
```

## Backend (apps/api)

NestJS, modular:

- `modules/auth` — register, login, refresh-token rotation, logout, forgot/reset
  password, email-verification token issuance/confirmation. Access JWT (15 min) +
  refresh token (7 d, stored hashed in `RefreshToken`, rotated on every use,
  revoked on logout).
- `modules/users` — profile get/update, avatar upload, change password, account
  deletion, admin user listing/ban.
- `modules/posts` — CRUD with pagination/sorting/tag filter/search; feed.
- `modules/comments` — CRUD nested under posts.
- `modules/social` — like/unlike posts and comments.
- `modules/moderation` — report creation and listing; hide post; ban user
  (MODERATOR/ADMIN roles via a `RolesGuard`).
- `modules/health` — `/health` liveness + DB check.
- `common/` — global validation pipe (class-validator DTOs), exception filter that
  emits `{ statusCode, message, error }`, JWT guard, roles guard, ThrottlerGuard
  (rate limiting), request logging interceptor.

Key decisions:

- **Passwords** hashed with bcrypt (cost 12). Never returned by any endpoint.
- **Refresh tokens** are stored as SHA-256 hashes; rotation invalidates the used
  token, and reuse of a revoked token revokes the whole family (theft detection).
- **Validation** happens on the server for every input, independent of client-side
  Zod schemas (which mirror the same rules in `packages/shared`).
- **Ownership checks** are enforced in services (IDOR prevention) — a user may only
  edit/delete their own posts/comments unless MODERATOR/ADMIN.
- Prisma with a single `DATABASE_URL`; migrations in `apps/api/prisma/migrations`.
- Swagger UI at `http://localhost:3000/docs`.

## Mobile (apps/mobile)

Expo managed workflow, JavaScript:

- `src/navigation` — root navigator switches on auth status; bottom tabs
  (Feed, Search, Profile, Settings) + auth stack + detail/modals.
- `src/services/api.js` — Axios instance with:
  - access token attached from SecureStore,
  - 401 handling: single-flight refresh then retry the original request; on refresh
    failure, clear session and emit an auth-expired event.
- `src/store` — Zustand stores: `useAuthStore` (user, tokens), `useThemeStore`
  (light/dark, persisted with AsyncStorage).
- `src/features` — React Query hooks (`usePosts`, `useLogin`, ...) that own all
  server state; components never call Axios directly.
- `src/schemas` — Zod schemas shared from `packages/shared` for form validation
  via react-hook-form resolvers.
- `src/components` — design system: Button, TextField, Card, Badge, EmptyState,
  ErrorState, SkeletonLoader, Modal, ListItem, Avatar, TagChip, ConfirmDialog.

State split: Zustand = client/auth state; React Query = server state (caching,
invalidation, retry); forms live in react-hook-form.

## Testing

- API: Jest + Supertest against an isolated test database (`TEST_DATABASE_URL`).
- Mobile: Jest + React Native Testing Library.
- E2E: Maestro flows in `apps/mobile/.maestro`.
See `docs/testing-guide.md`.

## Adding a feature

1. Prisma model → migration.
2. Nest module (DTOs with validation, service with authorization checks, controller).
3. Zod schema + React Query hook on mobile.
4. Screen + design-system components; wire into navigation.
5. Tests at each layer.
