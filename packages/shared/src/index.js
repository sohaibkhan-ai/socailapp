/** Shared response & domain contracts used by both API and mobile app. */

const ROLES = { USER: 'USER', MODERATOR: 'ADMIN' };

const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL: 'INTERNAL_ERROR',
};

/** Envelope every API response uses: { success, data?, error? } */
const ok = (data) => ({ success: true, data });
const fail = (code, message, details) => ({
  success: false,
  error: { code, message, details: details ?? null },
});

const PAGINATION_DEFAULT = { page: 1, limit: 20 };
const MAX_LIMIT = 50;

module.exports = { ROLES, ERROR_CODES, ok, fail, PAGINATION_DEFAULT, MAX_LIMIT };
