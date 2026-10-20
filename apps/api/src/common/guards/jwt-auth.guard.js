const { Injectable, CanActivate, ExecutionContext, UnauthorizedException } = require('@nestjs/common');
const { Reflector } = require('@nestjs/core');
const jwt = require('jsonwebtoken');
const config = require('../../config/configuration');
const { ERROR_CODES } = require('@socialhub/shared');
const { IS_PUBLIC_KEY } = require('../decorators/public.decorator');
const { declareDeps } = require('../apply');


// Plain-JS guard: verifies the access JWT (bearer header or access_token cookie)
// and attaches { id, role } to request.user. @Public routes skip verification.
class JwtAuthGuard {
  constructor(reflector) {
    this.reflector = reflector || new Reflector();
  }

  canActivate(context) {
    const isPublic = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const cfg = config();
    const header = request.headers['authorization'] || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
    const cookieToken = request.cookies ? request.cookies['access_token'] : null;
    const token = bearer || cookieToken;

    // Public routes still attach the user when a valid token is supplied,
    // so handlers can show visibility-aware content without requiring auth.
    if (isPublic) {
      if (token) {
        try {
          const payload = jwt.verify(token, cfg.jwt.accessSecret);
          request.user = { id: payload.sub, userId: payload.sub, role: payload.role };
        } catch (e) {
          // Ignore invalid tokens on public routes.
        }
      }
      return true;
    }

    if (!token) {
      throw new UnauthorizedException({ code: ERROR_CODES.UNAUTHORIZED, message: 'Authentication required' });
    }
    try {
      const payload = jwt.verify(token, cfg.jwt.accessSecret);
      request.user = { id: payload.sub, userId: payload.sub, role: payload.role };
      return true;
    } catch (e) {
      throw new UnauthorizedException({ code: ERROR_CODES.UNAUTHORIZED, message: 'Invalid or expired token' });
    }
  }
}

Injectable()(JwtAuthGuard);declareDeps(JwtAuthGuard, Reflector);

module.exports = { JwtAuthGuard };
