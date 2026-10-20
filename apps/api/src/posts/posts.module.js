const { Module } = require('@nestjs/common');
const { PostsController } = require('./posts.controller');

@Module({ controllers: [PostsController] })
class PostsModule {}

module.exports = { PostsModule };
