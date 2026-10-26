import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { loadConfig } from './config';

export async function createApp() {
  const config = loadConfig();
  const app = await NestFactory.create(AppModule, { logger: config.NODE_ENV === 'test' ? ['error'] : undefined });
  app.use(helmet());
  const origins = config.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  app.enableCors({ origin: origins.length ? origins : false });
  app.enableShutdownHooks();

  const doc = new DocumentBuilder()
    .setTitle('API NutriPlan')
    .setDescription('API REST de NutriPlan. Authentification : jeton d’accès Supabase (Bearer).')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, doc));
  return { app, config };
}

if (require.main === module) {
  createApp()
    .then(async ({ app, config }) => {
      await app.listen(config.PORT);
      console.log(`API NutriPlan démarrée sur le port ${config.PORT} (documentation : /docs)`);
    })
    .catch((e) => {
      console.error(e instanceof Error ? e.message : e);
      process.exit(1);
    });
}
