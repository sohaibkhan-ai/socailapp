const { Module } = require('@nestjs/common');
const { HealthController } = require('./health.controller');

@Module({ controllers: [HealthController] })
class HealthModule {}

module.exports = { HealthModule };
