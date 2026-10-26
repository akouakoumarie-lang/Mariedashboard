import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

/** Journal d'accès minimal : pas d'adresse IP, pas d'identifiant utilisateur, pas de corps de requête. */
@Injectable()
export class RequestLogger implements NestMiddleware {
  private readonly logger = new Logger('HTTP');
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    res.on('finish', () => {
      // On remplace les identifiants (UUID) dans le chemin pour éviter de tracer des ressources personnelles.
      const path = req.originalUrl.split('?')[0]!.replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, ':id');
      if (process.env.NODE_ENV !== 'test') this.logger.log(`${req.method} ${path} ${res.statusCode} ${Date.now() - start} ms`);
    });
    next();
  }
}
