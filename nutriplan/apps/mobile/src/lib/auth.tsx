import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { queryClient } from './queries';
import { supabase } from './supabase';

interface AuthState {
  session: Session | null;
  /** Vrai tant que la session persistée n'a pas été lue. */
  initializing: boolean;
  configured: boolean;
  signIn(email: string, password: string): Promise<void>;
  /** Renvoie `needsConfirmation` si Supabase exige la confirmation de l'adresse e-mail. */
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>;
  resetPassword(email: string): Promise<void>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/** Traduction des erreurs Supabase Auth les plus courantes. */
function authMessage(error: { message?: string; code?: string } | null): string {
  const code = error?.code ?? '';
  if (code === 'invalid_credentials') return 'Adresse e-mail ou mot de passe incorrect.';
  if (code === 'email_not_confirmed') return 'Confirmez votre adresse e-mail grâce au lien reçu, puis connectez-vous.';
  if (code === 'user_already_exists') return 'Un compte existe déjà avec cette adresse e-mail.';
  if (code === 'weak_password') return 'Mot de passe trop faible : utilisez au moins 8 caractères.';
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit') return 'Trop de tentatives. Patientez quelques minutes.';
  return 'La connexion n’a pas pu aboutir. Vérifiez votre connexion internet et réessayez.';
}

export class AuthError extends Error {}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [initializing, setInitializing] = useState(!!supabase);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .finally(() => setInitializing(false));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      session,
      initializing,
      configured: !!supabase,
      async signIn(email, password) {
        if (!supabase) throw new AuthError("L'authentification n'est pas configurée.");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new AuthError(authMessage(error));
      },
      async signUp(email, password) {
        if (!supabase) throw new AuthError("L'authentification n'est pas configurée.");
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw new AuthError(authMessage(error));
        return { needsConfirmation: !data.session };
      },
      async resetPassword(email) {
        if (!supabase) throw new AuthError("L'authentification n'est pas configurée.");
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw new AuthError(authMessage(error));
      },
      async signOut() {
        await supabase?.auth.signOut();
        queryClient.clear();
      },
    }),
    [session, initializing],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider.');
  return ctx;
}
