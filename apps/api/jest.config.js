module.exports = {
  testEnvironment: 'node',
  testRegex: '.*\\.(e2e-spec|spec)\\.js$',
  testTimeout: 30000,
  setupFiles: ['<rootDir>/test/setup.js'],
  roots: ['<rootDir>/test'],
};
