// Marie Dashboard — « My life, organized. »
// Application personnelle : les données sont stockées dans le navigateur
// (localStorage) et peuvent être synchronisées via Supabase (cloud.js).

import { initCloud, cloudStatus, cloudConfig, schedulePush, sync, signIn, signUp, signOut, saveConfig, sendTestPush } from './cloud.js';
import { pushSupport, registerSW, currentSubscription, enablePush, disablePush, generateKeys } from './push.js';
import { PRAYERS, MYSTERIES, MYSTERY_OF_DAY, rosarySteps, NOVENA_TEMPLATES } from './prayer-data.js';
import { mountMap, unmountMap, geocode, reverseGeocode, flagOf } from './map.js';
import { RECIPE_CATEGORIES, RECIPE_TAGS, MEALS, SAMPLE_RECIPES } from './recipes-data.js';
import { TOEIC_PARTS, TOEIC_LEVELS, VOCAB_THEMES, VOCAB, GRAMMAR, QUESTIONS } from './toeic-data.js';

const STORAGE_KEY = 'marie-dashboard:v1';

/* ============================================================
   Utilitaires
   ============================================================ */

const $ = (sel, root = document) => root.querySelector(sel);
const uid = () => Math.random().toString(36).slice(2, 10);
const pad = (n) => String(n).padStart(2, '0');
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const todayISO = () => iso(new Date());
const monthKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
const parseISO = (s) => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};
const addDays = (s, n) => {
  const d = parseISO(s);
  d.setDate(d.getDate() + n);
  return iso(d);
};
const daysBetween = (a, b) => Math.round((parseISO(b) - parseISO(a)) / 86400000);
const lastDayOfMonth = (y, m) => new Date(y, m + 1, 0).getDate();
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

function dateInMonth(day, ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${y}-${pad(m)}-${pad(Math.min(day, lastDayOfMonth(y, m - 1)))}`;
}
function shiftMonth(ym, n) {
  const [y, m] = ym.split('-').map(Number);
  return monthKey(new Date(y, m - 1 + n, 1));
}
// Prochaine date (cette année ou la suivante) pour un mois/jour donné.
function nextDate(month, day) {
  const now = new Date();
  let d = new Date(now.getFullYear(), month - 1, day);
  if (iso(d) < todayISO()) d = new Date(now.getFullYear() + 1, month - 1, day);
  return iso(d);
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const eurFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
const eur = (n) => eurFmt.format(Math.round((Number(n) || 0) * 100) / 100);
const sum = (arr, f = (x) => x) => arr.reduce((acc, x) => acc + (Number(f(x)) || 0), 0);
const plural = (n, one, many = `${one}s`) => `${n} ${n > 1 ? many : one}`;

const fmtLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const fmtLongNoYear = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const fmtShort = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const fmtWeekday = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const fmtMonth = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const fmtMonthShort = new Intl.DateTimeFormat('fr-FR', { month: 'short', year: 'numeric' });
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const fmtDate = (s) => (s ? fmtShort.format(parseISO(s)) : '');
const fmtDayMonth = (s) => (s ? `${parseISO(s).getDate()}/${pad(parseISO(s).getMonth() + 1)}` : '');

// Libellé court d'une date : « Aujourd'hui », « Demain », « Jeu. 9 oct. », « 12 nov. »
function dayLabel(s) {
  const d = daysBetween(todayISO(), s);
  if (d === 0) return "Aujourd'hui";
  if (d === 1) return 'Demain';
  if (d === -1) return 'Hier';
  if (d > 1 && d < 7) return cap(fmtWeekday.format(parseISO(s)));
  return fmtDate(s);
}
function inDays(n) {
  if (n === 0) return "aujourd'hui";
  if (n === 1) return 'demain';
  if (n < 0) return `en retard de ${-n} j`;
  return `dans ${n} jours`;
}
const fmtTime = (t) => (t ? t.replace(':', 'h').replace(/h00$/, 'h') : '');

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const icon = (name, cls = '') => `<svg class="i ${cls}"><use href="#i-${name}"/></svg>`;

/* ============================================================
   Configuration
   ============================================================ */

const AREAS = {
  travail: {
    label: 'Pro',
    icon: 'briefcase',
    kinds: {
      tache: { label: 'Tâche pro', tag: 'Pro', emoji: '💼' },
      projet: { label: 'Projet', tag: 'Projet', emoji: '🧩', statuses: ['À démarrer', 'En cours', 'En pause', 'Terminé'] },
      candidature: { label: 'Candidature CDI', tag: 'Carrière', emoji: '📨', statuses: ['À envoyer', 'Envoyée', 'Relancée', 'Entretien', 'Offre', 'Refus'] },
      contact: { label: 'Entretien / échange', tag: 'Carrière', emoji: '☕' },
      opportunite: { label: 'Opportunité', tag: 'Carrière', emoji: '🎯', statuses: ['Repérée', 'À creuser', 'En discussion', 'Abandonnée'] },
      formation: { label: 'Formation', tag: 'Carrière', emoji: '📚', statuses: ['À faire', 'En cours', 'Terminée'] },
      competence: { label: 'Compétence', tag: 'Carrière', emoji: '🌱', statuses: ['À développer', 'En progrès', 'Acquise'] },
    },
  },
  ecole: {
    label: 'École',
    icon: 'school',
    kinds: {
      devoir: { label: 'Devoir / rendu', tag: 'École', emoji: '📝' },
      examen: { label: 'Examen', tag: 'Examen', emoji: '🧪' },
      rattrapage: { label: 'Rattrapage', tag: 'École', emoji: '🔁' },
      echeance: { label: 'Échéance', tag: 'École', emoji: '⏳' },
      toeic: { label: 'TOEIC', tag: 'TOEIC', emoji: '🇬🇧' },
      cours: { label: 'Cours / projet', tag: 'Cours', emoji: '📖', statuses: ['En cours', 'À rendre', 'Terminé'] },
      document: { label: 'Document important', tag: 'Document', emoji: '📄' },
    },
  },
  quotidien: {
    label: 'Perso',
    icon: 'heart',
    kinds: {
      tache: { label: 'Tâche perso', tag: 'Perso', emoji: '🌸' },
      courses: { label: 'Courses', tag: 'Perso', emoji: '🛒' },
      demarche: { label: 'Démarche administrative', tag: 'Admin', emoji: '🗂️' },
      renouvellement: { label: 'Renouvellement de document', tag: 'Admin', emoji: '🪪' },
      rappel: { label: 'Rappel', tag: 'Perso', emoji: '🔔' },
    },
  },
};
const kindOf = (i) => AREAS[i.area]?.kinds[i.kind] || { label: i.kind, tag: AREAS[i.area]?.label || '', emoji: '•' };

const BILL_CATEGORIES = { loyer: 'Loyer', facture: 'Facture', abonnement: 'Abonnement', credit: 'Crédit', autre: 'Autre' };
const EXPENSE_CATEGORIES = ['Courses', 'Transport', 'Restaurants', 'Sorties', 'Shopping', 'Beauté', 'Santé', 'Maison', 'Cadeaux', 'Voyage', 'Épargne', 'Remboursement', 'Autre'];
const INCOME_KINDS = { salaire: 'Salaire', caf: 'CAF', autre: 'Autre' };
const TRIP_STATUSES = ['À planifier', 'À organiser', 'Planifié', 'Réservé', 'Terminé'];
const TRIP_STATUS_CLASS = { 'À planifier': 'info', 'À organiser': 'warn', Planifié: 'good', Réservé: 'good', Terminé: 'muted' };
const BOOKING_KINDS = { billet: '🎫 Billet', hotel: '🏨 Hôtel', activite: '🎟️ Activité', autre: '📦 Autre' };
const DEFAULT_CHECKLIST = ["Pièce d'identité / passeport", 'Billets dans le téléphone', 'Réservation hôtel', 'Assurance voyage', 'Chargeur + adaptateur', 'Trousse beauté 💄', 'Prévenir la banque'];
const DREAM_CATEGORIES = {
  carriere: { label: 'Carrière', emoji: '💼' },
  argent: { label: 'Argent', emoji: '💰' },
  sante: { label: 'Santé', emoji: '💪' },
  voyages: { label: 'Voyages', emoji: '✈️' },
  etudes: { label: 'Études', emoji: '🎓' },
  maison: { label: 'Maison', emoji: '🏠' },
  amour: { label: 'Amour', emoji: '💕' },
  moi: { label: 'Moi', emoji: '✨' },
};
const DEFAULT_AFFIRMATIONS = [
  'Tu avances, même quand c’est discret. Et c’est déjà énorme.',
  'Je mérite tout ce que je désire.',
  "L'argent vient à moi facilement et en abondance.",
  'Mon CDI idéal est déjà en route vers moi.',
  'Je suis capable, brillante et déterminée.',
  'Chaque jour, je me rapproche de la vie dont je rêve.',
  'Je réussis mes examens avec confiance et sérénité.',
  'Les bonnes opportunités me trouvent naturellement.',
  'Je prends soin de mon corps, de mon esprit et de mon argent.',
  'Je voyage, je découvre, je vis pleinement.',
];
const DEFAULT_COLLECTIONS = ['✈️ Voyages', '💄 Beauté', '👗 Mode', '🍝 Recettes', '🏠 Déco', '💪 Sport', '💼 Business'];

const STICKERS = [
  ['Organisée', '-3deg'],
  ['Ambitieuse', '2deg'],
  ['Forte', '2deg'],
  ['Inspirante', '-2deg'],
];

/* ============================================================
   Données
   ============================================================ */

function emptyState() {
  return {
    version: 2,
    settings: {
      name: 'Marie',
      tagline: 'Dream • Plan • Do • Repeat',
      photo: '',
      cover: '',
      onboarded: false,
      hideBalance: false,
      school: { program: '', school: '', start: '', end: '' },
      push: { publicKey: '', prefs: { morning: '08:00', reminders: true, before: 15 } },
    },
    items: [],
    routines: [],
    money: { recurringIncomes: [], extraIncomes: [], bills: [], expenses: [], debts: [], savings: [], carry: {} },
    trips: [],
    manifest: {
      affirmations: DEFAULT_AFFIRMATIONS.map((text) => ({ id: uid(), text })),
      dreams: [],
      gratitude: {},
    },
    prayer: {
      rosary: { log: {}, current: null, daily: false, time: '' },
      novenas: [],
      intentions: [],
    },
    inspirations: {
      collections: DEFAULT_COLLECTIONS.slice(),
      items: [],
    },
    recipes: [],
    mealPlan: {},
    toeic: {
      target: 785,
      examDate: '',
      dailyGoal: 15,
      reminder: { daily: false, time: '19:00' },
      cards: {},
      myWords: [],
      stats: {},
      errors: [],
      recent: { L: [], R: [] },
      log: {},
      tests: [],
    },
  };
}

// Données d'exemple (modifiables ou à effacer dans Réglages).
function sampleState() {
  const t = todayISO();
  const m = monthKey();
  const dom = new Date().getDate();
  const s = emptyState();
  const item = (area, kind, title, date = '', time = '', extra = {}) => ({ id: uid(), area, kind, title, date, time, done: false, notes: '', status: '', ...extra });

  s.items = [
    item('travail', 'tache', 'Finaliser le dossier d’architecture générale', t, '09:00'),
    item('travail', 'candidature', 'Rédiger 2 candidatures CDI', t, '14:00', { status: 'À envoyer' }),
    item('quotidien', 'courses', 'Faire les courses', t, '17:00'),
    item('ecole', 'devoir', 'Rendu FYC (dette technique)', addDays(t, 3)),
    item('travail', 'contact', 'Appel avec ma manager', addDays(t, 4), '10:30'),
    item('quotidien', 'renouvellement', 'Renouvellement titre de séjour', addDays(t, 8)),
    item('travail', 'candidature', 'Candidature CDI — architecte SI', addDays(t, -6), '', { status: 'Envoyée', done: false }),
    item('travail', 'candidature', 'Candidature CDI — urbaniste SI', addDays(t, -12), '', { status: 'Envoyée' }),
    item('travail', 'candidature', 'Candidature — consultante SI', '', '', { status: 'Entretien' }),
    item('travail', 'formation', 'TOGAF fondamentaux', '', '', { status: 'À faire' }),
    item('travail', 'formation', 'Power BI', '', '', { status: 'En cours' }),
    item('travail', 'formation', 'Prise de parole', '', '', { status: 'À faire' }),
    item('travail', 'projet', 'Urbanisme SI — Safran', '', '', { status: 'En cours' }),
    item('travail', 'projet', 'BMA + AI Labelling', '', '', { status: 'En cours' }),
    item('travail', 'projet', 'SharePoint — CDE', '', '', { status: 'En cours' }),
    item('ecole', 'rattrapage', 'Rattrapages', nextDate(12, 15), '', { notes: 'Avant le 15 décembre' }),
    item('ecole', 'toeic', 'TOEIC', addDays(t, 30), '', { notes: 'Préparation — objectif 785+' }),
    item('ecole', 'devoir', 'Dossier FYC', addDays(t, 15)),
    item('ecole', 'cours', 'Dette technique', '', '', { status: 'En cours', notes: 'Pilotage managérial (sans code)' }),
    item('ecole', 'cours', 'Cartographie SI', '', '', { status: 'À rendre' }),
    item('quotidien', 'demarche', 'Envoyer le justificatif à la CAF', addDays(t, 2)),
  ];

  s.routines = [{ id: uid(), label: 'Séance Fitness Park', emoji: '🏋🏾‍♀️', time: '18:00', days: [...new Set([1, 3, 5, new Date().getDay()])], log: {} }];

  s.money.recurringIncomes = [
    { id: uid(), label: 'Salaire (alternance)', kind: 'salaire', amount: 1401, day: 15, received: dom >= 15 ? [m] : [] },
    { id: uid(), label: 'CAF', kind: 'caf', amount: 347, day: 5, received: dom >= 5 ? [m] : [] },
  ];
  s.money.extraIncomes = [{ id: uid(), label: '13e mois', amount: 1401, date: nextDate(12, 15), received: false }];
  s.money.bills = [
    { id: uid(), label: 'Loyer', category: 'loyer', amount: 698, day: 15, paid: [] },
    { id: uid(), label: 'Fitness Park', category: 'abonnement', amount: 28, day: clamp(dom + 1, 1, 28), paid: [] },
    { id: uid(), label: 'Forfait téléphone', category: 'abonnement', amount: 15, day: 12, paid: [] },
    { id: uid(), label: 'Électricité', category: 'facture', amount: 45, day: 20, paid: [] },
  ];
  s.money.expenses = [
    { id: uid(), label: 'Courses', amount: 64.3, date: addDays(t, -2), category: 'Courses' },
    { id: uid(), label: 'Pass Navigo', amount: 88.8, date: dateInMonth(1, m), category: 'Transport' },
    { id: uid(), label: 'Brunch avec les filles', amount: 27, date: addDays(t, -1), category: 'Restaurants' },
  ].filter((e) => e.date.startsWith(m));
  s.money.debts = [{ id: uid(), label: 'Avance de ma sœur', total: 300, remaining: 150 }];
  s.money.savings = [
    { id: uid(), label: 'Épargne de précaution', amount: 650, goal: 1500 },
    { id: uid(), label: 'Voyage Suède', amount: 420, goal: 1200 },
  ];
  s.money.carry[m] = 900;
  // Historique des 5 mois précédents (pour les graphiques).
  const HISTORY = [
    { Courses: [58, 71, 64, 49], Restaurants: [24, 31], Shopping: [65], Sorties: [18], Beauté: [] },
    { Courses: [62, 55, 73, 60], Restaurants: [19], Shopping: [120], Sorties: [35, 12], Beauté: [28] },
    { Courses: [51, 66, 58, 70], Restaurants: [27, 22, 33], Shopping: [], Sorties: [15], Beauté: [] },
    { Courses: [69, 57, 61, 54], Restaurants: [21], Shopping: [48], Sorties: [40], Beauté: [35] },
    { Courses: [60, 63, 52, 67], Restaurants: [30, 26], Shopping: [85], Sorties: [], Beauté: [22] },
  ];
  HISTORY.forEach((h, i) => {
    const mk = shiftMonth(m, -(i + 1));
    s.money.expenses.push({ id: uid(), label: 'Pass Navigo', amount: 88.8, date: dateInMonth(1, mk), category: 'Transport' });
    for (const [cat, amounts] of Object.entries(h)) amounts.forEach((a, j) => s.money.expenses.push({ id: uid(), label: cat, amount: a, date: dateInMonth(3 + j * 7, mk), category: cat }));
    for (const inc of s.money.recurringIncomes) inc.received.push(mk);
    for (const b of s.money.bills) b.paid.push(mk);
  });

  const sweden = nextDate(12, 12);
  s.trips = [
    {
      id: uid(), emoji: '🇸🇪', destination: 'Suède', start: sweden, end: addDays(sweden, 4), status: 'Planifié', budget: 1200, image: '',
      bookings: [
        { id: uid(), kind: 'billet', label: 'Vol Paris → Stockholm', cost: 180, booked: true },
        { id: uid(), kind: 'hotel', label: 'Hôtel Gamla Stan — 4 nuits', cost: 240, booked: true },
      ],
      checklist: DEFAULT_CHECKLIST.map((text, i) => ({ id: uid(), text, done: i < 2 })),
      notes: 'Prévoir des vêtements chauds ❄️',
    },
    { id: uid(), emoji: '🇳🇱', destination: 'Rotterdam', start: nextDate(11, 14), end: nextDate(11, 16), status: 'À organiser', budget: 400, image: '', bookings: [], checklist: [], notes: '' },
    { id: uid(), emoji: '🇬🇧', destination: 'London', start: nextDate(2, 13), end: nextDate(2, 15), status: 'À organiser', budget: 500, image: '', bookings: [], checklist: [], notes: '' },
    { id: uid(), emoji: '🇧🇷', destination: 'Brésil', start: '', end: '', status: 'À planifier', budget: 2500, image: '', bookings: [], checklist: [], notes: 'Février ou avril 2027' },
  ];

  s.settings.school = { program: 'Master 2 MCSI', school: 'ESGI', start: `${new Date().getFullYear() - (new Date().getMonth() < 8 ? 1 : 0)}-09-01`, end: '' };
  s.settings.school.end = `${Number(s.settings.school.start.slice(0, 4)) + 1}-01-31`;

  s.manifest.dreams = [
    { id: uid(), emoji: '💼', title: 'CDI — Janvier 2027', category: 'carriere', progress: 75, date: '2027-01-15', notes: 'Je me vois signer mon contrat, fière de moi.', image: '', manifested: false },
    { id: uid(), emoji: '💰', title: '5 000 € / mois', category: 'argent', progress: 40, date: '', notes: '', image: '', manifested: false },
    { id: uid(), emoji: '💪', title: 'Fitness 3 fois par semaine', category: 'sante', progress: 30, date: '', notes: '', image: '', manifested: false },
    { id: uid(), emoji: '🇧🇷', title: 'Brésil', category: 'voyages', progress: 20, date: '', notes: '', image: '', manifested: false },
    { id: uid(), emoji: '🏠', title: 'Nouveau logement', category: 'maison', progress: 15, date: '', notes: '', image: '', manifested: false },
  ];
  s.recipes = SAMPLE_RECIPES.map((r) => ({ id: uid(), image: '', link: '', notes: '', favorite: false, ...r }));
  s.recipes[2].favorite = true;
  s.mealPlan = { [t]: { soir: s.recipes[2].id }, [addDays(t, 1)]: { matin: s.recipes[0].id, midi: s.recipes[1].id } };
  s.prayer.rosary.daily = true;
  s.prayer.rosary.time = '21:30';
  s.prayer.novenas = [
    { id: uid(), name: 'Neuvaine à Marie qui défait les nœuds', intention: 'Pour mon CDI et ma famille', start: addDays(t, -3), days: 9, time: '21:00', text: '', link: '', done: { 1: addDays(t, -3), 2: addDays(t, -2), 3: addDays(t, -1) } },
  ];
  s.prayer.intentions = [
    { id: uid(), text: 'Pour ma famille', answered: false, date: addDays(t, -10) },
    { id: uid(), text: 'Réussir mon année de Master', answered: false, date: addDays(t, -20) },
  ];
  return s;
}

const LEGACY_TRIP_STATUS = { Envisagé: 'À planifier', 'En préparation': 'À organiser' };
const LEGACY_DREAM_CATEGORY = { bienetre: 'sante' };

function normalize(data) {
  const base = emptyState();
  const out = { ...base, ...data };
  out.settings = { ...base.settings, ...(data.settings || {}) };
  out.settings.school = { ...base.settings.school, ...(data.settings?.school || {}) };
  out.settings.push = { ...base.settings.push, ...(data.settings?.push || {}) };
  out.settings.push.prefs = { ...base.settings.push.prefs, ...(data.settings?.push?.prefs || {}) };
  out.money = { ...base.money, ...(data.money || {}) };
  out.manifest = { ...base.manifest, ...(data.manifest || {}) };
  for (const k of ['items', 'routines', 'trips', 'recipes']) if (!Array.isArray(out[k])) out[k] = [];
  if (!out.mealPlan || typeof out.mealPlan !== 'object') out.mealPlan = {};
  out.items = out.items.map((i) => ({ time: '', status: '', notes: '', ...i }));
  out.routines = out.routines.map((r) => ({ time: '', log: {}, days: [], ...r }));
  out.trips = out.trips.map((tr) => ({ emoji: '✈️', image: '', bookings: [], checklist: [], notes: '', ...tr, status: LEGACY_TRIP_STATUS[tr.status] || tr.status || 'À planifier' }));
  out.prayer = { ...base.prayer, ...(data.prayer || {}) };
  out.prayer.rosary = { ...base.prayer.rosary, ...(data.prayer?.rosary || {}) };
  out.inspirations = { ...base.inspirations, ...(data.inspirations || {}) };
  out.toeic = { ...base.toeic, ...(data.toeic || {}) };
  out.toeic.reminder = { ...base.toeic.reminder, ...(data.toeic?.reminder || {}) };
  out.toeic.recent = { ...base.toeic.recent, ...(data.toeic?.recent || {}) };
  out.manifest.dreams = out.manifest.dreams.map((d) => ({ progress: d.manifested ? 100 : 0, ...d, category: LEGACY_DREAM_CATEGORY[d.category] || d.category || 'moi' }));
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      // Les personnes qui utilisaient déjà l'app n'ont pas besoin de l'écran d'accueil.
      if (data.settings && data.settings.onboarded === undefined) data.settings.onboarded = true;
      return normalize(data);
    }
  } catch (e) {
    console.warn('Lecture des données impossible', e);
  }
  return sampleState();
}

let state = load();
const ui = {
  taskFilter: 'all',
  showDone: false,
  areaFilter: {},
  goalFilter: 'all',
  calMonth: monthKey(),
  calDay: todayISO(),
  affShift: 0,
  editCloudConfig: false,
  pushDevice: 'unknown',
  inspFilter: 'all',
  mapFilter: 'all',
  recipeFilter: 'all',
  recipeSearch: '',
  servings: {},
  checkedIng: {},
  mapView: null,
  pickTrip: null,
  showPrayerText: true,
  quiz: null,
  cards: null,
  cardDir: 'en',
  vocabTheme: 'all',
  ttsSlow: false,
};

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    toast('⚠️ Stockage plein : retire quelques photos');
  }
}

function commit(message) {
  state.updatedAt = Date.now();
  save();
  render();
  schedulePush();
  if (message) toast(message);
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
}

/* ============================================================
   Calculs
   ============================================================ */

const findById = (arr, id) => arr.find((x) => x.id === id);
const itemsFor = (area) => state.items.filter((i) => i.area === area);
const byDateTime = (a, b) => (a.date || '9999').localeCompare(b.date || '9999') || (a.time || '99').localeCompare(b.time || '99');

function dueNow(area) {
  const t = todayISO();
  return state.items.filter((i) => (!area || i.area === area) && !i.done && i.date && i.date <= t);
}

const routinesOn = (date) => state.routines.filter((r) => r.days.includes(parseISO(date).getDay()));

function billNextDue(bill) {
  const m = monthKey();
  if (!bill.paid.includes(m)) return { date: dateInMonth(bill.day, m), month: m };
  const n = shiftMonth(m, 1);
  return { date: dateInMonth(bill.day, n), month: n };
}

function upcomingBills(days = 10) {
  const limit = addDays(todayISO(), days);
  return state.money.bills
    .map((b) => ({ bill: b, ...billNextDue(b) }))
    .filter((x) => x.date <= limit)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function incomeNextDate(inc) {
  const m = monthKey();
  return inc.received.includes(m) ? dateInMonth(inc.day, shiftMonth(m, 1)) : dateInMonth(inc.day, m);
}

function nextSalary() {
  const list = state.money.recurringIncomes.filter((i) => i.kind === 'salaire');
  if (!list.length) return null;
  const next = list.map((inc) => ({ inc, date: incomeNextDate(inc) })).sort((a, b) => a.date.localeCompare(b.date))[0];
  return { ...next, days: daysBetween(todayISO(), next.date) };
}

function monthBudget(m = monthKey()) {
  const money = state.money;
  const carry = Number(money.carry[m]) || 0;
  const income =
    sum(money.recurringIncomes.filter((i) => i.received.includes(m)), (i) => i.amount) +
    sum(money.extraIncomes.filter((i) => i.received && (i.date || '').startsWith(m)), (i) => i.amount);
  const charges = sum(money.bills, (b) => b.amount);
  const chargesPaid = sum(money.bills.filter((b) => b.paid.includes(m)), (b) => b.amount);
  const expenses = sum(money.expenses.filter((e) => e.date.startsWith(m)), (e) => e.amount);
  const expected =
    sum(money.recurringIncomes.filter((i) => !i.received.includes(m)), (i) => i.amount) +
    sum(money.extraIncomes.filter((i) => !i.received && (i.date || '').startsWith(m)), (i) => i.amount);
  const remaining = carry + income - charges - expenses;
  const [y, mo] = m.split('-').map(Number);
  const daysLeft = m === monthKey() ? lastDayOfMonth(y, mo - 1) - new Date().getDate() + 1 : 0;
  return { carry, income, charges, chargesPaid, chargesLeft: charges - chargesPaid, expenses, spent: charges + expenses, expected, remaining, daysLeft };
}

function nextTrip() {
  const t = todayISO();
  const active = state.trips.filter((tr) => tr.status !== 'Terminé');
  return active.filter((tr) => tr.start && tr.end >= t).sort((a, b) => a.start.localeCompare(b.start))[0] || active[0] || null;
}
const tripSpent = (tr) => sum(tr.bookings, (b) => b.cost);

function topGoal(category) {
  return state.manifest.dreams
    .filter((d) => !d.manifested && (!category || d.category === category))
    .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || b.progress - a.progress)[0];
}

function schoolProgress() {
  const { start, end } = state.settings.school;
  if (!start || !end) return null;
  const total = daysBetween(start, end);
  if (total <= 0) return null;
  return clamp(Math.round((daysBetween(start, todayISO()) / total) * 100), 0, 100);
}

function affirmationOfDay() {
  const list = state.manifest.affirmations;
  if (!list.length) return null;
  const dayNumber = Math.floor(parseISO(todayISO()).getTime() / 86400000);
  return list[(((dayNumber + ui.affShift) % list.length) + list.length) % list.length];
}

function gratitudeStreak() {
  const has = (day) => (state.manifest.gratitude[day] || []).some((x) => x.trim());
  let d = todayISO();
  if (!has(d)) d = addDays(d, -1);
  let n = 0;
  while (has(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

function alerts() {
  const t = todayISO();
  const late = state.items.filter((i) => !i.done && i.date && i.date < t);
  const bills = upcomingBills(3);
  return { late, bills, count: late.length + bills.length };
}

/* ============================================================
   Formulaires (feuille du bas)
   ============================================================ */

function optionsHTML(options, v) {
  return options
    .map((o) =>
      o.group
        ? `<optgroup label="${esc(o.group)}">${optionsHTML(o.options, v)}</optgroup>`
        : `<option value="${esc(o[0])}" ${String(o[0]) === String(v) ? 'selected' : ''}>${esc(o[1])}</option>`,
    )
    .join('');
}

function fieldHTML(f, value) {
  const v = value ?? f.default ?? '';
  const req = f.required ? 'required' : '';
  const label = `<span>${esc(f.label)}</span>`;
  switch (f.type) {
    case 'textarea':
      return `<label class="field">${label}<textarea name="${f.name}" placeholder="${esc(f.placeholder || '')}">${esc(v)}</textarea></label>`;
    case 'select':
      return `<label class="field">${label}<select name="${f.name}">${optionsHTML(f.options, v)}</select></label>`;
    case 'checkbox':
      return `<label class="field field-check"><input type="checkbox" class="circle" name="${f.name}" ${v ? 'checked' : ''}/>${esc(f.label)}</label>`;
    case 'range':
      return `<label class="field">${label.replace('</span>', ` · <output>${Number(v) || 0} %</output></span>`)}<input type="range" name="${f.name}" min="0" max="100" step="5" value="${Number(v) || 0}" oninput="this.previousElementSibling.querySelector('output').textContent=this.value+' %'"/></label>`;
    case 'multi':
      return `<div class="field">${label}<div class="days">${f.options
        .map((o) => `<label><input type="checkbox" name="${f.name}" value="${esc(o)}" ${(v || []).includes(o) ? 'checked' : ''}/>${esc(o)}</label>`)
        .join('')}</div></div>`;
    case 'days':
      return `<div class="field">${label}<div class="days">${[1, 2, 3, 4, 5, 6, 0]
        .map((d) => `<label><input type="checkbox" name="${f.name}" value="${d}" ${(v || []).includes(d) ? 'checked' : ''}/>${WEEKDAYS[d]}</label>`)
        .join('')}</div></div>`;
    case 'image':
      return `<div class="field">${label}
        <img class="preview-img" data-preview="${f.name}" src="${esc(v)}" alt="" ${v ? '' : 'hidden'} />
        <input type="hidden" name="${f.name}" value="${esc(v)}" />
        <div class="btn-row">
          <label class="btn sm soft">📷 Choisir une photo<input type="file" accept="image/*" data-image-for="${f.name}" data-max="${f.max || 720}" hidden /></label>
          <button type="button" class="btn sm ghost" data-clear-image="${f.name}">Retirer</button>
        </div></div>`;
    case 'number':
      return `<label class="field">${label}<input type="text" inputmode="decimal" name="${f.name}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${req}/></label>`;
    default:
      return `<label class="field">${label}<input type="${f.type || 'text'}" name="${f.name}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${req}/></label>`;
  }
}

