const { Catch, HttpException, HttpStatus } = require('@nestjs/common');

const CODE_BY_STATUS = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'VALIDATION_ERROR',
  429: 'RATE_LIMITED',
};

class HttpExceptionFilter {
  catch(exception, host) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_ERROR';
    let details = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        code = body.code || null;
        if (Array.isArray(body.message)) {
          details = body.message;
          message = 'Validation failed';
        } else {
          message = body.message || exception.message;
        }
      }
      if (!code) code = CODE_BY_STATUS[status] || 'INTERNAL_ERROR';
    }

    if (status >= 500) {
      console.error(`[error] ${request?.method} ${request?.url}`, exception);
    }

    response.status(status).json({ success: false, error: { code, message, details } });
  }
}

Catch()(HttpExceptionFilter);

module.exports = { HttpExceptionFilter };
