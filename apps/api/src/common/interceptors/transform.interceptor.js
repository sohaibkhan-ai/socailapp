const { Injectable, NestInterceptor, ExecutionContext, CallHandler } = require('@nestjs/common');
const { Observable } = require('rxjs');
const { map } = require('rxjs/operators');
const { ok } = require('@socialhub/shared');

@Injectable()
class TransformInterceptor {
  intercept(context, next) {
    const res = context.switchToHttp().getResponse();
    return next.handle().pipe(
      map((data) => {
        // Preserve already-enveloped payloads (e.g. passthrough streams)
        if (data && typeof data === 'object' && 'success' in data) return data;
        res.header('X-Response-Envelope', 'success/data');
        return ok(data);
      }),
    );
  }
}

module.exports = { TransformInterceptor };
