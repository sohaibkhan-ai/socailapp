// Compile decorators (@Module, @Controller, ...) before any app module loads.
require('../src/babel-register');

process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://socialhub@127.0.0.1:5433/socialhub_test?schema=public';
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'test-access-secret-0123456789abcdef0123456789abcdef';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-0123456789abcdef0123456789abcde';
process.env.JWT_ACCESS_EXPIRES_IN = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
process.env.THROTTLE_LIMIT = process.env.THROTTLE_LIMIT || '1000';
process.env.UPLOAD_DIR = process.env.UPLOAD_DIR || '/tmp/socialhub-test-uploads';
process.env.AUTH_THROTTLE_LIMIT = process.env.AUTH_THROTTLE_LIMIT || '1000';