function readForm(form, fields) {
  const data = {};
  for (const f of fields) {
    const el = form.elements[f.name];
    if (f.type === 'checkbox') data[f.name] = el.checked;
    else if (f.type === 'multi') data[f.name] = [...form.querySelectorAll(`input[name="${f.name}"]:checked`)].map((i) => i.value);
    else if (f.type === 'days') data[f.name] = [...form.querySelectorAll(`input[name="${f.name}"]:checked`)].map((i) => Number(i.value));
    else if (f.type === 'number' || f.type === 'range') data[f.name] = parseFloat(String(el.value).replace(/\s/g, '').replace(',', '.')) || 0;
    else data[f.name] = el.value.trim();
  }
  return data;
}

function resizeImage(file, max = 720) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}

function showDialog(html) {
  const dlg = $('#modal');
  dlg.innerHTML = html;
  if (!dlg.open) dlg.showModal();
  return dlg;
}
const closeDialog = () => $('#modal').open && $('#modal').close();

function openForm({ title, fields, values = {}, submitLabel = 'Enregistrer', onSubmit, onDelete }) {
  const dlg = showDialog(`<form class="modal-form" novalidate>
    <h2>${esc(title)}</h2>
    ${fields.map((f) => fieldHTML(f, values[f.name])).join('')}
    <div class="modal-actions">
      ${onDelete ? '<button type="button" class="btn danger sm" data-del>Supprimer</button>' : ''}
      <span class="spacer"></span>
      <button type="button" class="btn ghost" data-cancel>Annuler</button>
      <button type="submit" class="btn pink">${esc(submitLabel)}</button>
    </div>
  </form>`);
  const form = $('form', dlg);
  const setImage = (name, url) => {
    form.elements[name].value = url;
    const img = form.querySelector(`[data-preview="${name}"]`);
    img.src = url;
    img.hidden = !url;
  };
  form.querySelectorAll('[data-image-for]').forEach((input) =>
    input.addEventListener('change', async () => {
      if (!input.files?.[0]) return;
      try {
        setImage(input.dataset.imageFor, await resizeImage(input.files[0], Number(input.dataset.max)));
      } catch {
        toast('⚠️ Image illisible');
      }
    }),
  );
  form.querySelectorAll('[data-clear-image]').forEach((b) => b.addEventListener('click', () => setImage(b.dataset.clearImage, '')));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = fields.find((f) => f.required && !String(form.elements[f.name].value).trim());
    if (missing) {
      form.elements[missing.name].focus();
      toast(`« ${missing.label} » est obligatoire`);
      return;
    }
    dlg.close();
    onSubmit(readForm(form, fields));
  });
  $('[data-cancel]', dlg).addEventListener('click', () => dlg.close());
  $('[data-del]', dlg)?.addEventListener('click', () => {
    if (confirm('Supprimer cet élément ?')) {
      dlg.close();
      onDelete();
    }
  });
  const first = form.querySelector('input:not([type="checkbox"]):not([type="hidden"]):not([type="file"]), textarea');
  if (first && window.matchMedia('(pointer: fine)').matches) first.focus();
}

function openSheet(title, body) {
  showDialog(`<div class="modal-form">
    <div class="between"><h2>${esc(title)}</h2><button class="icon-btn sm" data-action="close-sheet" aria-label="Fermer">${icon('x')}</button></div>
    ${body}
  </div>`);
}

/* ---------- Formulaires métier ---------- */

