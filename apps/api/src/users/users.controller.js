const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { plainToInstance } = require('class-transformer');
const { IsOptional, IsString, MaxLength, MinLength } = require('class-validator');
const {
  ValidationPipe, BadRequestException, PayloadTooLargeException,
  UnsupportedMediaTypeException, NotFoundException, UseInterceptors,
} = require('@nestjs/common');
const { FileInterceptor } = require('@nestjs/platform-express');
const { AuthService } = require('../auth/auth.service');
const { PrismaService } = require('../common/prisma.service');
const { applyController, applyMethods, declareDeps, rawCurrentUserFactory, rawBodyFactory, rawParamFactory, rawResFactory, rawFileFactory } = require('../common/apply');
const { JwtAuthGuard } = require('../common/guards/jwt-auth.guard');

class UpdateMeDto {}
IsOptional()(UpdateMeDto.prototype, 'displayName');
IsString()(UpdateMeDto.prototype, 'displayName');
MinLength(2)(UpdateMeDto.prototype, 'displayName');
MaxLength(40)(UpdateMeDto.prototype, 'displayName');
IsOptional()(UpdateMeDto.prototype, 'bio');
IsString()(UpdateMeDto.prototype, 'bio');
MaxLength(500)(UpdateMeDto.prototype, 'bio');

const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
async function validateDto(cls, body) {
  const inst = await pipe.transform(plainToInstance(cls, body), { type: 'body', metatype: cls });
  await pipe.validate(inst, { type: 'body', metatype: cls });
  return inst;
}

const ALLOWED_MIMES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

function sniffImage(buf) {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
  if (buf.length > 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
  if (buf.length > 12 && buf.slice(0, 4).toString() === 'RIFF' && buf.slice(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

const maxMb = parseInt(process.env.MAX_UPLOAD_MB || '5', 10);
const uploadInterceptor = FileInterceptor('file', {
  storage: multer.memoryStorage(),
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIMES[file.mimetype]) {
      return cb(new UnsupportedMediaTypeException({ code: 'VALIDATION_ERROR', message: 'Only image/jpeg, image/png, image/webp are allowed' }));
    }
    cb(null, true);
  },
});

class UsersController {
  constructor(prisma, authService) {
    this.prisma = prisma;
    this.authService = authService;
  }

  async getMe(user) {
    return this.authService.me(user.id);
  }

  async updateMe(user, body) {
    const dto = await validateDto(UpdateMeDto, body);
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(dto.displayName !== undefined ? { displayName: dto.displayName } : {}),
        ...(dto.bio !== undefined ? { bio: dto.bio } : {}),
      },
      select: { id: true, email: true, displayName: true, avatarUrl: true, bio: true, role: true, createdAt: true },
    });
  }

  async changePassword(user, body) {
    if (!body || !body.currentPassword || !body.newPassword) {
      throw new BadRequestException('currentPassword and newPassword are required');
    }
    return this.authService.changePassword(user.id, body.currentPassword, body.newPassword);
  }

  async uploadAvatar(user, file) {
    if (!file) throw new BadRequestException({ code: 'VALIDATION_ERROR', message: 'No file uploaded (field name: "file")' });
    if (file.size > maxMb * 1024 * 1024) {
      throw new PayloadTooLargeException({ code: 'VALIDATION_ERROR', message: `File exceeds ${maxMb}MB limit` });
    }
    const sniffed = sniffImage(file.buffer);
    if (!sniffed || !ALLOWED_MIMES[sniffed]) {
      throw new UnsupportedMediaTypeException({ code: 'VALIDATION_ERROR', message: 'Only image/jpeg, image/png, image/webp are allowed' });
    }
    const dir = process.env.UPLOAD_DIR || 'uploads';
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${user.id}-${Date.now()}.${ALLOWED_MIMES[sniffed]}`;
    fs.writeFileSync(path.join(dir, filename), file.buffer);
    const avatarUrl = `/static/${filename}`;
    await this.prisma.user.update({ where: { id: user.id }, data: { avatarUrl } });
    return { avatarUrl };
  }

  // Anonymization: displayName replaced, bio/avatar cleared, banned, sessions revoked.
  // NOTE: schema's onDelete: Cascade applies only to hard row deletes; authored posts
  // remain (disowned). A hard DELETE would cascade-delete all posts.
  async deleteMe(res, user) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        displayName: 'Deleted User',
        bio: null,
        avatarUrl: null,
        isBanned: true,
        email: `deleted+${user.id}@socialhub.invalid`,
      },
    });
    await this.authService.revokeAllSessions(user.id);
    res.status(200).json({ success: true, data: { deleted: true, note: 'account anonymized; hard delete would cascade-delete posts' } });
  }

  async getProfile(id) {
    const found = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true, displayName: true, avatarUrl: true, bio: true, role: true, createdAt: true,
        posts: { where: { isHidden: false }, select: { id: true, title: true, createdAt: true } },
      },
    });
    if (!found) throw new NotFoundException({ code: 'NOT_FOUND', message: 'User not found' });
    return found;
  }
}

declareDeps(UsersController, PrismaService, AuthService);
applyController(UsersController, 'users');
applyMethods(UsersController, [
  { method: 'get', path: 'me', name: 'getMe', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawCurrentUserFactory }] },
  { method: 'patch', path: 'me', name: 'updateMe', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawCurrentUserFactory }, { index: 1, factory: rawBodyFactory }] },
  { method: 'patch', path: 'me/password', name: 'changePassword', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawCurrentUserFactory }, { index: 1, factory: rawBodyFactory }] },
  { method: 'post', path: 'me/avatar', name: 'uploadAvatar', guards: [JwtAuthGuard], decorators: [UseInterceptors(uploadInterceptor)], params: [{ index: 0, factory: rawCurrentUserFactory }, { index: 1, factory: rawFileFactory }] },
  { method: 'delete', path: 'me', name: 'deleteMe', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawResFactory }, { index: 1, factory: rawCurrentUserFactory }] },
  { method: 'get', path: ':id', name: 'getProfile', params: [{ index: 0, factory: rawParamFactory, data: 'id' }] },
]);

module.exports = { UsersController };
