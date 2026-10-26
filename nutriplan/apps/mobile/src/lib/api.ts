import { API_URL, isApiConfigured } from './config';
import { supabase } from './supabase';

/** Erreur d'API avec un message compréhensible, issu du serveur ou du client. */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function api<T>(path: string, options: { method?: Method; body?: unknown; auth?: boolean } = {}): Promise<T> {
  if (!isApiConfigured) throw new ApiError(0, 'NOT_CONFIGURED', "L'adresse du serveur NutriPlan n'est pas configurée (EXPO_PUBLIC_API_URL).");
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.auth !== false) {
    const token = (await supabase?.auth.getSession())?.data.session?.access_token;
    if (!token) throw new ApiError(401, 'UNAUTHENTICATED', 'Votre session a expiré. Veuillez vous reconnecter.');
    headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Impossible de joindre le serveur. Vérifiez votre connexion internet puis réessayez.');
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;
  if (!res.ok) {
    const body = (data ?? {}) as { error?: string; message?: string; details?: unknown };
    throw new ApiError(res.status, body.error ?? 'ERROR', body.message ?? 'La requête n’a pas pu aboutir.', body.details);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const details = error.details as { path: string; message: string }[] | undefined;
    if (error.code === 'VALIDATION_ERROR' && Array.isArray(details) && details[0]) return details[0].message;
    return error.message;
  }
  return 'Une erreur inattendue est survenue. Réessayez dans quelques instants.';
}
