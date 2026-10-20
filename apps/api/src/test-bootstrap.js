// Bootstraps the Nest app for e2e tests without listening on a port.
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { AppModule } = require('./app.module');
const { TransformInterceptor } = require('./common/interceptors/transform.interceptor');
const { HttpExceptionFilter } = require('./common/filters/http-exception.filter');

async function bootstrapForTest() {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api/v1');
  app.use(express.json({ limit: '1mb' }));
  app.use(helmet());
  app.use(cookieParser());
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return app;
}

module.exports = { bootstrapForTest };
