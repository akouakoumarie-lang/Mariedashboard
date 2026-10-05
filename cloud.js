// Synchronisation entre appareils via Supabase (compte gratuit).
// Client minimal sans dépendance : authentification email + mot de passe
// et une ligne JSON par utilisateur dans la table `dashboards`.
// Règle de fusion : la version modifiée le plus récemment l'emporte.

import { CLOUD_DEFAULTS } from './config.js';

const META_KEY = 'marie-dashboard:v1:cloud';
const TABLE = 'dashboards';
const PUSH_DELAY = 1500;

let hooks = null;
let status = { state: 'off', message: '' };
let busy = false;
let pushTimer = null;
let listening = false;

/* ---------- Stockage local de la configuration et de la session ---------- */

function readMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY)) || {};
  } catch {
    return {};
  }
}

function writeMeta(patch) {
  const meta = { ...readMeta(), ...patch };
  for (const k of Object.keys(meta)) if (meta[k] === undefined) delete meta[k];
  try {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {}
  return meta;
}

export function cloudConfig() {
  const m = readMeta();
  return {
    url: (m.url || CLOUD_DEFAULTS.url || '').replace(/\/+$/, ''),
    anonKey: m.anonKey || CLOUD_DEFAULTS.anonKey || '',
  };
}

const isConfigured = () => {
  const c = cloudConfig();
  return !!(c.url && c.anonKey);
};
const session = () => readMeta().session || null;

export function cloudStatus() {
  return { ...status, configured: isConfigured(), email: session()?.user?.email || '' };
}

function setStatus(state, message = '') {
  status = { state, message };
  hooks?.onStatus?.(cloudStatus());
}

/* ---------- Appels HTTP ---------- */

function explain(err) {
  const raw = `${err?.message || ''} ${err?.code || ''} ${err?.error_code || ''}`.toLowerCase();
  if (raw.includes('invalid login') || raw.includes('invalid_credentials')) return 'Email ou mot de passe incorrect.';
  if (raw.includes('not confirmed') || raw.includes('email_not_confirmed')) return 'Confirme ton adresse email (lien reçu par mail), puis reconnecte-toi.';
  if (raw.includes('already registered') || raw.includes('user_already_exists')) return 'Ce compte existe déjà : utilise « Se connecter ».';
  if (raw.includes('password') && raw.includes('6')) return 'Le mot de passe doit faire au moins 6 caractères.';
  if (raw.includes('42p01') || raw.includes('pgrst205') || raw.includes('does not exist')) return 'La table « dashboards » n’existe pas : exécute le script SQL dans Supabase.';
  if (raw.includes('invalid api key') || raw.includes('no api key')) return 'Clé Supabase invalide : vérifie la configuration.';
  if (raw.includes('failed to fetch') || raw.includes('networkerror') || raw.includes('load failed')) return 'Pas de connexion (ou adresse Supabase incorrecte).';
  return err?.message || 'Erreur inconnue';
}

async function request(path, { method = 'GET', body, auth = false, headers = {} } = {}) {
  const { url, anonKey } = cloudConfig();
  const h = { apikey: anonKey, 'Content-Type': 'application/json', ...headers };
  if (auth) h.Authorization = `Bearer ${session()?.access_token}`;
  const res = await fetch(url + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    const e = new Error(data?.msg || data?.message || data?.error_description || data?.error || `HTTP ${res.status}`);
    e.status = res.status;
    e.code = data?.code;
    e.error_code = data?.error_code;
    throw e;
  }
  return data;
}

function storeSession(data) {
  const expiresAt = data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600);
  writeMeta({ session: { access_token: data.access_token, refresh_token: data.refresh_token, expires_at: expiresAt, user: { id: data.user?.id, email: data.user?.email } } });
}

