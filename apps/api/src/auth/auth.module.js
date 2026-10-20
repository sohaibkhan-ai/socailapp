const { Module } = require('@nestjs/common');
const { JwtModule } = require('@nestjs/jwt');
const config = require('../config/configuration');
const { AuthController } = require('./auth.controller');
const { AuthService } = require('./auth.service');

@Module({
  imports: [
    JwtModule.register({
      secret: config().jwt.accessSecret,
      signOptions: { expiresIn: config().jwt.accessExpiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
class AuthModule {}

module.exports = { AuthModule };
