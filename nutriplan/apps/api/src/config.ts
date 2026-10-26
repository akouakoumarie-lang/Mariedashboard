import { z } from 'zod';

/** Configuration lue depuis l'environnement et validée au démarrage. Aucun secret n'est codé en dur. */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL est obligatoire.'),
  CORS_ORIGINS: z.string().default(''),
  SUPABASE_URL: z.url('SUPABASE_URL doit être une URL.'),
  SUPABASE_JWT_SECRET: z.string().default(''),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(''),
  ANTHROPIC_API_KEY: z.string().default(''),
  AI_MODEL: z.string().default('claude-opus-5-5'),
  /** Durée de conservation des plannings archivés, en mois. */
  RETENTION_MONTHS: z.coerce.number().int().min(1).default(12),
});

export type AppConfig = z.infer<typeof envSchema>;

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const parsed = envSchema.safeParse(env);
  if (!parsed.success) {
    const details = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Configuration invalide :\n${details}`);
  }
  return parsed.data;
}

export const APP_CONFIG = Symbol('APP_CONFIG');