function itemForm(item, preset = {}) {
  const area = item?.area || preset.area || 'travail';
  const kind = item?.kind || preset.kind || 'tache';
  const statuses = AREAS[area].kinds[kind]?.statuses;
  const fields = [
    { name: 'title', label: 'Intitulé', required: true, placeholder: 'Ex. : Finaliser le dossier' },
    {
      name: 'cat',
      label: 'Catégorie',
      type: 'select',
      options: Object.entries(AREAS).map(([a, cfg]) => ({ group: cfg.label, options: Object.entries(cfg.kinds).map(([k, v]) => [`${a}:${k}`, `${v.emoji} ${v.label}`]) })),
    },
    { name: 'date', label: 'Date', type: 'date' },
    { name: 'time', label: 'Heure (optionnel)', type: 'time' },
  ];
  if (statuses || item?.status) fields.push({ name: 'status', label: 'Statut', type: 'select', options: [['', '—'], ...(statuses || [item.status]).map((s) => [s, s])] });
  fields.push({ name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Détails, liens, contacts…' });
  openForm({
    title: item ? 'Modifier' : 'Nouvelle tâche',
    fields,
    values: { ...(item || { date: preset.date ?? todayISO() }), cat: `${area}:${kind}` },
    onSubmit: (d) => {
      const [a, k] = d.cat.split(':');
      delete d.cat;
      const data = { ...d, area: a, kind: k };
      if (item) Object.assign(item, data);
      else state.items.push({ id: uid(), done: false, status: '', ...data });
      commit(item ? 'Modifié ✓' : 'Ajouté ✦');
    },
    onDelete: item
      ? () => {
          state.items = state.items.filter((i) => i !== item);
          commit('Supprimé');
        }
      : null,
  });
}

function routineForm(r) {
  openForm({
    title: r ? 'Modifier la routine' : 'Nouvelle routine',
    fields: [
      { name: 'emoji', label: 'Emoji', placeholder: '🏋🏾‍♀️' },
      { name: 'label', label: 'Nom', required: true, placeholder: 'Sport, lecture, skincare…' },
      { name: 'time', label: 'Heure', type: 'time' },
      { name: 'days', label: 'Jours', type: 'days' },
    ],
    values: r || { emoji: '✨', days: [1, 2, 3, 4, 5] },
    onSubmit: (d) => {
      if (r) Object.assign(r, d);
      else state.routines.push({ id: uid(), log: {}, ...d });
      commit('Routine enregistrée ✦');
    },
    onDelete: r
      ? () => {
          state.routines = state.routines.filter((x) => x !== r);
          commit('Routine supprimée');
        }
      : null,
  });
}

function billForm(b, presetCategory) {
  const m = monthKey();
  openForm({
    title: b ? 'Modifier la charge' : 'Nouvelle charge mensuelle',
    fields: [
      { name: 'label', label: 'Libellé', required: true, placeholder: 'Loyer, électricité, Netflix…' },
      { name: 'category', label: 'Catégorie', type: 'select', options: Object.entries(BILL_CATEGORIES) },
      { name: 'amount', label: 'Montant (€)', type: 'number', required: true },
      { name: 'day', label: 'Jour du prélèvement (1–31)', type: 'number', required: true },
      { name: 'paidNow', label: 'Déjà payé ce mois-ci', type: 'checkbox' },
    ],
    values: b ? { ...b, paidNow: b.paid.includes(m) } : { category: presetCategory || 'facture', day: 5 },
    onSubmit: (d) => {
      const { paidNow, ...rest } = d;
      rest.day = clamp(Math.round(rest.day), 1, 31);
      const target = b || { id: uid(), paid: [] };
      Object.assign(target, rest);
      target.paid = paidNow ? [...new Set([...target.paid, m])] : target.paid.filter((x) => x !== m);
      if (!b) state.money.bills.push(target);
      commit('Charge enregistrée ✓');
    },
    onDelete: b
      ? () => {
          state.money.bills = state.money.bills.filter((x) => x !== b);
          commit('Charge supprimée');
        }
      : null,
  });
}

function recurringIncomeForm(inc) {
  const m = monthKey();
  openForm({
    title: inc ? 'Modifier le revenu' : 'Nouveau revenu régulier',
    fields: [
      { name: 'label', label: 'Libellé', required: true, placeholder: 'Salaire, CAF…' },
      { name: 'kind', label: 'Type', type: 'select', options: Object.entries(INCOME_KINDS) },
      { name: 'amount', label: 'Montant (€)', type: 'number', required: true },
      { name: 'day', label: 'Jour de versement (1–31)', type: 'number', required: true },
      { name: 'gotNow', label: 'Reçu ce mois-ci', type: 'checkbox' },
    ],
    values: inc ? { ...inc, gotNow: inc.received.includes(m) } : { kind: 'salaire', day: 28 },
    onSubmit: (d) => {
      const { gotNow, ...rest } = d;
      rest.day = clamp(Math.round(rest.day), 1, 31);
      const target = inc || { id: uid(), received: [] };
      Object.assign(target, rest);
      target.received = gotNow ? [...new Set([...target.received, m])] : target.received.filter((x) => x !== m);
      if (!inc) state.money.recurringIncomes.push(target);
      commit('Revenu enregistré ✓');
    },
    onDelete: inc
      ? () => {
          state.money.recurringIncomes = state.money.recurringIncomes.filter((x) => x !== inc);
          commit('Revenu supprimé');
        }
      : null,
  });
}

function extraIncomeForm(inc) {
  openForm({
    title: inc ? 'Modifier le revenu' : 'Revenu exceptionnel',
    fields: [
      { name: 'label', label: 'Libellé', required: true, placeholder: 'Prime, 13e mois, remboursement…' },
      { name: 'amount', label: 'Montant (€)', type: 'number', required: true },
      { name: 'date', label: 'Date prévue', type: 'date', required: true },
      { name: 'received', label: 'Déjà reçu', type: 'checkbox' },
    ],
    values: inc || { date: todayISO() },
    onSubmit: (d) => {
      if (inc) Object.assign(inc, d);
      else state.money.extraIncomes.push({ id: uid(), ...d });
      commit('Enregistré ✓');
    },
    onDelete: inc
      ? () => {
          state.money.extraIncomes = state.money.extraIncomes.filter((x) => x !== inc);
          commit('Supprimé');
        }
      : null,
  });
}

function expenseForm(e) {
  openForm({
    title: e ? 'Modifier la dépense' : 'Nouvelle dépense',
    fields: [
      { name: 'label', label: 'Libellé', required: true, placeholder: 'Courses, resto, Uber…' },
      { name: 'amount', label: 'Montant (€)', type: 'number', required: true },
      { name: 'category', label: 'Catégorie', type: 'select', options: EXPENSE_CATEGORIES.map((c) => [c, c]) },
      { name: 'date', label: 'Date', type: 'date', required: true },
    ],
    values: e || { date: todayISO(), category: 'Courses' },
    onSubmit: (d) => {
      if (e) Object.assign(e, d);
      else state.money.expenses.push({ id: uid(), ...d });
      commit(e ? 'Dépense modifiée ✓' : `− ${eur(d.amount)} noté`);
    },
    onDelete: e
      ? () => {
          state.money.expenses = state.money.expenses.filter((x) => x !== e);
          commit('Dépense supprimée');
        }
      : null,
  });
}

function debtForm(d0) {
  openForm({
    title: d0 ? 'Modifier la dette' : 'Nouvelle dette',
    fields: [
      { name: 'label', label: 'Libellé', required: true, placeholder: 'Prêt étudiant, avance…' },
      { name: 'total', label: 'Montant total (€)', type: 'number', required: true },
      { name: 'remaining', label: 'Reste à rembourser (€)', type: 'number', required: true },
    ],
    values: d0 || {},
    onSubmit: (d) => {
      if (d0) Object.assign(d0, d);
      else state.money.debts.push({ id: uid(), ...d });
      commit('Dette enregistrée ✓');
    },
    onDelete: d0
      ? () => {
          state.money.debts = state.money.debts.filter((x) => x !== d0);
          commit('Dette supprimée');
        }
      : null,
  });
}

function savingForm(s) {
  openForm({
    title: s ? 'Modifier l’épargne' : 'Nouvelle épargne',
    fields: [
      { name: 'label', label: 'Nom', required: true, placeholder: 'Précaution, voyage, permis…' },
      { name: 'amount', label: 'Montant épargné (€)', type: 'number' },
      { name: 'goal', label: 'Objectif (€)', type: 'number' },
    ],
    values: s || {},
    onSubmit: (d) => {
      if (s) Object.assign(s, d);
      else state.money.savings.push({ id: uid(), ...d });
      commit('Épargne enregistrée ✓');
    },
    onDelete: s
      ? () => {
          state.money.savings = state.money.savings.filter((x) => x !== s);
          commit('Supprimé');
        }
      : null,
  });
}

function amountPrompt(title, hint, onSubmit) {
  openForm({
    title,
    fields: [
      { name: 'amount', label: 'Montant (€)', type: 'number', required: true },
      { name: 'asExpense', label: hint, type: 'checkbox', default: true },
    ],
    submitLabel: 'Valider',
    onSubmit,
  });
}

// Trouve la position d'un voyage (OpenStreetMap) et complète le drapeau.
async function locateTrip(trip) {
  const g = await geocode(trip.destination);
  if (!g) {
    trip.geoTried = true;
    return false;
  }
  Object.assign(trip, { lat: g.lat, lng: g.lng, country: g.country, geoTried: false });
  if ((!trip.emoji || trip.emoji === '✈️') && g.country) trip.emoji = flagOf(g.country);
  return true;
}

function tripForm(trip, preset = {}) {
  openForm({
    title: trip ? 'Modifier le voyage' : 'Nouveau voyage',
    fields: [
      { name: 'emoji', label: 'Drapeau / emoji', placeholder: '🇸🇪' },
      { name: 'destination', label: 'Destination', required: true, placeholder: 'Suède, Londres, Brésil…' },
      { name: 'status', label: 'Statut', type: 'select', options: TRIP_STATUSES.map((s) => [s, s]) },
      { name: 'start', label: 'Départ', type: 'date' },
      { name: 'end', label: 'Retour', type: 'date' },
      { name: 'budget', label: 'Budget prévu (€)', type: 'number' },
      { name: 'image', label: 'Photo de la destination', type: 'image', max: 900 },
      { name: 'notes', label: 'Documents & notes', type: 'textarea', placeholder: 'Passeport, visa, numéros de réservation…' },
    ],
    values: trip || { status: 'À planifier', emoji: preset.emoji || '✈️', destination: preset.destination || '' },
    onSubmit: async (d) => {
      let target = trip;
      if (trip) {
        if (trip.destination !== d.destination) Object.assign(trip, { lat: undefined, lng: undefined, geoTried: false });
        Object.assign(trip, d);
      } else {
        target = { id: uid(), bookings: [], checklist: DEFAULT_CHECKLIST.map((text) => ({ id: uid(), text, done: false })), ...d };
        if (preset.lat !== undefined) Object.assign(target, { lat: preset.lat, lng: preset.lng, country: preset.country || '' });
        state.trips.push(target);
        if (preset.lat === undefined) location.hash = `#/voyage/${target.id}`;
      }
      commit('Voyage enregistré ✈️');
      if (target.lat === undefined && (await locateTrip(target))) commit();
    },
    onDelete: trip
      ? () => {
          state.trips = state.trips.filter((x) => x !== trip);
          location.hash = '#/voyages';
          commit('Voyage supprimé');
        }
      : null,
  });
}

function bookingForm(trip, b) {
  openForm({
    title: b ? 'Modifier la réservation' : 'Billet / hôtel / activité',
    fields: [
      { name: 'kind', label: 'Type', type: 'select', options: Object.entries(BOOKING_KINDS) },
      { name: 'label', label: 'Détail', required: true, placeholder: 'Vol Paris → Stockholm…' },
      { name: 'cost', label: 'Coût (€)', type: 'number' },
      { name: 'booked', label: 'Réservé / payé', type: 'checkbox' },
    ],
    values: b || { kind: 'billet' },
    onSubmit: (d) => {
      if (b) Object.assign(b, d);
      else trip.bookings.push({ id: uid(), ...d });
      commit('Enregistré ✓');
    },
    onDelete: b
      ? () => {
          trip.bookings = trip.bookings.filter((x) => x !== b);
          commit('Supprimé');
        }
      : null,
  });
}

function goalForm(goal, presetCategory) {
  openForm({
    title: goal ? 'Modifier l’objectif' : 'Nouvel objectif',
    fields: [
      { name: 'emoji', label: 'Emoji', placeholder: '✨' },
      { name: 'title', label: 'Mon objectif', required: true, placeholder: 'CDI, nouvel appart, 2 000 € d’épargne…' },
      { name: 'category', label: 'Domaine', type: 'select', options: Object.entries(DREAM_CATEGORIES).map(([k, v]) => [k, `${v.emoji} ${v.label}`]) },
      { name: 'progress', label: 'Avancement', type: 'range' },
      { name: 'date', label: 'Pour quand ?', type: 'date' },
      { name: 'notes', label: 'Ce que je ressens quand c’est réalisé', type: 'textarea', placeholder: 'Écris-le au présent, comme si c’était déjà là…' },
      { name: 'image', label: 'Photo pour mon vision board', type: 'image' },
      { name: 'manifested', label: 'C’est réalisé ! ✨', type: 'checkbox' },
    ],
    values: goal || { emoji: '✨', category: presetCategory || 'moi', progress: 0 },
    onSubmit: (d) => {
      const wasDone = goal?.manifested;
      if (d.manifested) d.progress = 100;
      if (goal) Object.assign(goal, d);
      else state.manifest.dreams.push({ id: uid(), ...d });
      commit(d.manifested && !wasDone ? '🎉 Réalisé ! Bravo ✨' : 'Objectif enregistré ✦');
    },
    onDelete: goal
      ? () => {
          state.manifest.dreams = state.manifest.dreams.filter((x) => x !== goal);
          commit('Objectif retiré');
        }
      : null,
  });
}

function schoolForm() {
  openForm({
    title: 'Mon année d’études',
    fields: [
      { name: 'program', label: 'Formation', placeholder: 'Master 2 MCSI' },
      { name: 'school', label: 'École', placeholder: 'ESGI' },
      { name: 'start', label: 'Début de l’année', type: 'date' },
      { name: 'end', label: 'Fin de l’année', type: 'date' },
    ],
    values: state.settings.school,
    onSubmit: (d) => {
      state.settings.school = d;
      commit('Enregistré ✓');
    },
  });
}

function profileForm() {
  openForm({
    title: 'Mon profil',
    fields: [
      { name: 'name', label: 'Prénom', required: true },
      { name: 'tagline', label: 'Ma devise', placeholder: 'Dream • Plan • Do • Repeat' },
      { name: 'photo', label: 'Photo de profil', type: 'image', max: 400 },
      { name: 'cover', label: 'Photo de l’écran d’accueil', type: 'image', max: 1000 },
    ],
    values: state.settings,
    onSubmit: (d) => {
      Object.assign(state.settings, d);
      commit('Profil mis à jour 💖');
    },
  });
}

function gratitudeForm() {
  const t = todayISO();
  const g = state.manifest.gratitude[t] || [];
  openForm({
    title: '🙏 Mes 3 gratitudes',
    fields: [
      { name: 'g0', label: 'Aujourd’hui je suis reconnaissante pour…' },
      { name: 'g1', label: 'Une personne qui compte pour moi…' },
      { name: 'g2', label: 'Une petite victoire du jour…' },
    ],
    values: { g0: g[0], g1: g[1], g2: g[2] },
    onSubmit: (d) => {
      state.manifest.gratitude[t] = [d.g0, d.g1, d.g2];
      commit('Merci, merci, merci 🙏✨');
    },
  });
}

/* ============================================================
   Composants
   ============================================================ */

const backBtn = (href = '#/menu', light = false) => `<a class="icon-btn ${light ? 'ghost' : ''}" href="${href}" aria-label="Retour">${icon('left')}</a>`;
const progressBar = (pct, cls = '') => `<div class="bar ${cls}"><span style="width:${clamp(pct, 0, 100).toFixed(1)}%"></span></div>`;
const emptyMsg = (text) => `<div class="empty">${esc(text)}</div>`;
const secHead = (title, link = '', linkLabel = 'Voir tout') =>
  `<div class="sec-head"><h2>${title}</h2>${link ? (link.startsWith('#') ? `<a class="see-all" href="${link}">${linkLabel} ${icon('right')}</a>` : `<button class="see-all" ${link}>${linkLabel} ${icon('right')}</button>`) : ''}</div>`;

function taskRow(i, { showDate = true } = {}) {
  const k = kindOf(i);
  const t = todayISO();
  let right = '';
  if (i.date && i.date !== t && showDate) right = esc(dayLabel(i.date));
  if (i.time) right = right ? `${right}<br>${esc(i.time)}` : esc(i.time);
  const late = !i.done && i.date && i.date < t;
  return `<li class="row tap ${i.done ? 'done' : ''}" data-action="edit-item" data-id="${i.id}">
    <input type="checkbox" class="circle" data-action="toggle-item" data-id="${i.id}" ${i.done ? 'checked' : ''} aria-label="Fait" />
    <div class="grow">
      <div class="t">${esc(i.title)}</div>
      <div class="s"><span>${esc(k.tag)}</span>${i.status ? `<span class="badge pink">${esc(i.status)}</span>` : ''}${late ? '<span class="badge bad">en retard</span>' : ''}${i.notes ? `<span>· ${esc(i.notes.length > 42 ? `${i.notes.slice(0, 42)}…` : i.notes)}</span>` : ''}</div>
    </div>
    ${right ? `<div class="r">${right}</div>` : ''}
  </li>`;
}

function routineRow(r, date = todayISO()) {
  const done = !!r.log[date];
  return `<li class="row ${done ? 'done' : ''}">
    <input type="checkbox" class="circle" data-action="toggle-routine" data-id="${r.id}" data-date="${date}" ${done ? 'checked' : ''} aria-label="Fait" />
    <div class="grow tap" data-action="edit-routine" data-id="${r.id}"><div class="t">${esc(r.label)}</div><div class="s">${esc(r.emoji)} Routine</div></div>
    ${r.time ? `<div class="r">${esc(r.time)}</div>` : ''}
  </li>`;
}

function goalCard(d) {
  const cat = DREAM_CATEGORIES[d.category] || DREAM_CATEGORIES.moi;
  return `<div class="goal ${d.manifested ? 'done' : ''}" data-action="edit-goal" data-id="${d.id}" role="button" tabindex="0">
    <div class="ico-box round pink">${esc(d.emoji || cat.emoji)}</div>
    <div class="grow">
      <div class="t">${esc(d.title)}</div>
      <div class="meta"><span>${esc(cat.label)}${d.date ? ` · ${esc(fmtMonthShort.format(parseISO(d.date)))}` : ''}</span><span class="pct">${d.manifested ? '✨ Réalisé' : `${d.progress || 0} %`}</span></div>
      ${progressBar(d.progress || 0, 'pink')}
    </div>
  </div>`;
}

/* ============================================================
   Écran d'accueil (premier lancement)
   ============================================================ */

function viewSplash() {
  const cover = state.settings.cover;
  return `<section class="splash ${cover ? '' : 'no-photo'}" ${cover ? `style="background-image:url('${esc(cover)}')"` : ''}>
    <div class="logo">
      <div class="name">MARIE</div>
      <div class="sub">DASHBOARD</div>
      <div class="tag">My life, organized.</div>
      <div class="stars">✦ ✧ ✦</div>
    </div>
    <div>
      <button class="btn glass" data-action="start">Commencer</button>
      <button class="link" data-action="start-login">Se connecter</button>
    </div>
  </section>`;
}

/* ============================================================
   Accueil
   ============================================================ */

function viewHome() {
  const t = todayISO();
  const now = new Date();
  const due = dueNow();
  const byArea = ['travail', 'ecole', 'quotidien'].filter((a) => due.some((i) => i.area === a)).map((a) => AREAS[a].label);
  const routines = routinesOn(t);
  const bills = upcomingBills(7).filter((b) => b.month === monthKey() || daysBetween(t, b.date) <= 7);
  const budget = monthBudget();
  const salary = nextSalary();
  const aff = affirmationOfDay();
  const career = topGoal('carriere');
  const trip = nextTrip();
  const activeGoals = state.manifest.dreams.filter((d) => !d.manifested).length;
  const grat = (state.manifest.gratitude[t] || []).some((x) => x.trim());
  const al = alerts();
  const hour = now.getHours();
  const hello = hour < 5 ? 'Bonne nuit' : hour < 18 ? 'Bonjour' : 'Bonsoir';

  const rows = [];
  rows.push(`<li class="row tap" data-action="goto" data-href="#/taches">
    <div class="ico-box">${icon('check')}</div>
    <div class="grow"><div class="t">${due.length ? plural(due.length, 'chose') + ' à faire' : 'Rien d’urgent ✨'}</div><div class="s">${esc(byArea.join(' / ') || 'Profite de ta journée')}</div></div>
    <span class="chev">${icon('right')}</span></li>`);
  if (bills.length) {
    const b = bills[0];
    rows.push(`<li class="row tap" data-action="goto" data-href="#/argent">
      <div class="ico-box">${icon('calendar')}</div>
      <div class="grow"><div class="t">${plural(bills.length, 'échéance')}</div><div class="s">${esc(b.bill.label)} – ${eur(b.bill.amount)} (${esc(fmtDayMonth(b.date))})</div></div>
      <span class="chev">${icon('right')}</span></li>`);
  }
  if (salary) {
    rows.push(`<li class="row tap" data-action="goto" data-href="#/argent">
      <div class="ico-box">${icon('euro')}</div>
      <div class="grow"><div class="t">Prochain salaire ${salary.days < 0 ? 'attendu' : salary.days === 0 ? "aujourd'hui 🎉" : `dans ${plural(salary.days, 'jour')}`}</div><div class="s">${esc(salary.inc.label)} – ${eur(salary.inc.amount)}</div></div>
      <span class="chev">${icon('right')}</span></li>`);
  }
  for (const r of routines) {
    const done = !!r.log[t];
    rows.push(`<li class="row ${done ? 'done' : ''}">
      <div class="ico-box">${icon('dumbbell')}</div>
      <div class="grow tap" data-action="edit-routine" data-id="${r.id}"><div class="t">${esc(r.label)}</div><div class="s">${esc(r.emoji)} ${r.time ? esc(fmtTime(r.time)) : 'Aujourd’hui'}</div></div>
      <input type="checkbox" class="circle" data-action="toggle-routine" data-id="${r.id}" data-date="${t}" ${done ? 'checked' : ''} aria-label="Fait" /></li>`);
  }
  if (state.prayer.rosary.daily) {
    const prayed = !!state.prayer.rosary.log[t];
    rows.push(`<li class="row tap ${prayed ? 'done' : ''}" data-action="goto" data-href="#/chapelet">
      <div class="ico-box lilac">📿</div>
      <div class="grow"><div class="t">Chapelet</div><div class="s">${esc(MYSTERIES[MYSTERY_OF_DAY[now.getDay()]].label)}${state.prayer.rosary.time ? ` · ${esc(fmtTime(state.prayer.rosary.time))}` : ''}</div></div>
      ${prayed ? '<span class="badge good">✓</span>' : `<span class="chev">${icon('right')}</span>`}</li>`);
  }
  const menu = state.mealPlan[t] || {};
  const menuTxt = Object.keys(MEALS).filter((m) => menu[m] && recipeById(menu[m])).map((m) => `${recipeById(menu[m]).title} (${MEALS[m].toLowerCase()})`);
  if (menuTxt.length) {
    rows.push(`<li class="row tap" data-action="goto" data-href="#/recettes">
      <div class="ico-box peach">🍽️</div>
      <div class="grow"><div class="t">Au menu aujourd’hui</div><div class="s">${esc(menuTxt.join(' · '))}</div></div>
      <span class="chev">${icon('right')}</span></li>`);
  }
  for (const n of activeNovenas()) {
    const day = novenaDay(n);
    const done = !!n.done?.[day];
    rows.push(`<li class="row ${done ? 'done' : ''}">
      <div class="ico-box lilac">🙏</div>
      <div class="grow tap" data-action="goto" data-href="#/priere"><div class="t">${esc(n.name)}</div><div class="s">Jour ${day}/${n.days}${n.time ? ` · ${esc(fmtTime(n.time))}` : ''}</div></div>
      <input type="checkbox" class="circle" data-action="novena-day" data-id="${n.id}" data-day="${day}" ${done ? 'checked' : ''} aria-label="Prié" /></li>`);
  }
  const T = state.toeic;
  if (T.examDate >= t || T.reminder.daily || Object.keys(T.log).length) {
    const left = T.examDate >= t ? daysBetween(t, T.examDate) : null;
    const q = T.log[t]?.q || 0;
    const cards = cardsToReview().total;
    rows.push(`<li class="row tap ${q >= T.dailyGoal && !cards ? 'done' : ''}" data-action="goto" data-href="#/toeic">
      <div class="ico-box lilac">🎧</div>
      <div class="grow"><div class="t">TOEIC${left !== null ? ` · J-${left}` : ''}</div><div class="s">${Math.min(q, T.dailyGoal)}/${T.dailyGoal} questions${cards ? ` · ${plural(cards, 'carte')} à réviser` : ''}</div></div>
      ${q >= T.dailyGoal && !cards ? '<span class="badge good">✓</span>' : `<span class="chev">${icon('right')}</span>`}</li>`);
  }
  if (!grat) {
    rows.push(`<li class="row tap" data-action="gratitude">
      <div class="ico-box pink">${icon('heart')}</div>
      <div class="grow"><div class="t">Mes 3 gratitudes</div><div class="s">30 secondes pour dire merci</div></div>
      <span class="chev">${icon('right')}</span></li>`);
  }

  const hidden = state.settings.hideBalance;
  return `
  <header class="head">
    <div class="head-row">
      <div>
        <h1 class="hello">${hello} ${esc(state.settings.name)} 👋</h1>
        <div class="subtitle">${esc(cap(fmtLong.format(now)))}</div>
      </div>
      <button class="icon-btn ${al.count ? 'dot' : ''}" data-action="alerts" aria-label="Rappels">${icon('bell')}</button>
    </div>
  </header>

  ${aff ? `<a class="quote" href="#/manifestation"><div class="quote-inner">${esc(aff.text)}<span class="heart">♥</span></div></a>` : ''}

  <section class="section">
    ${secHead("Aujourd'hui", '#/taches')}
    <div class="card flush"><ul class="list">${rows.join('')}</ul></div>
  </section>

  <div class="tiles">
    <a class="tile" href="#/argent">
      <div class="top"><div class="ico-box" style="background:var(--surface)">${icon('wallet')}</div><span class="corner">${icon('wallet')}</span></div>
      <div><div class="label">Money</div><div class="big ${hidden ? 'hide-amount' : ''}">${eur(budget.remaining)}</div><div class="small">disponible ce mois-ci</div></div>
    </a>
    <a class="tile peach" href="#/carriere">
      <div class="top"><div class="ico-box" style="background:var(--surface)">${icon('briefcase')}</div><span class="corner">${icon('briefcase')}</span></div>
      <div><div class="label">Career</div><div class="small">${career ? esc(career.title) : 'Ajoute un objectif'}</div>
      ${career ? `<div class="between mt" style="margin-top:6px"><div style="flex:1">${progressBar(career.progress)}</div><span class="pct">${career.progress} %</span></div>` : ''}</div>
    </a>
    <a class="tile lilac" href="${trip ? `#/voyage/${trip.id}` : '#/voyages'}">
      <div class="top"><div class="ico-box" style="background:var(--surface)">${icon('plane')}</div><span class="corner">${icon('plane')}</span></div>
      <div><div class="label">Travel</div><div class="small">${trip ? `${esc(trip.destination)} ${esc(trip.emoji || '')}` : 'Prochaine aventure ?'}</div>${trip ? `<div class="small">Budget : ${eur(trip.budget)}</div>` : ''}</div>
    </a>
    <a class="tile ink" href="#/objectifs">
      <div class="top"><div class="ico-box pink">${icon('target')}</div><span class="corner">✦</span></div>
      <div><div class="label">Goals</div><div class="small">${plural(activeGoals, 'objectif actif', 'objectifs actifs')}</div></div>
    </a>
  </div>`;
}

/* ============================================================
   Tâches
   ============================================================ */

const TASK_FILTERS = [
  ['all', 'Tout'],
  ['travail', 'Pro'],
  ['ecole', 'École'],
  ['quotidien', 'Perso'],
];

function viewTasks() {
  const t = todayISO();
  const in7 = addDays(t, 7);
  const f = ui.taskFilter;
  const all = state.items.filter((i) => f === 'all' || i.area === f);
  const open = all.filter((i) => !i.done);
  const done = all.filter((i) => i.done).sort((a, b) => byDateTime(b, a));
  const routines = f === 'all' || f === 'quotidien' ? routinesOn(t) : [];
  const groups = [
    ['En retard', open.filter((i) => i.date && i.date < t).sort(byDateTime), 'bad'],
    ["Aujourd'hui", open.filter((i) => i.date === t).sort(byDateTime), '', routines],
    ['Cette semaine', open.filter((i) => i.date > t && i.date <= in7).sort(byDateTime)],
    ['Plus tard', open.filter((i) => i.date > in7).sort(byDateTime)],
    ['Sans date', open.filter((i) => !i.date)],
  ];
  const body = groups
    .filter(([, list, , extra]) => list.length || extra?.length)
    .map(([label, list, cls, extra = []]) => {
      const rows = [...extra.map((r) => ({ html: routineRow(r), time: r.time || '99' })), ...list.map((i) => ({ html: taskRow(i, { showDate: label !== "Aujourd'hui" }), time: label === "Aujourd'hui" ? i.time || '99' : '' }))];
      if (label === "Aujourd'hui") rows.sort((a, b) => a.time.localeCompare(b.time));
      return `${secHead(`${label}${cls ? ' ⚠️' : ''}`)}<div class="card flush"><ul class="list">${rows.map((r) => r.html).join('')}</ul></div>`;
    })
    .join('');

  return `
  <header class="head">
    <h1 class="title sparkle">Tâches</h1>
    <div class="subtitle">Reste focus sur l’essentiel.</div>
  </header>
  <div class="chips">${TASK_FILTERS.map(([k, l]) => `<button class="chip ${f === k ? 'active' : ''}" data-action="task-filter" data-filter="${k}">${l}</button>`).join('')}</div>
  <section class="section">
    ${body || `<div class="card">${emptyMsg('Tout est fait. Tu es une reine 👑')}</div>`}
    <div class="add-pill"><button class="btn soft" data-action="add-item" data-area="${f === 'all' ? 'travail' : f}">${icon('plus')} Ajouter une tâche</button></div>
    ${done.length ? `<div class="add-pill"><button class="btn ghost sm" data-action="toggle-show-done">${ui.showDone ? 'Masquer' : 'Voir'} les tâches terminées (${done.length})</button></div>` : ''}
    ${ui.showDone && done.length ? `<div class="card flush"><ul class="list">${done.slice(0, 50).map((i) => taskRow(i)).join('')}</ul></div>
      <div class="add-pill"><button class="btn danger sm" data-action="clear-done">Vider les terminées</button></div>` : ''}
  </section>`;
}

/* ============================================================
   Calendrier
   ============================================================ */

function eventsOn(date) {
  const ev = [];
  for (const i of state.items) if (i.date === date) ev.push({ time: i.time, title: i.title, sub: kindOf(i).tag, done: i.done, action: `data-action="edit-item" data-id="${i.id}"`, dot: '' });
  for (const r of routinesOn(date)) ev.push({ time: r.time, title: r.label, sub: `${r.emoji} Routine`, done: !!r.log[date], action: `data-action="edit-routine" data-id="${r.id}"`, dot: '' });
  const ym = date.slice(0, 7);
  for (const b of state.money.bills) if (dateInMonth(b.day, ym) === date) ev.push({ time: '', title: `${b.label} – ${eur(b.amount)}`, sub: 'Paiement', done: b.paid.includes(ym), action: `data-action="edit-bill" data-id="${b.id}"`, dot: 'lilac' });
  for (const inc of state.money.recurringIncomes) if (dateInMonth(inc.day, ym) === date) ev.push({ time: '', title: `${inc.label} + ${eur(inc.amount)}`, sub: 'Revenu', done: inc.received.includes(ym), action: `data-action="edit-income" data-id="${inc.id}"`, dot: 'good' });
  for (const x of state.money.extraIncomes) if (x.date === date) ev.push({ time: '', title: `${x.label} + ${eur(x.amount)}`, sub: 'Revenu exceptionnel', done: x.received, action: `data-action="edit-extra" data-id="${x.id}"`, dot: 'good' });
  for (const tr of state.trips) {
    if (tr.start === date) ev.push({ time: '', title: `Départ ${tr.destination} ${tr.emoji || ''}`, sub: 'Voyage', action: `data-action="goto" data-href="#/voyage/${tr.id}"`, dot: 'lilac' });
    if (tr.end === date && tr.end !== tr.start) ev.push({ time: '', title: `Retour de ${tr.destination}`, sub: 'Voyage', action: `data-action="goto" data-href="#/voyage/${tr.id}"`, dot: 'lilac' });
  }
  if (state.toeic.examDate === date) ev.push({ time: '', title: 'Examen TOEIC 🎯', sub: 'TOEIC', action: 'data-action="goto" data-href="#/toeic"', dot: 'lilac' });
  return ev.sort((a, b) => (a.time || '99').localeCompare(b.time || '99'));
}

function viewCalendar() {
  const ym = ui.calMonth;
  const [y, m] = ym.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const offset = (first.getDay() + 6) % 7;
  const start = addDays(iso(first), -offset);
  const t = todayISO();
  const cells = [];
  for (let i = 0; i < 42; i++) {
    const d = addDays(start, i);
    if (i >= 35 && !d.startsWith(ym)) break;
    const ev = eventsOn(d).filter((e) => !e.sub.includes('Routine'));
    const dots = [...new Set(ev.map((e) => e.dot))].slice(0, 3).map((c) => `<i class="${c}"></i>`).join('');
    cells.push(`<button class="day ${d.startsWith(ym) ? '' : 'out'} ${d === t ? 'today' : ''} ${d === ui.calDay ? 'sel' : ''}" data-action="cal-day" data-date="${d}">${parseISO(d).getDate()}${dots ? `<span class="dots">${dots}</span>` : ''}</button>`);
  }
  const sel = ui.calDay;
  const events = eventsOn(sel);
  const selLabel = sel === t ? `Aujourd'hui – ${cap(fmtLongNoYear.format(parseISO(sel)))}` : cap(fmtLongNoYear.format(parseISO(sel)));
  return `
  <header class="head">
    <h1 class="title sparkle">Calendrier</h1>
    <div class="subtitle">Tes dates, tes projets, ton planning.</div>
  </header>
  <section class="section">
    <div class="card cal">
      <div class="cal-head">
        <button class="icon-btn sm" data-action="cal-month" data-step="-1" aria-label="Mois précédent">${icon('left')}</button>
        <h3>${esc(cap(fmtMonth.format(first)))}</h3>
        <button class="icon-btn sm" data-action="cal-month" data-step="1" aria-label="Mois suivant">${icon('right')}</button>
      </div>
      <div class="cal-grid">${['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d) => `<div class="dow">${d}</div>`).join('')}${cells.join('')}</div>
    </div>
    ${secHead(esc(selLabel))}
    <div class="card flush agenda"><ul class="list">${events
      .map((e) => `<li class="row tap ${e.done ? 'done' : ''}" ${e.action}><span class="time">${e.time ? esc(e.time) : '—'}</span><div class="grow"><div class="t">${esc(e.title)}</div><div class="s">${esc(e.sub)}</div></div></li>`)
      .join('')}</ul>${events.length ? '' : emptyMsg('Rien de prévu ce jour-là.')}</div>
    <div class="add-pill"><button class="btn soft" data-action="add-item" data-date="${sel}">${icon('plus')} Ajouter ce jour-là</button></div>
  </section>`;
}

/* ============================================================
   Argent
   ============================================================ */

function viewMoney() {
  const m = monthKey();
  const money = state.money;
  const b = monthBudget(m);
  const t = todayISO();
  const hidden = state.settings.hideBalance;
  const monthExpenses = money.expenses.filter((e) => e.date.startsWith(m)).sort((a, c) => c.date.localeCompare(a.date));

  const incomes = [
    ...money.recurringIncomes.map((inc) => ({ type: 'rec', inc, date: incomeNextDate(inc), got: false })),
    ...money.extraIncomes.filter((x) => !x.received).map((x) => ({ type: 'extra', inc: x, date: x.date, got: false })),
  ].sort((a, c) => (a.date || '9').localeCompare(c.date || '9'));
  const received = money.recurringIncomes.filter((i) => i.received.includes(m));

  const incomeRow = ({ type, inc, date }) => `<li class="row">
    <input type="checkbox" class="circle" data-action="${type === 'rec' ? 'toggle-income' : 'toggle-extra'}" data-id="${inc.id}" aria-label="Reçu" />
    <div class="grow tap" data-action="${type === 'rec' ? 'edit-income' : 'edit-extra'}" data-id="${inc.id}"><div class="t">${esc(inc.label)}</div><div class="s">${type === 'rec' ? esc(INCOME_KINDS[inc.kind] || '') : 'Exceptionnel'}</div></div>
    <div class="r"><div class="amt pos">${type === 'extra' ? '≈ ' : ''}${eur(inc.amount)}</div><div>le ${esc(fmtDate(date))}</div></div>
  </li>`;

  const unpaid = money.bills.map((bill) => ({ bill, ...billNextDue(bill) })).filter((x) => x.month === m).sort((a, c) => a.date.localeCompare(c.date));
  const paid = money.bills.filter((bill) => bill.paid.includes(m));
  const billRow = ({ bill, date }) => {
    const d = daysBetween(t, date);
    return `<li class="row">
      <input type="checkbox" class="circle" data-action="toggle-bill" data-id="${bill.id}" aria-label="Payé" />
      <div class="grow tap" data-action="edit-bill" data-id="${bill.id}"><div class="t">${esc(bill.label)}</div><div class="s">${esc(BILL_CATEGORIES[bill.category] || '')}${d < 0 ? ' · <span class="badge bad">en retard</span>' : d <= 3 ? ` · <span class="badge warn">${esc(inDays(d))}</span>` : ''}</div></div>
      <div class="r"><div class="amt neg">${eur(bill.amount)}</div><div>le ${esc(fmtDate(date))}</div></div>
    </li>`;
  };

  return `
  <header class="dark-head">
    <div class="head-row">
      <div><h1 class="title sparkle">Argent</h1><div class="subtitle">Gère ton budget, atteins tes objectifs.</div></div>
      ${backBtn('#/accueil', true)}
    </div>
    <div class="balance">
      <div class="lbl">Solde disponible</div>
      <div class="val ${b.remaining < 0 ? 'neg' : ''}"><span class="${hidden ? 'hide-amount' : ''}">${eur(b.remaining)}</span>
        <button class="icon-btn ghost sm" style="background:transparent;color:#fff" data-action="toggle-balance" aria-label="${hidden ? 'Afficher' : 'Masquer'} le solde">${icon(hidden ? 'eye-off' : 'eye')}</button></div>
      <div class="btn-row"><button class="pill-btn" data-action="budget-detail">Voir le détail ${icon('right')}</button><a class="pill-btn" href="#/graphiques">📊 Mes graphiques</a></div>
    </div>
  </header>
  <div class="sheet">
    <section class="section">
      ${secHead('Ce mois-ci', '#/graphiques', '📊 Graphiques')}
      <div class="card">
        <div class="split2">
          <div class="kpi"><div class="ico-box round good">${icon('euro')}</div><div><div class="k">Revenus</div><div class="v pos">${eur(b.income)}</div></div></div>
          <div class="sep"></div>
          <div class="kpi"><div class="ico-box round bad">${icon('receipt')}</div><div><div class="k">Dépenses</div><div class="v neg">−${eur(b.spent)}</div></div></div>
        </div>
        <div class="mt">${progressBar((b.spent / Math.max(1, b.income + b.carry)) * 100, b.remaining < 0 ? 'bad' : 'leo')}</div>
        <div class="between mt small"><span>Reste : <strong>${eur(b.remaining)}</strong></span><span class="muted">${b.daysLeft ? `~${eur(Math.max(0, b.remaining) / b.daysLeft)} / jour` : ''}</span></div>
      </div>

      ${secHead('Prochains revenus', 'data-action="add-income-choice"', 'Ajouter')}
      <div class="card flush"><ul class="list">${incomes.map(incomeRow).join('')}</ul>${incomes.length ? '' : emptyMsg('Ajoute ton salaire et la CAF.')}</div>
      ${received.length ? `<div class="group-label">Déjà reçu ce mois</div><div class="card flush"><ul class="list">${received
        .map((inc) => `<li class="row done"><input type="checkbox" class="circle" checked data-action="toggle-income" data-id="${inc.id}" aria-label="Reçu" /><div class="grow tap" data-action="edit-income" data-id="${inc.id}"><div class="t">${esc(inc.label)}</div></div><div class="amt pos">${eur(inc.amount)}</div></li>`)
        .join('')}</ul></div>` : ''}

      ${secHead('Dépenses à venir', 'data-action="add-bill"', 'Ajouter')}
      <div class="card flush"><ul class="list">${unpaid.map(billRow).join('')}</ul>${unpaid.length ? '' : emptyMsg('Tout est payé ce mois-ci ✨')}</div>
      ${paid.length ? `<div class="group-label">Déjà payé ce mois</div><div class="card flush"><ul class="list">${paid
        .map((bill) => `<li class="row done"><input type="checkbox" class="circle" checked data-action="toggle-bill" data-id="${bill.id}" aria-label="Payé" /><div class="grow tap" data-action="edit-bill" data-id="${bill.id}"><div class="t">${esc(bill.label)}</div></div><div class="amt">${eur(bill.amount)}</div></li>`)
        .join('')}</ul></div>` : ''}

      ${secHead('Dépenses du mois', 'data-action="add-expense"', 'Ajouter')}
      <div class="card flush"><ul class="list">${monthExpenses
        .map((e) => `<li class="row tap" data-action="edit-expense" data-id="${e.id}"><div class="ico-box">${icon('bag')}</div><div class="grow"><div class="t">${esc(e.label)}</div><div class="s">${esc(e.category)} · ${esc(fmtDate(e.date))}</div></div><div class="amt neg">− ${eur(e.amount)}</div></li>`)
        .join('')}</ul>${monthExpenses.length ? '' : emptyMsg('Aucune dépense ce mois-ci.')}</div>

      ${secHead('Épargne', 'data-action="add-saving"', 'Ajouter')}
      <div class="card flush"><ul class="list">${money.savings
        .map((s) => `<li class="row"><div class="ico-box pink">${icon('piggy')}</div><div class="grow tap" data-action="edit-saving" data-id="${s.id}"><div class="t">${esc(s.label)}</div><div class="s"><strong class="num" style="color:var(--text)">${eur(s.amount)}</strong>${s.goal ? ` / ${eur(s.goal)}` : ''}</div>${s.goal ? `<div style="margin-top:6px">${progressBar((s.amount / s.goal) * 100, 'pink')}</div>` : ''}</div><button class="btn sm soft" data-action="deposit-saving" data-id="${s.id}">Verser</button></li>`)
        .join('')}</ul>${money.savings.length ? '' : emptyMsg('Crée ta première épargne 🐷')}</div>

      ${secHead('Dettes', 'data-action="add-debt"', 'Ajouter')}
      <div class="card flush"><ul class="list">${money.debts
        .map((d) => `<li class="row"><div class="grow tap" data-action="edit-debt" data-id="${d.id}"><div class="t">${esc(d.label)}</div><div class="s"><strong class="num" style="color:var(--text)">${eur(d.remaining)}</strong> restants / ${eur(d.total)}</div><div style="margin-top:6px">${progressBar(((d.total - d.remaining) / (d.total || 1)) * 100)}</div></div>${d.remaining > 0 ? `<button class="btn sm" data-action="repay-debt" data-id="${d.id}">Rembourser</button>` : '🎉'}</li>`)
        .join('')}</ul>${money.debts.length ? '' : emptyMsg('Aucune dette 🎉')}</div>
    </section>
  </div>`;
}

function budgetDetail() {
  const b = monthBudget();
  openSheet(
    'Comment est calculé ton solde',
    `<ul class="list">
      <li class="row"><div class="grow">Solde au début du mois</div><span class="amt">${eur(b.carry)}</span><button class="icon-btn sm" data-action="edit-carry" aria-label="Modifier">${icon('pencil')}</button></li>
      <li class="row"><div class="grow">+ Revenus reçus</div><span class="amt pos">${eur(b.income)}</span></li>
      <li class="row"><div class="grow">− Loyer, factures, abonnements</div><span class="amt">${eur(b.charges)}</span></li>
      <li class="row"><div class="grow">− Dépenses du mois</div><span class="amt">${eur(b.expenses)}</span></li>
      <li class="row"><div class="grow"><strong>= Disponible jusqu’à la fin du mois</strong></div><span class="amt">${eur(b.remaining)}</span></li>
    </ul>
    ${b.expected ? `<p class="small muted">Encore attendu ce mois-ci : <strong>${eur(b.expected)}</strong> (pas encore compté).</p>` : ''}`,
  );
}

/* ============================================================
   Carrière
   ============================================================ */

function areaList(area, anchor) {
  const cfg = AREAS[area];
  const f = ui.areaFilter[area] || 'all';
  const list = itemsFor(area).filter((i) => !i.done && (f === 'all' || i.kind === f)).sort(byDateTime);
  return `<div id="${anchor}">
    ${secHead(`Tout ${area === 'travail' ? 'le pro' : area === 'ecole' ? "l'école" : 'le perso'}`, `data-action="add-item" data-area="${area}" data-kind="${f === 'all' ? '' : f}"`, 'Ajouter')}
    <div class="chips in-section">
      <button class="chip ${f === 'all' ? 'active' : ''}" data-action="area-filter" data-area="${area}" data-kind="all">Tout</button>
      ${Object.entries(cfg.kinds).map(([k, v]) => `<button class="chip ${f === k ? 'active' : ''}" data-action="area-filter" data-area="${area}" data-kind="${k}">${v.emoji} ${esc(v.label)}</button>`).join('')}
    </div>
    <div class="card flush"><ul class="list">${list.map((i) => taskRow(i)).join('')}</ul>${list.length ? '' : emptyMsg('Rien ici pour le moment.')}</div>
  </div>`;
}

function viewCareer() {
  const items = itemsFor('travail');
  const goal = topGoal('carriere');
  const apps = items.filter((i) => i.kind === 'candidature');
  const sent = apps.filter((i) => ['Envoyée', 'Relancée', 'Entretien', 'Offre', 'Refus'].includes(i.status)).length;
  const ongoing = apps.filter((i) => !i.done && !['Refus', 'Offre'].includes(i.status)).length;
  const talks = items.filter((i) => !i.done && (i.kind === 'contact' || i.status === 'Entretien')).length;
  const trainings = items.filter((i) => i.kind === 'formation' && !i.done && i.status !== 'Terminée').length;
  const projects = items.filter((i) => i.kind === 'projet' && !i.done);

  const action = (ic, title, sub, kind) => `<li class="row tap" data-action="area-filter" data-area="travail" data-kind="${kind}" data-scroll="pro-list">
    <div class="ico-box peach">${icon(ic)}</div><div class="grow"><div class="t">${title}</div><div class="s">${sub}</div></div><span class="chev">${icon('right')}</span></li>`;

  return `
  <header class="dark-head">
    <div class="head-row"><div><h1 class="title sparkle">Carrière</h1><div class="subtitle">Construis la vie pro que tu veux.</div></div>${backBtn('#/accueil', true)}</div>
    <div class="hero-card" data-action="${goal ? 'edit-goal' : 'add-goal'}" data-id="${goal?.id || ''}" data-category="carriere">
      <div class="row1"><div class="ico-box round pink">${icon('target')}</div><div><div class="h">${goal ? esc(goal.title) : 'Définis ton objectif carrière'}</div><div class="s">${goal?.date ? esc(cap(fmtMonth.format(parseISO(goal.date)))) : 'Touche pour le modifier'}</div></div></div>
      ${goal ? `<div class="between"><span>Avancement</span><strong style="color:#fff">${goal.progress} %</strong></div>${progressBar(goal.progress, 'on-ink')}` : ''}
    </div>
  </header>
  <div class="sheet">
    <section class="section">
      ${secHead('Mes actions')}
      <div class="card flush"><ul class="list">
        ${action('file', 'Candidatures', `${sent} envoyée${sent > 1 ? 's' : ''} · ${ongoing} en cours`, 'candidature')}
        ${action('users', 'Entretiens / Échanges', `${talks} à venir`, 'contact')}
        ${action('book', 'Formations', `${trainings} à suivre`, 'formation')}
      </ul></div>
      ${secHead('Mes projets', 'data-action="add-item" data-area="travail" data-kind="projet"', 'Ajouter')}
      <div class="card flush"><ul class="list">${projects
        .map((p) => `<li class="row tap" data-action="edit-item" data-id="${p.id}"><div class="ico-box">${icon('folder')}</div><div class="grow"><div class="t">${esc(p.title)}</div><div class="s">${esc(p.status || 'En cours')}</div></div><span class="chev">${icon('right')}</span></li>`)
        .join('')}</ul>${projects.length ? '' : emptyMsg('Ajoute tes projets en cours.')}</div>
      ${areaList('travail', 'pro-list')}
    </section>
  </div>`;
}

/* ============================================================
   École
   ============================================================ */

function viewSchool() {
  const sch = state.settings.school;
  const pct = schoolProgress();
  const t = todayISO();
  const items = itemsFor('ecole').filter((i) => !i.done);
  const deadlines = items.filter((i) => i.kind !== 'cours' && i.date).sort(byDateTime).slice(0, 6);
  const courses = items.filter((i) => i.kind === 'cours');
  const ic = { examen: 'school', rattrapage: 'calendar', toeic: 'book', devoir: 'file', echeance: 'clock', document: 'file' };

  return `
  <header class="dark-head">
    <div class="head-row"><div><h1 class="title sparkle">École</h1><div class="subtitle">Apprends aujourd’hui, construis demain.</div></div>${backBtn('#/accueil', true)}</div>
    <div class="hero-card" data-action="edit-school">
      <div class="row1"><div class="ico-box round pink">${icon('school')}</div><div><div class="h">${esc(sch.program || 'Ma formation')}</div><div class="s">${esc(sch.school || 'Touche pour renseigner ton école')}${sch.end ? ` – fin ${esc(fmtMonthShort.format(parseISO(sch.end)))}` : ''}</div></div></div>
      ${pct !== null ? `<div class="between"><span>Année en cours</span><strong style="color:#fff">${pct} %</strong></div>${progressBar(pct, 'on-ink')}` : ''}
    </div>
  </header>
  <div class="sheet">
    <section class="section">
      ${secHead('Mes échéances', 'data-action="add-item" data-area="ecole" data-kind="devoir"', 'Ajouter')}
      <div class="card flush"><ul class="list">${deadlines
        .map((i) => `<li class="row tap" data-action="edit-item" data-id="${i.id}"><div class="ico-box">${icon(ic[i.kind] || 'file')}</div><div class="grow"><div class="t">${esc(i.title)}</div><div class="s">${esc(i.notes || kindOf(i).label)}</div></div><div class="r">${esc(daysBetween(t, i.date) < 0 ? 'en retard' : dayLabel(i.date))}</div></li>`)
        .join('')}</ul>${deadlines.length ? '' : emptyMsg('Aucune échéance à venir.')}</div>
      ${secHead('Mes cours / projets', 'data-action="add-item" data-area="ecole" data-kind="cours"', 'Ajouter')}
      <div class="card flush"><ul class="list">${courses
        .map((i) => `<li class="row tap" data-action="edit-item" data-id="${i.id}"><div class="ico-box peach">${icon('book')}</div><div class="grow"><div class="t">${esc(i.title)}</div><div class="s">${esc(i.notes || i.status || '')}</div></div>${i.status ? `<span class="status pink">${esc(i.status)}</span>` : ''}</li>`)
        .join('')}</ul>${courses.length ? '' : emptyMsg('Ajoute tes cours et projets.')}</div>
      ${areaList('ecole', 'school-list')}
    </section>
  </div>`;
}

/* ============================================================
   Voyages
   ============================================================ */

function viewTrips() {
  const trip = nextTrip();
  const t = todayISO();
  const order = (tr) => (tr.status === 'Terminé' ? 2 : tr.start ? 0 : 1);
  const trips = state.trips.slice().sort((a, b) => order(a) - order(b) || (a.start || '').localeCompare(b.start || ''));
  const spent = trip ? tripSpent(trip) : 0;
  const datesLabel = (tr) => (tr.start ? `Du ${parseISO(tr.start).getDate()}${tr.end ? ` au ${fmtLongNoYear.format(parseISO(tr.end)).replace(/^\S+ /, '')}` : ''} ${parseISO(tr.end || tr.start).getFullYear()}` : 'Dates à définir');

  return `
  <header class="dark-head">
    <div class="head-row"><div><h1 class="title sparkle">Voyages</h1><div class="subtitle">Découvre le monde, à ton rythme.</div></div><div class="btn-row"><a class="pill-btn" href="#/carte">🗺️ Ma carte</a>${backBtn('#/accueil', true)}</div></div>
    ${trip ? `<a class="photo-card ${trip.image ? '' : 'no-photo'}" href="#/voyage/${trip.id}" ${trip.image ? `style="background-image:url('${esc(trip.image)}')"` : ''}>
      <div class="k">Prochain voyage${trip.start && trip.start >= t ? ` · J-${daysBetween(t, trip.start)}` : ''}</div>
      <div class="h">${esc(trip.destination)} ${esc(trip.emoji || '')}</div>
      <div class="k">${esc(datesLabel(trip))}</div>
      <span class="edit icon-btn ghost sm" style="background:rgba(255,255,255,.2);color:#fff">${icon('pencil')}</span>
    </a>` : `<button class="photo-card no-photo" data-action="add-trip" style="border:0;color:#fff;text-align:left;width:100%"><div class="h">Ton prochain voyage ✈️</div><div class="k">Touche pour l’ajouter</div></button>`}
  </header>
  <div class="sheet">
    <section class="section">
      ${trip ? `${secHead('Budget', `#/voyage/${trip.id}`)}
      <div class="card">
        <div class="between"><span style="font-size:22px;font-weight:800">${eur(spent)} <span class="muted small">/ ${eur(trip.budget)}</span></span></div>
        <div class="mt">${progressBar((spent / (trip.budget || 1)) * 100, spent > trip.budget ? 'bad' : 'leo')}</div>
        <div class="small mt">Reste : <strong>${eur((trip.budget || 0) - spent)}</strong></div>
      </div>` : ''}
      ${secHead('Mes voyages', 'data-action="add-trip"', 'Ajouter')}
      <div class="card flush"><ul class="list">${trips
        .map((tr) => `<li class="row tap" data-action="goto" data-href="#/voyage/${tr.id}"><div class="ico-box round" style="font-size:22px">${esc(tr.emoji || '✈️')}</div><div class="grow"><div class="t">${esc(tr.destination)}</div><div class="s">${tr.start ? esc(cap(fmtMonthShort.format(parseISO(tr.start)))) : esc(tr.notes || 'Dates à définir')}</div></div><span class="status ${TRIP_STATUS_CLASS[tr.status] || ''}">${tr.status === 'Planifié' || tr.status === 'Réservé' ? '✓ ' : ''}${esc(tr.status)}</span></li>`)
        .join('')}</ul>${trips.length ? '' : emptyMsg('Où as-tu envie d’aller ?')}</div>
    </section>
  </div>`;
}

function viewTrip(id) {
  const tr = findById(state.trips, id);
  if (!tr) return viewTrips();
  const t = todayISO();
  const spent = tripSpent(tr);
  const doneCount = tr.checklist.filter((c) => c.done).length;
  return `
  <header class="dark-head">
    <div class="head-row"><div><h1 class="title">${esc(tr.destination)} ${esc(tr.emoji || '')}</h1><div class="subtitle">${tr.start ? `${esc(fmtDate(tr.start))}${tr.end ? ` → ${esc(fmtDate(tr.end))}` : ''}` : 'Dates à définir'} · <span class="status ${TRIP_STATUS_CLASS[tr.status] || ''}">${esc(tr.status)}</span></div></div>${backBtn('#/voyages', true)}</div>
    <div class="photo-card ${tr.image ? '' : 'no-photo'}" data-action="edit-trip" data-id="${tr.id}" ${tr.image ? `style="background-image:url('${esc(tr.image)}')"` : ''}>
      ${tr.start && tr.start >= t ? `<div class="h">J-${daysBetween(t, tr.start)}</div><div class="k">avant le départ</div>` : `<div class="k">Touche pour ajouter une photo</div>`}
      <span class="edit icon-btn ghost sm" style="background:rgba(255,255,255,.2);color:#fff">${icon('pencil')}</span>
    </div>
  </header>
  <div class="sheet">
    <section class="section">
      ${secHead('Budget')}
      <div class="card">
        <div style="font-size:22px;font-weight:800">${eur(spent)} <span class="muted small">/ ${eur(tr.budget)}</span></div>
        <div class="mt">${progressBar((spent / (tr.budget || 1)) * 100, spent > tr.budget ? 'bad' : 'leo')}</div>
        <div class="small mt">Reste : <strong>${eur((tr.budget || 0) - spent)}</strong></div>
      </div>
      ${secHead('Billets & hôtels', `data-action="add-booking" data-trip="${tr.id}"`, 'Ajouter')}
      <div class="card flush"><ul class="list">${tr.bookings
        .map((b) => `<li class="row tap" data-action="edit-booking" data-trip="${tr.id}" data-id="${b.id}"><div class="grow"><div class="t">${esc(b.label)}</div><div class="s">${esc(BOOKING_KINDS[b.kind] || '')}</div></div><div class="r"><div class="amt">${eur(b.cost)}</div><span class="status ${b.booked ? 'good' : 'warn'}">${b.booked ? '✓ Réservé' : 'À réserver'}</span></div></li>`)
        .join('')}</ul>${tr.bookings.length ? '' : emptyMsg('Aucune réservation.')}</div>
      ${secHead(`Checklist · ${doneCount}/${tr.checklist.length}`)}
      <div class="card flush"><ul class="list">${tr.checklist
        .map((c) => `<li class="row ${c.done ? 'done' : ''}"><input type="checkbox" class="circle" data-action="toggle-check" data-trip="${tr.id}" data-id="${c.id}" ${c.done ? 'checked' : ''} aria-label="Fait" /><div class="grow"><div class="t">${esc(c.text)}</div></div><button class="icon-btn sm" data-action="del-check" data-trip="${tr.id}" data-id="${c.id}" aria-label="Retirer">${icon('x')}</button></li>`)
        .join('')}</ul>
        <form class="inline-add" data-form="add-check" data-trip="${tr.id}" style="padding-bottom:12px"><input class="input" name="text" placeholder="Ajouter à la checklist…" autocomplete="off" /><button class="btn sm pink" type="submit">Ajouter</button></form>
      </div>
      ${secHead('🎵 Mes TikToks pour ce voyage', `data-action="add-insp" data-trip="${tr.id}" data-collection="✈️ Voyages"`, 'Ajouter')}
      ${(() => {
        const its = state.inspirations.items.filter((it) => it.tripId === tr.id);
        return its.length ? `<div class="insp-grid">${its.map(inspCard).join('')}</div>` : `<div class="card">${emptyMsg('Restos, spots photo, hôtels… garde tes TikToks ici.')}</div>`;
      })()}
      ${tr.notes ? `${secHead('Documents & notes')}<div class="card small" style="white-space:pre-wrap">${esc(tr.notes)}</div>` : ''}
      <div class="add-pill btn-row" style="justify-content:center"><button class="btn soft" data-action="edit-trip" data-id="${tr.id}">${icon('pencil')} Modifier le voyage</button><button class="btn ghost" data-action="map-pick" data-id="${tr.id}">📍 ${typeof tr.lat === 'number' ? 'Déplacer' : 'Placer'} sur la carte</button></div>
    </section>
  </div>`;
}

/* ============================================================
   Objectifs
   ============================================================ */

function viewGoals() {
  const dreams = state.manifest.dreams;
  const used = Object.keys(DREAM_CATEGORIES).filter((k) => dreams.some((d) => d.category === k));
  const f = ui.goalFilter;
  const list = dreams.filter((d) => f === 'all' || d.category === f).sort((a, b) => Number(a.manifested) - Number(b.manifested) || b.progress - a.progress);
  return `
  <header class="head">
    <div class="head-row"><div><h1 class="title sparkle">Objectifs</h1><div class="subtitle">Petits pas, grands rêves.</div></div>${backBtn('#/accueil')}</div>
  </header>
  <div class="chips">
    <button class="chip ${f === 'all' ? 'active' : ''}" data-action="goal-filter" data-filter="all">Tous</button>
    ${used.map((k) => `<button class="chip ${f === k ? 'active' : ''}" data-action="goal-filter" data-filter="${k}">${esc(DREAM_CATEGORIES[k].label)}</button>`).join('')}
  </div>
  <section class="section" style="margin-top:8px">
    ${list.map(goalCard).join('') || `<div class="card">${emptyMsg('Quel est ton prochain grand rêve ?')}</div>`}
    <button class="btn pink block" data-action="add-goal" data-category="${f === 'all' ? '' : f}">${icon('plus')} Ajouter un objectif</button>
  </section>`;
}

/* ============================================================
   Manifestation
   ============================================================ */

function viewManifest() {
  const mf = state.manifest;
  const aff = affirmationOfDay();
  const t = todayISO();
  const g = mf.gratitude[t] || [];
  const streak = gratitudeStreak();
  const dreams = mf.dreams.slice().sort((a, b) => Number(a.manifested) - Number(b.manifested));
  const history = Object.keys(mf.gratitude)
    .filter((d) => d < t && mf.gratitude[d].some((x) => x.trim()))
    .sort()
    .reverse()
    .slice(0, 5);

  return `
  <section class="mani-hero">
    <div class="between" style="margin-bottom:6px"><span></span>${backBtn('#/menu', true)}</div>
    <div class="date">${esc(cap(fmtLong.format(new Date())))}</div>
    <h1>Tu fais déjà un super travail <span class="heart">♥</span></h1>
    <div class="stickers">${STICKERS.map(([w, r]) => `<div class="sticker" style="--rot:${r}">${w}</div>`).join('')}</div>
  </section>

  ${aff ? `<div class="aff-card"><div class="inner">
    <div class="kicker">✦ Mon affirmation du jour ✦</div>
    <blockquote>« ${esc(aff.text)} »</blockquote>
    ${mf.affirmations.length > 1 ? '<button class="btn sm soft" data-action="next-affirmation">🔄 Une autre</button>' : ''}
  </div></div>` : ''}

  <section class="section">
    ${secHead('🙏 Gratitude du jour', '', '')}
    <div class="card">
      <form class="grat" data-form="gratitude">
        ${[0, 1, 2].map((i) => `<label><span class="n">${i + 1}</span><input class="input" name="g${i}" value="${esc(g[i] || '')}" placeholder="${['Je suis reconnaissante pour…', 'Une personne qui compte…', 'Une petite victoire…'][i]}" autocomplete="off" /></label>`).join('')}
        <div class="between"><span class="small muted">${streak ? `🔥 ${plural(streak, 'jour')} de suite` : 'Commence ta série aujourd’hui'}</span><button class="btn sm pink" type="submit">Enregistrer</button></div>
      </form>
      ${history.length ? `<div class="group-label">Les jours précédents</div>${history.map((d) => `<div class="small" style="padding:6px 4px"><strong>${esc(cap(fmtLongNoYear.format(parseISO(d))))}</strong> — ${mf.gratitude[d].filter((x) => x.trim()).map(esc).join(' · ')}</div>`).join('')}` : ''}
    </div>

    ${secHead('💖 Mon vision board', '#/objectifs', 'Objectifs')}
    <div class="dreams">
      ${dreams
        .map((d) => `<div class="dream" data-action="edit-goal" data-id="${d.id}" role="button" tabindex="0" ${d.image ? `style="background-image:url('${esc(d.image)}')"` : ''}>
          ${d.image ? '' : `<span class="emo">${esc(d.emoji || '✨')}</span>`}
          ${d.manifested ? '<span class="ribbon">Réalisé ✨</span>' : ''}
          <div class="txt">${d.image ? `${esc(d.emoji || '')} ` : ''}${esc(d.title)}</div>
        </div>`)
        .join('')}
      <button class="dream-add" data-action="add-goal">+ Ajouter un rêve</button>
    </div>

    ${secHead('💬 Mes affirmations', '', '')}
    <div class="card flush">
      <ul class="list">${mf.affirmations
        .map((a) => `<li class="row"><div class="grow"><div class="t" style="font-style:italic;font-weight:500">${esc(a.text)}</div></div><button class="icon-btn sm" data-action="del-affirmation" data-id="${a.id}" aria-label="Retirer">${icon('x')}</button></li>`)
        .join('')}</ul>
      <form class="inline-add" data-form="add-affirmation" style="padding-bottom:12px"><input class="input" name="text" placeholder="J’attire… / Je suis… / Je mérite…" autocomplete="off" /><button class="btn sm pink" type="submit">Ajouter</button></form>
    </div>
  </section>`;
}

/* ============================================================
   Perso (vie quotidienne)
   ============================================================ */

function viewPerso() {
  const dow = new Date().getDay();
  const subs = state.money.bills.filter((b) => ['abonnement', 'facture'].includes(b.category)).sort((a, b) => a.day - b.day);
  return `
  <header class="head">
    <div class="head-row"><div><h1 class="title sparkle">Perso</h1><div class="subtitle">Courses, admin, routines & abonnements.</div></div>${backBtn('#/menu')}</div>
  </header>
  <section class="section">
    ${secHead('Mes routines', 'data-action="add-routine"', 'Ajouter')}
    <div class="card flush"><ul class="list">${state.routines
      .map((r) => `<li class="row tap" data-action="edit-routine" data-id="${r.id}"><div class="ico-box">${esc(r.emoji)}</div><div class="grow"><div class="t">${esc(r.label)}</div><div class="s">${[1, 2, 3, 4, 5, 6, 0].filter((d) => r.days.includes(d)).map((d) => WEEKDAYS[d]).join(' · ') || 'Aucun jour'}${r.time ? ` · ${esc(fmtTime(r.time))}` : ''}</div></div>${r.days.includes(dow) ? '<span class="badge pink">aujourd’hui</span>' : ''}</li>`)
      .join('')}</ul>${state.routines.length ? '' : emptyMsg('Sport, skincare, lecture…')}</div>
    ${areaList('quotidien', 'perso-list')}
    ${secHead('Abonnements & factures', 'data-action="add-bill" data-category="abonnement"', 'Ajouter')}
    <div class="card flush"><ul class="list">${subs
      .map((b) => `<li class="row tap" data-action="edit-bill" data-id="${b.id}"><div class="ico-box">${icon('receipt')}</div><div class="grow"><div class="t">${esc(b.label)}</div><div class="s">${esc(BILL_CATEGORIES[b.category])} · le ${b.day}</div></div><div class="amt">${eur(b.amount)}</div></li>`)
      .join('')}</ul>${subs.length ? `<div class="between small" style="padding:10px 2px"><span class="muted">Total par mois</span><strong>${eur(sum(subs, (b) => b.amount))}</strong></div>` : emptyMsg('Téléphone, streaming, salle de sport…')}</div>
  </section>`;
}

function viewDocuments() {
  const docs = state.items.filter((i) => ['document', 'renouvellement', 'demarche'].includes(i.kind)).sort(byDateTime);
  return `
  <header class="head">
    <div class="head-row"><div><h1 class="title sparkle">Mes documents</h1><div class="subtitle">Papiers, renouvellements, démarches.</div></div>${backBtn('#/menu')}</div>
  </header>
  <section class="section">
    <div class="card flush"><ul class="list">${docs.map((i) => taskRow(i)).join('')}</ul>${docs.length ? '' : emptyMsg('Aucun document suivi.')}</div>
    <div class="add-pill"><button class="btn soft" data-action="add-item" data-area="quotidien" data-kind="renouvellement">${icon('plus')} Ajouter un document</button></div>
  </section>`;
}


/* ============================================================
   Prière : chapelet, neuvaines, intentions
   ============================================================ */

const novenaDay = (n, date = todayISO()) => daysBetween(n.start, date) + 1;
const novenaDoneCount = (n) => Object.keys(n.done || {}).length;
function novenaState(n) {
  const day = novenaDay(n);
  if (novenaDoneCount(n) >= n.days) return 'finished';
  if (day < 1) return 'upcoming';
  if (day > n.days) return 'ended';
  return 'active';
}
const activeNovenas = () => state.prayer.novenas.filter((n) => novenaState(n) === 'active');

function rosaryStreak() {
  const log = state.prayer.rosary.log;
  let d = todayISO();
  if (!log[d]) d = addDays(d, -1);
  let n = 0;
  while (log[d]) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

function novenaForm(n) {
  openForm({
    title: n ? 'Modifier la neuvaine' : 'Nouvelle neuvaine 🙏',
    fields: [
      { name: 'name', label: 'Nom de la neuvaine', placeholder: 'Écris-le, ou choisis ci-dessous' },
      { name: 'template', label: 'Ou choisis dans la liste', type: 'select', options: [['', '—'], ...NOVENA_TEMPLATES.map((x) => [x, x])] },
      { name: 'intention', label: 'Mon intention', type: 'textarea', placeholder: 'Pour qui, pour quoi je prie…' },
      { name: 'start', label: 'Premier jour', type: 'date', required: true },
      { name: 'days', label: 'Nombre de jours', type: 'number' },
      { name: 'time', label: 'Heure du rappel (notifications)', type: 'time' },
      { name: 'text', label: 'Texte de la prière (à coller)', type: 'textarea', placeholder: 'Colle ici la prière de la neuvaine, pour l’avoir sous la main.' },
      { name: 'link', label: 'Lien vers le texte (optionnel)', type: 'url', placeholder: 'https://…' },
    ],
    values: n || { start: todayISO(), days: 9, time: '21:00' },
    onSubmit: (d) => {
      d.name = d.name || d.template || 'Neuvaine';
      delete d.template;
      d.days = clamp(Math.round(d.days) || 9, 1, 54);
      if (n) Object.assign(n, d);
      else state.prayer.novenas.push({ id: uid(), done: {}, ...d });
      commit('Neuvaine enregistrée 🙏');
    },
    onDelete: n
      ? () => {
          state.prayer.novenas = state.prayer.novenas.filter((x) => x !== n);
          commit('Neuvaine supprimée');
        }
      : null,
  });
}

function novenaCard(n) {
  const st = novenaState(n);
  const today = novenaDay(n);
  const dots = Array.from({ length: n.days }, (_, i) => {
    const k = i + 1;
    const cls = n.done?.[k] ? 'on' : k === today ? 'today' : k < today ? 'missed' : '';
    return `<button class="nov-dot ${cls}" data-action="novena-day" data-id="${n.id}" data-day="${k}" aria-label="Jour ${k}">${k}</button>`;
  }).join('');
  const missed = st === 'active' || st === 'ended' ? Array.from({ length: Math.min(today - 1, n.days) }, (_, i) => i + 1).filter((k) => !n.done?.[k]).length : 0;
  const status = {
    finished: '<span class="status pink">✨ Neuvaine terminée</span>',
    upcoming: `<span class="status info">Commence ${esc(dayLabel(n.start).toLowerCase())}</span>`,
    ended: `<span class="status muted">Terminée le ${esc(fmtDate(addDays(n.start, n.days - 1)))}</span>`,
    active: `<span class="status pink">Jour ${today}/${n.days}</span>`,
  }[st];
  return `<div class="card stack">
    <div class="between"><div class="grow tap" data-action="edit-novena" data-id="${n.id}"><div class="t" style="font-weight:700">${esc(n.name)}</div>${n.intention ? `<div class="small muted">🕊️ ${esc(n.intention)}</div>` : ''}</div>${status}</div>
    <div class="nov-dots">${dots}</div>
    ${missed ? `<div class="small muted">${plural(missed, 'jour manqué', 'jours manqués')} — touche un rond pour le rattraper.</div>` : ''}
    <div class="btn-row">
      ${st === 'active' ? (n.done?.[today] ? '<span class="badge good">Prié aujourd’hui ✓</span>' : `<button class="btn sm pink" data-action="novena-day" data-id="${n.id}" data-day="${today}">J’ai prié aujourd’hui 🙏</button>`) : ''}
      ${n.text ? `<button class="btn sm soft" data-action="novena-text" data-id="${n.id}">Lire la prière</button>` : ''}
      ${n.link ? `<a class="btn sm ghost" href="${esc(n.link)}" target="_blank" rel="noopener">Ouvrir le lien ↗</a>` : ''}
    </div>
  </div>`;
}

function viewPrayer() {
  const t = todayISO();
  const r = state.prayer.rosary;
  const set = r.current?.set || MYSTERY_OF_DAY[new Date().getDay()];
  const steps = rosarySteps(set);
  const cur = r.current && r.current.step < steps.length ? steps[r.current.step] : null;
  const month = monthKey();
  const monthCount = sum(Object.entries(r.log).filter(([d]) => d.startsWith(month)), ([, v]) => v);
  const streak = rosaryStreak();
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(t, i - 13));
  const novenas = state.prayer.novenas.slice().sort((a, b) => ['active', 'upcoming', 'ended', 'finished'].indexOf(novenaState(a)) - ['active', 'upcoming', 'ended', 'finished'].indexOf(novenaState(b)));
  const intentions = state.prayer.intentions.slice().sort((a, b) => Number(a.answered) - Number(b.answered));

  return `
  <header class="dark-head prayer-head">
    <div class="head-row"><div><h1 class="title">Prière <span style="color:var(--pink-2)">✝</span></h1><div class="subtitle">Un temps rien qu’à toi et Dieu.</div></div>${backBtn('#/menu', true)}</div>
    <a class="hero-card" href="#/chapelet" style="display:block">
      <div class="row1"><div class="ico-box round pink" style="font-size:22px">📿</div><div><div class="h">Chapelet · ${esc(MYSTERIES[set].label)}</div><div class="s">${cur ? `En cours : ${cur.decade ? `dizaine ${cur.decade}/5` : 'introduction'} — touche pour reprendre` : r.log[t] ? 'Déjà prié aujourd’hui ✨ — encore un ?' : 'Touche pour commencer'}</div></div></div>
      ${cur ? progressBar((r.current.step / steps.length) * 100, 'on-ink') : ''}
    </a>
  </header>
  <div class="sheet">
    <section class="section">
      <div class="tiles" style="padding:6px 0 0">
        <div class="tile"><div class="label">Ce mois-ci</div><div class="big">${plural(monthCount, 'chapelet')}</div><div class="small">📿 prié${monthCount > 1 ? 's' : ''}</div></div>
        <div class="tile peach"><div class="label">Série</div><div class="big">${plural(streak, 'jour')}</div><div class="small">${streak ? 'd’affilée, bravo 🔥' : 'commence aujourd’hui'}</div></div>
      </div>
      <div class="card mt"><div class="small muted" style="margin-bottom:8px">Les 14 derniers jours</div><div class="days14">${last14.map((d) => `<span class="${r.log[d] ? 'on' : ''} ${d === t ? 'today' : ''}" title="${esc(fmtDate(d))}">${parseISO(d).getDate()}</span>`).join('')}</div>
        <form class="between mt" data-form="rosary-prefs" style="flex-wrap:wrap">
          <label class="field-check small" style="display:flex;gap:8px;align-items:center"><input type="checkbox" class="circle" name="daily" ${r.daily ? 'checked' : ''} /> Chapelet chaque jour</label>
          <span class="btn-row" style="align-items:center"><input class="input" type="time" name="time" value="${esc(r.time || '')}" style="width:auto;padding:6px 10px" aria-label="Heure du rappel" /><button class="btn sm soft" type="submit">OK</button></span>
        </form>
      </div>

      ${secHead('🙏 Mes neuvaines', 'data-action="add-novena"', 'Ajouter')}
      <div class="stack">${novenas.map(novenaCard).join('') || `<div class="card">${emptyMsg('Commence une neuvaine : 9 jours de prière pour une intention.')}</div>`}</div>

      ${secHead('🕊️ Mes intentions')}
      <div class="card flush">
        <ul class="list">${intentions
          .map((it) => `<li class="row ${it.answered ? 'done' : ''}"><input type="checkbox" class="circle" data-action="toggle-intention" data-id="${it.id}" ${it.answered ? 'checked' : ''} aria-label="Exaucée" /><div class="grow"><div class="t">${esc(it.text)}</div><div class="s">${it.answered ? '✨ Exaucée — merci Seigneur' : `depuis le ${esc(fmtDate(it.date))}`}</div></div><button class="icon-btn sm" data-action="del-intention" data-id="${it.id}" aria-label="Retirer">${icon('x')}</button></li>`)
          .join('')}</ul>
        <form class="inline-add" data-form="add-intention" style="padding-bottom:12px"><input class="input" name="text" placeholder="Je confie à Dieu…" autocomplete="off" /><button class="btn sm pink" type="submit">Ajouter</button></form>
      </div>

      ${secHead('📖 Mes prières')}
      <div class="card flush prayers">${['croix', 'pater', 'ave', 'gloria', 'credo', 'fatima', 'salve']
        .map((k) => `<details><summary>${esc(PRAYERS[k].title)}</summary><p>${esc(PRAYERS[k].text)}</p></details>`)
        .join('')}</div>
    </section>
  </div>`;
}

function viewRosary() {
  const r = state.prayer.rosary;
  const set = r.current?.set || MYSTERY_OF_DAY[new Date().getDay()];
  const steps = rosarySteps(set);
  const i = clamp(r.current?.step || 0, 0, steps.length - 1);
  const s = steps[i];
  const decadeBeads = s.decade
    ? Array.from({ length: 10 }, (_, k) => `<i class="${s.bead === 'small' && k < s.n ? 'on' : ''} ${s.bead === 'small' && k + 1 === s.n ? 'now' : ''} ${s.bead === 'none' && steps[i].prayers.includes('gloria') ? 'on' : ''}"></i>`).join('')
    : s.of === 3
      ? Array.from({ length: 3 }, (_, k) => `<i class="${k < s.n ? 'on' : ''} ${k + 1 === s.n ? 'now' : ''}"></i>`).join('')
      : '';
  const decades = Array.from({ length: 5 }, (_, d) => `<span class="${s.decade > d + 1 || (!s.decade && i > 6) ? 'on' : ''} ${s.decade === d + 1 ? 'now' : ''}"></span>`).join('');
  const texts = s.prayers.map((k) => `<p><strong>${esc(PRAYERS[k].title)}</strong><br>${esc(PRAYERS[k].text)}</p>`).join('');

  return `
  <section class="rosary">
    <div class="between"><a class="icon-btn ghost" href="#/priere" aria-label="Retour">${icon('left')}</a><span class="small" style="opacity:.8">${esc(MYSTERIES[set].label)}</span><button class="icon-btn ghost" data-action="rosary-reset" aria-label="Recommencer">↺</button></div>
    <div class="chips">${Object.entries(MYSTERIES)
      .map(([k, m]) => `<button class="chip ${k === set ? 'active' : ''}" data-action="rosary-set" data-set="${k}">${esc(m.adj[0].toUpperCase() + m.adj.slice(1))}</button>`)
      .join('')}</div>
    <div class="decades">${decades}</div>
    <button class="rosary-tap" data-action="rosary-next" aria-label="Grain suivant">
      ${s.mystery ? `<div class="mystery">✦ ${esc(s.mystery)}</div>` : ''}
      <div class="step-label">${esc(s.label)}</div>
      ${s.n ? `<div class="count">${s.n}<span>/${s.of}</span></div>` : `<div class="count" style="font-size:44px">${s.bead === 'cross' ? '✝' : s.bead === 'big' ? '●' : '✦'}</div>`}
      ${decadeBeads ? `<div class="beads">${decadeBeads}</div>` : ''}
      <div class="tap-hint">Touche pour avancer</div>
    </button>
    <div class="between" style="margin-top:14px">
      <button class="btn ghost sm" style="color:#fff;border-color:rgba(255,255,255,.3)" data-action="rosary-prev" ${i === 0 ? 'disabled' : ''}>◀ Retour</button>
      <span class="small" style="opacity:.75">${i + 1} / ${steps.length}</span>
      <button class="btn ghost sm" style="color:#fff;border-color:rgba(255,255,255,.3)" data-action="rosary-toggle-text">${ui.showPrayerText ? 'Masquer' : 'Afficher'} le texte</button>
    </div>
    ${ui.showPrayerText && texts ? `<div class="prayer-text">${texts}</div>` : ''}
  </section>`;
}


/* ============================================================
   TOEIC
   ============================================================ */

// Répétition espacée : jours avant la prochaine révision selon la boîte (0 à 5).
const SRS_DAYS = [0, 1, 3, 7, 14, 30];
const NEW_CARDS_PER_DAY = 10;
const TEST_MINUTES = 20;
const QUESTION_BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
const QUESTION_INDEX = Object.fromEntries(QUESTIONS.map((q, i) => [q.id, i]));
const GRAMMAR_BY_ID = Object.fromEntries(GRAMMAR.map((g) => [g.id, g]));
const tq = () => state.toeic;
const sectionOf = (q) => TOEIC_PARTS[q.part].section;
const ofPart = (...parts) => (q) => parts.includes(q.part);
const LETTERS = ['A', 'B', 'C', 'D'];

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const allWords = () => [...tq().myWords, ...VOCAB];
const wordById = (id) => allWords().find((w) => w.id === id);
const wordsOf = (theme) => allWords().filter((w) => theme === 'all' || w.theme === theme);

function cardsToReview(theme = 'all') {
  const t = todayISO();
  const words = wordsOf(theme);
  const due = words.filter((w) => tq().cards[w.id] && tq().cards[w.id].due <= t);
  const left = Math.max(0, NEW_CARDS_PER_DAY - (tq().log[t]?.newCards || 0));
  const fresh = words.filter((w) => !tq().cards[w.id]).slice(0, left);
  return { due, fresh, total: due.length + fresh.length };
}

function toeicLog(date = todayISO()) {
  return (tq().log[date] ||= { q: 0, ok: 0, cards: 0, newCards: 0 });
}

const roundScore = (acc) => Math.round((5 + acc * 490) / 5) * 5;
function sectionEstimate(sec) {
  const r = tq().recent[sec] || [];
  if (r.length < 10) return null;
  return roundScore(sum(r) / r.length);
}
function toeicEstimate() {
  const L = sectionEstimate('L');
  const R = sectionEstimate('R');
  return { L, R, total: L !== null && R !== null ? L + R : null };
}
const levelOf = (score) => TOEIC_LEVELS.find((l) => score >= l.min);

function toeicStreak() {
  const log = tq().log;
  const active = (d) => (log[d]?.q || 0) + (log[d]?.cards || 0) > 0;
  let d = todayISO();
  if (!active(d)) d = addDays(d, -1);
  let n = 0;
  while (active(d)) {
    n++;
    d = addDays(d, -1);
  }
  return n;
}

function partStats(filter) {
  let n = 0;
  let ok = 0;
  let seen = 0;
  let total = 0;
  for (const q of QUESTIONS) {
    if (!filter(q)) continue;
    total++;
    const s = tq().stats[q.id];
    if (!s) continue;
    seen++;
    n += s.n;
    ok += s.ok;
  }
  return { pct: n ? Math.round((ok / n) * 100) : null, seen, total };
}

// Les questions jamais vues ou souvent ratées passent en premier.
function priority(id) {
  const s = tq().stats[id];
  return (s ? 1 + s.ok / s.n : 0) + Math.random() * 0.6;
}
function pickSingles(filter, n) {
  return QUESTIONS.filter(filter)
    .map((q) => [q.id, priority(q.id)])
    .sort((a, b) => a[1] - b[1])
    .slice(0, n)
    .map(([id]) => id);
}
function pickGroups(filter, k) {
  const groups = {};
  for (const q of QUESTIONS.filter(filter)) (groups[q.group] ||= []).push(q.id);
  return Object.values(groups)
    .map((ids) => [ids, sum(ids, priority) / ids.length])
    .sort((a, b) => a[1] - b[1])
    .slice(0, k)
    .flatMap(([ids]) => ids);
}
const inExamOrder = (ids) => [...new Set(ids)].sort((a, b) => QUESTION_INDEX[a] - QUESTION_INDEX[b]);

function buildSession(mode) {
  const [kind, arg] = mode.split(':');
  const errors = tq().errors.filter((id) => QUESTION_BY_ID[id]);
  if (kind === 'part') {
    const grouped = ['p3', 'p4', 'p6', 'p7'].includes(arg);
    const ids = grouped ? pickGroups(ofPart(arg), arg === 'p6' ? 2 : 3) : pickSingles(ofPart(arg), 10);
    return { title: TOEIC_PARTS[arg].label, ids: inExamOrder(ids) };
  }
  if (kind === 'gram') return { title: `Grammaire · ${GRAMMAR_BY_ID[arg].title}`, ids: shuffle(pickSingles((q) => q.part === 'p5' && q.t === arg, 10)) };
  if (kind === 'errors') return { title: 'Mes erreurs', ids: inExamOrder(shuffle(errors).slice(0, 15)) };
  if (kind === 'test') {
    const ids = [...pickSingles(ofPart('p2'), 5), ...pickGroups(ofPart('p3'), 1), ...pickGroups(ofPart('p4'), 1), ...pickSingles(ofPart('p5'), 8), ...pickGroups(ofPart('p6'), 1), ...pickGroups(ofPart('p7'), 1)];
    return { title: 'Mini test', ids: inExamOrder(ids), timed: true, endAt: Date.now() + TEST_MINUTES * 60000 };
  }
  // Séance du jour : un peu de tout, avec quelques erreurs à retravailler.
  const ids = [...shuffle(errors).slice(0, 3), ...pickSingles(ofPart('p2'), 3), ...pickGroups(ofPart('p3', 'p4'), 1), ...pickSingles(ofPart('p5'), 5), ...pickGroups(ofPart('p6', 'p7'), 1)];
  return { title: 'Séance du jour', ids: inExamOrder(ids) };
}

function recordAnswer(q, ok) {
  const T = tq();
  const t = todayISO();
  const s = (T.stats[q.id] ||= { n: 0, ok: 0, last: '' });
  s.n++;
  if (ok) s.ok++;
  s.last = t;
  const sec = sectionOf(q);
  T.recent[sec] = [...(T.recent[sec] || []), ok ? 1 : 0].slice(-60);
  const lg = toeicLog(t);
  lg.q++;
  if (ok) lg.ok++;
  if (ok) T.errors = T.errors.filter((x) => x !== q.id);
  else if (!T.errors.includes(q.id)) T.errors.push(q.id);
}

function sessionScore(z) {
  const res = { L: [0, 0], R: [0, 0] };
  for (const id of z.ids) {
    const q = QUESTION_BY_ID[id];
    const r = res[sectionOf(q)];
    r[1]++;
    if (z.answers[id] === q.a) r[0]++;
  }
  return res;
}

function finishQuiz() {
  const z = ui.quiz;
  if (!z || z.done) return;
  z.done = true;
  stopSpeaking();
  if (z.timed) {
    const { L, R } = sessionScore(z);
    tq().tests.push({ date: todayISO(), L, R, score: roundScore(L[0] / (L[1] || 1)) + roundScore(R[0] / (R[1] || 1)) });
  }
}

const audioKey = (q) => q.group || q.id;
function nextQuestion() {
  const z = ui.quiz;
  const prev = QUESTION_BY_ID[z.ids[z.i]];
  if (z.i >= z.ids.length - 1) return finishQuiz();
  z.i++;
  const q = QUESTION_BY_ID[z.ids[z.i]];
  if (audioKey(q) !== audioKey(prev)) stopSpeaking();
  // On lance l'écoute tout de suite, comme le jour de l'examen.
  if (q.audio && !z.played[audioKey(q)]) {
    z.played[audioKey(q)] = 1;
    setTimeout(() => speak(q.audio), 250);
  }
}

/* ---------- Audio (synthèse vocale du téléphone) ---------- */

let speaking = false;
const ttsSupported = () => 'speechSynthesis' in window;
const englishVoices = () => (ttsSupported() ? speechSynthesis.getVoices().filter((v) => /^en[-_]/i.test(v.lang)) : []);
if (ttsSupported()) {
  speechSynthesis.getVoices();
  speechSynthesis.addEventListener?.('voiceschanged', () => speechSynthesis.getVoices());
}

function refreshPlayButtons() {
  document.querySelectorAll('[data-action="toeic-play"]').forEach((b) => {
    if (!b.disabled || speaking) b.innerHTML = speaking ? '⏹ Arrêter' : b.dataset.label;
  });
}

function speak(lines) {
  if (!ttsSupported()) return toast('Ton navigateur ne sait pas lire l’audio 😕');
  speechSynthesis.cancel();
  const voices = englishVoices();
  const us = voices.filter((v) => /en[-_]US/i.test(v.lang));
  const pool = us.length >= 2 ? us : voices;
  const find = (re) => pool.find((v) => re.test(v.name));
  const female = find(/samantha|zira|aria|jenny|ava|allison|susan|karen|moira|serena|victoria|female|google us english/i) || pool[0];
  const male = find(/daniel|alex|david|guy|aaron|fred|tom|arthur|rishi|\bmale/i) || pool.find((v) => v !== female) || pool[0];
  const rate = ui.ttsSlow ? 0.75 : 0.95;
  lines.forEach(([who, text], k) => {
    const u = new SpeechSynthesisUtterance(text);
    const v = who === 'M' ? male : female;
    u.lang = v?.lang || 'en-US';
    if (v) u.voice = v;
    if (!v || male === female) u.pitch = who === 'M' ? 0.75 : who === 'W' ? 1.25 : 1;
    u.rate = rate;
    if (k === lines.length - 1) {
      u.onend = () => {
        speaking = false;
        refreshPlayButtons();
      };
      u.onerror = u.onend;
    }
    speechSynthesis.speak(u);
  });
  speaking = true;
  refreshPlayButtons();
}

function stopSpeaking() {
  if (ttsSupported()) speechSynthesis.cancel();
  speaking = false;
}

const sayWord = (w) => speak([['W', w.en.replace(/\(.*?\)/g, '').replace(/\s*\/\s*/g, ', ')]]);

/* ---------- Écrans ---------- */

function toeicSettingsForm() {
  const T = tq();
  openForm({
    title: 'Mon TOEIC 🎯',
    fields: [
      { name: 'target', label: 'Score visé (sur 990)', type: 'number', placeholder: '785' },
      { name: 'examDate', label: 'Date de l’examen', type: 'date' },
      { name: 'dailyGoal', label: 'Questions par jour', type: 'number', placeholder: '15' },
      { name: 'daily', label: 'Me rappeler de réviser chaque jour (notifications)', type: 'checkbox' },
      { name: 'time', label: 'Heure du rappel', type: 'time' },
    ],
    values: { target: T.target, examDate: T.examDate, dailyGoal: T.dailyGoal, daily: T.reminder.daily, time: T.reminder.time },
    onSubmit: (d) => {
      T.target = clamp(Math.round(d.target / 5) * 5 || 785, 10, 990);
      T.examDate = d.examDate;
      T.dailyGoal = clamp(Math.round(d.dailyGoal) || 15, 5, 100);
      T.reminder = { daily: d.daily, time: d.time };
      commit('C’est noté, on vise haut 🎯');
    },
  });
}

function myWordForm(w) {
  openForm({
    title: w ? 'Modifier le mot' : 'Ajouter un mot ⭐',
    fields: [
      { name: 'en', label: 'En anglais', required: true, placeholder: 'to meet a deadline' },
      { name: 'fr', label: 'En français', required: true, placeholder: 'respecter une échéance' },
      { name: 'ex', label: 'Phrase d’exemple (conseillé)', type: 'textarea', placeholder: 'We worked late to meet the deadline.' },
    ],
    values: w || {},
    onSubmit: (d) => {
      if (w) Object.assign(w, d);
      else tq().myWords.unshift({ id: `perso-${uid()}`, theme: 'perso', ...d });
      commit(w ? 'Mot modifié ✓' : 'Mot ajouté à tes cartes ⭐');
    },
    onDelete: w
      ? () => {
          tq().myWords = tq().myWords.filter((x) => x !== w);
          delete tq().cards[w.id];
          commit('Mot supprimé');
        }
      : null,
  });
}

const levelDots = (box = -1) => `<span class="lvl" title="${box < 0 ? 'Nouveau' : `Niveau ${box}/5`}">${[1, 2, 3, 4, 5].map((k) => `<i class="${box >= k ? 'on' : ''}"></i>`).join('')}</span>`;
const pctBadge = (pct) => (pct === null ? '<span class="badge">nouveau</span>' : `<span class="badge ${pct >= 80 ? 'good' : pct >= 55 ? 'warn' : 'bad'}">${pct} %</span>`);

function viewToeic() {
  const T = tq();
  const t = todayISO();
  const est = toeicEstimate();
  const left = T.examDate ? daysBetween(t, T.examDate) : null;
  const doneToday = T.log[t]?.q || 0;
  const cards = cardsToReview();
  const streak = toeicStreak();
  const errors = T.errors.filter((id) => QUESTION_BY_ID[id]).length;
  const last14 = Array.from({ length: 14 }, (_, i) => addDays(t, i - 13));
  const lvl = est.total !== null ? levelOf(est.total) : null;
  const learned = allWords().filter((w) => T.cards[w.id]?.box >= 1).length;
  const exam =
    left === null ? 'Ajoute la date de ton examen' : left > 1 ? `Examen dans ${plural(left, 'jour')}` : left === 1 ? 'Examen demain : repose-toi bien 💖' : left === 0 ? 'C’est le grand jour, tu vas briller ✨' : 'Examen passé : une nouvelle date ?';
  const row = (action, ico, title, sub, extra = '') => `<li class="row tap" ${action}><div class="ico-box ${ico[1] || ''}">${ico[0]}</div><div class="grow"><div class="t">${title}</div><div class="s">${sub}</div>${extra}</div><span class="chev">${icon('right')}</span></li>`;
  const parts = ['p2', 'p3', 'p4', 'p5', 'p6', 'p7'];

  return `
  <header class="dark-head">
    <div class="head-row"><div><h1 class="title">TOEIC <span style="color:var(--pink-2)">🎯</span></h1><div class="subtitle">Objectif ${T.target} points${lvl ? ` · niveau actuel ${lvl.label}` : ''}</div></div>${backBtn('#/menu', true)}</div>
    <div class="hero-card" role="button" tabindex="0" data-action="toeic-settings">
      <div class="row1"><div class="ico-box round pink" style="font-size:22px">🗓️</div><div><div class="h">${exam}</div><div class="s">${T.examDate ? esc(cap(fmtLong.format(parseISO(T.examDate)))) : 'Touche ici pour régler ton objectif'}</div></div></div>
      <div class="between"><span>Score estimé : <strong style="color:#fff">${est.total ?? '—'}</strong> / ${T.target}</span><span>${est.total !== null ? `${Math.min(100, Math.round((est.total / T.target) * 100))} %` : 'réponds à quelques questions'}</span></div>
      ${progressBar(est.total ? (est.total / T.target) * 100 : 0, 'on-ink')}
    </div>
  </header>
  <div class="sheet">
    <section class="section">
      ${secHead('Aujourd’hui')}
      <div class="card flush"><ul class="list">
        ${row('data-action="toeic-cards" data-theme="all"', ['📇', 'pink'], 'Cartes de vocabulaire', cards.total ? `${plural(cards.total, 'carte')} à réviser (${cards.due.length} à revoir, ${cards.fresh.length} nouvelles)` : 'Tout est révisé pour aujourd’hui ✨')}
        ${row('data-action="toeic-start" data-mode="daily"', ['✏️', 'lilac'], 'Séance du jour', `${Math.min(doneToday, T.dailyGoal)}/${T.dailyGoal} questions ${doneToday >= T.dailyGoal ? '✓ objectif atteint 🎉' : ''}`, `<div style="margin-top:6px">${progressBar((doneToday / T.dailyGoal) * 100)}</div>`)}
        ${errors ? row('data-action="toeic-start" data-mode="errors"', ['🔁', 'peach'], 'Mon carnet d’erreurs', `${plural(errors, 'question')} à retravailler`) : ''}
      </ul></div>

      <div class="tiles" style="padding:12px 0 0">
        <div class="tile lilac"><div class="label">Score estimé</div><div class="big">${est.total ?? '—'}</div><div class="small">🎧 ${est.L ?? '—'} · 📖 ${est.R ?? '—'}</div></div>
        <div class="tile peach"><div class="label">Série</div><div class="big">${plural(streak, 'jour')}</div><div class="small">${streak ? 'd’affilée, bravo 🔥' : 'commence aujourd’hui'}</div></div>
      </div>
      <div class="card mt"><div class="small muted" style="margin-bottom:8px">Mes 14 derniers jours de révision</div><div class="days14">${last14.map((d) => `<span class="${(T.log[d]?.q || 0) + (T.log[d]?.cards || 0) ? 'on' : ''} ${d === t ? 'today' : ''}" title="${esc(fmtDate(d))}">${parseISO(d).getDate()}</span>`).join('')}</div></div>

      ${secHead('🎧📖 S’entraîner par partie')}
      <div class="card flush"><ul class="list">${parts
        .map((p) => {
          const st = partStats(ofPart(p));
          return `<li class="row tap" data-action="toeic-start" data-mode="part:${p}"><div class="ico-box ${TOEIC_PARTS[p].section === 'L' ? 'lilac' : 'pink'}">${TOEIC_PARTS[p].section === 'L' ? '🎧' : '📖'}</div><div class="grow"><div class="t">${esc(TOEIC_PARTS[p].label)}</div><div class="s">${st.seen}/${st.total} questions vues ${pctBadge(st.pct)}</div></div><span class="chev">${icon('right')}</span></li>`;
        })
        .join('')}</ul></div>

      ${secHead('⏱️ Mini test chronométré')}
      <div class="card">
        <div class="small muted">26 questions des parties 2 à 7 en ${TEST_MINUTES} minutes. Comme le jour J : une seule écoute et la correction à la fin.</div>
        <button class="btn pink block mt" data-action="toeic-start" data-mode="test">Commencer le test</button>
        ${
          T.tests.length
            ? `<ul class="list mt">${T.tests
                .slice(-5)
                .reverse()
                .map((x) => `<li class="row"><div class="grow"><div class="t">${x.score} points</div><div class="s">${esc(fmtDate(x.date))} · 🎧 ${x.L[0]}/${x.L[1]} · 📖 ${x.R[0]}/${x.R[1]}</div></div><span class="badge ${x.score >= T.target ? 'good' : 'pink'}">${esc(levelOf(x.score).label)}</span></li>`)
                .join('')}</ul>`
            : ''
        }
      </div>

      ${secHead('📚 Apprendre')}
      <div class="card flush"><ul class="list">
        ${row('data-action="goto" data-href="#/toeic-vocab"', ['🗂️', 'pink'], 'Vocabulaire', `${learned}/${allWords().length} mots appris · ${Object.keys(VOCAB_THEMES).length} thèmes`)}
        ${row('data-action="goto" data-href="#/toeic-grammaire"', ['🧩', 'lilac'], 'Fiches de grammaire', `${GRAMMAR.length} fiches avec exercices`)}
      </ul></div>

      ${secHead('💡 Ma méthode')}
      <div class="card flush prayers">
        <details><summary>Mon plan de révision</summary><p class="method">
          ✦ <b>Chaque jour (15 à 20 min)</b> : tes cartes de vocabulaire, puis la séance du jour.<br>
          ✦ <b>Le carnet d’erreurs</b> : une question ratée revient jusqu’à ce que tu la réussisses.<br>
          ✦ <b>Une fois par semaine</b> : un mini test chronométré pour mesurer tes progrès.<br>
          ✦ <b>Ta partie la plus faible</b> (le pourcentage le plus bas) : travaille-la deux fois plus.<br>
          ✦ <b>En plus</b> : écoute de l’anglais tous les jours (podcasts, séries en VO avec sous-titres anglais) et passe au moins un test blanc officiel complet avant l’examen.
        </p></details>
        ${parts.map((p) => `<details><summary>${esc(TOEIC_PARTS[p].label)}</summary><p class="method">${esc(TOEIC_PARTS[p].tip)}</p></details>`).join('')}
        <details><summary>${esc(TOEIC_PARTS.p1.label)}</summary><p class="method">Avant d’écouter, décris la photo dans ta tête : qui, quoi, où. Élimine les réponses qui parlent d’une action qu’on ne voit pas, ou qui utilisent un mot présent sur la photo dans une phrase fausse.</p></details>
        <details><summary>Le jour J</summary><p class="method">L’examen dure 2 heures : 45 min d’écoute (100 questions) puis 75 min de lecture (100 questions). Il n’y a pas de point en moins pour une erreur : réponds à TOUTES les questions. En lecture, ne bloque jamais plus d’une minute sur une question, et garde du temps pour la partie 7.</p></details>
      </div>
    </section>
  </div>`;
}

function viewToeicVocab() {
  const T = tq();
  const theme = ui.vocabTheme;
  const words = wordsOf(theme);
  const themes = { all: 'Tout', ...VOCAB_THEMES, perso: '⭐ Mes mots' };
  const rev = cardsToReview(theme);
  const mastered = words.filter((w) => T.cards[w.id]?.box >= 4).length;
  const learned = words.filter((w) => T.cards[w.id]?.box >= 1).length;
  return `
  <header class="head">
    <div class="head-row"><div><h1 class="title">Vocabulaire 🗂️</h1><div class="subtitle">Les mots qui reviennent le plus au TOEIC</div></div>${backBtn('#/toeic')}</div>
  </header>
  <div class="chips">${Object.entries(themes)
    .map(([k, v]) => `<button class="chip ${k === theme ? 'active' : ''}" data-action="vocab-theme" data-theme="${k}">${esc(v)}</button>`)
    .join('')}</div>
  <section class="section">
    <div class="tiles" style="padding:6px 0 0">
      <div class="tile"><div class="label">Appris</div><div class="big">${learned}/${words.length}</div><div class="small">mots déjà vus et sus</div></div>
      <div class="tile lilac"><div class="label">Maîtrisés</div><div class="big">${mastered}</div><div class="small">niveau 4 ou 5 ✦</div></div>
    </div>
    <div class="btn-row mt">
      <button class="btn pink" style="flex:1" data-action="toeic-cards" data-theme="${theme}" ${rev.total ? '' : 'disabled'}>📇 Réviser${rev.total ? ` (${rev.total})` : ' : tout est à jour'}</button>
      <button class="btn soft" data-action="add-word">⭐ Ajouter un mot</button>
    </div>
    <div class="small muted mt">Chaque bonne réponse fait monter le mot d’un niveau : il revient dans 1, 3, 7, 14 puis 30 jours. Un mot oublié revient dès aujourd’hui.</div>
    <div class="card flush mt"><ul class="list">${
      words
        .map((w) => {
          const own = w.theme === 'perso';
          return `<li class="row"><button class="icon-btn sm" data-action="say-word" data-id="${esc(w.id)}" aria-label="Écouter">🔊</button><div class="grow ${own ? 'tap' : ''}" ${own ? `data-action="edit-word" data-id="${esc(w.id)}"` : ''}><div class="t">${esc(w.en)}</div><div class="s">${esc(w.fr)}</div></div>${levelDots(T.cards[w.id]?.box ?? -1)}</li>`;
        })
        .join('') || `<li>${emptyMsg('Ajoute ici les mots que tu rencontres en révisant ⭐')}</li>`
    }</ul></div>
  </section>`;
}

function viewToeicCards() {
  const c = ui.cards;
  if (!c) return noSessionHTML('#/toeic-vocab');
  if (c.i >= c.queue.length) {
    return `
    <header class="head"><div class="head-row"><div><h1 class="title">Bravo 💖</h1><div class="subtitle">Révision terminée</div></div>${backBtn('#/toeic')}</div></header>
    <section class="section"><div class="card center-card">
      <div style="font-size:54px">🎉</div>
      <div class="big-num">${c.known}/${c.seen}</div>
      <div class="muted">cartes sues du premier coup</div>
      <div class="btn-row mt" style="justify-content:center"><a class="btn pink" href="#/toeic">Retour au TOEIC</a><button class="btn soft" data-action="toeic-start" data-mode="daily">✏️ Séance du jour</button></div>
    </div></section>`;
  }
  const w = wordById(c.queue[c.i]);
  const front = ui.cardDir === 'fr' ? w.fr : w.en;
  return `
  <header class="head">
    <div class="head-row"><div><h1 class="title">Cartes 📇</h1><div class="subtitle">${c.i + 1} / ${c.queue.length} · ${esc(VOCAB_THEMES[w.theme] || '⭐ Mes mots')}</div></div>${backBtn('#/toeic')}</div>
    <div class="mt">${progressBar((c.i / c.queue.length) * 100)}</div>
  </header>
  <div class="chips">
    <button class="chip ${ui.cardDir !== 'fr' ? 'active' : ''}" data-action="card-dir" data-dir="en">Anglais → français</button>
    <button class="chip ${ui.cardDir === 'fr' ? 'active' : ''}" data-action="card-dir" data-dir="fr">Français → anglais</button>
  </div>
  <section class="section">
    <div class="flashcard ${c.flipped ? 'flipped' : ''}" role="button" tabindex="0" data-action="card-flip">
      ${levelDots(tq().cards[w.id]?.box ?? -1)}
      <div class="front">${esc(front)}</div>
      ${
        c.flipped
          ? `<div class="back"><div class="answer">${esc(ui.cardDir === 'fr' ? w.en : w.fr)}</div>${w.ex ? `<div class="ex">« ${esc(w.ex)} »</div>` : ''}</div>`
          : '<div class="tap-hint">Cherche la réponse dans ta tête, puis touche la carte</div>'
      }
    </div>
    <div class="btn-row mt" style="justify-content:center"><button class="btn soft sm" data-action="say-word" data-id="${esc(w.id)}">🔊 Écouter</button>${c.flipped && w.ex ? `<button class="btn soft sm" data-action="say-example" data-id="${esc(w.id)}">🔊 L’exemple</button>` : ''}</div>
    ${
      c.flipped
        ? `<div class="answer-btns mt"><button class="btn bad-btn" data-action="card-answer" data-known="0">😕 Pas encore</button><button class="btn good-btn" data-action="card-answer" data-known="1">😊 Je savais</button></div>`
        : '<button class="btn ink block mt" data-action="card-flip">Voir la réponse</button>'
    }
  </section>`;
}

function noSessionHTML(back = '#/toeic') {
  return `<header class="head"><div class="head-row"><div><h1 class="title">TOEIC</h1></div>${backBtn(back)}</div></header>
  <section class="section"><div class="card">${emptyMsg('Pas de séance en cours.')}<a class="btn pink block" href="#/toeic">Choisir un entraînement</a></div></section>`;
}

const fmtCountdown = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${pad(s % 60)}`;
};

function passageHTML(q) {
  let h = esc(q.passage).replace(/\n/g, '<br>');
  if (q.blank) h = h.replace(/\[(\d)\]/g, (m, n) => `<span class="blank ${Number(n) === q.blank ? 'now' : ''}">${n}</span>`);
  return `<div class="card passage">${q.title ? `<div class="group-label" style="margin-top:0">${esc(q.title)}</div>` : ''}<div class="passage-text">${h}</div></div>`;
}

function viewToeicQuiz() {
  const z = ui.quiz;
  if (!z) return noSessionHTML();
  if (z.done) return quizResultsHTML(z);
  const q = QUESTION_BY_ID[z.ids[z.i]];
  const picked = z.answers[q.id];
  const reveal = picked !== undefined && !z.timed;
  const ok = picked === q.a;
  const playedOut = z.timed && z.played[audioKey(q)] >= 1 && !speaking;
  const playLabel = playedOut ? '✓ Écouté' : z.played[audioKey(q)] ? '↺ Réécouter' : '▶ Écouter';
  const g = q.t && GRAMMAR_BY_ID[q.t];

  return `
  <header class="head">
    <div class="head-row"><div><h1 class="title" style="font-size:24px">${esc(z.title)}</h1><div class="subtitle">Question ${z.i + 1} / ${z.ids.length}${z.timed ? ` · ⏱️ <strong id="quiz-timer">${fmtCountdown(z.endAt - Date.now())}</strong>` : ''}</div></div>${backBtn('#/toeic')}</div>
    <div class="mt">${progressBar((z.i / z.ids.length) * 100)}</div>
  </header>
  <section class="section">
    <div class="between" style="margin:4px 4px 10px"><span class="badge ${sectionOf(q) === 'L' ? 'info' : 'pink'}">${sectionOf(q) === 'L' ? '🎧' : '📖'} ${esc(TOEIC_PARTS[q.part].label)}</span>${q.title && q.audio ? `<span class="small muted">${esc(q.title)}</span>` : ''}</div>
    ${
      q.audio
        ? `<div class="card audio-card">
            ${ttsSupported() ? `<button class="btn pink" data-action="toeic-play" data-id="${q.id}" data-label="${esc(playLabel)}" ${playedOut ? 'disabled' : ''}>${speaking ? '⏹ Arrêter' : playLabel}</button>` : '<span class="small">Ton navigateur ne lit pas l’audio : lis le texte ci-dessous.</span>'}
            ${z.timed ? '<span class="small muted">Une seule écoute, comme le jour J</span>' : `<button class="chip" data-action="toeic-rate">${ui.ttsSlow ? '🐢 Lent' : '🎧 Normal'}</button>`}
          </div>
          ${!ttsSupported() || reveal ? `<details class="card script mt" ${ttsSupported() ? '' : 'open'}><summary>📝 Le texte de l’audio</summary><p>${esc(q.script).replace(/\n/g, '<br>')}</p></details>` : ''}`
        : ''
    }
    ${q.passage ? passageHTML(q) : ''}
    <div class="question">${esc(q.q)}</div>
    <div class="choices">${q.c
      .map((txt, k) => {
        const cls = reveal ? (k === q.a ? 'ok' : k === picked ? 'bad' : 'dim') : k === picked ? 'picked' : '';
        return `<button class="choice ${cls}" data-action="toeic-pick" data-c="${k}" ${picked !== undefined ? 'disabled' : ''}><b>${LETTERS[k]}</b><span>${q.part === 'p2' ? (reveal ? esc(q.script.split('\n')[k + 1].slice(4)) : 'Réponse ' + LETTERS[k]) : esc(txt)}</span></button>`;
      })
      .join('')}</div>
    ${
      reveal
        ? `<div class="card feedback ${ok ? 'ok' : 'bad'}">
            <div class="t">${ok ? '✅ Bonne réponse !' : `❌ La bonne réponse était ${LETTERS[q.a]}`}</div>
            <p>${esc(q.e)}</p>
            ${g ? `<button class="btn soft sm" data-action="goto" data-href="#/toeic-grammaire/${g.id}">${g.emoji} Revoir la fiche « ${esc(g.title)} »</button>` : ''}
          </div>
          <button class="btn ink block mt" data-action="toeic-next">${z.i < z.ids.length - 1 ? 'Question suivante →' : 'Voir mon résultat'}</button>`
        : ''
    }
    ${z.timed ? `<button class="btn ghost sm mt" data-action="toeic-finish">Terminer le test maintenant</button>` : ''}
  </section>`;
}

function quizResultsHTML(z) {
  const { L, R } = sessionScore(z);
  const ok = L[0] + R[0];
  const n = L[1] + R[1];
  const pct = n ? Math.round((ok / n) * 100) : 0;
  const wrong = z.ids.map((id) => QUESTION_BY_ID[id]).filter((q) => z.answers[q.id] !== q.a);
  const score = z.timed ? tq().tests[tq().tests.length - 1]?.score : null;
  const msg = pct >= 90 ? 'Incroyable, tu es prête 👑' : pct >= 75 ? 'Très beau travail 💖' : pct >= 50 ? 'Ça progresse, continue ✨' : 'Chaque erreur te fait progresser 💪';
  return `
  <header class="head"><div class="head-row"><div><h1 class="title">Résultat ✦</h1><div class="subtitle">${esc(z.title)}</div></div>${backBtn('#/toeic')}</div></header>
  <section class="section">
    <div class="card center-card">
      <div class="big-num">${ok}/${n}</div>
      <div class="muted">${pct} % de bonnes réponses · ${msg}</div>
      ${score ? `<div class="mt"><span class="badge pink" style="font-size:14px;padding:6px 14px">Estimation : ${score} points (${esc(levelOf(score).label)})</span></div>` : ''}
      <div class="small muted mt">${L[1] ? `🎧 Écoute ${L[0]}/${L[1]}` : ''}${L[1] && R[1] ? ' · ' : ''}${R[1] ? `📖 Lecture ${R[0]}/${R[1]}` : ''}</div>
    </div>
    <div class="btn-row mt">
      ${wrong.length ? '<button class="btn pink" style="flex:1" data-action="toeic-start" data-mode="errors">🔁 Retravailler mes erreurs</button>' : ''}
      <button class="btn soft" style="flex:1" data-action="toeic-start" data-mode="${esc(z.mode)}">Recommencer</button>
    </div>
    ${secHead(wrong.length ? `À revoir (${wrong.length})` : 'Aucune erreur 🎉')}
    <div class="stack">${wrong
      .map((q) => {
        const p = z.answers[q.id];
        const g = q.t && GRAMMAR_BY_ID[q.t];
        const label = (k) => (q.part === 'p2' ? q.script.split('\n')[k + 1] : `(${LETTERS[k]}) ${q.c[k]}`);
        return `<div class="card review">
          <div class="small muted">${esc(TOEIC_PARTS[q.part].label)}${q.title ? ` · ${esc(q.title)}` : ''}</div>
          <div class="t">${esc(q.part === 'p2' ? q.script.split('\n')[0] : q.part === 'p6' ? `Trou [${q.blank}]` : q.q)}</div>
          ${p !== undefined ? `<div class="bad-txt">✗ ${esc(label(p))}</div>` : '<div class="muted small">Pas de réponse</div>'}
          <div class="good-txt">✓ ${esc(label(q.a))}</div>
          <p class="small">${esc(q.e)}</p>
          ${g ? `<a class="see-all" href="#/toeic-grammaire/${g.id}">${g.emoji} Fiche « ${esc(g.title)} » ${icon('right')}</a>` : ''}
        </div>`;
      })
      .join('')}</div>
  </section>`;
}

function viewToeicGrammar(open) {
  return `
  <header class="head">
    <div class="head-row"><div><h1 class="title">Grammaire 🧩</h1><div class="subtitle">Les règles qui tombent à chaque TOEIC</div></div>${backBtn('#/toeic')}</div>
  </header>
  <section class="section">
    <div class="card flush prayers grammar">${GRAMMAR.map((g) => {
      const st = partStats((q) => q.part === 'p5' && q.t === g.id);
      return `<details ${open === g.id ? 'open' : ''} id="g-${g.id}"><summary><span>${g.emoji} ${esc(g.title)}</span>${pctBadge(st.pct)}</summary>
        <div class="g-body">
          <p class="rule">${esc(g.rule)}</p>
          <ul>${g.points.map((x) => `<li>${x}</li>`).join('')}</ul>
          <div class="trap">⚠️ <b>Piège :</b> ${g.trap}</div>
          ${st.total ? `<button class="btn pink sm" data-action="toeic-start" data-mode="gram:${g.id}">✏️ M’entraîner (${st.total} questions)</button>` : ''}
        </div></details>`;
    }).join('')}</div>
  </section>`;
}

const toeicActions = {
  'toeic-settings': () => toeicSettingsForm(),
  'toeic-start': (el) => {
    const s = buildSession(el.dataset.mode);
    if (!s.ids.length) return toast(el.dataset.mode === 'errors' ? 'Aucune erreur à retravailler 🎉' : 'Pas de question disponible');
    stopSpeaking();
    ui.quiz = { mode: el.dataset.mode, i: 0, answers: {}, played: {}, done: false, timed: false, ...s };
    if (location.hash === '#/toeic-quiz') render();
    else location.hash = '#/toeic-quiz';
    window.scrollTo(0, 0);
  },
  'toeic-pick': (el) => {
    const z = ui.quiz;
    if (!z || z.done) return;
    const q = QUESTION_BY_ID[z.ids[z.i]];
    if (z.answers[q.id] !== undefined) return;
    const choice = Number(el.dataset.c);
    z.answers[q.id] = choice;
    recordAnswer(q, choice === q.a);
    if (z.timed) {
      nextQuestion();
      window.scrollTo(0, 0);
    }
    commit();
  },
  'toeic-next': () => {
    nextQuestion();
    commit();
    window.scrollTo(0, 0);
  },
  'toeic-finish': () => {
    if (!confirm('Terminer le test ? Les questions sans réponse comptent comme fausses.')) return;
    finishQuiz();
    commit();
    window.scrollTo(0, 0);
  },
  'toeic-play': () => {
    const z = ui.quiz;
    const q = QUESTION_BY_ID[z.ids[z.i]];
    if (speaking) {
      stopSpeaking();
      return refreshPlayButtons();
    }
    z.played[audioKey(q)] = (z.played[audioKey(q)] || 0) + 1;
    speak(q.audio);
  },
  'toeic-rate': () => {
    ui.ttsSlow = !ui.ttsSlow;
    render();
    toast(ui.ttsSlow ? '🐢 Lecture lente' : '🎧 Vitesse normale');
  },
  'toeic-cards': (el) => {
    const { due, fresh } = cardsToReview(el.dataset.theme || 'all');
    const queue = [...shuffle(due), ...fresh].map((w) => w.id);
    if (!queue.length) return toast('Tout est révisé pour aujourd’hui ✨');
    ui.cards = { queue, i: 0, flipped: false, known: 0, seen: 0, retries: {} };
    location.hash = '#/toeic-cartes';
  },
  'card-flip': () => {
    if (!ui.cards) return;
    ui.cards.flipped = !ui.cards.flipped;
    render();
  },
  'card-dir': (el) => {
    ui.cardDir = el.dataset.dir;
    if (ui.cards) ui.cards.flipped = false;
    render();
  },
  'card-answer': (el) => {
    const c = ui.cards;
    const id = c.queue[c.i];
    const known = el.dataset.known === '1';
    const t = todayISO();
    const lg = toeicLog(t);
    let card = tq().cards[id];
    if (!card) {
      card = tq().cards[id] = { box: 0, due: t };
      lg.newCards++;
    }
    lg.cards++;
    const firstTry = !c.retries[id];
    if (firstTry) c.seen++;
    if (known) {
      if (firstTry) c.known++;
      card.box = Math.min(5, card.box + 1);
      card.due = addDays(t, SRS_DAYS[card.box]);
    } else {
      card.box = 0;
      card.due = t;
      // Le mot oublié revient en fin de séance (deux fois au maximum).
      c.retries[id] = (c.retries[id] || 0) + 1;
      if (c.retries[id] <= 2) c.queue.push(id);
    }
    c.i++;
    c.flipped = false;
    commit();
  },
  'say-word': (el) => {
    const w = wordById(el.dataset.id);
    if (w) sayWord(w);
  },
  'say-example': (el) => {
    const w = wordById(el.dataset.id);
    if (w?.ex) speak([['W', w.ex]]);
  },
  'vocab-theme': (el) => {
    ui.vocabTheme = el.dataset.theme;
    render();
  },
  'add-word': () => myWordForm(),
  'edit-word': (el) => myWordForm(tq().myWords.find((w) => w.id === el.dataset.id)),
};

let quizTimer = null;
function syncQuizTimer(active) {
  if (!active) {
    clearInterval(quizTimer);
    quizTimer = null;
    return;
  }
  if (quizTimer) return;
  quizTimer = setInterval(() => {
    const z = ui.quiz;
    if (!z || !z.timed || z.done || parseRoute().name !== 'toeic-quiz') return syncQuizTimer(false);
    const left = z.endAt - Date.now();
    if (left <= 0) {
      finishQuiz();
      commit('⏰ Temps écoulé !');
      return;
    }
    const el = $('#quiz-timer');
    if (el) el.textContent = fmtCountdown(left);
  }, 1000);
}

/* ============================================================
   Carte des voyages
   ============================================================ */

const TRIP_PIN_CLASS = { 'À planifier': 's-dream', 'À organiser': 's-todo', Planifié: 's-ok', Réservé: 's-ok', Terminé: 's-past' };
const yearOf = (tr) => (tr.start ? tr.start.slice(0, 4) : '');

function mapTrips() {
  const f = ui.mapFilter;
  return state.trips.filter((tr) => f === 'all' || (f === 'reves' ? !tr.start : yearOf(tr) === f));
}

function tripDates(tr) {
  if (!tr.start) return 'Dates à définir';
  return `${fmtDate(tr.start)}${tr.end ? ` → ${fmtDate(tr.end)}` : ''} ${yearOf(tr)}`;
}

function viewMap() {
  const y = new Date().getFullYear();
  const years = [...new Set([String(y), String(y + 1), ...state.trips.map(yearOf).filter(Boolean)])].sort();
  const trips = mapTrips();
  const countries = new Set(trips.map((tr) => tr.country).filter(Boolean));
  const budget = sum(trips, (tr) => tr.budget);
  const picking = ui.pickTrip ? findById(state.trips, ui.pickTrip) : null;
  const chip = (k, l) => `<button class="chip ${ui.mapFilter === k ? 'active' : ''}" data-action="map-filter" data-filter="${k}">${l}</button>`;
  return `
  <section class="map-page">
    <div id="map" class="map" aria-label="Carte de mes voyages"></div>
    <div class="map-top">
      <div class="map-title">
        ${backBtn('#/voyages')}
        <div><h1 class="title sparkle" style="font-size:24px">Ma carte</h1><div class="subtitle" style="margin:0">${plural(trips.length, 'voyage')} · ${plural(countries.size, 'pays', 'pays')} · ${eur(budget)}</div></div>
      </div>
      <div class="chips in-section" style="padding-top:10px">${chip('all', 'Tout')}${years.map((yy) => chip(yy, yy)).join('')}${chip('reves', '✨ Rêves')}</div>
      ${picking ? `<div class="map-banner">📍 Touche la carte pour placer <strong>${esc(picking.destination)}</strong> <button class="btn sm ghost" data-action="map-pick-cancel">Annuler</button></div>` : ''}
    </div>
    <div class="map-cards">
      ${trips
        .map((tr) => `<button class="map-card ${TRIP_PIN_CLASS[tr.status] || ''}" data-action="map-focus" data-id="${tr.id}">
          <span class="emo">${esc(tr.emoji || '✈️')}</span>
          <span class="txt"><strong>${esc(tr.destination)}</strong><small>${esc(tripDates(tr))}</small><small class="st">${tr.lat === undefined ? '📍 À placer' : esc(tr.status)}</small></span>
        </button>`)
        .join('')}
      <button class="map-card add" data-action="add-trip">${icon('plus')}<span class="txt"><strong>Nouveau</strong><small>ou touche la carte</small></span></button>
    </div>
  </section>`;
}

let mapApi = null;
let geocoding = false;

async function setupMap() {
  const el = $('#map');
  if (!el) return;
  const trips = mapTrips();
  const placed = trips.filter((tr) => typeof tr.lat === 'number');
  const pins = placed.map((tr) => ({
    id: tr.id,
    lat: tr.lat,
    lng: tr.lng,
    title: tr.destination,
    emoji: esc(tr.emoji || '✈️'),
    cls: TRIP_PIN_CLASS[tr.status] || '',
    popup: `<div class="pp"><div class="pp-h">${esc(tr.emoji || '')} ${esc(tr.destination)}</div><div class="pp-s">${esc(tripDates(tr))}</div><div class="pp-s">${esc(tr.status)}${tr.budget ? ` · ${eur(tr.budget)}` : ''}</div><a class="pp-a" href="#/voyage/${tr.id}">Voir le voyage →</a></div>`,
  }));
  const route = /^\d{4}$/.test(ui.mapFilter) ? placed.filter((tr) => tr.start).sort((a, b) => a.start.localeCompare(b.start)).map((tr) => [tr.lat, tr.lng]) : [];
  mapApi = await mountMap(el, {
    pins,
    route,
    view: ui.mapView,
    onMove: (v) => {
      ui.mapView = v;
    },
    onClick: mapClick,
  });
  geocodeMissing();
}

// Place automatiquement les voyages qui n'ont pas encore de position (1 requête / seconde).
async function geocodeMissing() {
  if (geocoding) return;
  const todo = state.trips.filter((tr) => typeof tr.lat !== 'number' && !tr.geoTried && tr.destination);
  if (!todo.length) return;
  geocoding = true;
  let changed = false;
  for (const tr of todo) {
    changed = (await locateTrip(tr)) || changed;
    await new Promise((r) => setTimeout(r, 1100));
  }
  geocoding = false;
  if (changed || todo.length) {
    state.updatedAt = Date.now();
    save();
    schedulePush();
    if (parseRoute().name === 'carte') render();
  }
}

async function mapClick(lat, lng) {
  if (ui.pickTrip) {
    const tr = findById(state.trips, ui.pickTrip);
    ui.pickTrip = null;
    if (!tr) return;
    Object.assign(tr, { lat, lng, geoTried: false });
    const place = await reverseGeocode(lat, lng);
    if (place?.country) {
      tr.country = place.country;
      if (!tr.emoji || tr.emoji === '✈️') tr.emoji = flagOf(place.country);
    }
    commit(`📍 ${tr.destination} placé sur la carte`);
    return;
  }
  toast('📍 Recherche du lieu…');
  const place = await reverseGeocode(lat, lng);
  tripForm(null, { lat, lng, destination: place?.name || '', country: place?.country || '', emoji: flagOf(place?.country) || '✈️' });
}

/* ============================================================
   Recettes saines & menu de la semaine
   ============================================================ */

const FRACTIONS = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3 };
const qtyFmt = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 });

// Ajuste la quantité en début de ligne (« 200 g de… », « 1/2 concombre », « 1,5 l… »).
function scaleLine(line, factor) {
  if (factor === 1) return line;
  return line.replace(/^(\d+(?:[.,]\d+)?\/\d+|\d+(?:[.,]\d+)?|[½¼¾⅓⅔])/, (m) => {
    let v;
    if (FRACTIONS[m]) v = FRACTIONS[m];
    else if (m.includes('/')) {
      const [a, b] = m.split('/');
      v = parseFloat(a.replace(',', '.')) / parseFloat(b);
    } else v = parseFloat(m.replace(',', '.'));
    const r = v * factor;
    return qtyFmt.format(r >= 10 ? Math.round(r) : Math.round(r * 4) / 4 || Math.round(r * 100) / 100);
  });
}

const recipeById = (id) => findById(state.recipes, id);
const lines = (s) => String(s || '').split('\n').map((x) => x.trim()).filter(Boolean);

function recipeForm(recipe, preset = {}) {
  openForm({
    title: recipe ? 'Modifier la recette' : 'Nouvelle recette 🥗',
    fields: [
      { name: 'emoji', label: 'Emoji', placeholder: '🥗' },
      { name: 'title', label: 'Nom de la recette', required: true, placeholder: 'Bowl saumon avocat' },
      { name: 'category', label: 'Moment', type: 'select', options: Object.entries(RECIPE_CATEGORIES) },
      { name: 'tags', label: 'Étiquettes', type: 'multi', options: RECIPE_TAGS },
      { name: 'time', label: 'Temps (minutes)', type: 'number' },
      { name: 'servings', label: 'Portions', type: 'number' },
      { name: 'kcal', label: 'Calories par portion (optionnel)', type: 'number' },
      { name: 'ingredients', label: 'Ingrédients (un par ligne, quantité au début)', type: 'textarea', placeholder: '200 g de poulet\n1 avocat\n2 c. à soupe d’huile d’olive' },
      { name: 'steps', label: 'Étapes (une par ligne)', type: 'textarea', placeholder: 'Couper les légumes\nFaire cuire 10 minutes…' },
      { name: 'image', label: 'Photo', type: 'image' },
      { name: 'link', label: 'Lien (TikTok, site…)', type: 'url', placeholder: 'https://…' },
      { name: 'notes', label: 'Mes astuces', type: 'textarea' },
    ],
    values: recipe
      ? { ...recipe, ingredients: recipe.ingredients.join('\n'), steps: recipe.steps.join('\n') }
      : { emoji: '🥗', category: 'midi', tags: [], servings: 2, ...preset },
    onSubmit: (d) => {
      const data = { ...d, ingredients: lines(d.ingredients), steps: lines(d.steps), servings: Math.max(1, Math.round(d.servings) || 1) };
      if (recipe) Object.assign(recipe, data);
      else {
        const r = { id: uid(), favorite: false, ...data };
        state.recipes.unshift(r);
        location.hash = `#/recette/${r.id}`;
      }
      commit(recipe ? 'Recette modifiée ✓' : 'Recette ajoutée 🥗');
    },
    onDelete: recipe
      ? () => {
          state.recipes = state.recipes.filter((x) => x !== recipe);
          for (const day of Object.values(state.mealPlan)) for (const m of Object.keys(day)) if (day[m] === recipe.id) delete day[m];
          location.hash = '#/recettes';
          commit('Recette supprimée');
        }
      : null,
  });
}

