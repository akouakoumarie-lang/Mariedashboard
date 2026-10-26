import { CanActivate, createParamDecorator, ExecutionContext, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppError } from '../common/errors';
import { AuthService, type AuthUser } from './auth.service';

const IS_PUBLIC = 'isPublic';
/** Marque une route comme accessible sans authentification. Toutes les autres sont protégées. */
export const Public = () => SetMetadata(IS_PUBLIC, true);

type AuthedRequest = Request & { user?: AuthUser };

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly auth: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, [context.getHandler(), context.getClass()])) return true;
    const req = context.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHENTICATED', 'Vous devez être connecté·e pour accéder à cette ressource.');
    }
    req.user = await this.auth.verify(header.slice('Bearer '.length).trim());
    return true;
  }
}

/** Utilisateur authentifié de la requête (issu du jeton vérifié, jamais du corps de la requête). */
export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest<AuthedRequest>().user!;
});
