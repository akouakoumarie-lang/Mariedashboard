import { Inject, Injectable } from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { APP_CONFIG, type AppConfig } from '../config';
import { AppError } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';

export interface AuthUser {
  id: string;
  email: string | null;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Vérifie les jetons d'accès émis par Supabase Auth, conformément à la documentation Supabase :
 *  - projets à clés de signature asymétriques : vérification via le JWKS public du projet ;
 *  - projets au secret JWT historique (HS256) : vérification avec SUPABASE_JWT_SECRET.
 * Contrôles : signature, expiration, émetteur, audience « authenticated », sujet UUID.
 */
@Injectable()
export class AuthService {
  private readonly issuer: string;
  private readonly jwks?: ReturnType<typeof createRemoteJWKSet>;
  private readonly secret?: Uint8Array;

  constructor(
    @Inject(APP_CONFIG) config: AppConfig,
    private readonly prisma: PrismaService,
  ) {
    const base = config.SUPABASE_URL.replace(/\/$/, '');
    this.issuer = `${base}/auth/v1`;
    if (config.SUPABASE_JWT_SECRET) this.secret = new TextEncoder().encode(config.SUPABASE_JWT_SECRET);
    else this.jwks = createRemoteJWKSet(new URL(`${this.issuer}/.well-known/jwks.json`));
  }

  async verify(token: string): Promise<AuthUser> {
    let payload: JWTPayload;
    try {
      const options = { issuer: this.issuer, audience: 'authenticated' };
      payload = this.secret
        ? (await jwtVerify(token, this.secret, { ...options, algorithms: ['HS256'] })).payload
        : (await jwtVerify(token, this.jwks!, options)).payload;
    } catch {
      throw new AppError(401, 'INVALID_TOKEN', 'Session invalide ou expirée. Veuillez vous reconnecter.');
    }
    if (typeof payload.sub !== 'string' || !UUID.test(payload.sub) || payload.role !== 'authenticated') {
      throw new AppError(401, 'INVALID_TOKEN', 'Session invalide ou expirée. Veuillez vous reconnecter.');
    }
    const email = typeof payload.email === 'string' ? payload.email : null;
    // Le compte applicatif est créé à la première requête authentifiée.
    await this.prisma.user.upsert({ where: { id: payload.sub }, create: { id: payload.sub, email }, update: { email } });
    return { id: payload.sub, email };
  }
}
