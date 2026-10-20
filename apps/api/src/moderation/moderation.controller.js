const { BadRequestException, ForbiddenException, NotFoundException, SetMetadata } = require('@nestjs/common');
const { PrismaService } = require('../common/prisma.service');
const { applyController, applyMethods, declareDeps, rawCurrentUserFactory, rawBodyFactory, rawParamFactory, rawQueryFactory } = require('../common/apply');
const { JwtAuthGuard } = require('../common/guards/jwt-auth.guard');
const { Roles } = require('../common/decorators/roles.decorator');
const { parsePagination } = require('../common/pagination');

const MOD_ROLES = ['MODERATOR', 'ADMIN'];
const TARGET_TYPES = ['POST', 'COMMENT', 'USER'];

class ModerationController {
  constructor(prisma) {
    this.prisma = prisma;
  }

  async listReports(query) {
    const { skip, take, page, limit } = parsePagination(query);
    const where = query.status ? { status: String(query.status).toUpperCase() } : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where, orderBy: { createdAt: 'desc' }, skip, take,
        include: {
          reporter: { select: { id: true, displayName: true } },
          moderator: { select: { id: true, displayName: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);
    return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
  }

  async createReport(user, body) {
    const { targetType, targetId, reason } = body || {};
    if (!TARGET_TYPES.includes(targetType)) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: `targetType must be one of ${TARGET_TYPES.join(', ')}` });
    }
    if (!targetId || typeof targetId !== 'string') {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'targetId is required' });
    }
    if (!reason || typeof reason !== 'string' || reason.trim().length < 3 || reason.length > 1000) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'reason must be 3-1000 characters' });
    }
    return this.prisma.report.create({
      data: { reporterId: user.id, targetType, targetId, reason: reason.trim() },
    });
  }

  async resolveReport(id, user, body) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException({ code: 'NOT_FOUND', message: 'Report not found' });
    if (report.status !== 'PENDING') {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'Report already resolved' });
    }
    const action = body && body.action;
    if (!['resolve', 'dismiss'].includes(action)) {
      throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'action must be "resolve" or "dismiss"' });
    }

    const status = action === 'resolve' ? 'RESOLVED' : 'DISMISSED';
    const updated = await this.prisma.report.update({
      where: { id },
      data: { status, moderatorId: user.id, resolvedAt: new Date() },
    });

    if (action === 'resolve') {
      // Hide the reported content.
      if (report.targetType === 'POST') {
        await this.prisma.post.update({ where: { id: report.targetId }, data: { isHidden: true } }).catch(() => null);
      } else if (report.targetType === 'COMMENT') {
        await this.prisma.comment.update({ where: { id: report.targetId }, data: { isHidden: true } }).catch(() => null);
      }
    }
    return updated;
  }

  async banUser(id, user) {
    if (id === user.id) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'You cannot ban yourself' });
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });
    if (target.role === 'ADMIN') throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Cannot ban an admin' });
    const updated = await this.prisma.user.update({ where: { id }, data: { isBanned: true } });
    // Revoke all sessions.
    await this.prisma.refreshToken.updateMany({ where: { userId: id, revokedAt: null }, data: { revokedAt: new Date() } });
    return { id: updated.id, isBanned: updated.isBanned };
  }

  async unbanUser(id) {
    const target = await this.prisma.user.findUnique({ where: { id } });
    if (!target) throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });
    const updated = await this.prisma.user.update({ where: { id }, data: { isBanned: false } });
    return { id: updated.id, isBanned: updated.isBanned };
  }
}

const modOnly = Roles(...MOD_ROLES);
declareDeps(ModerationController, PrismaService);
applyController(ModerationController, 'moderation');
applyMethods(ModerationController, [
  { method: 'get', path: 'reports', name: 'listReports', guards: [JwtAuthGuard], decorators: [modOnly], params: [{ index: 0, factory: rawQueryFactory }] },
  { method: 'patch', path: 'reports/:id', name: 'resolveReport', guards: [JwtAuthGuard], decorators: [modOnly], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }, { index: 2, factory: rawBodyFactory }] },
  { method: 'post', path: 'users/:id/ban', name: 'banUser', guards: [JwtAuthGuard], decorators: [modOnly], params: [{ index: 0, factory: rawParamFactory, data: 'id' }, { index: 1, factory: rawCurrentUserFactory }] },
  { method: 'post', path: 'users/:id/unban', name: 'unbanUser', guards: [JwtAuthGuard], decorators: [modOnly], params: [{ index: 0, factory: rawParamFactory, data: 'id' }] },
]);

// POST /reports is available to any authenticated user, registered separately:
const ReportsController = class ReportsController {
  constructor(prisma) { this.prisma = prisma; }
  async createReport(user, body) { return ModerationController.prototype.createReport.call(this, user, body); }
};
declareDeps(ReportsController, PrismaService);
applyController(ReportsController, 'reports');
applyMethods(ReportsController, [
  { method: 'post', path: '', name: 'createReport', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawCurrentUserFactory }, { index: 1, factory: rawBodyFactory }] },
]);

module.exports = { ModerationController, ReportsController };
