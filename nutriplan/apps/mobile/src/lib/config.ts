/** Configuration publique (variables EXPO_PUBLIC_*). Aucun secret côté application. */
export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'NutriPlan';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isApiConfigured = API_URL.length > 0;
export const isAuthConfigured = SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 0 && !SUPABASE_URL.includes('VOTRE-PROJET');
