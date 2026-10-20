const { createParamDecorator, ExecutionContext } = require('@nestjs/common');

const CurrentUser = createParamDecorator((data, ctx) => {
  const request = ctx.switchToHttp().getRequest();
  return data ? request.user?.[data] : request.user;
});

module.exports = { CurrentUser };