function recipeCard(r) {
  return `<a class="recipe-card" href="#/recette/${r.id}">
    <div class="rc-img ${r.image ? '' : 'no-img'}" ${r.image ? `style="background-image:url('${esc(r.image)}')"` : ''}>${r.image ? '' : `<span>${esc(r.emoji || '🥗')}</span>`}${r.favorite ? '<i class="rc-fav">♥</i>' : ''}</div>
    <div class="rc-body"><div class="t">${esc(r.title)}</div><div class="s">${r.time ? `⏱ ${r.time} min` : ''}${r.kcal ? ` · ≈${r.kcal} kcal` : ''}</div></div>
  </a>`;
}

function weekStrip() {
  const t = todayISO();
  return `<div class="week-strip">${Array.from({ length: 7 }, (_, i) => {
    const d = addDays(t, i);
    const plan = state.mealPlan[d] || {};
    const meals = Object.keys(MEALS).filter((m) => plan[m] && recipeById(plan[m]));
    return `<button class="day-col ${d === t ? 'today' : ''}" data-action="plan-day" data-date="${d}">
      <span class="dn">${i === 0 ? "Auj." : esc(WEEKDAYS[parseISO(d).getDay()])}</span><span class="dd">${parseISO(d).getDate()}</span>
      <span class="meals">${meals.map((m) => `<i title="${esc(MEALS[m])} : ${esc(recipeById(plan[m]).title)}">${esc(recipeById(plan[m]).emoji || '🍽️')}</i>`).join('') || '<i class="empty-meal">+</i>'}</span>
    </button>`;
  }).join('')}</div>`;
}

