require('reflect-metadata');
const express = require('express');
const { NestFactory } = require('@nestjs/core');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const { AppModule } = require('./app.module');
const { HttpExceptionFilter } = require('./common/filters/http-exception.filter');
const { TransformInterceptor } = require('./common/interceptors/transform.interceptor');
const config = require('./config/configuration');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { logger: ['log', 'warn', 'error'] });
  const cfg = config();

  app.setGlobalPrefix('api/v1');
  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.enableCors({
    origin: cfg.corsOrigins,
    credentials: true,
  });

  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();

  const { DocumentBuilder, SwaggerModule } = require('@nestjs/swagger');
  const swaggerConfig = new DocumentBuilder()
    .setTitle('SocialHub API')
    .setDescription('SocialHub backend API v1')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(cfg.port);
  console.log(`API listening on http://localhost:${cfg.port}/api/v1 (docs: /docs)`);

  const graceful = async (signal) => {
    console.log(`\n${signal} received, shutting down...`);
    await app.close();
    process.exit(0);
  };
  process.on('SIGINT', () => graceful('SIGINT'));
  process.on('SIGTERM', () => graceful('SIGTERM'));
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap app:', err);
  process.exit(1);
});
