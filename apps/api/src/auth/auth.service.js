const { Injectable, ConflictException, UnauthorizedException, BadRequestException } = require('@nestjs/common');
const { JwtService } = require('@nestjs/jwt');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const config = require('../config/configuration');
const { PrismaService } = require('../common/prisma.service');
const { ERROR_CODES } = require('@socialhub/shared');
const { declareDeps } = require('../common/apply');

const BCRYPT_ROUNDS = 12;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

const PUBLIC_USER_SELECT = {
  id: true, email: true, displayName: true, avatarUrl: true,
  bio: true, role: true, emailVerified: true, isBanned: true,
  createdAt: true, updatedAt: true,
};

@Injectable()
class AuthService {
  constructor(prisma, jwtService) {
    this.prisma = prisma;
    this.jwtService = jwtService;
    this.cfg = config();
  }

  async register(dto) {
    const email = dto.email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new ConflictException({ code: ERROR_CODES.CONFLICT, message: 'Email already registered' });
    }
    if (!PASSWORD_RE.test(dto.password)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Password must be at least 8 characters and contain a letter and a digit',
      });
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        displayName: dto.displayName,
        role: 'USER',
      },
      select: PUBLIC_USER_SELECT,
    });
    const tokens = await this.issueTokens(user.id, user.role);
    return { user, ...tokens };
  }

  async login(email, password) {
    const user = await this.prisma.user.findUnique({
      where: { email: (email || '').toLowerCase().trim() },
    });
    // Compare against a fixed dummy hash for unknown users to keep timing similar.
    const hash = user ? user.passwordHash : '$2a$12$C6UzMDM.H6dfI/f/IKcEeO7Z7pVeG8FtL9mXlSbIYuiVh0dQlM3Wu';
    const valid = await bcrypt.compare(password || '', hash);
    if (!user || !valid) {
      throw new UnauthorizedException({ code: ERROR_CODES.UNAUTHORIZED, message: 'Invalid credentials' });
    }
    if (user.isBanned) {
      throw new UnauthorizedException({ code: ERROR_CODES.UNAUTHORIZED, message: 'Account is banned' });
    }
    const safeUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: PUBLIC_USER_SELECT,
    });
    const tokens = await this.issueTokens(user.id, user.role);
    return { user: safeUser, ...tokens };
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async issueTokens(userId, role) {
    const accessToken = this.jwtService.sign({ sub: userId, role }, {
      secret: this.cfg.jwt.accessSecret,
      expiresIn: this.cfg.jwt.accessExpiresIn,
    });
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + this.parseExpiryMs(this.cfg.jwt.refreshExpiresIn));
    await this.prisma.refreshToken.create({
      data: { tokenHash: this.hashToken(refreshToken), userId, expiresAt },
    });
    return { accessToken, refreshToken };
  }

  parseExpiryMs(str) {
    const m = /^(\d+)([smhd])$/.exec(str || '7d');
    if (!m) return 7 * 24 * 3600 * 1000;
    const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
    return parseInt(m[1], 10) * mult;
  }

  async refresh(refreshToken) {
    if (!refreshToken) {
      throw new UnauthorizedException({ code: ERROR_CODES.UNAUTHORIZED, message: 'Refresh token required' });
    }
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(refreshToken) },
      include: { user: true },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: ERROR_CODES.UNAUTHORIZED, message: 'Invalid refresh token' });
    }
    if (stored.user.isBanned) {
      throw new UnauthorizedException({ code: ERROR_CODES.UNAUTHORIZED, message: 'Account is banned' });
    }
    // Rotation: revoke old, issue new.
    await this.prisma.refreshToken.update({
      where: { id: stored.id },
      data: { revokedAt: new Date() },
    });
    const tokens = await this.issueTokens(stored.userId, stored.user.role);
    return { user: { ...stored.user, passwordHash: undefined }, ...tokens };
  }

  async logout(userId, refreshToken) {
    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: this.hashToken(refreshToken), userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }
    return { success: true };
  }

  async revokeAllSessions(userId) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const valid = await bcrypt.compare(currentPassword || '', user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException({ code: ERROR_CODES.UNAUTHORIZED, message: 'Current password is incorrect' });
    }
    if (!PASSWORD_RE.test(newPassword)) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Password must be at least 8 characters and contain a letter and a digit',
      });
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await this.revokeAllSessions(userId);
    return { success: true };
  }

  async forgotPassword(email) {
    const user = await this.prisma.user.findUnique({
      where: { email: (email || '').toLowerCase().trim() },
    });
    // Always appear successful; do not leak whether the account exists.
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      await this.prisma.refreshToken.create({
        data: {
          tokenHash: this.hashToken(rawToken),
          userId: user.id,
          expiresAt: new Date(Date.now() + 3600 * 1000), // 1h
        },
      });
      // No mailer in dev: log the reset token.
      console.log(`[dev] password reset token for ${user.email}: ${rawToken}`);
    }
    return { message: 'If that email exists, a reset link has been sent' };
  }

  async resetPassword(token, newPassword) {
    if (!token || !PASSWORD_RE.test(newPassword || '')) {
      throw new BadRequestException({
        code: ERROR_CODES.VALIDATION_ERROR,
        message: 'Valid token and a password of 8+ chars with letter and digit required',
      });
    }
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(token) },
    });
    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      throw new UnauthorizedException({ code: ERROR_CODES.UNAUTHORIZED, message: 'Invalid or expired reset token' });
    }
    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({ where: { id: stored.userId }, data: { passwordHash } });
    await this.prisma.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    await this.revokeAllSessions(stored.userId);
    return { success: true };
  }

  async me(userId) {
    return this.prisma.user.findUnique({ where: { id: userId }, select: PUBLIC_USER_SELECT });
  }
}

declareDeps(AuthService, PrismaService, JwtService);

module.exports = { AuthService, PUBLIC_USER_SELECT, PASSWORD_RE };
