/** Configuration publique (variables EXPO_PUBLIC_*). Aucun secret côté application. */
export const APP_NAME = process.env.EXPO_PUBLIC_APP_NAME || 'NutriPlan';
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/$/, '');
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/** Version web autonome : pas de serveur ni de compte, les règles tournent dans le navigateur. */
export const LOCAL_MODE = process.env.EXPO_PUBLIC_DATA_MODE === 'local';

export const isApiConfigured = LOCAL_MODE || API_URL.length > 0;
export const isAuthConfigured = SUPABASE_URL.startsWith('https://') && SUPABASE_ANON_KEY.length > 0 && !SUPABASE_URL.includes('VOTRE-PROJET');
