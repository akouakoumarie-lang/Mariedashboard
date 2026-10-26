import { ArgumentsHost, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { z } from 'zod';
import { loadConfig } from '../config';
import { AllExceptionsFilter, AppError } from './errors';

function run(exception: unknown) {
  let status = 0;
  let body: any;
  const res = { status: (s: number) => ((status = s), { json: (b: unknown) => (body = b) }) };
  const host = { switchToHttp: () => ({ getResponse: () => res, getRequest: () => ({ method: 'GET', route: { path: '/x' } }) }) } as unknown as ArgumentsHost;
  new AllExceptionsFilter().catch(exception, host);
  return { status, body };
}

describe('Gestion centralisée des erreurs', () => {
  it('convertit une erreur de validation Zod en 400 détaillé', () => {
    const err = z.object({ age: z.number().min(15, 'Trop jeune.') }).safeParse({ age: 3 }).error!;
    expect(run(err)).toEqual({
      status: 400,
      body: { statusCode: 400, error: 'VALIDATION_ERROR', message: 'Certaines informations sont invalides.', details: [{ path: 'age', message: 'Trop jeune.' }] },
    });
  });

  it('conserve le code et le message des erreurs métier', () => {
    expect(run(new AppError(422, 'PLAN_GENERATION_FAILED', 'Impossible.', { suggestions: [] })).body).toEqual({
      statusCode: 422,
      error: 'PLAN_GENERATION_FAILED',
      message: 'Impossible.',
      details: { suggestions: [] },
    });
  });

  it('traduit les erreurs Prisma et HTTP sans exposer de détails internes', () => {
    const p2025 = new Prisma.PrismaClientKnownRequestError('Record not found', { code: 'P2025', clientVersion: 'test' });
    expect(run(p2025)).toMatchObject({ status: 404, body: { error: 'NOT_FOUND' } });
    expect(run(new NotFoundException('Cannot GET /secret')).body.message).toBe('Ressource introuvable.');
    const internal = run(new Error('mot de passe=1234'));
    expect(internal.status).toBe(500);
    expect(JSON.stringify(internal.body)).not.toContain('1234');
  });
});

describe('Configuration', () => {
  it('refuse une configuration incomplète avec un message explicite', () => {
    expect(() => loadConfig({})).toThrow(/DATABASE_URL/);
  });
  it('applique les valeurs par défaut sans secret codé en dur', () => {
    const c = loadConfig({ DATABASE_URL: 'postgresql://x', SUPABASE_URL: 'https://p.supabase.co' });
    expect(c.ANTHROPIC_API_KEY).toBe('');
    expect(c.SUPABASE_JWT_SECRET).toBe('');
    expect(c.PORT).toBe(3000);
  });
});
