const { Module } = require('@nestjs/common');
const { APP_GUARD } = require('@nestjs/core');
const { ThrottlerModule } = require('@nestjs/throttler');
const config = require('./config/configuration');
const { validateEnv } = require('./config/env.validation');
validateEnv(process.env);
const { PrismaModule } = require('./common/prisma.module');
const { JwtAuthGuard } = require('./common/guards/jwt-auth.guard');
const { RolesGuard } = require('./common/guards/roles.guard');
const { ThrottlerBehindProxyGuard } = require('./common/guards/throttler-behind-proxy.guard');
const { AuthModule } = require('./auth/auth.module');
const { UsersModule } = require('./users/users.module');
const { PostsModule } = require('./posts/posts.module');
const { CommentsModule } = require('./comments/comments.module');
const { ModerationModule } = require('./moderation/moderation.module');
const { HealthModule } = require('./health/health.module');

@Module({
  imports: [
    // @nestjs/config 3.3.0 forRoot() is async and returns a Promise, which Nest
    // cannot use as a module metatype. All app code reads config via config(),
    // so we just validate env synchronously at module load instead.
    ThrottlerModule.forRoot([
      {
        ttl: (parseInt(process.env.THROTTLE_TTL || '60', 10)) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT || '100', 10),
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
    PostsModule,
    CommentsModule,
    ModerationModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerBehindProxyGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
class AppModule {}

module.exports = { AppModule };
