const { plainToInstance } = require('class-transformer');
const { ValidationPipe, UnauthorizedException } = require('@nestjs/common');
const { IsEmail, IsString, MinLength, MaxLength, Matches } = require('class-validator');
const { JwtAuthGuard } = require('../common/guards/jwt-auth.guard');
const { Public } = require('../common/decorators/public.decorator');
const { AuthService } = require('./auth.service');
const { applyController, applyMethods, declareDeps, rawReqFactory, rawBodyFactory, rawCurrentUserFactory } = require('../common/apply');
const { Throttle } = require('@nestjs/throttler');

class RegisterDto {}
IsEmail({})(RegisterDto.prototype, 'email');
IsString()(RegisterDto.prototype, 'password');
MinLength(8, { message: 'password must be at least 8 characters' })(RegisterDto.prototype, 'password');
Matches(/[A-Za-z]/, { message: 'password must contain a letter' })(RegisterDto.prototype, 'password');
Matches(/\d/, { message: 'password must contain a digit' })(RegisterDto.prototype, 'password');
IsString()(RegisterDto.prototype, 'displayName');
MinLength(2, { message: 'displayName must be at least 2 characters' })(RegisterDto.prototype, 'displayName');
MaxLength(40, { message: 'displayName must be at most 40 characters' })(RegisterDto.prototype, 'displayName');

class LoginDto {}
IsEmail({})(LoginDto.prototype, 'email');
IsString()(LoginDto.prototype, 'password');

class RefreshDto {}
IsString()(RefreshDto.prototype, 'refreshToken');

class ForgotPasswordDto {}
IsEmail({})(ForgotPasswordDto.prototype, 'email');

class ResetPasswordDto {}
IsString()(ResetPasswordDto.prototype, 'token');
IsString()(ResetPasswordDto.prototype, 'newPassword');
MinLength(8)(ResetPasswordDto.prototype, 'newPassword');

class ChangePasswordDto {}
IsString()(ChangePasswordDto.prototype, 'currentPassword');
IsString()(ChangePasswordDto.prototype, 'newPassword');
MinLength(8)(ChangePasswordDto.prototype, 'newPassword');

const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
async function validateDto(cls, body) {
  return pipe.transform(body, { type: 'body', metatype: cls });
}

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async register(body) {
    const dto = await validateDto(RegisterDto, body);
    return this.authService.register(dto);
  }

  async login(body) {
    const dto = await validateDto(LoginDto, body);
    return this.authService.login(dto.email, dto.password);
  }

  async refresh(req, body) {
    const token = body?.refreshToken || req.cookies?.['refresh_token'];
    if (!token) throw new UnauthorizedException({ code: 'UNAUTHORIZED', message: 'Refresh token required' });
    return this.authService.refresh(token);
  }

  async logout(req, user, body) {
    const token = body?.refreshToken || req.cookies?.['refresh_token'];
    return this.authService.logout(user.id, token);
  }

  async forgotPassword(body) {
    const dto = await validateDto(ForgotPasswordDto, body);
    return this.authService.forgotPassword(dto.email);
  }

  async resetPassword(body) {
    const dto = await validateDto(ResetPasswordDto, body);
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }

  async me(user) {
    return this.authService.me(user.id);
  }

  async changePassword(user, body) {
    const dto = await validateDto(ChangePasswordDto, body);
    return this.authService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }
}

const authLimit = parseInt(process.env.AUTH_THROTTLE_LIMIT || '5', 10);
const authTtl = parseInt(process.env.AUTH_THROTTLE_TTL || '60000', 10);
const strictAuth = Throttle({ default: { limit: authLimit, ttl: authTtl } });

declareDeps(AuthController, AuthService);
applyController(AuthController, 'auth');
applyMethods(AuthController, [
  { method: 'post', path: 'register', name: 'register', decorators: [Public(), strictAuth], params: [{ index: 0, factory: rawBodyFactory }] },
  { method: 'post', path: 'login', name: 'login', decorators: [Public(), strictAuth], params: [{ index: 0, factory: rawBodyFactory }] },
  { method: 'post', path: 'refresh', name: 'refresh', decorators: [Public()], params: [{ index: 0, factory: rawReqFactory }, { index: 1, factory: rawBodyFactory }] },
  { method: 'post', path: 'logout', name: 'logout', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawReqFactory }, { index: 1, factory: rawCurrentUserFactory }, { index: 2, factory: rawBodyFactory }] },
  { method: 'post', path: 'forgot-password', name: 'forgotPassword', decorators: [Public(), strictAuth], params: [{ index: 0, factory: rawBodyFactory }] },
  { method: 'post', path: 'reset-password', name: 'resetPassword', decorators: [Public(), strictAuth], params: [{ index: 0, factory: rawBodyFactory }] },
  { method: 'get', path: 'me', name: 'me', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawCurrentUserFactory }] },
  { method: 'post', path: 'change-password', name: 'changePassword', guards: [JwtAuthGuard], params: [{ index: 0, factory: rawCurrentUserFactory }, { index: 1, factory: rawBodyFactory }] },
]);

module.exports = { AuthController };
