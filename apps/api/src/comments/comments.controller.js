const { BadRequestException, ForbiddenException, NotFoundException, Param, Post: PostDeco } = require('@nestjs/common');
const { PrismaService } = require('../common/prisma.service');
const { applyController, applyMethods, declareDeps, rawCurrentUserFactory, rawBodyFactory, rawParamFactory } = require('../common/apply');
const { JwtAuthGuard } = require('../common/guards/jwt-auth.guard');
const { Public } = require('../common/decorators/public.decorator');

class CommentsController {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async getOne(id) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: { author: { select: { id: true, displayName: true, avatarUrl: true } }, _count: { select: { likes: true } } },
    });
    if (!comment || comment.isHidden) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Comment not found' });
    return comment;
  }

  async update(id, user, body) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.isHidden) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Comment not found' });
    const isMod = user.role === 'ADMIN' || user.role === 'MODERATOR';
    if (comment.authorId !== user.id && !isMod) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'You are not the author of this comment' });
    }
    const content = body && typeof body.content === 'string' ? body.content.trim() : '';
    if (content.length < 1 || content.length > 2000) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'comment content must be 1-2000 characters' });
    }
    return this.prisma.comment.update({ where: { id }, data: { content }, include: { author: { select: { id: true, displayName: true, avatarUrl: true } } } });
  }

  async remove(id, user) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Comment not found' });
    const isMod = user.role === 'ADMIN' || user.role === 'MODERATOR';
    if (comment.authorId !== user.id && !isMod) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'You are not the author of this comment' });
    }
    await this.prisma.comment.delete({ where: { id } });
    return { deleted: true };
  }

  async like(id, user) {
    const comment = await this.prisma.comment.findUnique({ where: { id } });
    if (!comment || comment.isHidden) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Comment not found' });
    await this.prisma.commentLike.upsert({
      where: { userId_commentId: { userId: user.id, commentId: id } },
      update: {},
      create: { userId: user.id, commentId: id },
    });
    return { liked: true };
  }

  async unlike(id, user) {
    await this.prisma.commentLike.deleteMany({ where: { userId: user.id, commentId: id } });
    return { liked: false };
  }
}

declareDeps(CommentsController, PrismaService);
applyController(CommentsController, 'comments');
applyMethods(CommentsController, [
  { method: 'get', path: ':id', name: 'getOne', decorators: [Public()], params: [{ index: 0, factory: rawParamFactory, data: 'id' }] },
  { method: 'patch', path: ':id', name: 'update', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }, { index: 2, factory: rawBodyFactory }] },
  { method: 'delete', path: ':id', name: 'remove', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }] },
  { method: 'post', path: ':id/like', name: 'like', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }] },
  { method: 'delete', path: ':id/like', name: 'unlike', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }] },
]);

module.exports = { CommentsController };
