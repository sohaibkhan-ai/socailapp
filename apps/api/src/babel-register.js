// Preload hook so plain-JS NestJS decorators (@Roles, @Public, @CurrentUser)
// compile via the Babel decorator plugins installed as devDependencies.
// Loaded via NODE_OPTIONS="--require ./src/babel-register.js" in npm scripts.
require('@babel/register')({
  presets: [],
  plugins: [
    ['@babel/plugin-proposal-decorators', { version: 'legacy' }],
    '@babel/plugin-transform-class-properties',
  ],
  extensions: ['.js'],
  only: [/(src|test)/],
  ignore: [/node_modules/],
  cache: true,
});
