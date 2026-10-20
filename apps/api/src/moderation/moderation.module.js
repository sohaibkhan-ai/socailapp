const { Module } = require('@nestjs/common');
const { ModerationController, ReportsController } = require('./moderation.controller');

@Module({ controllers: [ModerationController, ReportsController] })
class ModerationModule {}

module.exports = { ModerationModule };
