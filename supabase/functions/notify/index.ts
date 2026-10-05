// Marie Dashboard — notifications push (Supabase Edge Function « notify »).
//
// Appelée toutes les 5 minutes par pg_cron (voir supabase/notifications.sql) :
//  - résumé du matin à l'heure choisie (tâches, paiements, budget, salaire) ;
//  - rappel avant chaque tâche ou routine qui a une heure.
// Appelée depuis l'app avec { "test": true } : envoie une notification de test.
//
// Secrets à définir dans Supabase (Edge Functions → Secrets) :
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT (ex. mailto:toi@exemple.com), CRON_SECRET
// SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont fournis automatiquement.

// deno-lint-ignore-file no-explicit-any
import webpushLib from 'npm:web-push@3.6.7';

type Env = Record<string, string | undefined>;
type Push = { key: string; title: string; body: string; url: string };

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/* ---------- Dates dans le fuseau de l'utilisatrice ---------- */

const pad = (n: number) => String(n).padStart(2, '0');

export function localNow(now: Date, timeZone: string) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const date = `${parts.year}-${parts.month}-${parts.day}`;
  const dow = new Date(Date.UTC(+parts.year, +parts.month - 1, +parts.day)).getUTCDay();
  return { date, minutes: +parts.hour * 60 + +parts.minute, dow };
}

const toMinutes = (t: string) => {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
};
const lastDay = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
function dateInMonth(day: number, ym: string) {
  const [y, m] = ym.split('-').map(Number);
  return `${ym}-${pad(Math.min(day, lastDay(y, m)))}`;
}
function addMonths(ym: string, n: number) {
  const [y, m] = ym.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}
const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
const eur = (n: number) => `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Math.round(n))} €`;
const sum = (arr: any[], f: (x: any) => number) => arr.reduce((a, x) => a + (Number(f(x)) || 0), 0);
const fmtTime = (t: string) => t.replace(':', 'h').replace(/h00$/, 'h');

/* ---------- Ce qu'il faut envoyer maintenant ---------- */

export const DEFAULT_PREFS = { morning: '08:00', reminders: true, before: 15 };

export function planNotifications(data: any, timeZone: string, now: Date): Push[] {
  const prefs = { ...DEFAULT_PREFS, ...(data?.settings?.push?.prefs || {}) };
  const { date, minutes, dow } = localNow(now, timeZone);
  const ym = date.slice(0, 7);
  const items: any[] = data?.items || [];
  const routines: any[] = data?.routines || [];
  const money = data?.money || {};
  const prayer = data?.prayer || {};
  const out: Push[] = [];
  // Neuvaines en cours aujourd'hui et pas encore priées.
  const novenas = (prayer.novenas || [])
    .map((n: any) => ({ n, day: daysBetween(n.start, date) + 1 }))
    .filter(({ n, day }: any) => day >= 1 && day <= (n.days || 9) && !n.done?.[day]);

  // Résumé du matin (fenêtre d'une heure pour tolérer un retard du planificateur).
  if (prefs.morning) {
    const start = toMinutes(prefs.morning);
    if (minutes >= start && minutes < start + 60) {
      const due = items.filter((i) => !i.done && i.date && i.date <= date);
      const todayRoutines = routines.filter((r) => (r.days || []).includes(dow));
      const bills = (money.bills || [])
        .map((b: any) => {
          const m = (b.paid || []).includes(ym) ? addMonths(ym, 1) : ym;
          return { b, d: dateInMonth(b.day, m) };
        })
        .filter((x: any) => daysBetween(date, x.d) <= 3)
        .sort((a: any, c: any) => a.d.localeCompare(c.d));
      const carry = Number(money.carry?.[ym]) || 0;
      const income =
        sum((money.recurringIncomes || []).filter((i: any) => (i.received || []).includes(ym)), (i) => i.amount) +
        sum((money.extraIncomes || []).filter((i: any) => i.received && (i.date || '').startsWith(ym)), (i) => i.amount);
      const remaining = carry + income - sum(money.bills || [], (b) => b.amount) - sum((money.expenses || []).filter((e: any) => (e.date || '').startsWith(ym)), (e) => e.amount);
      const salaries = (money.recurringIncomes || []).filter((i: any) => i.kind === 'salaire');
      const nextSalary = salaries
        .map((s: any) => dateInMonth(s.day, (s.received || []).includes(ym) ? addMonths(ym, 1) : ym))
        .sort()[0];

      const line1 = [
        due.length ? `${due.length} chose${due.length > 1 ? 's' : ''} à faire` : 'Rien d’urgent ✨',
        bills.length ? `${bills.length} paiement${bills.length > 1 ? 's' : ''} (${bills[0].b.label} ${eur(bills[0].b.amount)})` : '',
        ...todayRoutines.map((r) => `${r.label}${r.time ? ` ${fmtTime(r.time)}` : ''}`),
        ...novenas.map(({ n, day }: any) => `🙏 Neuvaine jour ${day}/${n.days || 9}`),
      ].filter(Boolean);
      const line2 = [`Budget : ${eur(remaining)}`, nextSalary ? `Salaire ${daysBetween(date, nextSalary) <= 0 ? "aujourd'hui 🎉" : `dans ${daysBetween(date, nextSalary)} j`}` : ''].filter(Boolean);
      out.push({
        key: `morning:${date}`,
        title: `☀️ Bonjour ${data?.settings?.name || 'Marie'}`,
        body: `${line1.join(' · ')}\n${line2.join(' · ')}`,
        url: './#/accueil',
      });
    }
  }

  // Rappels avant les tâches et routines qui ont une heure.
  if (prefs.reminders) {
    const before = Number(prefs.before) || 0;
    const inWindow = (time: string) => {
      const at = toMinutes(time);
      return minutes >= at - before && minutes <= at + 5;
    };
    for (const i of items) {
      if (i.done || i.date !== date || !i.time || !inWindow(i.time)) continue;
      out.push({ key: `item:${i.id}:${date}`, title: `⏰ ${fmtTime(i.time)} · ${i.title}`, body: before ? `Dans ${before} min ✦` : 'C’est l’heure ✦', url: './#/taches' });
    }
    for (const r of routines) {
      if (!(r.days || []).includes(dow) || !r.time || r.log?.[date] || !inWindow(r.time)) continue;
      out.push({ key: `routine:${r.id}:${date}`, title: `${r.emoji || '✨'} ${r.label} à ${fmtTime(r.time)}`, body: 'Tu vas tout déchirer 💪', url: './#/accueil' });
    }
    for (const { n, day } of novenas) {
      if (!n.time || !inWindow(n.time)) continue;
      out.push({ key: `novena:${n.id}:${date}`, title: `🙏 ${n.name}`, body: `Jour ${day}/${n.days || 9}${n.intention ? ` · ${n.intention}` : ''}`, url: './#/priere' });
    }
    const rosary = prayer.rosary || {};
    if (rosary.daily && rosary.time && !rosary.log?.[date] && inWindow(rosary.time)) {
      out.push({ key: `rosary:${date}`, title: '📿 L’heure du chapelet', body: 'Un moment de paix avec Marie ✨', url: './#/chapelet' });
    }
  }
  return out;
}

