import { Inject, Injectable, Logger, OnApplicationBootstrap, OnApplicationShutdown } from '@nestjs/common';
import { APP_CONFIG, type AppConfig } from '../config';
import { PrismaService } from '../prisma/prisma.service';

/** Politique de conservation : les plannings archivés plus anciens que RETENTION_MONTHS sont supprimés chaque jour. */
@Injectable()
export class RetentionService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger('Conservation');
  private timer?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  onApplicationBootstrap() {
    if (this.config.NODE_ENV === 'test') return;
    void this.purge();
    this.timer = setInterval(() => void this.purge(), 24 * 60 * 60 * 1000);
    this.timer.unref();
  }

  onApplicationShutdown() {
    if (this.timer) clearInterval(this.timer);
  }

  async purge(now = new Date()): Promise<number> {
    const limit = new Date(now);
    limit.setUTCMonth(limit.getUTCMonth() - this.config.RETENTION_MONTHS);
    const res = await this.prisma.mealPlan.deleteMany({ where: { archived: true, endDate: { lt: limit } } });
    if (res.count > 0) this.logger.log(`${res.count} planning(s) archivé(s) supprimé(s).`);
    return res.count;
  }
}