function recipeGridHTML() {
  const f = ui.recipeFilter;
  const q = ui.recipeSearch.toLowerCase();
  const list = state.recipes.filter((r) => {
    if (f === 'fav' && !r.favorite) return false;
    if (RECIPE_CATEGORIES[f] && r.category !== f) return false;
    if (RECIPE_TAGS.includes(f) && !(r.tags || []).includes(f)) return false;
    if (q && !`${r.title} ${r.ingredients.join(' ')} ${(r.tags || []).join(' ')}`.toLowerCase().includes(q)) return false;
    return true;
  });
  return `${list.map(recipeCard).join('')}<button class="recipe-card add" data-action="add-recipe">${icon('plus')}<span>Nouvelle recette</span></button>${list.length ? '' : `<div class="empty" style="grid-column:1/-1">Aucune recette ne correspond.</div>`}`;
}

function viewRecipes() {
  const f = ui.recipeFilter;
  const chip = (k, l) => `<button class="chip ${f === k ? 'active' : ''}" data-action="recipe-filter" data-filter="${esc(k)}">${esc(l)}</button>`;
  return `
  <header class="head">
    <div class="head-row"><div><h1 class="title sparkle">Recettes saines</h1><div class="subtitle">Bien manger, sans prise de tête.</div></div>${backBtn('#/menu')}</div>
  </header>
  <section class="section">
    ${secHead('📅 Mon menu de la semaine', 'data-action="week-shopping"', '🛒 Courses')}
    ${weekStrip()}
  </section>
  <div class="section" style="margin-top:14px"><input class="input" type="search" placeholder="🔍 Chercher une recette, un ingrédient…" value="${esc(ui.recipeSearch)}" data-input="recipe-search" /></div>
  <div class="chips" style="margin-top:6px">${chip('all', 'Toutes')}${chip('fav', '♥ Favoris')}${Object.entries(RECIPE_CATEGORIES).map(([k, l]) => chip(k, l)).join('')}${RECIPE_TAGS.map((tg) => chip(tg, tg)).join('')}</div>
  <section class="section">
    <div class="recipe-grid" id="recipe-grid">${recipeGridHTML()}</div>
  </section>`;
}

