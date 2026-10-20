const { Injectable, CanActivate, ExecutionContext } = require('@nestjs/common');
const { Reflector } = require('@nestjs/core');
const { ROLES_KEY } = require('../decorators/roles.decorator');
const { declareDeps } = require('../apply');


@Injectable()
class RolesGuard {
  constructor(reflector) {
    this.reflector = reflector;
  }

  canActivate(context) {
    const required = this.reflector.getAllAndOverride(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required || required.length === 0) return true;
    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;
    return required.includes(user.role);
  }
}

declareDeps(RolesGuard, Reflector);

module.exports = { RolesGuard };