async function refreshIfNeeded(force = false) {
  const s = session();
  if (!s) throw new Error('not signed in');
  if (!force && s.expires_at * 1000 > Date.now() + 60_000) return;
  try {
    const data = await request('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: s.refresh_token } });
    storeSession(data);
  } catch (e) {
    if (e.status === 400 || e.status === 401) {
      writeMeta({ session: undefined });
      setStatus('signed-out', 'Session expirée : reconnecte-toi.');
    }
    throw e;
  }
}

// Requête authentifiée, avec un nouvel essai après rafraîchissement du jeton.
async function authed(path, opts) {
  await refreshIfNeeded();
  try {
    return await request(path, { ...opts, auth: true });
  } catch (e) {
    if (e.status !== 401) throw e;
    await refreshIfNeeded(true);
    return request(path, { ...opts, auth: true });
  }
}

/* ---------- Synchronisation ---------- */

async function fetchRemote() {
  const uid = session().user.id;
  const rows = await authed(`/rest/v1/${TABLE}?select=data,updated_at&user_id=eq.${encodeURIComponent(uid)}`);
  return rows?.[0] || null;
}

async function push() {
  const s = hooks.getState();
  await authed(`/rest/v1/${TABLE}`, {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: { user_id: session().user.id, data: s, updated_at: new Date(s.updatedAt || Date.now()).toISOString() },
  });
  writeMeta({ syncedUser: session().user.id });
}

export async function sync() {
  if (!isConfigured() || !session()) return;
  if (busy) {
    schedulePush();
    return;
  }
  busy = true;
  clearTimeout(pushTimer);
  setStatus('syncing');
  try {
    const local = hooks.getState();
    const row = await fetchRemote();
    const remoteAt = row?.data?.updatedAt || 0;
    const localAt = local.updatedAt || 0;
    // Premier passage sur cet appareil : la version en ligne fait foi.
    const firstTime = readMeta().syncedUser !== session().user.id;
    if (row && (firstTime || remoteAt > localAt)) {
      hooks.replaceState(row.data);
      writeMeta({ syncedUser: session().user.id });
      setStatus('ok', firstTime ? 'Données récupérées depuis le cloud' : '');
    } else if (!row || localAt > remoteAt) {
      await push();
      setStatus('ok');
    } else {
      setStatus('ok');
    }
  } catch (e) {
    if (session()) setStatus('error', explain(e));
  } finally {
    busy = false;
  }
}

// Appelé à chaque modification : envoie les changements après une courte pause.
export function schedulePush() {
  if (!isConfigured() || !session()) return;
  clearTimeout(pushTimer);
  setStatus('pending');
  pushTimer = setTimeout(sync, PUSH_DELAY);
}

/* ---------- Compte ---------- */

export async function signIn(email, password) {
  try {
    storeSession(await request('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }));
  } catch (e) {
    throw new Error(explain(e));
  }
  await sync();
}

// Renvoie 'ok' si la connexion est immédiate, 'confirm' si Supabase attend la confirmation de l'email.
export async function signUp(email, password) {
  let data;
  try {
    data = await request('/auth/v1/signup', { method: 'POST', body: { email, password } });
  } catch (e) {
    throw new Error(explain(e));
  }
  if (!data?.access_token) return 'confirm';
  storeSession(data);
  await sync();
  return 'ok';
}

export async function signOut() {
  clearTimeout(pushTimer);
  try {
    await request('/auth/v1/logout', { method: 'POST', auth: true });
  } catch {}
  writeMeta({ session: undefined, syncedUser: undefined });
  setStatus('signed-out');
}

export function saveConfig(url, anonKey) {
  writeMeta({ url: url.trim(), anonKey: anonKey.trim(), session: undefined, syncedUser: undefined });
  setStatus(isConfigured() ? 'signed-out' : 'off');
}

export function initCloud(h) {
  hooks = h;
  if (!listening) {
    listening = true;
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') sync();
    });
    window.addEventListener('online', () => sync());
  }
  if (!isConfigured()) setStatus('off');
  else if (!session()) setStatus('signed-out');
  else sync();
}

/* ---------- Notifications push ---------- */

function explainPush(e, what) {
  const code = String(e.code || '').toUpperCase();
  if (what === 'function' && e.status === 404) return 'La fonction « notify » n’est pas encore déployée dans Supabase.';
  if (what === 'table' && (code === 'PGRST205' || code === '42P01' || /push_subscriptions/.test(e.message || ''))) return 'Les tables de notifications n’existent pas : exécute supabase/notifications.sql.';
  return explain(e);
}

async function pushCall(fn, what) {
  if (!isConfigured() || !session()) throw new Error('Active d’abord la synchronisation.');
  try {
    return await fn();
  } catch (e) {
    throw new Error(explainPush(e, what));
  }
}

export const savePushSubscription = (subscription, timezone, device) =>
  pushCall(() =>
    authed('/rest/v1/push_subscriptions', {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: { endpoint: subscription.endpoint, user_id: session().user.id, subscription, timezone, device },
    }),
    'table',
  );

export const removePushSubscription = (endpoint) =>
  pushCall(() => authed(`/rest/v1/push_subscriptions?endpoint=eq.${encodeURIComponent(endpoint)}`, { method: 'DELETE' }), 'table');

export const sendTestPush = () => pushCall(() => authed('/functions/v1/notify', { method: 'POST', body: { test: true } }), 'function');
