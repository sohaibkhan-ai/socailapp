const { Injectable } = require('@nestjs/common');
const { ThrottlerGuard } = require('@nestjs/throttler');

@Injectable()
class ThrottlerBehindProxyGuard extends ThrottlerGuard {}

module.exports = { ThrottlerBehindProxyGuard };
