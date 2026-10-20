# API Reference

Base URL: `http://localhost:3000/api/v1` · Interactive docs: `http://localhost:3000/docs` (Swagger)

All responses use the envelope:

```json
{ "success": true, "data": { } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

Error codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.

## Authentication

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/register | — | Create account, returns access + refresh tokens |
| POST | /auth/login | — | Returns access (15 min) + refresh (7 d) |
| POST | /auth/refresh | — | Body: `{ refreshToken }`. Rotates the refresh token |
| POST | /auth/logout | Bearer | Revokes the presented refresh token |
| GET | /auth/me | Bearer | Current user profile |
| POST | /auth/forgot-password | — | Issues a reset token (dev: returned in response) |
| POST | /auth/reset-password | — | Body: `{ token, password }` |
| POST | /auth/change-password | Bearer | Body: `{ currentPassword, newPassword }` |

Refresh rotation: each refresh token is single-use. Reusing an already-revoked token revokes the whole family (theft detection) and forces a new login.

## Users

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /users/me | Bearer | Own profile |
| PATCH | /users/me | Bearer | Update displayName, bio |
| POST | /users/me/avatar | Bearer | multipart/form-data `file` |
| DELETE | /users/me | Bearer | Anonymizes and deletes the account |
| GET | /users | MODERATOR+ | Paginated user list |
| POST | /users/:id/ban | MODERATOR+ | Ban / unban (`{ isBanned }`) |

## Posts

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | /posts | optional | Feed. Query: `page, limit, sort, q, tag, authorId` |
| GET | /posts/:id | optional | Post with like/comment counts |
| POST | /posts | Bearer | `{ title, content, tags?, imageUrl? }` |
| PATCH | /posts/:id | Author or MOD+ | |
| DELETE | /posts/:id | Author or MOD+ | |
| POST | /posts/:id/like | Bearer | Toggle like; returns `{ liked, likeCount }` |
| GET | /posts/:id/comments | optional | Paginated comments |

## Comments

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /posts/:postId/comments | Bearer | `{ content }` |
| PATCH | /comments/:id | Author or MOD+ | |
| DELETE | /comments/:id | Author or MOD+ | |
| POST | /comments/:id/like | Bearer | Toggle like |

## Reports & Moderation (MODERATOR / ADMIN)

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /reports | Bearer | `{ targetType: POST/COMMENT/USER, targetId, reason }` |
| GET | /reports | MOD+ | Queue, filter by `status` |
| PATCH | /reports/:id | MOD+ | Resolve / dismiss |
| PATCH | /posts/:id/moderate | MOD+ | Hide / unhide (`{ isHidden }`) |

## Health

`GET /health` → `{ success, data: { status: "ok", db: true, uptime } }`

## Rate limiting

Auth endpoints are throttled (default 10 requests / minute / IP); exceeding returns `RATE_LIMITED` with `Retry-After`.
