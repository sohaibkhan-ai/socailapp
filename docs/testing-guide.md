# Testing Guide

## Layers

| Layer | Tooling | Location | Run |
|---|---|---|---|
| Shared package | Jest | `packages/shared` | `npm test -w packages/shared` |
| API unit | Jest | `apps/api/src/**/*.spec.js` | `npm test -w apps/api` |
| API integration | Jest + Supertest against a **test database** | `apps/api/test/*.e2e-spec.js` | `npm run test:e2e -w apps/api` |
| Mobile unit/component | jest-expo + React Native Testing Library | `apps/mobile/tests` | `npm test -w apps/mobile` |
| Mobile E2E | Maestro | `apps/mobile/.maestro/*.yaml` | `maestro test apps/mobile/.maestro/login.yaml` |

## API integration tests

1. Set `TEST_DATABASE_URL` in `apps/api/.env` (a **separate** database — tests wipe it between suites).
2. `npx prisma migrate deploy` against it once.
3. `npm run test:e2e -w apps/api` boots the app with `test-bootstrap.js`, runs Supertest flows (register → login → refresh rotation → post CRUD → like → comment → report → moderation), and truncates tables per suite.

CI (`.github/workflows/ci.yml`) does exactly this with a `postgres:16` service container.

## Mobile tests

`jest-expo` preset with `jest.setup.js` mocking `expo-secure-store`, `@react-native-async-storage/async-storage`, `react-native-safe-area-context`, and the axios client where needed. 6 suites / 26 tests cover schemas, the API wrapper + refresh interceptor, the auth store, base components, LoginScreen, and PostCard.

## Maestro flows

- `login.yaml` — welcome → login with seeded user → feed visible.
- `feed.yaml` — feed renders, pull-to-refresh, open post detail.
- `create-post.yaml` — create a post, see it in the feed.
- `logout.yaml` — settings → logout → back to welcome.

Prerequisite: `npm run api` running locally and the mobile app pointing at `http://localhost:3000/api/v1` (set `API_URL` in the dev menu or `.env`).

## Conventions

- Every bug fix ships with a regression test at the lowest layer that can catch it.
- Integration tests never hit a shared/dev database.
- A PR is mergeable only when all suites above pass in CI.
