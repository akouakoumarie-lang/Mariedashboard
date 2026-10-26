import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { isAuthConfigured, SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/**
 * Client Supabase Auth configuré selon la documentation Supabase pour Expo :
 * session persistée (AsyncStorage), rafraîchissement automatique au premier plan.
 * null si le projet n'est pas configuré : l'application l'indique au lieu de simuler une connexion.
 */
export const supabase: SupabaseClient | null = isAuthConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { storage: AsyncStorage, autoRefreshToken: true, persistSession: true, detectSessionInUrl: false },
    })
  : null;

if (supabase && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
