import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AiController } from './ai/ai.controller';
import { AiService } from './ai/ai.service';
import { AuthGuard } from './auth/auth.guard';
import { AuthService } from './auth/auth.service';
import { CatalogController } from './catalog/catalog.controller';
import { CatalogRepository } from './catalog/catalog.repository';
import { CatalogService } from './catalog/catalog.service';
import { AllExceptionsFilter } from './common/errors';
import { HealthController } from './common/health.controller';
import { RequestLogger } from './common/request-logger';
import { RetentionService } from './common/retention.service';
import { SessionThrottlerGuard } from './common/throttler.guard';
import { APP_CONFIG, loadConfig, type AppConfig } from './config';
import { MeController } from './me/me.controller';
import { MeService } from './me/me.service';
import { UserContextService } from './me/user-context.service';
import { PlanningController } from './planning/planning.controller';
import { PlanningService } from './planning/planning.service';
import { PrismaModule } from './prisma/prisma.module';
import { ProgressController } from './progress/progress.controller';
import { ProgressService } from './progress/progress.service';
import { ShoppingController } from './shopping/shopping.controller';
import { ShoppingService } from './shopping/shopping.service';

@Module({
  imports: [
    PrismaModule,
    // Limitation globale des requêtes ; des limites plus strictes sont posées sur les routes sensibles.
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
  ],
  controllers: [HealthController, MeController, CatalogController, PlanningController, ShoppingController, ProgressController, AiController],
  providers: [
    { provide: APP_CONFIG, useFactory: (): AppConfig => loadConfig() },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Ordre : limitation des requêtes, puis authentification (toutes les routes sont privées sauf @Public).
    { provide: APP_GUARD, useClass: SessionThrottlerGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    AuthService,
    UserContextService,
    MeService,
    CatalogRepository,
    CatalogService,
    PlanningService,
    ShoppingService,
    ProgressService,
    AiService,
    RetentionService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLogger).forRoutes('*');
  }
}
