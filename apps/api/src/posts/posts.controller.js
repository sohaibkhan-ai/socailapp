const { BadRequestException, ForbiddenException, NotFoundException } = require('@nestjs/common');
const { PrismaService } = require('../common/prisma.service');
const { applyController, applyMethods, declareDeps, rawCurrentUserFactory, rawBodyFactory, rawParamFactory, rawQueryFactory } = require('../common/apply');
const { JwtAuthGuard } = require('../common/guards/jwt-auth.guard');
const { Public } = require('../common/decorators/public.decorator');
const { parsePagination } = require('../common/pagination');

const TITLE_MIN = 3, TITLE_MAX = 140, CONTENT_MAX = 10000, TAGS_MAX = 5;

function validatePostDto(body, partial = false) {
  if (!body || typeof body !== 'object') throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Body required' });
  const { title, content, tags, imageUrl } = body;
  if (!partial || title !== undefined) {
    if (typeof title !== 'string' || title.length < TITLE_MIN || title.length > TITLE_MAX) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `title must be ${TITLE_MIN}-${TITLE_MAX} characters` });
    }
  }
  if (!partial || content !== undefined) {
    if (typeof content !== 'string' || content.length < 1 || content.length > CONTENT_MAX) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `content must be 1-${CONTENT_MAX} characters` });
    }
  }
  if (tags !== undefined) {
    if (!Array.isArray(tags)) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'tags must be an array of strings' });
    if (tags.length > TAGS_MAX) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `max ${TAGS_MAX} tags` });
    if (tags.some((t) => typeof t !== 'string' || t.length > 30)) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'each tag must be a string of 30 chars max' });
    }
  }
  if (imageUrl !== undefined && imageUrl !== null && typeof imageUrl !== 'string') {
    throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'imageUrl must be a string' });
  }
  return { title, content, tags, imageUrl };
}

const cleanTags = (tags) => tags.map((t) => t.toLowerCase().trim()).filter(Boolean).slice(0, TAGS_MAX);

const AUTHOR_SELECT = { select: { id: true, displayName: true, avatarUrl: true } };

class PostsController {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async list(query, user) {
    const { page, limit, skip, take } = parsePagination(query);
    const where = {};
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { content: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query.tag) where.tags = { has: String(query.tag).toLowerCase() };
    if (query.authorId) where.authorId = query.authorId;
    const orderBy = query.sort === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.post.findMany({
        where, orderBy, skip, take,
        include: { author: AUTHOR_SELECT, _count: { select: { likes: true, comments: true } } },
      }),
      this.prisma.post.count({ where }),
    ]);
    const visible = items.filter(
      (p) => !p.isHidden || (user && (user.role === 'ADMIN' || p.authorId === user.id)),
    );
    return { items: visible, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async getOne(id, user) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: { author: AUTHOR_SELECT, _count: { select: { likes: true, comments: true } } },
    });
    if (!post || (post.isHidden && !(user && (user.role === 'ADMIN' || post.authorId === user.id)))) {
      throw new NotFoundException({ code: 'NOT_FOUND', message: 'Post not found' });
    }
    return post;
  }

  async create(user, body) {
    const dto = validatePostDto(body);
    return this.prisma.post.create({
      data: {
        title: dto.title,
        content: dto.content,
        tags: dto.tags ? cleanTags(dto.tags) : [],
        ...(dto.imageUrl ? { imageUrl: dto.imageUrl } : {}),
        authorId: user.id,
      },
      include: { author: AUTHOR_SELECT },
    });
  }

  async update(id, user, body) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Post not found' });
    if (post.authorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'You are not the author of this post' });
    }
    const dto = validatePostDto(body, true);
    return this.prisma.post.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.content !== undefined ? { content: dto.content } : {}),
        ...(dto.tags !== undefined ? { tags: cleanTags(dto.tags) } : {}),
        ...(dto.imageUrl !== undefined ? { imageUrl: dto.imageUrl } : {}),
      },
      include: { author: AUTHOR_SELECT },
    });
  }

  async remove(id, user) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Post not found' });
    if (post.authorId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'You are not the author of this post' });
    }
    await this.prisma.post.delete({ where: { id } });
    return { deleted: true };
  }

  async like(id, user) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.isHidden) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Post not found' });
    await this.prisma.postLike.upsert({
      where: { userId_postId: { userId: user.id, postId: id } },
      update: {},
      create: { userId: user.id, postId: id },
    });
    return { liked: true };
  }

  async unlike(id, user) {
    await this.prisma.postLike.deleteMany({ where: { userId: user.id, postId: id } });
    return { liked: false };
  }

  async listComments(id, user) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Post not found' });
    const isAdmin = user && user.role === 'ADMIN';
    const where = { postId: id };
    if (!isAdmin && !(user && post.authorId === user.id)) where.isHidden = false;
    return this.prisma.comment.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: { author: AUTHOR_SELECT, _count: { select: { likes: true } } },
    });
  }

  async createComment(id, user, body) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post || post.isHidden) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Post not found' });
    const content = body && typeof body.content === 'string' ? body.content.trim() : '';
    if (content.length < 1 || content.length > 2000) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'comment content must be 1-2000 characters' });
    }
    return this.prisma.comment.create({
      data: { postId: id, authorId: user.id, content },
      include: { author: AUTHOR_SELECT },
    });
  }
}

declareDeps(PostsController, PrismaService);
applyController(PostsController, 'posts');
applyMethods(PostsController, [
  { method: 'get', path: '', name: 'list', decorators: [Public()], params: [{ index: 0, factory: rawQueryFactory }, { index: 1, factory: rawCurrentUserFactory }] },
  { method: 'get', path: ':id', name: 'getOne', decorators: [Public()], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }] },
  { method: 'post', path: '', name: 'create', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawCurrentUserFactory }, { index: 1, factory: rawBodyFactory }] },
  { method: 'patch', path: ':id', name: 'update', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }, { index: 2, factory: rawBodyFactory }] },
  { method: 'delete', path: ':id', name: 'remove', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }] },
  { method: 'post', path: ':id/like', name: 'like', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }] },
  { method: 'delete', path: ':id/like', name: 'unlike', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }] },
  { method: 'get', path: ':id/comments', name: 'listComments', decorators: [Public()], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }] },
  { method: 'post', path: ':id/comments', name: 'createComment', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }, { index: 2, factory: rawBodyFactory }] },
]);

module.exports = { PostsController };