function viewRecipe(id) {
  const r = recipeById(id);
  if (!r) return viewRecipes();
  const n = ui.servings[r.id] || r.servings || 1;
  const factor = n / (r.servings || 1);
  const checked = ui.checkedIng[r.id] || {};
  const planned = Object.entries(state.mealPlan)
    .filter(([d, p]) => d >= todayISO() && Object.values(p).includes(r.id))
    .map(([d, p]) => `${dayLabel(d)} (${MEALS[Object.keys(p).find((m) => p[m] === r.id)].toLowerCase()})`);
  return `
  <header class="recipe-hero ${r.image ? '' : 'no-img'}" ${r.image ? `style="background-image:url('${esc(r.image)}')"` : ''}>
    <div class="between">${backBtn('#/recettes', true)}<div class="btn-row">
      <button class="icon-btn ghost" data-action="recipe-fav" data-id="${r.id}" aria-label="Favori" style="color:${r.favorite ? '#ff2e8a' : '#fff'}">${r.favorite ? '♥' : '♡'}</button>
      <button class="icon-btn ghost" data-action="edit-recipe" data-id="${r.id}" aria-label="Modifier">${icon('pencil')}</button></div></div>
    ${r.image ? '' : `<div class="hero-emoji">${esc(r.emoji || '🥗')}</div>`}
    <div><div class="small" style="opacity:.85">${esc(RECIPE_CATEGORIES[r.category] || '')}</div><h1 class="title" style="color:#fff">${esc(r.title)}</h1></div>
  </header>
  <div class="sheet">
    <section class="section">
      <div class="recipe-meta">
        ${r.time ? `<span>⏱ ${r.time} min</span>` : ''}
        ${r.kcal ? `<span>🔥 ≈${r.kcal} kcal / portion</span>` : ''}
        ${(r.tags || []).map((tg) => `<span>${esc(tg)}</span>`).join('')}
      </div>
      ${planned.length ? `<div class="small muted mt">📅 Prévu : ${esc(planned.join(', '))}</div>` : ''}
      <div class="btn-row mt">
        <button class="btn pink sm" data-action="plan-recipe" data-id="${r.id}">📅 Planifier</button>
        <button class="btn soft sm" data-action="recipe-shopping" data-id="${r.id}">🛒 Ajouter aux courses</button>
        <button class="btn sm" data-action="cook-mode">🔆 Mode cuisine</button>
        ${r.link ? `<a class="btn sm ghost" href="${esc(r.link)}" target="_blank" rel="noopener">${platformOf(r.link).emoji} Voir la vidéo</a>` : ''}
      </div>

      <div class="sec-head"><h2>Ingrédients</h2>
        <div class="servings"><button class="icon-btn sm" data-action="servings" data-id="${r.id}" data-step="-1" aria-label="Moins">−</button><strong>${plural(n, 'portion')}</strong><button class="icon-btn sm" data-action="servings" data-id="${r.id}" data-step="1" aria-label="Plus">+</button></div>
      </div>
      <div class="card flush"><ul class="list">${r.ingredients
        .map((ing, i) => `<li class="row ${checked[i] ? 'done' : ''}"><input type="checkbox" class="circle" data-action="check-ing" data-id="${r.id}" data-i="${i}" ${checked[i] ? 'checked' : ''} aria-label="Prêt" /><div class="grow t" style="font-weight:500">${esc(scaleLine(ing, factor))}</div></li>`)
        .join('')}</ul>${r.ingredients.length ? '' : emptyMsg('Ajoute les ingrédients en modifiant la recette.')}</div>

      ${secHead('Préparation')}
      <ol class="steps">${r.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
      ${r.notes ? `${secHead('💡 Mes astuces')}<div class="card small" style="white-space:pre-wrap">${esc(r.notes)}</div>` : ''}
    </section>
  </div>`;
}

function planSheet(date, recipeId) {
  const plan = state.mealPlan[date] || {};
  const label = cap(fmtLongNoYear.format(parseISO(date)));
  if (recipeId) {
    // Choisir le jour et le repas pour une recette donnée.
    const days = Array.from({ length: 7 }, (_, i) => addDays(todayISO(), i));
    openSheet(
      'Planifier 📅',
      `<div class="plan-grid">${days
        .map((d) => `<div class="plan-row"><span class="small"><strong>${esc(dayLabel(d))}</strong></span>${Object.entries(MEALS)
          .map(([m, l]) => `<button class="chip ${state.mealPlan[d]?.[m] === recipeId ? 'active' : ''}" data-action="plan-set" data-date="${d}" data-meal="${m}" data-id="${recipeId}" data-back="recipe">${l}</button>`)
          .join('')}</div>`)
        .join('')}</div>`,
    );
    return;
  }
  openSheet(
    `📅 ${label}`,
    Object.entries(MEALS)
      .map(([m, l]) => {
        const cur = plan[m] && recipeById(plan[m]);
        return `<div class="group-label">${l}${cur ? ` · ${esc(cur.emoji || '')} ${esc(cur.title)}` : ''}</div>
        <div class="chips in-section" style="flex-wrap:wrap">${state.recipes
          .filter((r) => (m === 'matin' ? ['matin', 'boisson', 'snack'] : ['midi', 'soir']).includes(r.category) || plan[m] === r.id)
          .map((r) => `<button class="chip ${plan[m] === r.id ? 'active' : ''}" data-action="plan-set" data-date="${date}" data-meal="${m}" data-id="${r.id}">${esc(r.emoji || '')} ${esc(r.title)}</button>`)
          .join('')}${cur ? `<button class="chip" data-action="plan-set" data-date="${date}" data-meal="${m}" data-id="">✕ Retirer</button>` : ''}</div>`;
      })
      .join('') + '<button class="btn pink block mt" data-action="close-sheet">Terminé ✦</button>',
  );
}

// Ajoute des ingrédients à la liste de courses (sans doublon avec ce qui y est déjà).
function addToShopping(entries) {
  const existing = new Set(state.items.filter((i) => i.area === 'quotidien' && i.kind === 'courses' && !i.done).map((i) => i.title.toLowerCase()));
  let added = 0;
  for (const { line, from } of entries) {
    if (existing.has(line.toLowerCase())) continue;
    existing.add(line.toLowerCase());
    state.items.push({ id: uid(), area: 'quotidien', kind: 'courses', title: line, date: '', time: '', done: false, status: '', notes: from ? `Pour : ${from}` : '' });
    added++;
  }
  return added;
}

let wakeLock = null;
async function toggleWakeLock() {
  try {
    if (wakeLock) {
      await wakeLock.release();
      wakeLock = null;
      return toast('Mode cuisine désactivé');
    }
    if (!('wakeLock' in navigator)) return toast('Ton navigateur ne peut pas garder l’écran allumé');
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
    });
    toast('🔆 Mode cuisine : l’écran reste allumé');
  } catch {
    toast('Impossible de garder l’écran allumé');
  }
}

/* ============================================================
   Graphiques de l'argent
   ============================================================ */

const compactEur = new Intl.NumberFormat('fr-FR', { notation: 'compact', maximumFractionDigits: 1 });
const kEur = (n) => `${compactEur.format(Math.round(n))} €`;
const monthShort = (ym) => cap(new Intl.DateTimeFormat('fr-FR', { month: 'short' }).format(parseISO(`${ym}-01`)).replace('.', ''));

function monthStats(ym) {
  const money = state.money;
  const income =
    sum(money.recurringIncomes.filter((i) => i.received.includes(ym)), (i) => i.amount) +
    sum(money.extraIncomes.filter((i) => i.received && (i.date || '').startsWith(ym)), (i) => i.amount);
  const expenses = money.expenses.filter((e) => e.date.startsWith(ym));
  // Mois en cours : toutes les charges du mois (comme le solde). Mois passés : celles payées.
  const bills = ym === monthKey() ? money.bills : money.bills.filter((b) => b.paid.includes(ym));
  const charges = sum(bills, (b) => b.amount);
  const spent = sum(expenses, (e) => e.amount) + charges;
  return { ym, income, spent, charges, expenses, bills };
}

function niceMax(v) {
  if (v <= 0) return 100;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return ([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => n <= s) || 10) * p;
}

// Barre arrondie seulement du côté de la donnée (en haut), posée sur la ligne de base.
function barPath(x, y, w, h) {
  if (h <= 0) return '';
  const r = Math.min(4, w / 2, h);
  return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
}

const tipAttr = (lines) => `data-tip="${esc(lines.join('|'))}"`;

function chartMonths(stats) {
  const W = 340, H = 196, L = 40, R = 6, T = 12, B = 24;
  const max = niceMax(Math.max(...stats.flatMap((s) => [s.income, s.spent]), 1));
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const gw = (W - L - R) / stats.length;
  const bw = Math.min(16, (gw - 12) / 2);
  const grid = [0, 0.5, 1].map((f) => `<line x1="${L}" x2="${W - R}" y1="${y(max * f)}" y2="${y(max * f)}" class="grid"/><text x="${L - 6}" y="${y(max * f) + 4}" class="axis" text-anchor="end">${esc(kEur(max * f))}</text>`).join('');
  const bars = stats
    .map((s, i) => {
      const cx = L + gw * i + gw / 2;
      const xIn = cx - bw - 1;
      const xOut = cx + 1;
      const diff = s.income - s.spent;
      return `<g>
        <path d="${barPath(xIn, y(s.income), bw, y(0) - y(s.income))}" class="m-in"/>
        <path d="${barPath(xOut, y(s.spent), bw, y(0) - y(s.spent))}" class="m-out"/>
        <text x="${cx}" y="${H - 6}" class="axis ${s.ym === monthKey() ? 'cur' : ''}" text-anchor="middle">${esc(monthShort(s.ym))}</text>
        <rect x="${L + gw * i}" y="${T}" width="${gw}" height="${H - T - B}" class="hit" ${tipAttr([cap(fmtMonth.format(parseISO(`${s.ym}-01`))), `Revenus : ${eur(s.income)}`, `Dépenses : ${eur(s.spent)}`, `${diff >= 0 ? 'Mis de côté' : 'Dépassement'} : ${eur(Math.abs(diff))}`])} data-hl="${i}"/>
      </g>`;
    })
    .join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Revenus et dépenses des 6 derniers mois">${grid}${bars}</svg>`;
}

