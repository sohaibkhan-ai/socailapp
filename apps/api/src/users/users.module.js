const { Module } = require('@nestjs/common');
const { UsersController } = require('./users.controller');
const { AuthModule } = require('../auth/auth.module');

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
})
class UsersModule {}

module.exports = { UsersModule };
