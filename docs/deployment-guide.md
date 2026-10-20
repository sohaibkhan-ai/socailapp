# Deployment Guide

## Environment variables (apps/api)

| Var | Example | Notes |
|---|---|---|
| DATABASE_URL | `postgresql://user:pass@host:5432/socialhub` | required |
| JWT_ACCESS_SECRET | 32+ random bytes | rotate independently of refresh |
| JWT_REFRESH_SECRET | 32+ random bytes | |
| PORT | `3000` | |
| CORS_ORIGIN | `https://app.example.com` | comma-separated allowlist |
| THROTTLE_TTL / THROTTLE_LIMIT | `60000` / `100` | rate limiting |

Generate secrets: `openssl rand -base64 32`

## Docker Compose (staging / single host)

```bash
cp apps/api/.env.example apps/api/.env   # fill in real secrets
docker compose up -d --build
docker compose exec api npx prisma migrate deploy
```

`docker-compose.yml` runs PostgreSQL 16 and the API container. Health check gates the API start on DB readiness.

## Production checklist

- [ ] Migrations applied via `prisma migrate deploy` (never `migrate dev`).
- [ ] Distinct `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`, stored in a secret manager.
- [ ] `CORS_ORIGIN` set to the mobile/web origins you actually serve.
- [ ] TLS terminated at the load balancer; helmet is already on.
- [ ] PostgreSQL backups (`pg_dump`) scheduled; test a restore.
- [ ] Log aggregation on the API container stdout (JSON logs).
- [ ] No seed data in production databases.
- [ ] `/health` wired into load-balancer checks.

## Mobile release (Expo)

```bash
cd apps/mobile
eas build --platform all --profile production
eas submit            # App Store / Play Console
```

Set the production `API_URL` in `eas.json` env or app config before building. OTA updates: `eas update`.

## CI/CD

`.github/workflows/ci.yml` runs on every push/PR: install → lint → unit tests → migrations + integration tests against a Postgres service → mobile unit tests → docker build. Extend it with `eas build` on `main` if you use EAS.