function chartPace(ym) {
  const s = monthStats(ym);
  const [yy, mm] = ym.split('-').map(Number);
  const days = lastDayOfMonth(yy, mm - 1);
  const isCurrent = ym === monthKey();
  const until = isCurrent ? new Date().getDate() : days;
  const perDay = Array(days + 1).fill(0);
  for (const e of s.expenses) perDay[Number(e.date.slice(8, 10))] += Number(e.amount) || 0;
  for (const b of s.bills) perDay[Math.min(b.day, days)] += Number(b.amount) || 0;
  const cum = [];
  let acc = 0;
  for (let d = 1; d <= until; d++) cum.push((acc += perDay[d]));
  const carry = Number(state.money.carry[ym]) || 0;
  const budget = carry + s.income + (isCurrent ? monthBudget(ym).expected : 0);
  const W = 340, H = 180, L = 40, R = 8, T = 14, B = 22;
  const max = niceMax(Math.max(budget, acc, 1) * 1.05);
  const x = (d) => L + ((W - L - R) * (d - 1)) / Math.max(1, days - 1);
  const y = (v) => T + (H - T - B) * (1 - v / max);
  const pts = cum.map((v, i) => `${x(i + 1).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const last = cum.length ? [x(cum.length), y(cum[cum.length - 1])] : null;
  const grid = [0, 0.5, 1].map((f) => `<line x1="${L}" x2="${W - R}" y1="${y(max * f)}" y2="${y(max * f)}" class="grid"/><text x="${L - 6}" y="${y(max * f) + 4}" class="axis" text-anchor="end">${esc(kEur(max * f))}</text>`).join('');
  const ticks = [1, 10, 20, days].map((d) => `<text x="${x(d)}" y="${H - 6}" class="axis" text-anchor="middle">${d}</text>`).join('');
  const hits = cum
    .map((v, i) => `<rect x="${x(i + 1) - (W - L - R) / days / 2}" y="${T}" width="${(W - L - R) / days}" height="${H - T - B}" class="hit" data-cx="${x(i + 1).toFixed(1)}" ${tipAttr([`${i + 1} ${new Intl.DateTimeFormat('fr-FR', { month: 'long' }).format(parseISO(`${ym}-01`))}`, `Dépensé : ${eur(v)}`, budget ? `${Math.round((v / budget) * 100)} % du budget` : ''].filter(Boolean))}/>`)
    .join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Dépenses cumulées du mois comparées au budget">
    ${grid}${ticks}
    ${budget ? `<line x1="${L}" x2="${W - R}" y1="${y(budget)}" y2="${y(budget)}" class="ref"/><text x="${W - R}" y="${y(budget) - 5}" class="ref-label" text-anchor="end">Budget du mois · ${esc(eur(budget))}</text>` : ''}
    <polyline points="${pts}" class="line-out"/>
    ${last ? `<circle cx="${last[0]}" cy="${last[1]}" r="5" class="dot-out"/>` : ''}
    <line class="crosshair" x1="0" x2="0" y1="${T}" y2="${H - B}" visibility="hidden"/>
    ${hits}
  </svg>`;
}

function categoryBars(ym) {
  const s = monthStats(ym);
  const byCat = {};
  if (s.charges) byCat['🏠 Loyer & charges'] = s.charges;
  for (const e of s.expenses) byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
  const rows = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const total = sum(rows, (r) => r[1]);
  const max = rows[0]?.[1] || 1;
  if (!rows.length) return emptyMsg('Aucune dépense ce mois-là.');
  return `<div class="hbars">${rows
    .map(([cat, v]) => `<div class="hbar" ${tipAttr([cat, eur(v), `${Math.round((v / total) * 100)} % des dépenses`])}>
      <div class="hb-label">${esc(cat)}</div>
      <div class="hb-track"><span style="width:${((v / max) * 100).toFixed(1)}%"></span></div>
      <div class="hb-val">${esc(eur(v))}<small>${Math.round((v / total) * 100)} %</small></div>
    </div>`)
    .join('')}</div>`;
}

function viewCharts() {
  const months = Array.from({ length: 6 }, (_, i) => shiftMonth(monthKey(), i - 5));
  const stats = months.map(monthStats);
  const sel = ui.statsMonth && months.includes(ui.statsMonth) ? ui.statsMonth : monthKey();
  const past = stats.filter((s) => s.ym !== monthKey() && (s.spent || s.income));
  const avg = past.length ? sum(past, (s) => s.spent) / past.length : 0;
  const cur = stats[stats.length - 1];
  const vsAvg = avg ? Math.round(((cur.spent - avg) / avg) * 100) : null;
  const saved = sum(stats, (s) => s.income - s.spent);
  return `
  <header class="dark-head">
    <div class="head-row"><div><h1 class="title sparkle">Mes graphiques</h1><div class="subtitle">Où va ton argent, mois après mois.</div></div>${backBtn('#/argent', true)}</div>
    <div class="stat-row">
      <div class="stat"><div class="lbl">Dépenses moyennes</div><div class="val">${avg ? esc(eur(Math.round(avg))) : '—'}</div><div class="foot">par mois${past.length ? ` (${past.length} derniers mois)` : ''}</div></div>
      <div class="stat"><div class="lbl">Ce mois-ci</div><div class="val">${vsAvg === null ? '—' : `${vsAvg > 0 ? '+' : ''}${vsAvg} %`}</div><div class="foot">${vsAvg === null ? 'pas encore d’historique' : vsAvg > 0 ? 'au-dessus de ta moyenne' : 'en dessous de ta moyenne ✨'}</div></div>
      <div class="stat"><div class="lbl">Sur 6 mois</div><div class="val">${esc(eur(Math.round(Math.abs(saved))))}</div><div class="foot">${saved >= 0 ? 'mis de côté 🐷' : 'dépensés en plus'}</div></div>
    </div>
  </header>
  <div class="sheet">
    <section class="section">
      ${secHead('Revenus & dépenses', 'data-action="charts-table"', ui.chartsTable ? 'Graphique' : 'Tableau')}
      <div class="card chart-card">
        <div class="legend"><span><i class="sw in"></i>Revenus</span><span><i class="sw out"></i>Dépenses</span></div>
        ${ui.chartsTable
          ? `<table class="ctable"><thead><tr><th>Mois</th><th>Revenus</th><th>Dépenses</th><th>Solde</th></tr></thead><tbody>${stats
              .map((s) => `<tr><td>${esc(monthShort(s.ym))}</td><td>${esc(eur(s.income))}</td><td>${esc(eur(s.spent))}</td><td class="${s.income - s.spent >= 0 ? 'pos' : 'neg'}">${esc(eur(s.income - s.spent))}</td></tr>`)
              .join('')}</tbody></table>`
          : `<div class="chart-wrap">${chartMonths(stats)}<div class="chart-tip" hidden></div></div><div class="small muted">Touche un mois pour le détail.</div>`}
      </div>

      <div class="chips in-section" style="margin-top:18px">${months.map((m) => `<button class="chip ${m === sel ? 'active' : ''}" data-action="stats-month" data-month="${m}">${esc(monthShort(m))}</button>`).join('')}</div>

      ${secHead(`Où part ton argent · ${esc(cap(fmtMonth.format(parseISO(`${sel}-01`))))}`)}
      <div class="card chart-card"><div class="chart-wrap">${categoryBars(sel)}<div class="chart-tip" hidden></div></div></div>

      ${secHead('Rythme du mois')}
      <div class="card chart-card">
        <div class="legend"><span><i class="sw out"></i>Dépenses cumulées</span><span><i class="sw ref"></i>Budget du mois</span></div>
        <div class="chart-wrap">${chartPace(sel)}<div class="chart-tip" hidden></div></div>
        <div class="small muted">Si la courbe touche la ligne pointillée avant la fin du mois, c’est le moment de lever le pied 💅</div>
      </div>
      <p class="small muted" style="margin:14px 4px 0">Les revenus comptent ceux marqués « reçu ». Pour les mois passés, les loyers et factures comptent ceux marqués « payé ».</p>
    </section>
  </div>`;
}

// Infobulle : survol (ordinateur) ou toucher (téléphone).
function showTip(target, evt) {
  const wrap = target.closest('.chart-wrap');
  const tip = wrap?.querySelector('.chart-tip');
  if (!tip) return;
  tip.innerHTML = target.dataset.tip.split('|').map((l, i) => (i === 0 ? `<strong>${esc(l)}</strong>` : esc(l))).join('<br>');
  tip.hidden = false;
  const box = wrap.getBoundingClientRect();
  const px = (evt?.clientX ?? target.getBoundingClientRect().left) - box.left;
  const py = (evt?.clientY ?? target.getBoundingClientRect().top) - box.top;
  tip.style.left = `${clamp(px - tip.offsetWidth / 2, 0, box.width - tip.offsetWidth)}px`;
  tip.style.top = `${Math.max(0, py - tip.offsetHeight - 12)}px`;
  wrap.querySelectorAll('.hl').forEach((e) => e.classList.remove('hl'));
  if (target.dataset.hl !== undefined) target.parentElement.classList.add('hl');
  const cross = wrap.querySelector('.crosshair');
  if (cross && target.dataset.cx) {
    cross.setAttribute('x1', target.dataset.cx);
    cross.setAttribute('x2', target.dataset.cx);
    cross.setAttribute('visibility', 'visible');
  }
}
function hideTips() {
  document.querySelectorAll('.chart-tip').forEach((t) => (t.hidden = true));
  document.querySelectorAll('.chart-wrap .hl').forEach((e) => e.classList.remove('hl'));
  document.querySelectorAll('.crosshair').forEach((c) => c.setAttribute('visibility', 'hidden'));
}
document.addEventListener('pointerover', (e) => {
  const t = e.target.closest?.('.chart-wrap [data-tip]');
  if (t && e.pointerType === 'mouse') showTip(t, e);
});
document.addEventListener('pointerout', (e) => {
  if (e.pointerType === 'mouse' && e.target.closest?.('.chart-wrap [data-tip]') && !e.relatedTarget?.closest?.('.chart-wrap [data-tip]')) hideTips();
});
document.addEventListener('click', (e) => {
  const t = e.target.closest?.('.chart-wrap [data-tip]');
  if (t) showTip(t, e);
  else if (!e.target.closest?.('.chart-wrap')) hideTips();
});
/* ============================================================
   Collections (TikTok, Instagram, Pinterest…)
   ============================================================ */

const URL_RE = /https?:\/\/[^\s<>"']+/i;
function platformOf(url) {
  if (/tiktok\.com/i.test(url)) return { name: 'TikTok', emoji: '🎵' };
  if (/instagram\.com/i.test(url)) return { name: 'Instagram', emoji: '📸' };
  if (/pinterest\.|pin\.it/i.test(url)) return { name: 'Pinterest', emoji: '📌' };
  if (/youtu\.?be/i.test(url)) return { name: 'YouTube', emoji: '▶️' };
  return { name: 'Lien', emoji: '🔗' };
}

// Aperçu (titre, miniature) via oEmbed quand le site le permet.
async function fetchPreview(url) {
  let api = null;
  if (/tiktok\.com/i.test(url)) api = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
  else if (/youtu\.?be/i.test(url)) api = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  if (!api) return {};
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6000);
    const r = await fetch(api, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return {};
    const j = await r.json();
    return { title: j.title || '', thumb: j.thumbnail_url || '', author: j.author_name || '' };
  } catch {
    return {};
  }
}

function inspirationForm(item, preset = {}) {
  const cols = state.inspirations.collections;
  openForm({
    title: item ? 'Modifier' : 'Enregistrer un TikTok ✦',
    fields: [
      { name: 'url', label: 'Lien (TikTok, Instagram, Pinterest, YouTube…)', type: 'url', required: true, placeholder: 'https://www.tiktok.com/@…/video/…' },
      { name: 'collection', label: 'Collection', type: 'select', options: cols.map((c) => [c, c]) },
      { name: 'newCollection', label: 'Ou nouvelle collection', placeholder: '🌴 Bali, 💅 Ongles…' },
      { name: 'tripId', label: 'Pour quel voyage ? (optionnel)', type: 'select', options: [['', '—'], ...state.trips.map((tr) => [tr.id, `${tr.emoji || '✈️'} ${tr.destination}`])] },
      { name: 'title', label: 'Titre', placeholder: 'Rempli automatiquement si possible' },
      { name: 'note', label: 'Note', type: 'textarea', placeholder: 'Adresse du resto, prix, idée de tenue…' },
    ],
    values: item || { collection: preset.collection || cols[0], tripId: preset.tripId || '', url: preset.url || '', title: preset.title || '' },
    onSubmit: async (d) => {
      const url = (d.url.match(URL_RE) || [d.url])[0];
      const collection = d.newCollection || d.collection;
      if (d.newCollection && !cols.includes(d.newCollection)) cols.push(d.newCollection);
      const data = { url, collection, tripId: d.tripId, title: d.title, note: d.note };
      const target = item || { id: uid(), addedAt: todayISO(), thumb: '', author: '', tried: false };
      const urlChanged = target.url !== url;
      Object.assign(target, data);
      if (!item) state.inspirations.items.unshift(target);
      commit(item ? 'Modifié ✓' : 'Enregistré dans ta collection ✦');
      if (urlChanged || !target.thumb) {
        const pv = await fetchPreview(url);
        if (pv.thumb || pv.title) {
          target.thumb = pv.thumb || target.thumb;
          target.author = pv.author || target.author;
          if (!target.title) target.title = pv.title;
          commit();
        }
      }
    },
    onDelete: item
      ? () => {
          state.inspirations.items = state.inspirations.items.filter((x) => x !== item);
          commit('Retiré de la collection');
        }
      : null,
  });
}

function inspCard(it) {
  const pf = platformOf(it.url);
  const trip = it.tripId ? findById(state.trips, it.tripId) : null;
  return `<div class="insp ${it.tried ? 'tried' : ''}">
    <a class="insp-thumb" href="${esc(it.url)}" target="_blank" rel="noopener">
      ${it.thumb ? `<img src="${esc(it.thumb)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()" />` : ''}
      <span class="insp-pf">${pf.emoji} ${pf.name}</span>
      ${it.tried ? '<span class="insp-tried">✓ Testé</span>' : ''}
    </a>
    <div class="insp-body">
      <div class="t">${esc(it.title || it.note || pf.name)}</div>
      <div class="s">${trip ? `${esc(trip.emoji || '✈️')} ${esc(trip.destination)}` : esc(it.collection)}${it.author ? ` · @${esc(it.author)}` : ''}</div>
      <div class="btn-row" style="margin-top:6px">
        <button class="icon-btn sm" data-action="toggle-tried" data-id="${it.id}" aria-label="Testé">${it.tried ? '↺' : '✓'}</button>
        ${/recette/i.test(it.collection) ? `<button class="icon-btn sm" data-action="insp-to-recipe" data-id="${it.id}" aria-label="Créer la recette" title="Créer la recette">🍽️</button>` : ''}
        <button class="icon-btn sm" data-action="edit-insp" data-id="${it.id}" aria-label="Modifier">${icon('pencil')}</button>
      </div>
    </div>
  </div>`;
}

function viewInspirations() {
  const { collections, items } = state.inspirations;
  const f = ui.inspFilter;
  const list = items.filter((it) => f === 'all' || it.collection === f);
  return `
  <header class="head">
    <div class="head-row"><div><h1 class="title sparkle">Collections</h1><div class="subtitle">Tes TikToks & inspis, rangés par thème.</div></div>${backBtn('#/menu')}</div>
  </header>
  <div class="chips">
    <button class="chip ${f === 'all' ? 'active' : ''}" data-action="insp-filter" data-filter="all">Tout · ${items.length}</button>
    ${collections.map((c) => `<button class="chip ${f === c ? 'active' : ''}" data-action="insp-filter" data-filter="${esc(c)}">${esc(c)} · ${items.filter((it) => it.collection === c).length}</button>`).join('')}
  </div>
  <section class="section">
    <div class="btn-row" style="margin:8px 0 14px">
      <button class="btn pink" data-action="paste-insp">📋 Coller un lien</button>
      <button class="btn soft" data-action="add-insp" data-collection="${f === 'all' ? '' : esc(f)}">${icon('plus')} Ajouter</button>
    </div>
    <div class="insp-grid">${list.map(inspCard).join('')}</div>
    ${list.length ? '' : `<div class="card stack small">
      <strong>Comment enregistrer un TikTok ?</strong>
      <div>📱 <strong>Android</strong> : installe l’app sur l’écran d’accueil, puis dans TikTok → <em>Partager</em> → <strong>Marie</strong>. Le lien arrive tout seul ici.</div>
      <div>🍎 <strong>iPhone</strong> : dans TikTok → <em>Partager</em> → <em>Copier le lien</em>, puis ici → <strong>📋 Coller un lien</strong>.</div>
      <div class="muted">TikTok ne permet pas aux autres apps de lire tes collections : c’est pour ça qu’on ajoute les liens un par un.</div>
    </div>`}
  </section>`;
}

/* ============================================================
   Menu & réglages
   ============================================================ */

function avatarHTML() {
  const s = state.settings;
  return s.photo
    ? `<button class="avatar" data-action="edit-profile" style="background-image:url('${esc(s.photo)}')" aria-label="Modifier mon profil"></button>`
    : `<button class="avatar" data-action="edit-profile" aria-label="Ajouter une photo"><span style="background:var(--glass);border-radius:50%;width:44px;height:44px;display:grid;place-items:center">${esc((s.name || 'M').charAt(0))}</span></button>`;
}

function viewMenu() {
  const s = state.settings;
  const sc = (href, ic, label, cls = '') => `<a class="shortcut" href="${href}"><span class="ico-box ${cls}">${icon(ic)}</span>${label}</a>`;
  const line = (href, ic, label, extra = '') => `<li><a class="row" href="${href}"><div class="ico-box">${icon(ic)}</div><div class="grow t">${label}</div>${extra}<span class="chev">${icon('right')}</span></a></li>`;
  return `
  <header class="head">
    <div class="card"><div class="profile">${avatarHTML()}<div><div class="n">${esc(s.name)}</div><div class="tagline">${esc(s.tagline)} <span style="color:var(--pink)">♥</span></div></div></div></div>
  </header>
  <section class="section">
    ${secHead('Mes espaces')}
    <div class="shortcuts">
      ${sc('#/argent', 'wallet', 'Argent', 'pink')}
      ${sc('#/carriere', 'briefcase', 'Carrière', 'peach')}
      ${sc('#/ecole', 'school', 'École', 'lilac')}
      ${sc('#/voyages', 'plane', 'Voyages', 'pink')}
      ${sc('#/objectifs', 'target', 'Objectifs', 'lilac')}
      ${sc('#/manifestation', 'sparkles', 'Manifester', 'pink')}
      ${sc('#/perso', 'heart', 'Perso', 'peach')}
      ${sc('#/calendrier', 'calendar', 'Calendrier', 'lilac')}
      ${sc('#/priere', 'heart', 'Prière', 'lilac')}
      ${sc('#/inspirations', 'bookmark', 'Collections', 'pink')}
      ${sc('#/carte', 'plane', 'Ma carte', 'peach')}
      ${sc('#/recettes', 'bowl', 'Recettes', 'pink')}
      ${sc('#/toeic', 'book', 'TOEIC', 'lilac')}
    </div>
    <div class="card flush mt"><ul class="list">
      <li><button class="row" style="width:100%;border:0;background:none;text-align:left;cursor:pointer" data-action="edit-profile"><div class="ico-box">${icon('user')}</div><div class="grow t">Mon profil</div><span style="color:var(--pink)">♥</span><span class="chev">${icon('right')}</span></button></li>
      ${line('#/documents', 'file', 'Mes documents')}
      ${line('#/reglages', 'settings', 'Paramètres', cloudStatus().email ? '<span class="badge good">☁️ synchro</span>' : '')}
      <li><button class="row" style="width:100%;border:0;background:none;text-align:left;cursor:pointer" data-action="help"><div class="ico-box">${icon('help')}</div><div class="grow t">Aide & astuces</div><span class="chev">${icon('right')}</span></button></li>
    </ul></div>
  </section>`;
}

const CLOUD_LABELS = { off: '', 'signed-out': 'Non connectée', syncing: '🔄 Synchronisation…', pending: '⏳ Modifications en attente…', ok: '✅ Synchronisé', error: '⚠️ Erreur' };
const cloudStatusText = (s = cloudStatus()) => [CLOUD_LABELS[s.state], s.message].filter(Boolean).join(' — ');

function cloudCard() {
  const s = cloudStatus();
  const cfg = cloudConfig();
  let body;
  if (!s.configured || ui.editCloudConfig) {
    body = `<p class="small muted">Pour retrouver tes données sur ton téléphone et ton ordinateur, crée un projet gratuit sur Supabase (guide pas à pas : fichier <strong>SUPABASE.md</strong>), puis colle ici ses deux informations.</p>
      <form class="stack" data-form="cloud-config">
        <label class="field"><span>Project URL</span><input class="input" name="url" value="${esc(cfg.url)}" placeholder="https://xxxx.supabase.co" autocomplete="off" /></label>
        <label class="field"><span>Clé publique (anon / publishable)</span><input class="input" name="anonKey" value="${esc(cfg.anonKey)}" placeholder="eyJhbGciOi… ou sb_publishable_…" autocomplete="off" /></label>
        <div class="btn-row"><button class="btn pink sm" type="submit">Enregistrer</button>${s.configured ? '<button class="btn sm ghost" type="button" data-action="cloud-edit-cancel">Annuler</button>' : ''}</div>
      </form>`;
  } else if (!s.email) {
    body = `<p class="small muted">Connecte-toi avec le même compte sur chaque appareil. La première fois, choisis « Créer mon compte ».</p>
      <form class="stack" data-form="cloud-login">
        <input class="input" type="email" name="email" placeholder="Email" autocomplete="email" required />
        <input class="input" type="password" name="password" placeholder="Mot de passe (6 caractères min.)" autocomplete="current-password" required />
        <div class="btn-row">
          <button class="btn pink sm" type="submit">Se connecter</button>
          <button class="btn sm" type="button" data-action="cloud-signup">Créer mon compte</button>
          <button class="btn sm ghost" type="button" data-action="cloud-edit">Configuration</button>
        </div>
      </form>`;
  } else {
    body = `<p class="small">Connectée : <strong>${esc(s.email)}</strong></p>
      <p class="small muted">Chaque modification est envoyée automatiquement. Si deux appareils sont modifiés, c’est la version la plus récente qui l’emporte.</p>
      <div class="btn-row"><button class="btn sm soft" data-action="cloud-sync">🔄 Synchroniser maintenant</button><button class="btn sm ghost" data-action="cloud-signout">Se déconnecter</button></div>`;
  }
  return `<div class="card stack" id="sync">
    <h3 style="margin:0;font-family:var(--serif)">☁️ Synchronisation</h3>
    <div class="small" id="cloud-status">${esc(cloudStatusText(s))}</div>
    ${body}
  </div>`;
}

function notifCard() {
  const s = cloudStatus();
  const sup = pushSupport();
  const push = state.settings.push;
  const p = push.prefs;
  let body;
  if (!sup.supported) {
    body = sup.ios && !sup.standalone
      ? `<p class="small">Sur iPhone, les notifications marchent uniquement quand l’app est <strong>installée sur l’écran d’accueil</strong> (iOS 16.4 ou plus récent) :</p>
         <p class="small muted">Safari → bouton Partager → « Sur l’écran d’accueil », puis ouvre Marie Dashboard depuis son icône et reviens ici.</p>`
      : '<p class="small muted">Ce navigateur ne gère pas les notifications push. Essaie Chrome, Edge, Firefox ou Safari (iPhone : app installée sur l’écran d’accueil).</p>';
  } else if (!s.email) {
    body = '<p class="small muted">Active d’abord la <strong>synchronisation</strong> ci-dessus : c’est elle qui permet de t’envoyer tes rappels même quand l’app est fermée.</p>';
  } else if (!push.publicKey) {
    body = `<p class="small muted">Reçois chaque matin le résumé de ta journée, et un rappel avant chaque tâche ou séance qui a une heure — même app fermée. Première étape (une seule fois) : créer tes clés de notification.</p>
      <button class="btn pink sm" data-action="push-generate">✦ Générer mes clés</button>`;
  } else {
    const dev = {
      unknown: '…',
      on: '<span class="badge good">Activées sur cet appareil ✓</span>',
      off: '<button class="btn pink sm" data-action="push-enable">🔔 Activer sur cet appareil</button>',
      denied: '<span class="badge bad">Bloquées</span> <span class="small muted">Autorise les notifications pour Marie Dashboard dans les réglages du téléphone / du navigateur.</span>',
    }[ui.pushDevice];
    body = `<div id="push-device" class="btn-row" style="align-items:center">${dev}</div>
      <form class="stack" data-form="push-prefs">
        <label class="field"><span>Résumé du matin à</span><input class="input" type="time" name="morning" value="${esc(p.morning)}" /></label>
        <label class="field field-check"><input type="checkbox" class="circle" name="reminders" ${p.reminders ? 'checked' : ''} /> Rappel avant les tâches et routines qui ont une heure</label>
        <label class="field"><span>Me prévenir</span><select class="input" name="before">${[[0, 'à l’heure pile'], [5, '5 min avant'], [15, '15 min avant'], [30, '30 min avant'], [60, '1 h avant']].map(([v, l]) => `<option value="${v}" ${Number(p.before) === v ? 'selected' : ''}>${l}</option>`).join('')}</select></label>
        <div class="btn-row"><button class="btn sm soft" type="submit">Enregistrer</button></div>
      </form>
      <div class="btn-row">
        <button class="btn sm" data-action="push-test">Envoyer un test</button>
        ${ui.pushDevice === 'on' ? '<button class="btn sm ghost" data-action="push-disable">Désactiver ici</button>' : ''}
        <button class="btn sm ghost" data-action="push-generate">Refaire la configuration</button>
      </div>`;
  }
  return `<div class="card stack" id="notifications">
    <h3 style="margin:0;font-family:var(--serif)">🔔 Notifications</h3>
    ${body}
  </div>`;
}

async function refreshPushDevice() {
  const sup = pushSupport();
  if (!sup.supported || !state.settings.push.publicKey) return;
  let next = 'off';
  if (sup.permission === 'denied') next = 'denied';
  else if (sup.permission === 'granted' && (await currentSubscription())) next = 'on';
  if (next !== ui.pushDevice) {
    ui.pushDevice = next;
    if (parseRoute().name === 'reglages') render();
  }
}

function copyField(label, value, secret = false) {
  return `<div class="field"><span>${esc(label)}${secret ? ' 🔒' : ''}</span>
    <div class="inline-add" style="margin:0"><input class="input" readonly value="${esc(value)}" onclick="this.select()" /><button class="btn sm soft" type="button" data-action="copy" data-value="${esc(value)}">Copier</button></div></div>`;
}

function pushSetupSheet(keys) {
  const { url } = cloudConfig();
  const cron = `create extension if not exists pg_cron;
create extension if not exists pg_net;
select cron.schedule('marie-notify', '*/5 * * * *', $$
  select net.http_post(
    url := '${url}/functions/v1/notify',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ${keys.cronSecret}'),
    body := '{}'::jsonb
  );
$$);
select cron.schedule('marie-notify-cleanup', '0 4 * * *', $$
  delete from public.notifications_sent where sent_at < now() - interval '3 days';
$$);`;
  openSheet(
    '🔔 Configurer les notifications',
    `<p class="small"><strong>Copie ces valeurs maintenant</strong> : la clé privée n’est affichée qu’une fois (elle n’est pas enregistrée dans l’app). Le détail est dans <strong>NOTIFICATIONS.md</strong>.</p>
    <div class="group-label">1 · Supabase → SQL Editor</div>
    <p class="small muted" style="margin:0">Exécute le fichier <strong>supabase/notifications.sql</strong> (crée les tables).</p>
    <div class="group-label">2 · Edge Functions → Deploy a new function → Via Editor</div>
    <p class="small muted" style="margin:0">Nom : <strong>notify</strong>. Colle le contenu de <strong>supabase/functions/notify/index.ts</strong>, puis Deploy. Dans les réglages de la fonction, <strong>désactive « Verify JWT »</strong>.</p>
    <div class="group-label">3 · Edge Functions → Secrets (4 secrets)</div>
    ${copyField('VAPID_PUBLIC_KEY', keys.publicKey)}
    ${copyField('VAPID_PRIVATE_KEY', keys.privateKey, true)}
    ${copyField('VAPID_SUBJECT', 'mailto:ton-email@exemple.com')}
    ${copyField('CRON_SECRET', keys.cronSecret, true)}
    <p class="small muted" style="margin:0">Pour VAPID_SUBJECT, remplace par ton adresse email (garde « mailto: »).</p>
    <div class="group-label">4 · SQL Editor → nouveau script (planificateur)</div>
    <textarea class="input" readonly rows="7" style="font-family:monospace;font-size:11px" onclick="this.select()">${esc(cron)}</textarea>
    <button class="btn sm soft" data-action="copy" data-value="${esc(cron)}">Copier le script</button>
    <div class="group-label">5 · Ici, sur chaque téléphone</div>
    <p class="small muted" style="margin:0">« Activer sur cet appareil », puis « Envoyer un test ».</p>
    <button class="btn pink block" data-action="close-sheet">C’est noté ✦</button>`,
  );
}

function viewSettings() {
  const theme = document.documentElement.dataset.theme || 'auto';
  return `
  <header class="head">
    <div class="head-row"><div><h1 class="title sparkle">Paramètres</h1><div class="subtitle">${cloudStatus().email ? 'Tes données sont synchronisées.' : 'Tes données restent sur cet appareil.'}</div></div>${backBtn('#/menu')}</div>
  </header>
  <section class="section stack">
    ${cloudCard()}
    ${notifCard()}
    <div class="card stack">
      <h3 style="margin:0;font-family:var(--serif)">Apparence</h3>
      <div class="btn-row">${[['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']].map(([v, l]) => `<button class="chip ${theme === v ? 'active' : ''}" data-action="theme" data-theme="${v}">${l}</button>`).join('')}</div>
      <button class="btn sm" data-action="edit-profile">${icon('user')} Prénom, devise & photos</button>
    </div>
    <div class="card stack">
      <h3 style="margin:0;font-family:var(--serif)">Sauvegarde</h3>
      <p class="small muted" style="margin:0">Exporte tes données de temps en temps (fichier JSON), pour les garder en lieu sûr.</p>
      <div class="btn-row">
        <button class="btn sm" data-action="export">⬇️ Exporter</button>
        <label class="btn sm">⬆️ Importer<input type="file" accept="application/json,.json" data-action="import" hidden /></label>
      </div>
    </div>
    <div class="card stack">
      <h3 style="margin:0;font-family:var(--serif)">Remise à zéro</h3>
      <div class="btn-row"><button class="btn sm danger" data-action="reset-empty">Tout effacer</button><button class="btn sm" data-action="reset-sample">Recharger l’exemple</button><button class="btn sm ghost" data-action="show-splash">Revoir l’écran d’accueil</button></div>
    </div>
  </section>`;
}

/* ============================================================
   Feuilles : ajout rapide, rappels, aide
   ============================================================ */

function fabSheet() {
  const b = (action, ic, label, cls = '', extra = '') => `<button data-action="${action}" ${extra}><span class="ico-box ${cls}">${icon(ic)}</span>${label}</button>`;
  openSheet(
    'Ajouter ✦',
    `<div class="sheet-grid">
      ${b('add-item', 'check', 'Tâche', 'pink', `data-area="${ui.taskFilter === 'all' ? 'travail' : ui.taskFilter}"`)}
      ${b('add-expense', 'bag', 'Dépense', 'bad')}
      ${b('add-income-choice', 'euro', 'Revenu', 'good')}
      ${b('add-bill', 'receipt', 'Charge', 'peach')}
      ${b('add-goal', 'target', 'Objectif', 'lilac')}
      ${b('add-trip', 'plane', 'Voyage', 'pink')}
      ${b('add-routine', 'dumbbell', 'Routine', 'peach')}
      ${b('gratitude', 'heart', 'Gratitude', 'pink')}
      ${b('add-item', 'file', 'Document', 'lilac', 'data-area="quotidien" data-kind="renouvellement"')}
    </div>`,
  );
}

function alertsSheet() {
  const { late, bills } = alerts();
  const t = todayISO();
  const today = state.items.filter((i) => !i.done && i.date === t);
  openSheet(
    'Rappels 🔔',
    `${late.length ? `<div class="group-label bad">En retard</div><ul class="list">${late.map((i) => taskRow(i)).join('')}</ul>` : ''}
     ${bills.length ? `<div class="group-label">Paiements à prévoir</div><ul class="list">${bills.map(({ bill, date }) => `<li class="row"><input type="checkbox" class="circle" data-action="pay-bill" data-id="${bill.id}" data-month="${date.slice(0, 7)}" aria-label="Payé" /><div class="grow"><div class="t">${esc(bill.label)}</div><div class="s">${esc(inDays(daysBetween(t, date)))}</div></div><div class="amt">${eur(bill.amount)}</div></li>`).join('')}</ul>` : ''}
     ${today.length ? `<div class="group-label">Aujourd'hui</div><ul class="list">${today.map((i) => taskRow(i)).join('')}</ul>` : ''}
     ${late.length || bills.length || today.length ? '' : emptyMsg('Aucun rappel. Tout roule 💅')}`,
  );
}

function helpSheet() {
  openSheet(
    'Aide & astuces',
    `<ul class="list small">
      <li class="row"><div class="grow">✦ Le bouton <strong>+</strong> au centre ajoute n’importe quoi : tâche, dépense, objectif, voyage…</div></li>
      <li class="row"><div class="grow">✦ Coche le rond à gauche pour terminer une tâche, marquer un loyer payé ou un salaire reçu.</div></li>
      <li class="row"><div class="grow">✦ Touche une ligne pour la modifier ou la supprimer.</div></li>
      <li class="row"><div class="grow">✦ Ajoute ta photo dans <strong>Mon profil</strong>, et une photo pour tes voyages et ton vision board.</div></li>
      <li class="row"><div class="grow">✦ <strong>Paramètres → Synchronisation</strong> : retrouve tout sur ton téléphone et ton ordinateur.</div></li>
      <li class="row"><div class="grow">✦ Sur iPhone : Safari → Partager → « Sur l’écran d’accueil » pour l’installer comme une app.</div></li>
    </ul>`,
  );
}

/* ============================================================
   Routage & rendu
   ============================================================ */

const ROUTES = {
  accueil: viewHome,
  taches: viewTasks,
  calendrier: viewCalendar,
  menu: viewMenu,
  argent: viewMoney,
  carriere: viewCareer,
  ecole: viewSchool,
  voyages: viewTrips,
  voyage: viewTrip,
  objectifs: viewGoals,
  manifestation: viewManifest,
  perso: viewPerso,
  documents: viewDocuments,
  reglages: viewSettings,
  priere: viewPrayer,
  chapelet: viewRosary,
  carte: viewMap,
  recettes: viewRecipes,
  graphiques: viewCharts,
  recette: viewRecipe,
  inspirations: viewInspirations,
  toeic: viewToeic,
  'toeic-quiz': viewToeicQuiz,
  'toeic-cartes': viewToeicCards,
  'toeic-vocab': viewToeicVocab,
  'toeic-grammaire': viewToeicGrammar,
};
const TAB_OF = { accueil: 'accueil', taches: 'taches', calendrier: 'calendrier' };
// Anciennes adresses (version précédente de l'app).
const ALIASES = { aujourdhui: 'accueil', travail: 'carriere', quotidien: 'perso' };

function parseRoute() {
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
  const r = ALIASES[name] || name;
  return ROUTES[r] ? { name: r, arg } : { name: 'accueil' };
}

function render() {
  const { name, arg } = parseRoute();
  const splash = !state.settings.onboarded && name !== 'reglages';
  const view = $('#view');
  view.classList.toggle('bare', splash || name === 'chapelet' || name === 'carte');
  if (name !== 'recette' && wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
  if (name !== 'carte') {
    unmountMap();
    mapApi = null;
  }
  view.innerHTML = splash ? viewSplash() : ROUTES[name](arg);
  $('#tabbar').hidden = splash;
  document.querySelectorAll('.tabbar a[data-tab]').forEach((a) => a.classList.toggle('active', a.dataset.tab === (TAB_OF[name] || 'menu')));
  if (name === 'reglages' && ui.pushDevice === 'unknown') refreshPushDevice();
  if (name === 'carte' && !splash) setupMap();
  syncQuizTimer(name === 'toeic-quiz' && !!ui.quiz?.timed && !ui.quiz.done);
  if (name === 'toeic-grammaire' && arg) document.getElementById(`g-${arg}`)?.scrollIntoView({ block: 'start' });
}

/* ============================================================
   Actions
   ============================================================ */

const money = () => state.money;

const actions = {
  goto: (el) => {
    location.hash = el.dataset.href;
  },
  fab: () => fabSheet(),
  alerts: () => alertsSheet(),
  help: () => helpSheet(),
  'close-sheet': () => closeDialog(),
  start: () => {
    openForm({
      title: 'Bienvenue ✦',
      fields: [{ name: 'name', label: 'Comment tu t’appelles ?', required: true }],
      values: { name: state.settings.name },
      submitLabel: 'C’est parti 💖',
      onSubmit: (d) => {
        state.settings.name = d.name;
        state.settings.onboarded = true;
        location.hash = '#/accueil';
        commit(`Bienvenue ${d.name} ✨`);
      },
    });
  },
  'start-login': () => {
    state.settings.onboarded = true;
    save();
    location.hash = '#/reglages';
    render();
  },
  'show-splash': () => {
    state.settings.onboarded = false;
    save();
    location.hash = '#/accueil';
    render();
  },

  // Tâches
  'add-item': (el) => {
    closeDialog();
    itemForm(null, { area: el.dataset.area || 'travail', kind: el.dataset.kind || 'tache', date: el.dataset.date });
  },
  'edit-item': (el) => {
    const i = findById(state.items, el.dataset.id);
    if (i) itemForm(i);
  },
  'toggle-item': (el) => {
    const i = findById(state.items, el.dataset.id);
    if (!i) return;
    i.done = !i.done;
    commit(i.done ? 'Bravo, c’est fait ✦' : null);
  },
  'task-filter': (el) => {
    ui.taskFilter = el.dataset.filter;
    render();
  },
  'area-filter': (el) => {
    ui.areaFilter[el.dataset.area] = el.dataset.kind;
    render();
    if (el.dataset.scroll) document.getElementById(el.dataset.scroll)?.scrollIntoView({ behavior: 'smooth' });
  },
  'toggle-show-done': () => {
    ui.showDone = !ui.showDone;
    render();
  },
  'clear-done': () => {
    if (!confirm('Supprimer définitivement les tâches terminées affichées ?')) return;
    state.items = state.items.filter((i) => !(i.done && (ui.taskFilter === 'all' || i.area === ui.taskFilter)));
    commit('Tâches terminées supprimées');
  },
  'toggle-routine': (el) => {
    const r = findById(state.routines, el.dataset.id);
    if (!r) return;
    const d = el.dataset.date || todayISO();
    if (r.log[d]) delete r.log[d];
    else r.log[d] = true;
    commit(r.log[d] ? `${r.emoji} ${r.label} ✓` : null);
  },
  'add-routine': () => {
    closeDialog();
    routineForm();
  },
  'edit-routine': (el) => routineForm(findById(state.routines, el.dataset.id)),

  // Calendrier
  'cal-month': (el) => {
    ui.calMonth = shiftMonth(ui.calMonth, Number(el.dataset.step));
    render();
  },
  'cal-day': (el) => {
    ui.calDay = el.dataset.date;
    if (!ui.calDay.startsWith(ui.calMonth)) ui.calMonth = ui.calDay.slice(0, 7);
    render();
  },

  // Argent
  'toggle-balance': () => {
    state.settings.hideBalance = !state.settings.hideBalance;
    commit();
  },
  'budget-detail': () => budgetDetail(),
  'add-expense': () => {
    closeDialog();
    expenseForm();
  },
  'edit-expense': (el) => expenseForm(findById(money().expenses, el.dataset.id)),
  'add-bill': (el) => {
    closeDialog();
    billForm(null, el.dataset.category);
  },
  'edit-bill': (el) => billForm(findById(money().bills, el.dataset.id)),
  'toggle-bill': (el) => {
    const b = findById(money().bills, el.dataset.id);
    const m = monthKey();
    const had = b.paid.includes(m);
    b.paid = had ? b.paid.filter((x) => x !== m) : [...b.paid, m];
    commit(had ? null : `${b.label} payé ✓`);
  },
  'pay-bill': (el) => {
    const b = findById(money().bills, el.dataset.id);
    if (!b.paid.includes(el.dataset.month)) b.paid.push(el.dataset.month);
    commit(`${b.label} payé ✓`);
    alertsSheet();
  },
  'add-income-choice': () => {
    openSheet(
      'Ajouter un revenu',
      `<div class="sheet-grid" style="grid-template-columns:1fr 1fr">
        <button data-action="add-income"><span class="ico-box good">${icon('euro')}</span>Régulier<br><span class="muted small">salaire, CAF…</span></button>
        <button data-action="add-extra"><span class="ico-box pink">${icon('sparkles')}</span>Exceptionnel<br><span class="muted small">prime, 13e mois…</span></button>
      </div>`,
    );
  },
  'add-income': () => recurringIncomeForm(),
  'edit-income': (el) => recurringIncomeForm(findById(money().recurringIncomes, el.dataset.id)),
  'toggle-income': (el) => {
    const inc = findById(money().recurringIncomes, el.dataset.id);
    const m = monthKey();
    const had = inc.received.includes(m);
    inc.received = had ? inc.received.filter((x) => x !== m) : [...inc.received, m];
    commit(had ? null : `${inc.label} reçu 💸`);
  },
  'add-extra': () => extraIncomeForm(),
  'edit-extra': (el) => extraIncomeForm(findById(money().extraIncomes, el.dataset.id)),
  'toggle-extra': (el) => {
    const x = findById(money().extraIncomes, el.dataset.id);
    x.received = !x.received;
    if (x.received && x.date > todayISO()) x.date = todayISO();
    commit(x.received ? `+ ${eur(x.amount)} 💸` : null);
  },
  'add-debt': () => debtForm(),
  'edit-debt': (el) => debtForm(findById(money().debts, el.dataset.id)),
  'repay-debt': (el) => {
    const d = findById(money().debts, el.dataset.id);
    amountPrompt(`Rembourser — ${d.label}`, 'Compter comme dépense du mois', ({ amount, asExpense }) => {
      d.remaining = Math.max(0, d.remaining - amount);
      if (asExpense) money().expenses.push({ id: uid(), label: `Remboursement — ${d.label}`, amount, date: todayISO(), category: 'Remboursement' });
      commit(`${eur(amount)} remboursés ✓`);
    });
  },
  'add-saving': () => savingForm(),
  'edit-saving': (el) => savingForm(findById(money().savings, el.dataset.id)),
  'deposit-saving': (el) => {
    const s = findById(money().savings, el.dataset.id);
    amountPrompt(`Verser sur « ${s.label} »`, 'Déduire du budget du mois', ({ amount, asExpense }) => {
      s.amount = (Number(s.amount) || 0) + amount;
      if (asExpense) money().expenses.push({ id: uid(), label: `Épargne — ${s.label}`, amount, date: todayISO(), category: 'Épargne' });
      commit(`${eur(amount)} mis de côté 🐷`);
    });
  },
  'edit-carry': () => {
    const m = monthKey();
    openForm({
      title: 'Solde au début du mois',
      fields: [{ name: 'carry', label: 'Ce que tu avais le 1er (salaire du mois dernier compris)', type: 'number' }],
      values: { carry: money().carry[m] || 0 },
      onSubmit: (d) => {
        money().carry[m] = d.carry;
        commit('Solde mis à jour ✓');
      },
    });
  },

  // Carrière, école, objectifs
  'add-goal': (el) => {
    closeDialog();
    goalForm(null, el.dataset.category);
  },
  'edit-goal': (el) => {
    const g = findById(state.manifest.dreams, el.dataset.id);
    if (g) goalForm(g);
    else goalForm(null, el.dataset.category);
  },
  'goal-filter': (el) => {
    ui.goalFilter = el.dataset.filter;
    render();
  },
  'edit-school': () => schoolForm(),

  // Voyages
  'add-trip': () => {
    closeDialog();
    tripForm();
  },
  'edit-trip': (el) => tripForm(findById(state.trips, el.dataset.id)),
  'add-booking': (el) => bookingForm(findById(state.trips, el.dataset.trip)),
  'edit-booking': (el) => {
    const tr = findById(state.trips, el.dataset.trip);
    bookingForm(tr, findById(tr.bookings, el.dataset.id));
  },
  'toggle-check': (el) => {
    const tr = findById(state.trips, el.dataset.trip);
    const c = findById(tr.checklist, el.dataset.id);
    c.done = !c.done;
    commit();
  },
  'del-check': (el) => {
    const tr = findById(state.trips, el.dataset.trip);
    tr.checklist = tr.checklist.filter((c) => c.id !== el.dataset.id);
    commit();
  },

  // Manifestation
  gratitude: () => {
    closeDialog();
    gratitudeForm();
  },
  'next-affirmation': () => {
    ui.affShift++;
    render();
  },
  'del-affirmation': (el) => {
    state.manifest.affirmations = state.manifest.affirmations.filter((a) => a.id !== el.dataset.id);
    commit();
  },

  // Prière
  'add-novena': () => novenaForm(),
  'edit-novena': (el) => novenaForm(findById(state.prayer.novenas, el.dataset.id)),
  'novena-day': (el) => {
    const n = findById(state.prayer.novenas, el.dataset.id);
    const k = Number(el.dataset.day);
    if (!n || k < 1 || k > n.days) return;
    if (k > novenaDay(n)) return toast('Ce jour n’est pas encore arrivé 🙂');
    n.done = n.done || {};
    if (n.done[k]) delete n.done[k];
    else n.done[k] = todayISO();
    commit(n.done[k] ? (novenaDoneCount(n) >= n.days ? '✨ Neuvaine terminée ! Que Dieu te bénisse' : `Jour ${k} prié 🙏`) : null);
  },
  'novena-text': (el) => {
    const n = findById(state.prayer.novenas, el.dataset.id);
    openSheet(n.name, `<div class="prayer-text" style="color:var(--text);background:var(--surface-2)"><p style="white-space:pre-wrap">${esc(n.text)}</p></div>`);
  },
  'toggle-intention': (el) => {
    const it = findById(state.prayer.intentions, el.dataset.id);
    it.answered = !it.answered;
    commit(it.answered ? 'Exaucée ✨ Merci Seigneur' : null);
  },
  'del-intention': (el) => {
    state.prayer.intentions = state.prayer.intentions.filter((x) => x.id !== el.dataset.id);
    commit();
  },
  'rosary-next': () => {
    const r = state.prayer.rosary;
    const set = r.current?.set || MYSTERY_OF_DAY[new Date().getDay()];
    const total = rosarySteps(set).length;
    const step = (r.current?.step || 0) + 1;
    if (step >= total) {
      const t = todayISO();
      r.log[t] = (r.log[t] || 0) + 1;
      r.current = null;
      location.hash = '#/priere';
      commit('📿 Chapelet terminé ✨ Que Dieu te bénisse');
      return;
    }
    r.current = { set, step, date: todayISO() };
    commit();
  },
  'rosary-prev': () => {
    const r = state.prayer.rosary;
    if (!r.current) return;
    r.current.step = Math.max(0, r.current.step - 1);
    commit();
  },
  'rosary-set': (el) => {
    const r = state.prayer.rosary;
    r.current = { set: el.dataset.set, step: r.current?.step || 0, date: todayISO() };
    commit();
  },
  'rosary-reset': () => {
    if (state.prayer.rosary.current && !confirm('Recommencer le chapelet depuis le début ?')) return;
    state.prayer.rosary.current = null;
    commit();
  },
  'rosary-toggle-text': () => {
    ui.showPrayerText = !ui.showPrayerText;
    render();
  },

  // Graphiques
  'stats-month': (el) => {
    ui.statsMonth = el.dataset.month;
    render();
  },
  'charts-table': () => {
    ui.chartsTable = !ui.chartsTable;
    render();
  },

  // Recettes
  'add-recipe': () => {
    closeDialog();
    recipeForm();
  },
  'edit-recipe': (el) => recipeForm(recipeById(el.dataset.id)),
  'recipe-filter': (el) => {
    ui.recipeFilter = el.dataset.filter;
    render();
  },
  'recipe-fav': (el) => {
    const r = recipeById(el.dataset.id);
    r.favorite = !r.favorite;
    commit(r.favorite ? 'Ajoutée aux favoris ♥' : null);
  },
  servings: (el) => {
    const r = recipeById(el.dataset.id);
    ui.servings[r.id] = clamp((ui.servings[r.id] || r.servings || 1) + Number(el.dataset.step), 1, 24);
    render();
  },
  'check-ing': (el) => {
    const m = (ui.checkedIng[el.dataset.id] ||= {});
    m[el.dataset.i] = !m[el.dataset.i];
    render();
  },
  'cook-mode': () => toggleWakeLock(),
  'plan-day': (el) => planSheet(el.dataset.date),
  'plan-recipe': (el) => planSheet(todayISO(), el.dataset.id),
  'plan-set': (el) => {
    const { date, meal, id, back } = el.dataset;
    const day = (state.mealPlan[date] ||= {});
    if (!id || day[meal] === id) delete day[meal];
    else day[meal] = id;
    if (!Object.keys(day).length) delete state.mealPlan[date];
    commit();
    if (back === 'recipe') planSheet(date, id);
    else planSheet(date);
  },
  'recipe-shopping': (el) => {
    const r = recipeById(el.dataset.id);
    const factor = (ui.servings[r.id] || r.servings || 1) / (r.servings || 1);
    const n = addToShopping(r.ingredients.map((line) => ({ line: scaleLine(line, factor), from: r.title })));
    commit(n ? `🛒 ${plural(n, 'ingrédient ajouté', 'ingrédients ajoutés')} aux courses` : 'Tout est déjà dans ta liste 🛒');
  },
  'week-shopping': () => {
    const entries = [];
    for (let i = 0; i < 7; i++) {
      const plan = state.mealPlan[addDays(todayISO(), i)] || {};
      for (const id of Object.values(plan)) {
        const r = recipeById(id);
        if (r) entries.push(...r.ingredients.map((line) => ({ line, from: r.title })));
      }
    }
    if (!entries.length) return toast('Planifie d’abord des repas cette semaine 📅');
    const n = addToShopping(entries);
    commit(n ? `🛒 ${plural(n, 'article ajouté', 'articles ajoutés')} à tes courses` : 'Ta liste de courses est déjà complète 🛒');
  },
  'insp-to-recipe': (el) => {
    const it = findById(state.inspirations.items, el.dataset.id);
    recipeForm(null, { title: it.title || '', link: it.url, notes: it.note || '', image: '' });
  },

  // Carte
  'map-filter': (el) => {
    ui.mapFilter = el.dataset.filter;
    ui.mapView = null;
    render();
  },
  'map-focus': (el) => {
    const tr = findById(state.trips, el.dataset.id);
    if (!tr) return;
    if (mapApi?.focus(tr.id)) return;
    ui.pickTrip = tr.id;
    render();
    toast(`Touche la carte pour placer ${tr.destination}`);
  },
  'map-pick': (el) => {
    ui.pickTrip = el.dataset.id;
    location.hash = '#/carte';
  },
  'map-pick-cancel': () => {
    ui.pickTrip = null;
    render();
  },

  // Collections
  'add-insp': (el) => {
    closeDialog();
    inspirationForm(null, { tripId: el.dataset.trip, collection: el.dataset.collection });
  },
  'edit-insp': (el) => inspirationForm(findById(state.inspirations.items, el.dataset.id)),
  'toggle-tried': (el) => {
    const it = findById(state.inspirations.items, el.dataset.id);
    it.tried = !it.tried;
    commit(it.tried ? 'Testé ✓' : null);
  },
  'insp-filter': (el) => {
    ui.inspFilter = el.dataset.filter;
    render();
  },
  'paste-insp': async () => {
    let text = '';
    try {
      text = await navigator.clipboard.readText();
    } catch {}
    const url = (text.match(URL_RE) || [''])[0];
    if (!url) toast('Copie d’abord le lien dans TikTok (Partager → Copier le lien)');
    inspirationForm(null, { url, collection: ui.inspFilter === 'all' ? undefined : ui.inspFilter });
  },

  // Profil & réglages
  'edit-profile': () => profileForm(),
  theme: (el) => {
    try {
      if (el.dataset.theme === 'auto') localStorage.removeItem(`${STORAGE_KEY}:theme`);
      else localStorage.setItem(`${STORAGE_KEY}:theme`, el.dataset.theme);
    } catch {}
    applyTheme();
    render();
  },
  export: () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `marie-dashboard-${todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Sauvegarde téléchargée ✓');
  },
  'reset-empty': () => {
    if (!confirm('Effacer toutes les données ? Pense à exporter avant.')) return;
    const { name, photo, cover, tagline } = state.settings;
    state = emptyState();
    Object.assign(state.settings, { name, photo, cover, tagline, onboarded: true });
    commit('Page blanche ✨');
  },
  'reset-sample': () => {
    if (!confirm('Remplacer tes données par l’exemple ?')) return;
    state = sampleState();
    state.settings.onboarded = true;
    commit('Exemple rechargé');
  },

  // Notifications
  'push-generate': async () => {
    if (state.settings.push.publicKey && !confirm('Créer de nouvelles clés ? Il faudra remplacer les secrets dans Supabase et réactiver chaque appareil.')) return;
    const keys = await generateKeys();
    state.settings.push.publicKey = keys.publicKey;
    ui.pushDevice = 'off';
    await disablePush().catch(() => {});
    commit();
    pushSetupSheet(keys);
  },
  'push-enable': async (el) => {
    el.disabled = true;
    try {
      await enablePush(state.settings.push.publicKey);
      ui.pushDevice = 'on';
      render();
      toast('Notifications activées 🔔✨');
    } catch (e) {
      el.disabled = false;
      toast(`⚠️ ${e.message}`);
      refreshPushDevice();
    }
  },
  'push-disable': async () => {
    await disablePush();
    ui.pushDevice = 'off';
    render();
    toast('Notifications désactivées sur cet appareil');
  },
  'push-test': async (el) => {
    el.disabled = true;
    try {
      const r = await sendTestPush();
      if (r?.sent) toast(`Test envoyé à ${r.sent} appareil${r.sent > 1 ? 's' : ''} 🔔`);
      else toast(`⚠️ ${r?.errors?.[0] || r?.info || 'Aucun appareil activé'}`);
    } catch (e) {
      toast(`⚠️ ${e.message}`);
    }
    el.disabled = false;
  },
  copy: async (el) => {
    try {
      await navigator.clipboard.writeText(el.dataset.value);
      toast('Copié ✓');
    } catch {
      toast('Sélectionne le texte et copie-le');
    }
  },

  // Synchronisation
  'cloud-edit': () => {
    ui.editCloudConfig = true;
    render();
  },
  'cloud-edit-cancel': () => {
    ui.editCloudConfig = false;
    render();
  },
  'cloud-signup': async (el) => {
    const form = el.closest('form');
    const email = form.elements.email.value.trim();
    const password = form.elements.password.value;
    if (!email || password.length < 6) return toast('Email et mot de passe (6 caractères min.)');
    el.disabled = true;
    try {
      const result = await signUp(email, password);
      state.settings.onboarded = true;
      save();
      if (result === 'ok') render();
      else el.disabled = false;
      toast(result === 'confirm' ? '📧 Confirme ton email, puis connecte-toi' : 'Compte créé, synchro activée ☁️');
    } catch (e) {
      el.disabled = false;
      toast(`⚠️ ${e.message}`);
    }
  },
  'cloud-sync': async () => {
    await sync();
    const s = cloudStatus();
    toast(s.state === 'error' ? `⚠️ ${s.message}` : 'Synchronisé ✅');
  },
  'cloud-signout': async () => {
    if (!confirm('Se déconnecter ? Tes données restent sur cet appareil, mais ne seront plus synchronisées.')) return;
    await signOut();
    render();
  },
};

Object.assign(actions, toeicActions);

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.dataset.action === 'import') return;
  // closest() renvoie l'élément le plus proche : une case à cocher placée dans
  // une ligne cliquable déclenche sa propre action, pas l'édition de la ligne.
  actions[el.dataset.action]?.(el, e);
});

