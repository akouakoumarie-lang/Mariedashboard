import { execSync } from 'node:child_process';
import type { INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { SignJWT } from 'jose';
import { randomUUID } from 'node:crypto';
import { seedCatalog } from '../prisma/seed';

/**
 * Environnement de test : base PostgreSQL dédiée (TEST_DATABASE_URL), jetons signés
 * avec un secret HS256 de test — exactement le mécanisme de vérification utilisé en production
 * pour les projets Supabase à secret JWT. Aucune authentification n'est simulée.
 */
export const TEST_SECRET = 'test-secret-for-e2e-only-0123456789abcdef';
export const TEST_SUPABASE_URL = 'http://localhost:54321';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? 'postgresql://nutriplan:nutriplan@localhost:5432/nutriplan_test?schema=public';
process.env.SUPABASE_URL = TEST_SUPABASE_URL;
process.env.SUPABASE_JWT_SECRET = TEST_SECRET;
process.env.SUPABASE_SERVICE_ROLE_KEY = '';
process.env.ANTHROPIC_API_KEY = '';

/** Applique les migrations puis vide les données utilisateur. Refuse toute base qui n'est pas une base de test. */
export async function resetDatabase(): Promise<PrismaClient> {
  const dbName = new URL(process.env.DATABASE_URL!).pathname.slice(1);
  if (!dbName.endsWith('_test')) throw new Error(`Refus : la base « ${dbName} » n'est pas une base de test (suffixe _test attendu).`);
  execSync('npx prisma migrate deploy', { stdio: 'ignore', env: process.env });
  const prisma = new PrismaClient();
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE');
  await seedCatalog(prisma);
  return prisma;
}

export async function bootApp(): Promise<INestApplication> {
  const { createApp } = await import('../src/main');
  const { app } = await createApp();
  await app.init();
  return app;
}

export interface TestUser {
  id: string;
  email: string;
  token: string;
}

export async function makeUser(overrides: { role?: string; expiresIn?: string; secret?: string; issuer?: string } = {}): Promise<TestUser> {
  const id = randomUUID();
  const email = `test-${id.slice(0, 8)}@exemple.fr`;
  const token = await new SignJWT({ email, role: overrides.role ?? 'authenticated' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(id)
    .setAudience('authenticated')
    .setIssuer(overrides.issuer ?? `${TEST_SUPABASE_URL}/auth/v1`)
    .setIssuedAt()
    .setExpirationTime(overrides.expiresIn ?? '1h')
    .sign(new TextEncoder().encode(overrides.secret ?? TEST_SECRET));
  return { id, email, token };
}

export const PROFILE = {
  displayName: 'Camille',
  age: 34,
  sex: 'non_precise',
  heightCm: 168,
  weightKg: 64,
  activityLevel: 'modere',
  goal: 'equilibre',
  householdSize: 2,
  weeklyBudgetCents: 8000,
  mealsPerDay: 2,
  planningDays: 7,
  cookingTimePreference: 60,
  equipment: ['plaques', 'four', 'micro_ondes', 'mixeur'],
  diets: [],
};
