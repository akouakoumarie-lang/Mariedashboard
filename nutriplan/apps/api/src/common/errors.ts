import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Request, Response } from 'express';
import { ZodError } from 'zod';

/** Format unique des erreurs renvoyées par l'API. */
export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string;
  details?: unknown;
}

/** Erreur métier avec un code stable et un message compréhensible par l'utilisateur. */
export class AppError extends HttpException {
  constructor(status: number, code: string, message: string, details?: unknown) {
    super({ statusCode: status, error: code, message, details } satisfies ApiErrorBody, status);
  }
}

export const notFound = (what = 'Ressource') => new AppError(404, 'NOT_FOUND', `${what} introuvable.`);

const DEFAULT_MESSAGES: Record<number, string> = {
  400: 'La requête est invalide.',
  401: 'Vous devez être connecté·e pour accéder à cette ressource.',
  403: "Vous n'avez pas accès à cette ressource.",
  404: 'Ressource introuvable.',
  409: 'Cette ressource existe déjà.',
  429: 'Trop de requêtes. Patientez quelques instants avant de réessayer.',
};

/**
 * Gestion centralisée des erreurs. Les journaux ne contiennent ni corps de requête
 * ni données personnelles : seulement la méthode, la route et le code d'erreur.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Erreurs');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const body = this.toBody(exception);
    if (body.statusCode >= 500) {
      const name = exception instanceof Error ? exception.name : 'Inconnue';
      this.logger.error(`${req.method} ${req.route?.path ?? 'route inconnue'} → ${body.statusCode} (${name})`, exception instanceof Error ? exception.stack : undefined);
    }
    res.status(body.statusCode).json(body);
  }

  private toBody(exception: unknown): ApiErrorBody {
    if (exception instanceof ZodError) {
      return {
        statusCode: 400,
        error: 'VALIDATION_ERROR',
        message: 'Certaines informations sont invalides.',
        details: exception.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      };
    }
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2025') return { statusCode: 404, error: 'NOT_FOUND', message: DEFAULT_MESSAGES[404]! };
      if (exception.code === 'P2002') return { statusCode: 409, error: 'CONFLICT', message: DEFAULT_MESSAGES[409]! };
      if (exception.code === 'P2003') return { statusCode: 400, error: 'INVALID_REFERENCE', message: 'Un élément référencé est introuvable.' };
    }
    if (exception instanceof AppError) return exception.getResponse() as ApiErrorBody;
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      return { statusCode: status, error: HttpStatus[status] ?? 'ERROR', message: DEFAULT_MESSAGES[status] ?? 'La requête n’a pas pu aboutir.' };
    }
    return { statusCode: 500, error: 'INTERNAL_ERROR', message: 'Une erreur inattendue est survenue. Réessayez dans quelques instants.' };
  }
}