/* ---------- Serveur ---------- */

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, 'Content-Type': 'application/json' } });

export async function handle(req: Request, env: Env, deps: { webpush?: any; fetch?: typeof fetch; now?: Date } = {}) {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  const doFetch = deps.fetch || fetch;
  const base = env.SUPABASE_URL!;
  const service = env.SUPABASE_SERVICE_ROLE_KEY!;
  const rest = (path: string, init: RequestInit = {}) =>
    doFetch(`${base}/rest/v1/${path}`, { ...init, headers: { apikey: service, Authorization: `Bearer ${service}`, 'Content-Type': 'application/json', ...(init.headers || {}) } });

  for (const k of ['VAPID_PUBLIC_KEY', 'VAPID_PRIVATE_KEY', 'VAPID_SUBJECT', 'CRON_SECRET']) {
    if (!env[k]) return json({ error: `Secret manquant : ${k}` }, 500);
  }

  const auth = req.headers.get('Authorization') || '';
  const body = await req.json().catch(() => ({}));
  let onlyUser: string | null = null;
  const isTest = !!body?.test;
  if (auth === `Bearer ${env.CRON_SECRET}` && !isTest) {
    // Passage planifié : tout le monde.
  } else if (isTest) {
    const r = await doFetch(`${base}/auth/v1/user`, { headers: { apikey: service, Authorization: auth } });
    if (!r.ok) return json({ error: 'Non connectée' }, 401);
    onlyUser = (await r.json()).id;
  } else {
    return json({ error: 'Accès refusé' }, 401);
  }

  const webpush = deps.webpush || webpushLib;
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);

  const subsRes = await rest(`push_subscriptions?select=*${onlyUser ? `&user_id=eq.${onlyUser}` : ''}`);
  if (!subsRes.ok) return json({ error: `push_subscriptions : ${await subsRes.text()}` }, 500);
  const subs: any[] = await subsRes.json();
  const users = [...new Set(subs.map((s) => s.user_id))];
  if (!users.length) return json({ sent: 0, info: 'Aucun appareil abonné' });

  const dashRes = await rest(`dashboards?select=user_id,data&user_id=in.(${users.join(',')})`);
  const dashboards: any[] = dashRes.ok ? await dashRes.json() : [];
  const now = deps.now || new Date();
  let sent = 0;
  const errors: string[] = [];

  for (const user of users) {
    const data = dashboards.find((d) => d.user_id === user)?.data;
    const devices = subs.filter((s) => s.user_id === user);
    const tz = devices[0]?.timezone || 'Europe/Paris';
    const pushes: Push[] = isTest
      ? [{ key: '', title: '✦ Marie Dashboard', body: 'Les notifications fonctionnent 💖', url: './#/accueil' }]
      : planNotifications(data, tz, now);

    for (const p of pushes) {
      if (!isTest) {
        // Anti-doublon : une seule fois par clé.
        const ins = await rest('notifications_sent', {
          method: 'POST',
          headers: { Prefer: 'resolution=ignore-duplicates,return=representation' },
          body: JSON.stringify({ user_id: user, key: p.key }),
        });
        const rows = ins.ok ? await ins.json() : [];
        if (!rows.length) continue;
      }
      for (const d of devices) {
        try {
          await webpush.sendNotification(d.subscription, JSON.stringify({ title: p.title, body: p.body, url: p.url, tag: p.key || 'test' }), { TTL: 3600 });
          sent++;
        } catch (e: any) {
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await rest(`push_subscriptions?endpoint=eq.${encodeURIComponent(d.endpoint)}`, { method: 'DELETE' });
          } else errors.push(String(e?.body || e?.message || e));
        }
      }
    }
  }
  return json({ sent, errors });
}

// Point d'entrée Supabase (Deno). Ignoré quand le fichier est importé par les tests.
const D = (globalThis as any).Deno;
if (D?.serve) D.serve((req: Request) => handle(req, D.env.toObject()));
