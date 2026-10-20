const { Module } = require('@nestjs/common');
const { CommentsController } = require('./comments.controller');

@Module({ controllers: [CommentsController] })
class CommentsModule {}

module.exports = { CommentsModule };