document.addEventListener('keydown', (e) => {
  if (parseRoute().name === 'chapelet' && !$('#modal').open && (e.key === 'ArrowRight' || (e.key === ' ' && e.target === document.body))) {
    e.preventDefault();
    actions['rosary-next']();
    return;
  }
  if (parseRoute().name === 'chapelet' && e.key === 'ArrowLeft') return actions['rosary-prev']();
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('[role="button"][data-action]')) {
    e.preventDefault();
    actions[e.target.dataset.action]?.(e.target, e);
  }
});

document.addEventListener('input', (e) => {
  if (e.target.dataset?.input !== 'recipe-search') return;
  ui.recipeSearch = e.target.value;
  const grid = $('#recipe-grid');
  if (grid) grid.innerHTML = recipeGridHTML();
});

document.addEventListener('change', (e) => {
  const el = e.target;
  if (el.dataset?.action !== 'import' || !el.files?.[0]) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data || typeof data !== 'object' || !data.money) throw new Error('format');
      if (!confirm('Remplacer les données actuelles par ce fichier ?')) return;
      state = normalize(data);
      state.settings.onboarded = true;
      commit('Données importées ✓');
    } catch {
      toast('⚠️ Fichier invalide');
    }
  };
  reader.readAsText(el.files[0]);
  el.value = '';
});

document.addEventListener('submit', (e) => {
  const form = e.target.closest('form[data-form]');
  if (!form) return;
  e.preventDefault();
  const kind = form.dataset.form;
  if (kind === 'add-check') {
    const text = form.elements.text.value.trim();
    if (!text) return;
    const tr = findById(state.trips, form.dataset.trip);
    tr.checklist.push({ id: uid(), text, done: false });
    commit();
    $('form[data-form="add-check"] input')?.focus();
  } else if (kind === 'gratitude') {
    const entries = [0, 1, 2].map((i) => form.elements[`g${i}`].value.trim());
    state.manifest.gratitude[todayISO()] = entries;
    commit(entries.some(Boolean) ? 'Merci, merci, merci 🙏✨' : null);
  } else if (kind === 'add-affirmation') {
    const text = form.elements.text.value.trim();
    if (!text) return;
    state.manifest.affirmations.push({ id: uid(), text });
    commit('Affirmation ajoutée 💕');
    $('form[data-form="add-affirmation"] input')?.focus();
  } else if (kind === 'add-intention') {
    const text = form.elements.text.value.trim();
    if (!text) return;
    state.prayer.intentions.unshift({ id: uid(), text, answered: false, date: todayISO() });
    commit('Intention confiée 🕊️');
  } else if (kind === 'rosary-prefs') {
    state.prayer.rosary.daily = form.elements.daily.checked;
    state.prayer.rosary.time = form.elements.time.value;
    commit('Enregistré 📿');
  } else if (kind === 'push-prefs') {
    state.settings.push.prefs = {
      morning: form.elements.morning.value,
      reminders: form.elements.reminders.checked,
      before: Number(form.elements.before.value),
    };
    commit('Préférences enregistrées 🔔');
  } else if (kind === 'cloud-config') {
    const url = form.elements.url.value.trim();
    if (url && !/^https:\/\/.+/.test(url)) return toast('L’adresse doit commencer par https://');
    saveConfig(url, form.elements.anonKey.value);
    ui.editCloudConfig = false;
    render();
    toast('Configuration enregistrée ✓');
  } else if (kind === 'cloud-login') {
    const button = form.querySelector('button[type="submit"]');
    button.disabled = true;
    signIn(form.elements.email.value.trim(), form.elements.password.value)
      .then(() => {
        state.settings.onboarded = true;
        save();
        render();
        toast('Connectée ☁️');
      })
      .catch((err) => {
        button.disabled = false;
        toast(`⚠️ ${err.message}`);
      });
  }
});

function applyTheme() {
  let theme = null;
  try {
    theme = localStorage.getItem(`${STORAGE_KEY}:theme`);
  } catch {}
  if (theme) document.documentElement.dataset.theme = theme;
  else delete document.documentElement.dataset.theme;
}

window.addEventListener('hashchange', () => {
  closeDialog();
  stopSpeaking();
  render();
  window.scrollTo(0, 0);
});

let lastDay = todayISO();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayISO() !== lastDay) {
    lastDay = todayISO();
    ui.calDay = lastDay;
    ui.calMonth = monthKey();
    render();
  }
});

applyTheme();
save();
render();
if (pushSupport().supported) registerSW();

// Lien partagé depuis TikTok & co (Android : menu Partager → Marie).
(() => {
  const params = new URLSearchParams(location.search);
  const shared = [params.get('url'), params.get('text'), params.get('title')].filter(Boolean).join(' ');
  if (!shared) return;
  history.replaceState(null, '', location.pathname + '#/inspirations');
  const url = (shared.match(URL_RE) || [''])[0];
  state.settings.onboarded = true;
  render();
  if (url) inspirationForm(null, { url, title: params.get('title') || '' });
})();
initCloud({
  getState: () => state,
  replaceState: (data) => {
    state = normalize(data);
    state.settings.onboarded = true;
    save();
    render();
  },
  onStatus: (s) => {
    const el = $('#cloud-status');
    if (el) el.textContent = cloudStatusText(s);
  },
});
