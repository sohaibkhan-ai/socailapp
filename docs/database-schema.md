# Database Schema

PostgreSQL via Prisma (`apps/api/prisma/schema.prisma`).

## Entities

### User
| Column | Type | Notes |
|---|---|---|
| id | String (cuid) PK | |
| email | String unique | login identifier |
| passwordHash | String | bcrypt, never exposed |
| displayName | String | |
| avatarUrl | String? | uploaded file path/URL |
| bio | Text? | |
| role | enum USER/MODERATOR/ADMIN | default USER |
| emailVerified | Boolean default false | |
| isBanned | Boolean default false | |
| createdAt / updatedAt | timestamps | |

### RefreshToken
`tokenHash` (SHA-256, unique), `userId` FK → User **ON DELETE CASCADE**,
`expiresAt`, `revokedAt?`. Index on `userId`.

### Post
`authorId` FK → User CASCADE, `title`, `content` (Text), `imageUrl?`,
`tags String[]`, `isHidden` (soft-hide by moderation).
Indexes: `authorId`, `createdAt` (feed ordering), `tags`.

### PostLike
Composite PK `(userId, postId)`; both FKs CASCADE. One like per user per post.

### Comment
`postId` FK CASCADE, `authorId` FK CASCADE, `content`, `isHidden`.
Index on `postId`.

### CommentLike
Composite PK `(userId, commentId)`; both FKs CASCADE.

### Report
`reporterId` → User ("Reporter"), `handledById?` → User ("Moderator"),
`targetPostId?` / `targetCommentId?` (one required), `reason`, `status`
enum PENDING/RESOLVED/DISMISSED, `createdAt`.
Index on `status` (moderation queue).

## Deletion behaviour

- Deleting a User cascades to their posts, comments, likes, refresh tokens.
- Deleting a Post cascades to its comments and likes.
- Reports referencing a deleted post/comment keep `handledBy` history; target id
  remains but the resource 404s — moderators dismiss such reports.

## Migrations

```bash
cd apps/api
npx prisma migrate dev        # create/apply dev migrations
npx prisma migrate deploy     # apply in CI/production
npx prisma migrate reset      # drop + reapply + seed (dev only)
```

Rollback: Prisma has no automatic down-migrations; keep the previous migration's
SQL and write a corrective forward migration. Back up with
`pg_dump socialhub > backup.sql` before destructive migrations; restore with
`psql socialhub < backup.sql`.

## Seed

`apps/api/prisma/seed.js` creates demo users (admin/moderator/user — passwords in
the seed file are dev-only), posts, comments, likes and reports. Production must
never rely on it.

## Concurrency

Likes use `upsert` on the composite PK so double-taps are idempotent.
Post/comment counters are derived by `count()` at read time, so no denormalised
counter columns to drift.
