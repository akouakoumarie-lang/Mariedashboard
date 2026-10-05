// Marie Dashboard — cockpit personnel.
// Toutes les données sont stockées localement dans le navigateur (localStorage).

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

// Date du jour `day` dans le mois donné (borné au dernier jour du mois).
function dateInMonth(day, ym) {
  const [y, m] = ym.split('-').map(Number);
  return `${y}-${pad(m)}-${pad(Math.min(day, lastDayOfMonth(y, m - 1)))}`;
}

function nextMonthKey(ym) {
  const [y, m] = ym.split('-').map(Number);
  return monthKey(new Date(y, m, 1));
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const eurFmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 2 });
const eur = (n) => eurFmt.format(Math.round((Number(n) || 0) * 100) / 100);
const sum = (arr, f = (x) => x) => arr.reduce((acc, x) => acc + (Number(f(x)) || 0), 0);

const dateLong = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const dateShort = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const monthLong = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });
const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function fmtDate(s) {
  return s ? dateShort.format(parseISO(s)) : '';
}

// « aujourd'hui », « demain », « dans 3 j », « il y a 2 j »
function relDay(s) {
  const d = daysBetween(todayISO(), s);
  if (d === 0) return "aujourd'hui";
  if (d === 1) return 'demain';
  if (d === -1) return 'hier';
  if (d > 1 && d < 7) return `dans ${d} j`;
  if (d < 0) return `il y a ${-d} j`;
  return fmtDate(s);
}

function inDays(n) {
  if (n === 0) return "aujourd'hui";
  if (n === 1) return 'demain';
  if (n < 0) return `en retard de ${-n} j`;
  return `dans ${n} jours`;
}

const WEEKDAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

/* ============================================================
   Configuration des espaces
   ============================================================ */

const AREAS = {
  travail: {
    label: 'Travail & carrière',
    emoji: '💼',
    todayLabel: (n) => `${n} tâche${n > 1 ? 's' : ''} professionnelle${n > 1 ? 's' : ''}`,
    kinds: {
      tache: { label: 'Tâche Safran', emoji: '✅' },
      projet: { label: 'Projet en cours', emoji: '🧩', statuses: ['À démarrer', 'En cours', 'En pause', 'Terminé'] },
      contact: { label: 'Personne à contacter', emoji: '📇' },
      candidature: { label: 'Candidature CDI', emoji: '📨', statuses: ['À envoyer', 'Envoyée', 'Relancée', 'Entretien', 'Offre', 'Refus'] },
      opportunite: { label: 'Opportunité', emoji: '🎯', statuses: ['Repérée', 'À creuser', 'En discussion', 'Abandonnée'] },
      formation: { label: 'Formation', emoji: '📚', statuses: ['À faire', 'En cours', 'Terminée'] },
      competence: { label: 'Compétence', emoji: '🌱', statuses: ['À développer', 'En progrès', 'Acquise'] },
    },
  },
  ecole: {
    label: 'École',
    emoji: '🎓',
    todayLabel: (n) => `${n} tâche${n > 1 ? 's' : ''} école`,
    kinds: {
      devoir: { label: 'Devoir', emoji: '📝' },
      examen: { label: 'Examen', emoji: '🧪' },
      rattrapage: { label: 'Rattrapage', emoji: '🔁' },
      echeance: { label: 'Échéance', emoji: '⏳' },
      toeic: { label: 'TOEIC', emoji: '🇬🇧' },
      document: { label: 'Document important', emoji: '📄' },
    },
  },
  quotidien: {
    label: 'Vie quotidienne',
    emoji: '🏠',
    todayLabel: (n) => `${n} chose${n > 1 ? 's' : ''} du quotidien`,
    kinds: {
      courses: { label: 'Courses', emoji: '🛒' },
      demarche: { label: 'Démarche administrative', emoji: '🗂️' },
      renouvellement: { label: 'Renouvellement de document', emoji: '🪪' },
      rappel: { label: 'Rappel', emoji: '🔔' },
    },
  },
};

const BILL_CATEGORIES = { loyer: 'Loyer', facture: 'Facture', abonnement: 'Abonnement', credit: 'Crédit', autre: 'Autre' };
const EXPENSE_CATEGORIES = ['Courses', 'Transport', 'Restaurants', 'Sorties', 'Shopping', 'Santé', 'Maison', 'Cadeaux', 'Voyage', 'Épargne', 'Remboursement', 'Autre'];
const INCOME_KINDS = { salaire: 'Salaire', caf: 'CAF', autre: 'Autre' };
const TRIP_STATUSES = ['Envisagé', 'En préparation', 'Réservé', 'Terminé'];
const BOOKING_KINDS = { billet: '🎫 Billet', hotel: '🏨 Hôtel', activite: '🎟️ Activité', autre: '📦 Autre' };
const DREAM_CATEGORIES = {
  argent: '💰 Argent',
  carriere: '💼 Carrière',
  etudes: '🎓 Études',
  voyages: '✈️ Voyages',
  amour: '💕 Amour & relations',
  bienetre: '🌸 Santé & bien-être',
  maison: '🏠 Maison',
  moi: '✨ Moi',
};
const DEFAULT_AFFIRMATIONS = [
  'Je mérite tout ce que je désire.',
  "L'argent vient à moi facilement et en abondance.",
  'Mon CDI idéal est déjà en route vers moi.',
  'Je suis capable, brillante et déterminée.',
  'Chaque jour, je me rapproche de la vie dont je rêve.',
  'Je réussis mes examens avec confiance et sérénité.',
  'Je suis reconnaissante pour tout ce que j’ai déjà.',
  'Les bonnes opportunités me trouvent naturellement.',
  'Je prends soin de mon corps, de mon esprit et de mon argent.',
  'Je voyage, je découvre, je vis pleinement.',
];
const DEFAULT_CHECKLIST = ["Pièce d'identité / passeport", 'Billets imprimés ou dans le téléphone', 'Réservation hôtel', 'Assurance voyage', 'Chargeur + adaptateur', 'Médicaments', 'Prévenir la banque'];

/* ============================================================
   Données
   ============================================================ */

function emptyState() {
  return {
    version: 1,
    settings: { name: 'Marie' },
    items: [],
    routines: [],
    money: {
      recurringIncomes: [],
      extraIncomes: [],
      bills: [],
      expenses: [],
      debts: [],
      savings: [],
      carry: {},
    },
    trips: [],
    manifest: {
      affirmations: DEFAULT_AFFIRMATIONS.map((text) => ({ id: uid(), text })),
      dreams: [],
      gratitude: {},
    },
  };
}

// Données d'exemple pour découvrir l'application (modifiables / supprimables).
function sampleState() {
  const t = todayISO();
  const m = monthKey();
  const s = emptyState();
  const item = (area, kind, title, date = '', extra = {}) => ({ id: uid(), area, kind, title, date, done: false, notes: '', status: '', ...extra });

  s.items = [
    item('travail', 'tache', 'Préparer le point hebdo avec le tuteur', t),
    item('travail', 'tache', 'Mettre à jour le tableau de suivi des essais', t),
    item('travail', 'tache', 'Relire la doc technique du projet', addDays(t, 2)),
    item('travail', 'projet', 'Projet amélioration continue', '', { status: 'En cours' }),
    item('travail', 'contact', 'Recontacter la RH pour les postes CDI', addDays(t, 3)),
    item('travail', 'candidature', 'Candidature CDI — ingénieure qualité', addDays(t, 5), { status: 'À envoyer' }),
    item('travail', 'opportunite', 'Poste interne repéré sur l’intranet', '', { status: 'À creuser' }),
    item('travail', 'formation', 'Formation Excel avancé / Power BI', '', { status: 'À faire' }),
    item('travail', 'competence', 'Prise de parole en réunion', '', { status: 'En progrès' }),
    item('ecole', 'devoir', 'Rendre le rapport de gestion de projet', t),
    item('ecole', 'examen', 'Examen de finance', addDays(t, 9)),
    item('ecole', 'toeic', 'Inscription au TOEIC', addDays(t, 12)),
    item('ecole', 'rattrapage', 'Vérifier les dates de rattrapage', addDays(t, 20)),
    item('ecole', 'document', 'Convention de stage signée', ''),
    item('quotidien', 'courses', 'Lait, œufs, fruits', ''),
    item('quotidien', 'courses', 'Lessive', ''),
    item('quotidien', 'demarche', 'Envoyer le justificatif à la CAF', addDays(t, 4)),
    item('quotidien', 'renouvellement', 'Renouveler le titre de séjour / la carte d’identité', addDays(t, 60)),
    item('quotidien', 'rappel', 'Appeler maman', addDays(t, 1)),
  ];

  const todayDow = new Date().getDay();
  s.routines = [
    { id: uid(), label: 'Sport', emoji: '🏋🏾‍♀️', days: [1, 3, 5, todayDow].filter((v, i, a) => a.indexOf(v) === i), log: {} },
    { id: uid(), label: 'Courses', emoji: '🛒', days: [6, todayDow].filter((v, i, a) => a.indexOf(v) === i), log: {} },
  ];

  s.money.recurringIncomes = [
    { id: uid(), label: 'Salaire Safran', kind: 'salaire', amount: 1450, day: 28, received: [] },
    { id: uid(), label: 'CAF', kind: 'caf', amount: 180, day: 5, received: new Date().getDate() >= 5 ? [m] : [] },
  ];
  s.money.extraIncomes = [
    { id: uid(), label: 'Prime de fin d’année', amount: 400, date: addDays(t, 45), received: false },
  ];
  s.money.bills = [
    { id: uid(), label: 'Loyer', category: 'loyer', amount: 520, day: 5, paid: new Date().getDate() >= 5 ? [m] : [] },
    { id: uid(), label: 'Électricité', category: 'facture', amount: 45, day: new Date(Date.now() + 2 * 86400000).getDate(), paid: [] },
    { id: uid(), label: 'Forfait téléphone', category: 'abonnement', amount: 15, day: 12, paid: [] },
    { id: uid(), label: 'Netflix', category: 'abonnement', amount: 8, day: 20, paid: [] },
    { id: uid(), label: 'Abonnement salle de sport', category: 'abonnement', amount: 30, day: 1, paid: [m] },
  ];
  s.money.expenses = [
    { id: uid(), label: 'Courses Lidl', amount: 62.4, date: addDays(t, -3), category: 'Courses' },
    { id: uid(), label: 'Pass Navigo', amount: 88.8, date: dateInMonth(1, m), category: 'Transport' },
    { id: uid(), label: 'Resto avec les copines', amount: 27, date: addDays(t, -1), category: 'Restaurants' },
  ].filter((e) => e.date.startsWith(m));
  s.money.debts = [
    { id: uid(), label: 'Prêt à rembourser à ma sœur', total: 300, remaining: 150 },
  ];
  s.money.savings = [
    { id: uid(), label: 'Épargne de précaution', amount: 650, goal: 1500 },
    { id: uid(), label: 'Voyage été', amount: 120, goal: 800 },
  ];
  s.money.carry[m] = 1100;

  s.trips = [
    {
      id: uid(),
      destination: 'Lisbonne',
      start: addDays(t, 40),
      end: addDays(t, 44),
      status: 'En préparation',
      budget: 600,
      bookings: [
        { id: uid(), kind: 'billet', label: 'Vol aller-retour', cost: 140, booked: true },
        { id: uid(), kind: 'hotel', label: 'Airbnb Alfama — 4 nuits', cost: 220, booked: false },
      ],
      checklist: DEFAULT_CHECKLIST.map((text, i) => ({ id: uid(), text, done: i === 0 })),
      notes: 'Documents : carte d’identité, carte européenne d’assurance maladie.',
    },
    {
      id: uid(),
      destination: 'Abidjan',
      start: '',
      end: '',
      status: 'Envisagé',
      budget: 1200,
      bookings: [],
      checklist: [],
      notes: 'Regarder les prix des billets pour les vacances.',
    },
  ];
  s.manifest.dreams = [
    { id: uid(), emoji: '💼', title: 'Décrocher mon CDI', category: 'carriere', date: addDays(t, 180), notes: 'Je me vois signer mon contrat, fière de moi.', image: '', manifested: false },
    { id: uid(), emoji: '💰', title: '1 500 € d’épargne de précaution', category: 'argent', date: addDays(t, 120), notes: '', image: '', manifested: false },
    { id: uid(), emoji: '✈️', title: 'Week-end à Lisbonne', category: 'voyages', date: addDays(t, 40), notes: '', image: '', manifested: false },
    { id: uid(), emoji: '🇬🇧', title: '900+ au TOEIC', category: 'etudes', date: addDays(t, 60), notes: '', image: '', manifested: false },
    { id: uid(), emoji: '🏠', title: 'Mon appartement à moi', category: 'maison', date: '', notes: '', image: '', manifested: false },
  ];
  return s;
}

function normalize(data) {
  const base = emptyState();
  const out = { ...base, ...data };
  out.settings = { ...base.settings, ...(data.settings || {}) };
  out.money = { ...base.money, ...(data.money || {}) };
  out.manifest = { ...base.manifest, ...(data.manifest || {}) };
  for (const k of ['items', 'routines', 'trips']) if (!Array.isArray(out[k])) out[k] = [];
  return out;
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalize(JSON.parse(raw));
  } catch (e) {
    console.warn('Lecture des données impossible', e);
  }
  return sampleState();
}

let state = load();
const ui = { filters: {}, showDone: {}, openTrips: new Set(), affShift: 0 };

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    toast('⚠️ Sauvegarde impossible sur cet appareil');
  }
}

function commit(message) {
  save();
  render();
  if (message) toast(message);
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2200);
}

/* ============================================================
   Calculs
   ============================================================ */

const findById = (arr, id) => arr.find((x) => x.id === id);

function itemsFor(area) {
  return state.items.filter((i) => i.area === area);
}

// Éléments à traiter aujourd'hui (échéance aujourd'hui ou dépassée).
function dueNow(area) {
  const t = todayISO();
  return itemsFor(area).filter((i) => !i.done && i.date && i.date <= t);
}

function routinesToday() {
  const dow = new Date().getDay();
  return state.routines.filter((r) => r.days.includes(dow));
}

// Prochaine échéance non réglée d'une charge mensuelle.
function billNextDue(bill) {
  const m = monthKey();
  if (!bill.paid.includes(m)) return { date: dateInMonth(bill.day, m), month: m };
  const n = nextMonthKey(m);
  return { date: dateInMonth(bill.day, n), month: n };
}

function billsDueWithin(days) {
  const limit = addDays(todayISO(), days);
  return state.money.bills
    .map((b) => ({ bill: b, ...billNextDue(b) }))
    .filter((x) => x.date <= limit)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function incomeNextDate(inc) {
  const m = monthKey();
  if (!inc.received.includes(m)) return dateInMonth(inc.day, m);
  return dateInMonth(inc.day, nextMonthKey(m));
}

function nextSalary() {
  const salaries = state.money.recurringIncomes.filter((i) => i.kind === 'salaire');
  if (!salaries.length) return null;
  const next = salaries.map((s) => ({ inc: s, date: incomeNextDate(s) })).sort((a, b) => a.date.localeCompare(b.date))[0];
  return { ...next, days: daysBetween(todayISO(), next.date) };
}

function monthBudget(m = monthKey()) {
  const money = state.money;
  const carry = Number(money.carry[m]) || 0;
  const recurringIn = sum(money.recurringIncomes.filter((i) => i.received.includes(m)), (i) => i.amount);
  const extraIn = sum(money.extraIncomes.filter((i) => i.received && i.date.startsWith(m)), (i) => i.amount);
  const income = recurringIn + extraIn;
  const charges = sum(money.bills, (b) => b.amount);
  const chargesPaid = sum(money.bills.filter((b) => b.paid.includes(m)), (b) => b.amount);
  const expenses = sum(money.expenses.filter((e) => e.date.startsWith(m)), (e) => e.amount);
  const expected =
    sum(money.recurringIncomes.filter((i) => !i.received.includes(m)), (i) => i.amount) +
    sum(money.extraIncomes.filter((i) => !i.received && i.date.startsWith(m)), (i) => i.amount);
  const remaining = carry + income - charges - expenses;
  const [y, mo] = m.split('-').map(Number);
  const daysLeft = m === monthKey() ? lastDayOfMonth(y, mo - 1) - new Date().getDate() + 1 : 0;
  return { carry, income, charges, chargesPaid, chargesLeft: charges - chargesPaid, expenses, expected, remaining, daysLeft };
}

function upcomingExtraIncomes() {
  return state.money.extraIncomes.filter((i) => !i.received).sort((a, b) => (a.date || '9').localeCompare(b.date || '9'));
}

/* ============================================================
   Formulaires (modale)
   ============================================================ */

function fieldHTML(f, value) {
  const v = value ?? f.default ?? '';
  const req = f.required ? 'required' : '';
  const label = `<span>${esc(f.label)}</span>`;
  switch (f.type) {
    case 'textarea':
      return `<label class="field">${label}<textarea name="${f.name}" placeholder="${esc(f.placeholder || '')}">${esc(v)}</textarea></label>`;
    case 'select':
      return `<label class="field">${label}<select name="${f.name}" ${req}>${f.options
        .map(([val, text]) => `<option value="${esc(val)}" ${String(val) === String(v) ? 'selected' : ''}>${esc(text)}</option>`)
        .join('')}</select></label>`;
    case 'checkbox':
      return `<label class="field field-check"><input type="checkbox" class="check" name="${f.name}" ${v ? 'checked' : ''}/>${esc(f.label)}</label>`;
    case 'days':
      return `<div class="field">${label}<div class="days">${[1, 2, 3, 4, 5, 6, 0]
        .map((d) => `<label><input type="checkbox" name="${f.name}" value="${d}" ${(v || []).includes(d) ? 'checked' : ''}/>${WEEKDAYS[d]}</label>`)
        .join('')}</div></div>`;
    case 'image':
      return `<div class="field">${label}
        <img class="preview-img" data-preview="${f.name}" src="${esc(v)}" alt="" ${v ? '' : 'hidden'} />
        <input type="hidden" name="${f.name}" value="${esc(v)}" />
        <div class="head-actions">
          <label class="btn small">📷 Choisir une photo<input type="file" accept="image/*" data-image-for="${f.name}" hidden /></label>
          <button type="button" class="btn small ghost" data-clear-image="${f.name}">Retirer</button>
        </div></div>`;
    case 'number':
      return `<label class="field">${label}<input type="text" inputmode="decimal" name="${f.name}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${req}/></label>`;
    default:
      return `<label class="field">${label}<input type="${f.type || 'text'}" name="${f.name}" value="${esc(v)}" placeholder="${esc(f.placeholder || '')}" ${req} ${f.type === 'number' ? 'step="any"' : ''}/></label>`;
  }
}

function readForm(form, fields) {
  const data = {};
  for (const f of fields) {
    if (f.type === 'checkbox') data[f.name] = form.elements[f.name].checked;
    else if (f.type === 'days') data[f.name] = [...form.querySelectorAll(`input[name="${f.name}"]:checked`)].map((i) => Number(i.value));
    else if (f.type === 'number') data[f.name] = parseFloat(String(form.elements[f.name].value).replace(/\s/g, '').replace(',', '.')) || 0;
    else data[f.name] = form.elements[f.name].value.trim();
  }
  return data;
}

// Réduit une photo (max 640 px) pour qu'elle tienne dans le stockage local.
function resizeImage(file, max = 640) {
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
      resolve(canvas.toDataURL('image/jpeg', 0.78));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('image'));
    };
    img.src = url;
  });
}

function openForm({ title, fields, values = {}, submitLabel = 'Enregistrer', onSubmit, onDelete }) {
  const dlg = $('#modal');
  dlg.innerHTML = `<form class="modal-form" novalidate>
    <h2>${esc(title)}</h2>
    ${fields.map((f) => fieldHTML(f, values[f.name])).join('')}
    <div class="modal-actions">
      ${onDelete ? '<button type="button" class="btn danger" data-del>Supprimer</button>' : ''}
      <span class="spacer"></span>
      <button type="button" class="btn ghost" data-cancel>Annuler</button>
      <button type="submit" class="btn primary">${esc(submitLabel)}</button>
    </div>
  </form>`;
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
        setImage(input.dataset.imageFor, await resizeImage(input.files[0]));
      } catch {
        toast('⚠️ Image illisible');
      }
    }),
  );
  form.querySelectorAll('[data-clear-image]').forEach((btn) => btn.addEventListener('click', () => setImage(btn.dataset.clearImage, '')));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const missing = fields.find((f) => f.required && !String(form.elements[f.name].value).trim());
    if (missing) {
      form.elements[missing.name].focus();
      toast(`« ${missing.label} » est obligatoire`);
      return;
    }
    onSubmit(readForm(form, fields));
    dlg.close();
  });
  $('[data-cancel]', dlg).addEventListener('click', () => dlg.close());
  const del = $('[data-del]', dlg);
  if (del) {
    del.addEventListener('click', () => {
      if (confirm('Supprimer cet élément ?')) {
        onDelete();
        dlg.close();
      }
    });
  }
  dlg.showModal();
  const first = form.querySelector('input:not([type="checkbox"]), textarea, select');
  if (first && window.matchMedia('(pointer: fine)').matches) first.focus();
}

/* ---------- Formulaires métier ---------- */

function itemForm(area, item, presetKind) {
  const cfg = AREAS[area];
  const kind = item?.kind || presetKind || Object.keys(cfg.kinds)[0];
  const kindOptions = Object.entries(cfg.kinds).map(([k, v]) => [k, `${v.emoji} ${v.label}`]);
  const allStatuses = [...new Set(Object.values(cfg.kinds).flatMap((k) => k.statuses || []))];
  const fields = [
    { name: 'title', label: 'Intitulé', required: true, placeholder: 'Ex. : Préparer la réunion' },
    { name: 'kind', label: 'Type', type: 'select', options: kindOptions },
    { name: 'date', label: 'Date / échéance', type: 'date' },
  ];
  if (allStatuses.length) fields.push({ name: 'status', label: 'Statut (optionnel)', type: 'select', options: [['', '—'], ...allStatuses.map((s) => [s, s])] });
  fields.push({ name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Détails, liens, contacts…' });
  openForm({
    title: item ? 'Modifier' : `Ajouter — ${cfg.label}`,
    fields,
    values: item || { kind },
    onSubmit: (d) => {
      if (item) Object.assign(item, d);
      else state.items.push({ id: uid(), area, done: false, ...d });
      commit(item ? 'Modifié ✓' : 'Ajouté ✓');
    },
    onDelete: item ? () => {
      state.items = state.items.filter((i) => i !== item);
      commit('Supprimé');
    } : null,
  });
}

function routineForm(r) {
  openForm({
    title: r ? 'Modifier la routine' : 'Nouvelle routine',
    fields: [
      { name: 'emoji', label: 'Emoji', placeholder: '🏋🏾‍♀️' },
      { name: 'label', label: 'Nom', required: true, placeholder: 'Sport, Courses, Lecture…' },
      { name: 'days', label: 'Jours', type: 'days' },
    ],
    values: r || { emoji: '✨', days: [1, 2, 3, 4, 5] },
    onSubmit: (d) => {
      if (r) Object.assign(r, d);
      else state.routines.push({ id: uid(), log: {}, ...d });
      commit('Routine enregistrée ✓');
    },
    onDelete: r ? () => {
      state.routines = state.routines.filter((x) => x !== r);
      commit('Routine supprimée');
    } : null,
  });
}

function billForm(b, presetCategory) {
  openForm({
    title: b ? 'Modifier la charge' : 'Nouvelle charge mensuelle',
    fields: [
      { name: 'label', label: 'Libellé', required: true, placeholder: 'Loyer, électricité, Spotify…' },
      { name: 'category', label: 'Catégorie', type: 'select', options: Object.entries(BILL_CATEGORIES) },
      { name: 'amount', label: 'Montant (€)', type: 'number', required: true },
      { name: 'day', label: 'Jour du prélèvement (1–31)', type: 'number', required: true },
    ],
    values: b || { category: presetCategory || 'facture', day: 5 },
    onSubmit: (d) => {
      d.day = Math.min(31, Math.max(1, Math.round(d.day)));
      if (b) Object.assign(b, d);
      else state.money.bills.push({ id: uid(), paid: [], ...d });
      commit('Charge enregistrée ✓');
    },
    onDelete: b ? () => {
      state.money.bills = state.money.bills.filter((x) => x !== b);
      commit('Charge supprimée');
    } : null,
  });
}

function recurringIncomeForm(inc) {
  openForm({
    title: inc ? 'Modifier le revenu' : 'Nouveau revenu régulier',
    fields: [
      { name: 'label', label: 'Libellé', required: true, placeholder: 'Salaire, CAF…' },
      { name: 'kind', label: 'Type', type: 'select', options: Object.entries(INCOME_KINDS) },
      { name: 'amount', label: 'Montant (€)', type: 'number', required: true },
      { name: 'day', label: 'Jour de versement habituel (1–31)', type: 'number', required: true },
    ],
    values: inc || { kind: 'salaire', day: 28 },
    onSubmit: (d) => {
      d.day = Math.min(31, Math.max(1, Math.round(d.day)));
      if (inc) Object.assign(inc, d);
      else state.money.recurringIncomes.push({ id: uid(), received: [], ...d });
      commit('Revenu enregistré ✓');
    },
    onDelete: inc ? () => {
      state.money.recurringIncomes = state.money.recurringIncomes.filter((x) => x !== inc);
      commit('Revenu supprimé');
    } : null,
  });
}

function extraIncomeForm(inc) {
  openForm({
    title: inc ? 'Modifier le revenu exceptionnel' : 'Revenu exceptionnel',
    fields: [
      { name: 'label', label: 'Libellé', required: true, placeholder: 'Prime, remboursement, vente…' },
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
    onDelete: inc ? () => {
      state.money.extraIncomes = state.money.extraIncomes.filter((x) => x !== inc);
      commit('Supprimé');
    } : null,
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
      commit(e ? 'Dépense modifiée ✓' : `Dépense de ${eur(d.amount)} ajoutée`);
    },
    onDelete: e ? () => {
      state.money.expenses = state.money.expenses.filter((x) => x !== e);
      commit('Dépense supprimée');
    } : null,
  });
}

function debtForm(d0) {
  openForm({
    title: d0 ? 'Modifier la dette' : 'Nouvelle dette',
    fields: [
      { name: 'label', label: 'Libellé', required: true, placeholder: 'Prêt étudiant, avance d’une amie…' },
      { name: 'total', label: 'Montant total (€)', type: 'number', required: true },
      { name: 'remaining', label: 'Reste à rembourser (€)', type: 'number', required: true },
    ],
    values: d0 || {},
    onSubmit: (d) => {
      if (d0) Object.assign(d0, d);
      else state.money.debts.push({ id: uid(), ...d });
      commit('Dette enregistrée ✓');
    },
    onDelete: d0 ? () => {
      state.money.debts = state.money.debts.filter((x) => x !== d0);
      commit('Dette supprimée');
    } : null,
  });
}

function savingForm(s) {
  openForm({
    title: s ? 'Modifier l’épargne' : 'Nouvel objectif d’épargne',
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
    onDelete: s ? () => {
      state.money.savings = state.money.savings.filter((x) => x !== s);
      commit('Supprimé');
    } : null,
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

function tripForm(trip) {
  openForm({
    title: trip ? 'Modifier le voyage' : 'Nouveau voyage',
    fields: [
      { name: 'destination', label: 'Destination', required: true, placeholder: 'Lisbonne, Abidjan, Londres…' },
      { name: 'status', label: 'Statut', type: 'select', options: TRIP_STATUSES.map((s) => [s, s]) },
      { name: 'start', label: 'Départ', type: 'date' },
      { name: 'end', label: 'Retour', type: 'date' },
      { name: 'budget', label: 'Budget prévu (€)', type: 'number' },
      { name: 'notes', label: 'Documents & notes', type: 'textarea', placeholder: 'Passeport, visa, numéros de réservation…' },
    ],
    values: trip || { status: 'Envisagé' },
    onSubmit: (d) => {
      if (trip) Object.assign(trip, d);
      else {
        const t = { id: uid(), bookings: [], checklist: DEFAULT_CHECKLIST.map((text) => ({ id: uid(), text, done: false })), ...d };
        state.trips.push(t);
        ui.openTrips.add(t.id);
      }
      commit('Voyage enregistré ✓');
    },
    onDelete: trip ? () => {
      state.trips = state.trips.filter((x) => x !== trip);
      commit('Voyage supprimé');
    } : null,
  });
}

function bookingForm(trip, b) {
  openForm({
    title: b ? 'Modifier la réservation' : 'Billet / hôtel / activité',
    fields: [
      { name: 'kind', label: 'Type', type: 'select', options: Object.entries(BOOKING_KINDS) },
      { name: 'label', label: 'Détail', required: true, placeholder: 'Vol Paris → Lisbonne, hôtel…' },
      { name: 'cost', label: 'Coût (€)', type: 'number' },
      { name: 'booked', label: 'Réservé / payé', type: 'checkbox' },
    ],
    values: b || { kind: 'billet' },
    onSubmit: (d) => {
      if (b) Object.assign(b, d);
      else trip.bookings.push({ id: uid(), ...d });
      commit('Enregistré ✓');
    },
    onDelete: b ? () => {
      trip.bookings = trip.bookings.filter((x) => x !== b);
      commit('Supprimé');
    } : null,
  });
}

function dreamForm(dream) {
  openForm({
    title: dream ? 'Modifier mon rêve' : 'Nouveau rêve à manifester',
    fields: [
      { name: 'emoji', label: 'Emoji', placeholder: '✨' },
      { name: 'title', label: 'Ce que je manifeste', required: true, placeholder: 'Mon CDI, mon appart, 2 000 € d’épargne…' },
      { name: 'category', label: 'Domaine', type: 'select', options: Object.entries(DREAM_CATEGORIES) },
      { name: 'date', label: 'Pour quand ?', type: 'date' },
      { name: 'notes', label: 'Ce que je ressens quand c’est réalisé', type: 'textarea', placeholder: 'Écris-le au présent, comme si c’était déjà là…' },
      { name: 'image', label: 'Photo pour mon vision board', type: 'image' },
      { name: 'manifested', label: 'C’est manifesté ! ✨', type: 'checkbox' },
    ],
    values: dream || { emoji: '✨', category: 'moi' },
    onSubmit: (d) => {
      const wasDone = dream?.manifested;
      if (dream) Object.assign(dream, d);
      else state.manifest.dreams.push({ id: uid(), ...d });
      commit(d.manifested && !wasDone ? '🎉 Manifesté ! Bravo Marie ✨' : 'Rêve enregistré ✨');
    },
    onDelete: dream ? () => {
      state.manifest.dreams = state.manifest.dreams.filter((x) => x !== dream);
      commit('Rêve retiré');
    } : null,
  });
}

/* ============================================================
   Composants
   ============================================================ */

function itemRow(i, { showArea = false } = {}) {
  const cfg = AREAS[i.area];
  const kind = cfg.kinds[i.kind] || { label: i.kind, emoji: '•' };
  const t = todayISO();
  let dateBadge = '';
  if (i.date) {
    const cls = i.done ? '' : i.date < t ? 'bad' : i.date === t ? 'warn' : daysBetween(t, i.date) <= 3 ? 'info' : '';
    dateBadge = `<span class="badge ${cls}">📅 ${esc(relDay(i.date))}</span>`;
  }
  return `<li class="row clickable ${i.done ? 'is-done' : ''}" data-action="edit-item" data-id="${i.id}">
    <input type="checkbox" class="check" data-action="toggle-item" data-id="${i.id}" ${i.done ? 'checked' : ''} aria-label="Terminé" />
    <div class="grow">
      <div class="title">${esc(i.title)}</div>
      <div class="meta">
        <span>${showArea ? cfg.emoji + ' ' : ''}${kind.emoji} ${esc(kind.label)}</span>
        ${i.status ? `<span class="badge accent">${esc(i.status)}</span>` : ''}
        ${dateBadge}
        ${i.notes ? `<span class="muted">· ${esc(i.notes.slice(0, 60))}${i.notes.length > 60 ? '…' : ''}</span>` : ''}
      </div>
    </div>
  </li>`;
}

function routineRow(r, date = todayISO()) {
  const done = !!r.log[date];
  return `<li class="row ${done ? 'is-done' : ''}">
    <input type="checkbox" class="check" data-action="toggle-routine" data-id="${r.id}" ${done ? 'checked' : ''} aria-label="Fait" />
    <div class="grow"><div class="title">${esc(r.emoji)} ${esc(r.label)}</div><div class="meta">Routine</div></div>
  </li>`;
}

function billRow(x, { compact = false } = {}) {
  const { bill, date } = x;
  const t = todayISO();
  const d = daysBetween(t, date);
  const cls = d < 0 ? 'bad' : d <= 3 ? 'warn' : '';
  return `<li class="row">
    <div class="grow">
      <div class="title">${esc(bill.label)}</div>
      <div class="meta"><span>${esc(BILL_CATEGORIES[bill.category] || '')}</span><span class="badge ${cls}">📅 ${esc(d < 0 ? inDays(d) : relDay(date))}</span></div>
    </div>
    <span class="amount">${eur(bill.amount)}</span>
    <button class="btn small good" data-action="pay-bill" data-id="${bill.id}" data-month="${date.slice(0, 7)}">Marquer payé</button>
    ${compact ? '' : `<button class="icon-btn" data-action="edit-bill" data-id="${bill.id}" aria-label="Modifier">✏️</button>`}
  </li>`;
}

function progress(value, max, cls = '') {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return `<div class="bar ${cls}"><span style="width:${pct.toFixed(1)}%"></span></div>`;
}

function tile(label, value, foot = '', cls = '') {
  return `<div class="card tile ${cls}"><div class="label">${esc(label)}</div><div class="value">${value}</div>${foot ? `<div class="foot">${foot}</div>` : ''}</div>`;
}

function emptyMsg(text) {
  return `<div class="empty">${esc(text)}</div>`;
}

/* ============================================================
   Vue : Aujourd'hui
   ============================================================ */

function viewToday() {
  const t = todayISO();
  const now = new Date();
  const hour = now.getHours();
  const hello = hour < 5 ? 'Bonne nuit' : hour < 18 ? 'Bonjour' : 'Bonsoir';
  const work = dueNow('travail');
  const school = dueNow('ecole');
  const daily = dueNow('quotidien');
  const bills = billsDueWithin(3);
  const routines = routinesToday();
  const budget = monthBudget();
  const salary = nextSalary();
  const shopping = itemsFor('quotidien').filter((i) => i.kind === 'courses' && !i.done);

  const line = (href, emo, text, zero = false) =>
    `<li><a href="${href}" class="${zero ? 'zero' : ''}"><span class="emo">${emo}</span><span>${text}</span></a></li>`;

  const summary = [];
  summary.push(line('#/travail', '💼', esc(AREAS.travail.todayLabel(work.length)), !work.length));
  summary.push(line('#/ecole', '🎓', esc(AREAS.ecole.todayLabel(school.length)), !school.length));
  summary.push(line('#/argent', '💰', esc(`${bills.length} paiement${bills.length > 1 ? 's' : ''} à prévoir`), !bills.length));
  if (daily.length) summary.push(line('#/quotidien', '🏠', esc(AREAS.quotidien.todayLabel(daily.length))));
  const grat = state.manifest.gratitude[t] || [];
  for (const r of routines) {
    const done = !!r.log[t];
    summary.push(`<li><a href="#/quotidien"><span class="emo">${esc(r.emoji)}</span><span class="${done ? 'done-line' : ''}">${esc(r.label)}</span></a></li>`);
  }
  if (shopping.length && !routines.some((r) => /course/i.test(r.label))) {
    summary.push(line('#/quotidien', '🛒', esc(`Courses (${shopping.length} article${shopping.length > 1 ? 's' : ''})`)));
  }

  if (!grat.some((x) => x.trim())) summary.push(line('#/manifestation', '🙏', 'Mes 3 gratitudes du jour'));

  let salaryText = 'Ajoute ton salaire dans Argent';
  if (salary) {
    salaryText = salary.days < 0 ? `attendu depuis ${-salary.days} j` : salary.days === 0 ? "aujourd'hui 🎉" : `dans ${salary.days} jour${salary.days > 1 ? 's' : ''}`;
  }

  // À faire aujourd'hui (détail)
  const allDue = [...work, ...school, ...daily].sort((a, b) => a.date.localeCompare(b.date));
  const todoHTML = [
    ...routines.map((r) => routineRow(r)),
    ...allDue.map((i) => itemRow(i, { showArea: true })),
    ...bills.map((b) => billRow(b, { compact: true })),
  ].join('');

  // Cette semaine
  const in7 = addDays(t, 7);
  const upcoming = state.items
    .filter((i) => !i.done && i.date && i.date > t && i.date <= in7)
    .sort((a, b) => a.date.localeCompare(b.date));
  const bigDates = state.items
    .filter((i) => !i.done && i.date && i.date > in7 && ['examen', 'rattrapage', 'toeic', 'renouvellement', 'candidature'].includes(i.kind))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const nextTrip = state.trips
    .filter((tr) => tr.start && tr.start >= t)
    .sort((a, b) => a.start.localeCompare(b.start))[0];
  const extras = upcomingExtraIncomes().slice(0, 2);

  return `
  <header class="page-head">
    <div>
      <h1>${hello} ${esc(state.settings.name)} ☀️</h1>
      <div class="sub">${esc(capitalize(dateLong.format(now)))}</div>
    </div>
    <div class="head-actions">
      <a class="btn mobile-only" href="#/reglages" aria-label="Réglages">⚙️</a>
      <button class="btn" data-action="quick-expense">− Dépense</button>
      <button class="btn primary" data-action="quick-add">+ Ajouter</button>
    </div>
  </header>

  ${(() => {
    const aff = affirmationOfDay();
    return aff ? `<a href="#/manifestation" class="affirmation-banner leopard"><span>✨ ${esc(aff.text)}</span></a>` : '';
  })()}
  <section class="hero">
    <div>
      <h2>Aujourd'hui</h2>
      <ul class="summary">${summary.join('')}</ul>
    </div>
    <div class="hero-money">
      <a href="#/argent" class="big-stat ${budget.remaining < 0 ? 'neg' : ''}" style="text-decoration:none">
        <div class="label">Budget restant</div>
        <div class="value">${eur(budget.remaining)}</div>
        <div class="foot">${budget.daysLeft > 0 ? `soit ~${eur(Math.max(0, budget.remaining) / budget.daysLeft)} / jour jusqu'à la fin du mois` : ''}</div>
      </a>
      <div class="mini-stat"><span>💶 Prochain salaire</span><span class="value">${esc(salaryText)}</span></div>
      ${budget.expected > 0 ? `<div class="mini-stat"><span>⏳ Encore attendu ce mois</span><span class="value">${eur(budget.expected)}</span></div>` : ''}
    </div>
  </section>

  <div class="grid grid-2 section">
    <div class="card">
      <div class="section-head"><h2>À faire aujourd'hui</h2><span class="hint">${allDue.length + routines.length + bills.length} élément(s)</span></div>
      <ul class="list">${todoHTML || ''}</ul>
      ${todoHTML ? '' : emptyMsg('Rien de prévu aujourd’hui. Profite ✨')}
    </div>
    <div class="card">
      <div class="section-head"><h2>Les 7 prochains jours</h2></div>
      <ul class="list">${upcoming.map((i) => itemRow(i, { showArea: true })).join('')}</ul>
      ${upcoming.length ? '' : emptyMsg('Semaine tranquille pour l’instant.')}
      ${bigDates.length || nextTrip || extras.length ? `<div class="group-label">À l'horizon</div><ul class="list">
        ${bigDates.map((i) => `<li class="row clickable" data-action="edit-item" data-id="${i.id}"><div class="grow"><div class="title">${AREAS[i.area].kinds[i.kind]?.emoji || ''} ${esc(i.title)}</div></div><span class="badge info">${esc(inDays(daysBetween(t, i.date)))}</span></li>`).join('')}
        ${nextTrip ? `<li class="row clickable" data-action="goto" data-href="#/voyages"><div class="grow"><div class="title">✈️ ${esc(nextTrip.destination)}</div></div><span class="badge accent">${esc(inDays(daysBetween(t, nextTrip.start)))}</span></li>` : ''}
        ${extras.map((x) => `<li class="row"><div class="grow"><div class="title">💸 ${esc(x.label)}</div><div class="meta">${x.date ? esc(fmtDate(x.date)) : ''}</div></div><span class="amount pos">+${eur(x.amount)}</span></li>`).join('')}
      </ul>` : ''}
    </div>
  </div>`;
}

/* ============================================================
   Vue : Argent
   ============================================================ */

function viewMoney() {
  const m = monthKey();
  const money = state.money;
  const b = monthBudget(m);
  const totalSavings = sum(money.savings, (s) => s.amount);
  const totalDebts = sum(money.debts, (d) => d.remaining);
  const monthExpenses = money.expenses.filter((e) => e.date.startsWith(m)).sort((a, c) => c.date.localeCompare(a.date));
  const byCat = {};
  for (const e of monthExpenses) byCat[e.category] = (byCat[e.category] || 0) + Number(e.amount);
  const cats = Object.entries(byCat).sort((a, c) => c[1] - a[1]);
  const maxCat = cats.length ? cats[0][1] : 0;
  const t = todayISO();

  const incomesHTML = money.recurringIncomes
    .slice()
    .sort((a, c) => a.day - c.day)
    .map((inc) => {
      const got = inc.received.includes(m);
      const date = dateInMonth(inc.day, m);
      const d = daysBetween(t, date);
      return `<li class="row">
        <div class="grow">
          <div class="title">${inc.kind === 'caf' ? '🏛️' : inc.kind === 'salaire' ? '💼' : '💶'} ${esc(inc.label)}</div>
          <div class="meta">le ${inc.day} du mois · ${got ? '<span class="badge good">Reçu ce mois</span>' : `<span class="badge ${d < 0 ? 'warn' : ''}">${d < 0 ? 'pas encore reçu' : esc(inDays(d))}</span>`}</div>
        </div>
        <span class="amount pos">+${eur(inc.amount)}</span>
        <button class="btn small ${got ? '' : 'good'}" data-action="toggle-income" data-id="${inc.id}">${got ? 'Annuler' : 'Reçu'}</button>
        <button class="icon-btn" data-action="edit-income" data-id="${inc.id}" aria-label="Modifier">✏️</button>
      </li>`;
    })
    .join('');

  const extrasSorted = money.extraIncomes.slice().sort((a, c) => Number(a.received) - Number(c.received) || (a.date || '').localeCompare(c.date || ''));
  const extrasHTML = extrasSorted
    .map((x) => `<li class="row ${x.received ? 'is-done' : ''}">
        <input type="checkbox" class="check" data-action="toggle-extra" data-id="${x.id}" ${x.received ? 'checked' : ''} aria-label="Reçu" />
        <div class="grow clickable" data-action="edit-extra" data-id="${x.id}"><div class="title">${esc(x.label)}</div><div class="meta">${x.date ? `prévu ${esc(relDay(x.date))}` : ''}</div></div>
        <span class="amount pos">+${eur(x.amount)}</span>
      </li>`)
    .join('');

  const billsHTML = money.bills
    .slice()
    .sort((a, c) => a.day - c.day)
    .map((bill) => {
      const paid = bill.paid.includes(m);
      const date = dateInMonth(bill.day, m);
      const d = daysBetween(t, date);
      return `<li class="row ${paid ? 'is-done' : ''}">
        <input type="checkbox" class="check" data-action="toggle-bill" data-id="${bill.id}" ${paid ? 'checked' : ''} aria-label="Payé ce mois" />
        <div class="grow clickable" data-action="edit-bill" data-id="${bill.id}">
          <div class="title">${esc(bill.label)}</div>
          <div class="meta"><span>${esc(BILL_CATEGORIES[bill.category] || '')} · le ${bill.day}</span>${paid ? '<span class="badge good">Payé</span>' : `<span class="badge ${d < 0 ? 'bad' : d <= 3 ? 'warn' : ''}">${esc(d < 0 ? inDays(d) : relDay(date))}</span>`}</div>
        </div>
        <span class="amount">${eur(bill.amount)}</span>
      </li>`;
    })
    .join('');

  const expensesHTML = monthExpenses
    .map((e) => `<li class="row clickable" data-action="edit-expense" data-id="${e.id}">
        <div class="grow"><div class="title">${esc(e.label)}</div><div class="meta"><span>${esc(e.category)}</span><span>${esc(fmtDate(e.date))}</span></div></div>
        <span class="amount">−${eur(e.amount)}</span>
      </li>`)
    .join('');

  const debtsHTML = money.debts
    .map((d) => `<li class="row" style="display:block">
        <div class="split"><span class="title clickable" data-action="edit-debt" data-id="${d.id}">${esc(d.label)}</span><span class="amount">${eur(d.remaining)} <span class="muted small">/ ${eur(d.total)}</span></span></div>
        ${progress(d.total - d.remaining, d.total)}
        <div class="split small muted" style="margin-top:6px"><span>${d.remaining <= 0 ? '🎉 Remboursée !' : `${Math.round(((d.total - d.remaining) / (d.total || 1)) * 100)} % remboursé`}</span>
        ${d.remaining > 0 ? `<button class="btn small" data-action="repay-debt" data-id="${d.id}">Rembourser</button>` : ''}</div>
      </li>`)
    .join('');

  const savingsHTML = money.savings
    .map((s) => `<li class="row" style="display:block">
        <div class="split"><span class="title clickable" data-action="edit-saving" data-id="${s.id}">${esc(s.label)}</span><span class="amount">${eur(s.amount)}${s.goal ? ` <span class="muted small">/ ${eur(s.goal)}</span>` : ''}</span></div>
        ${s.goal ? progress(s.amount, s.goal, 'accent') : ''}
        <div class="split small muted" style="margin-top:6px"><span>${s.goal ? (s.amount >= s.goal ? '🎉 Objectif atteint' : `encore ${eur(s.goal - s.amount)}`) : ''}</span>
        <button class="btn small" data-action="deposit-saving" data-id="${s.id}">Verser</button></div>
      </li>`)
    .join('');

  return `
  <header class="page-head">
    <div><h1>💰 Argent</h1><div class="sub">${esc(capitalize(monthLong.format(new Date())))}</div></div>
    <div class="head-actions">
      <button class="btn" data-action="add-extra">+ Revenu</button>
      <button class="btn primary" data-action="add-expense">− Dépense</button>
    </div>
  </header>

  <div class="grid grid-tiles">
    ${tile('Budget restant', eur(b.remaining), b.daysLeft ? `~${eur(Math.max(0, b.remaining) / b.daysLeft)}/jour · ${b.daysLeft} j restants` : '', b.remaining < 0 ? 'bad' : 'accent')}
    ${tile('Revenus reçus', eur(b.income), b.expected ? `+ ${eur(b.expected)} attendus` : '', 'good')}
    ${tile('Dépenses du mois', eur(b.expenses), `${monthExpenses.length} dépense(s)`)}
    ${tile('Loyers & charges', eur(b.charges), b.chargesLeft ? `${eur(b.chargesLeft)} encore à payer` : 'tout est payé ✓')}
    ${tile('Épargne', eur(totalSavings), `${money.savings.length} objectif(s)`, 'good')}
    ${tile('Dettes', eur(totalDebts), totalDebts ? 'reste à rembourser' : 'aucune 🎉', totalDebts ? 'bad' : '')}
  </div>

  <div class="card section">
    <div class="section-head"><h2>Comment est calculé le budget ?</h2></div>
    <ul class="list num">
      <li class="row"><div class="grow">Solde au début du mois</div><span class="amount">${eur(b.carry)}</span><button class="icon-btn" data-action="edit-carry" aria-label="Modifier le solde de départ">✏️</button></li>
      <li class="row"><div class="grow">+ Revenus reçus ce mois</div><span class="amount pos">${eur(b.income)}</span></li>
      <li class="row"><div class="grow">− Loyers, factures & abonnements du mois</div><span class="amount">${eur(b.charges)}</span></li>
      <li class="row"><div class="grow">− Dépenses du mois</div><span class="amount">${eur(b.expenses)}</span></li>
      <li class="row"><div class="grow"><strong>= Budget disponible jusqu'à la fin du mois</strong></div><span class="amount">${eur(b.remaining)}</span></li>
    </ul>
  </div>

  <div class="grid grid-2 section">
    <div class="card">
      <div class="section-head"><h2>Revenus réguliers</h2><button class="btn small" data-action="add-income">+ Ajouter</button></div>
      <ul class="list">${incomesHTML}</ul>${incomesHTML ? '' : emptyMsg('Ajoute ton salaire et la CAF.')}
      <div class="section-head" style="margin-top:18px"><h2>Revenus exceptionnels</h2><button class="btn small" data-action="add-extra">+ Ajouter</button></div>
      <ul class="list">${extrasHTML}</ul>${extrasHTML ? '' : emptyMsg('Primes, remboursements, ventes…')}
    </div>
    <div class="card">
      <div class="section-head"><h2>Loyers & charges</h2><button class="btn small" data-action="add-bill">+ Ajouter</button></div>
      <ul class="list">${billsHTML}</ul>${billsHTML ? '' : emptyMsg('Loyer, électricité, téléphone, abonnements…')}
    </div>
  </div>

  <div class="grid grid-2 section">
    <div class="card">
      <div class="section-head"><h2>Dépenses du mois</h2><button class="btn small" data-action="add-expense">+ Ajouter</button></div>
      ${cats.length ? `<div class="cat-bars">${cats.map(([c, v]) => `<div class="row" style="display:block"><div class="split small"><span>${esc(c)}</span><span class="num">${eur(v)}</span></div>${progress(v, maxCat, 'accent')}</div>`).join('')}</div><div class="group-label">Détail</div>` : ''}
      <ul class="list">${expensesHTML}</ul>${expensesHTML ? '' : emptyMsg('Aucune dépense ce mois-ci.')}
    </div>
    <div class="card">
      <div class="section-head"><h2>Épargne</h2><button class="btn small" data-action="add-saving">+ Ajouter</button></div>
      <ul class="list">${savingsHTML}</ul>${savingsHTML ? '' : emptyMsg('Crée un objectif d’épargne.')}
      <div class="section-head" style="margin-top:18px"><h2>Dettes</h2><button class="btn small" data-action="add-debt">+ Ajouter</button></div>
      <ul class="list">${debtsHTML}</ul>${debtsHTML ? '' : emptyMsg('Aucune dette 🎉')}
    </div>
  </div>`;
}

/* ============================================================
   Vue : espaces génériques (Travail, École, Quotidien)
   ============================================================ */

function itemsListHTML(area) {
  const cfg = AREAS[area];
  const filter = ui.filters[area] || 'all';
  const showDone = !!ui.showDone[area];
  const all = itemsFor(area);
  const t = todayISO();
  const visible = all.filter((i) => filter === 'all' || i.kind === filter);
  const open = visible.filter((i) => !i.done);
  const done = visible.filter((i) => i.done);

  const groups = [
    ['En retard', open.filter((i) => i.date && i.date < t), 'bad'],
    ["Aujourd'hui", open.filter((i) => i.date === t), ''],
    ['À venir', open.filter((i) => i.date && i.date > t).sort((a, b) => a.date.localeCompare(b.date)), ''],
    ['Sans date', open.filter((i) => !i.date), ''],
  ];

  const chips = [
    `<button class="chip ${filter === 'all' ? 'active' : ''}" data-action="filter" data-area="${area}" data-kind="all">Tout<span class="n">${all.filter((i) => !i.done).length}</span></button>`,
    ...Object.entries(cfg.kinds).map(([k, v]) => {
      const n = all.filter((i) => i.kind === k && !i.done).length;
      return `<button class="chip ${filter === k ? 'active' : ''}" data-action="filter" data-area="${area}" data-kind="${k}">${v.emoji} ${esc(v.label)}<span class="n">${n}</span></button>`;
    }),
  ].join('');

  const body = groups
    .filter(([, list]) => list.length)
    .map(([label, list, cls]) => `<div class="group-label ${cls}">${label} · ${list.length}</div><ul class="list">${list.map((i) => itemRow(i)).join('')}</ul>`)
    .join('');

  return `
    <div class="chips">${chips}</div>
    <div class="card">
      ${body || emptyMsg(filter === 'all' ? 'Rien en cours ici. Ajoute un premier élément !' : 'Rien dans cette catégorie.')}
      <div class="split" style="margin-top:12px">
        <button class="btn small ghost" data-action="toggle-show-done" data-area="${area}">${showDone ? 'Masquer' : 'Afficher'} les éléments terminés (${done.length})</button>
        ${showDone && done.length ? `<button class="btn small danger" data-action="clear-done" data-area="${area}">Vider les terminés</button>` : ''}
      </div>
      ${showDone && done.length ? `<ul class="list">${done.map((i) => itemRow(i)).join('')}</ul>` : ''}
    </div>`;
}

function viewArea(area) {
  const cfg = AREAS[area];
  const filter = ui.filters[area] || 'all';
  const all = itemsFor(area).filter((i) => !i.done);
  const t = todayISO();
  const late = all.filter((i) => i.date && i.date < t).length;
  const week = all.filter((i) => i.date && i.date >= t && i.date <= addDays(t, 7)).length;

  let extraTiles = '';
  if (area === 'travail') {
    const apps = itemsFor('travail').filter((i) => i.kind === 'candidature');
    const active = apps.filter((i) => !['Refus', 'Offre'].includes(i.status) && !i.done).length;
    extraTiles = tile('Candidatures actives', active, `${apps.length} au total`, 'accent');
  } else if (area === 'ecole') {
    const exams = all.filter((i) => ['examen', 'rattrapage', 'toeic'].includes(i.kind) && i.date && i.date >= t).sort((a, b) => a.date.localeCompare(b.date));
    extraTiles = tile('Prochain examen', exams[0] ? esc(inDays(daysBetween(t, exams[0].date))) : '—', exams[0] ? esc(exams[0].title) : 'aucun prévu', 'accent');
  } else if (area === 'quotidien') {
    const subs = state.money.bills.filter((b) => b.category === 'abonnement');
    extraTiles = tile('Abonnements', eur(sum(subs, (b) => b.amount)), `${subs.length} par mois`, 'accent');
  }

  let quotidienExtras = '';
  if (area === 'quotidien') {
    const dow = new Date().getDay();
    const routinesHTML = state.routines
      .map((r) => {
        const today = r.days.includes(dow);
        const doneToday = !!r.log[todayISO()];
        const streak = routineStreak(r);
        return `<li class="row ${doneToday ? 'is-done' : ''}">
          ${today ? `<input type="checkbox" class="check" data-action="toggle-routine" data-id="${r.id}" ${doneToday ? 'checked' : ''} aria-label="Fait aujourd'hui" />` : '<span style="width:22px"></span>'}
          <div class="grow clickable" data-action="edit-routine" data-id="${r.id}">
            <div class="title">${esc(r.emoji)} ${esc(r.label)}</div>
            <div class="meta"><span>${[1, 2, 3, 4, 5, 6, 0].filter((d) => r.days.includes(d)).map((d) => WEEKDAYS[d]).join(' · ') || 'Aucun jour'}</span>${streak > 1 ? `<span class="badge good">🔥 ${streak} fois de suite</span>` : ''}${today ? '<span class="badge info">aujourd’hui</span>' : ''}</div>
          </div>
        </li>`;
      })
      .join('');
    const billsHTML = state.money.bills
      .filter((b) => ['abonnement', 'facture'].includes(b.category))
      .sort((a, b) => a.day - b.day)
      .map((b) => {
        const paid = b.paid.includes(monthKey());
        return `<li class="row clickable ${paid ? 'is-done' : ''}" data-action="edit-bill" data-id="${b.id}">
          <div class="grow"><div class="title">${esc(b.label)}</div><div class="meta"><span>${esc(BILL_CATEGORIES[b.category])} · le ${b.day}</span>${paid ? '<span class="badge good">Payé</span>' : ''}</div></div>
          <span class="amount">${eur(b.amount)}</span></li>`;
      })
      .join('');
    quotidienExtras = `
    <div class="grid grid-2 section">
      <div class="card">
        <div class="section-head"><h2>Routines</h2><button class="btn small" data-action="add-routine">+ Ajouter</button></div>
        <ul class="list">${routinesHTML}</ul>${routinesHTML ? '' : emptyMsg('Sport, lecture, ménage…')}
      </div>
      <div class="card">
        <div class="section-head"><h2>Abonnements & factures</h2><button class="btn small" data-action="add-bill" data-category="abonnement">+ Ajouter</button></div>
        <ul class="list">${billsHTML}</ul>${billsHTML ? '' : emptyMsg('Téléphone, internet, streaming, électricité…')}
      </div>
    </div>`;
  }

  return `
  <header class="page-head">
    <div><h1>${cfg.emoji} ${esc(cfg.label)}</h1><div class="sub">${all.length} élément(s) en cours</div></div>
    <div class="head-actions"><button class="btn primary" data-action="add-item" data-area="${area}" data-kind="${filter === 'all' ? '' : filter}">+ Ajouter</button></div>
  </header>
  <div class="grid grid-tiles" style="margin-bottom:20px">
    ${tile('En retard', late, '', late ? 'bad' : '')}
    ${tile('Cette semaine', week)}
    ${extraTiles}
  </div>
  ${itemsListHTML(area)}
  ${quotidienExtras}`;
}

function routineStreak(r) {
  // Nombre de jours prévus consécutifs réalisés, en remontant depuis aujourd'hui (aujourd'hui non bloquant).
  let streak = 0;
  let d = todayISO();
  for (let i = 0; i < 120; i++) {
    const dow = parseISO(d).getDay();
    if (r.days.includes(dow)) {
      if (r.log[d]) streak++;
      else if (i > 0) break;
    }
    d = addDays(d, -1);
  }
  return streak;
}

/* ============================================================
   Vue : Voyages
   ============================================================ */

function viewTrips() {
  const t = todayISO();
  const order = (tr) => (tr.status === 'Terminé' ? 3 : tr.start ? (tr.start >= t ? 0 : 2) : 1);
  const trips = state.trips.slice().sort((a, b) => order(a) - order(b) || (a.start || '').localeCompare(b.start || ''));

  const cards = trips
    .map((tr) => {
      const open = ui.openTrips.has(tr.id);
      const spent = sum(tr.bookings, (b) => b.cost);
      const doneCount = tr.checklist.filter((c) => c.done).length;
      const d = tr.start ? daysBetween(t, tr.start) : null;
      const nights = tr.start && tr.end ? daysBetween(tr.start, tr.end) : null;
      const statusCls = { Envisagé: '', 'En préparation': 'warn', Réservé: 'good', Terminé: '' }[tr.status] || '';
      return `<div class="card">
        <div class="trip-head" data-action="toggle-trip" data-id="${tr.id}">
          <div>
            <h3>✈️ ${esc(tr.destination)}</h3>
            <div class="meta muted small" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px">
              <span class="badge ${statusCls}">${esc(tr.status)}</span>
              <span>${tr.start ? `${esc(fmtDate(tr.start))}${tr.end ? ` → ${esc(fmtDate(tr.end))}` : ''}${nights ? ` · ${nights} nuit${nights > 1 ? 's' : ''}` : ''}` : 'Dates à définir'}</span>
            </div>
          </div>
          ${d !== null && d >= 0 ? `<div class="trip-countdown"><div class="value">J-${d}</div><div class="label">avant le départ</div></div>` : ''}
        </div>
        <div style="margin-top:12px">
          <div class="split small"><span>Budget : <strong class="num">${eur(spent)}</strong> réservés sur <span class="num">${eur(tr.budget)}</span></span><span class="muted">Checklist ${doneCount}/${tr.checklist.length}</span></div>
          ${progress(spent, tr.budget || spent || 1, spent > tr.budget && tr.budget ? 'bad' : 'accent')}
        </div>
        ${open ? tripBody(tr) : `<button class="btn small ghost" style="margin-top:10px" data-action="toggle-trip" data-id="${tr.id}">Voir le détail ▾</button>`}
      </div>`;
    })
    .join('');

  const totalPlanned = sum(state.trips.filter((tr) => tr.status !== 'Terminé'), (tr) => tr.budget);

  return `
  <header class="page-head">
    <div><h1>✈️ Voyages</h1><div class="sub">${state.trips.length} voyage(s) · ${eur(totalPlanned)} de budget prévu</div></div>
    <div class="head-actions"><button class="btn primary" data-action="add-trip">+ Nouveau voyage</button></div>
  </header>
  <div class="grid grid-2">${cards}</div>
  ${cards ? '' : `<div class="card">${emptyMsg('Aucun voyage pour le moment. Où as-tu envie d’aller ?')}</div>`}`;
}

function tripBody(tr) {
  const bookings = tr.bookings
    .map((b) => `<li class="row clickable" data-action="edit-booking" data-trip="${tr.id}" data-id="${b.id}">
      <div class="grow"><div class="title">${esc(BOOKING_KINDS[b.kind] || '')} · ${esc(b.label)}</div></div>
      <span class="badge ${b.booked ? 'good' : 'warn'}">${b.booked ? 'Réservé' : 'À réserver'}</span>
      <span class="amount">${eur(b.cost)}</span></li>`)
    .join('');
  const checklist = tr.checklist
    .map((c) => `<li class="row ${c.done ? 'is-done' : ''}">
      <input type="checkbox" class="check" data-action="toggle-check" data-trip="${tr.id}" data-id="${c.id}" ${c.done ? 'checked' : ''} aria-label="Fait" />
      <div class="grow"><div class="title">${esc(c.text)}</div></div>
      <button class="icon-btn" data-action="del-check" data-trip="${tr.id}" data-id="${c.id}" aria-label="Retirer">✕</button></li>`)
    .join('');
  return `<div class="trip-body">
    <div class="section-head" style="margin-top:10px"><h2>Billets & hôtels</h2><button class="btn small" data-action="add-booking" data-trip="${tr.id}">+ Ajouter</button></div>
    <ul class="list">${bookings}</ul>${bookings ? '' : emptyMsg('Aucune réservation.')}
    <div class="section-head" style="margin-top:16px"><h2>Checklist</h2></div>
    <ul class="list">${checklist}</ul>
    <form class="inline-add" data-form="add-check" data-trip="${tr.id}">
      <input name="text" placeholder="Ajouter à la checklist…" autocomplete="off" />
      <button class="btn small" type="submit">Ajouter</button>
    </form>
    ${tr.notes ? `<div class="section-head" style="margin-top:16px"><h2>Documents & notes</h2></div><div class="small" style="white-space:pre-wrap">${esc(tr.notes)}</div>` : ''}
    <div class="split" style="margin-top:16px">
      <button class="btn small ghost" data-action="toggle-trip" data-id="${tr.id}">Replier ▴</button>
      <button class="btn small" data-action="edit-trip" data-id="${tr.id}">Modifier le voyage</button>
    </div>
  </div>`;
}

function affirmationOfDay() {
  const list = state.manifest.affirmations;
  if (!list.length) return null;
  const dayNumber = Math.floor(parseISO(todayISO()).getTime() / 86400000);
  return list[(((dayNumber + ui.affShift) % list.length) + list.length) % list.length];
}

function gratitudeStreak() {
  let streak = 0;
  let d = todayISO();
  const has = (day) => (state.manifest.gratitude[day] || []).some((x) => x.trim());
  if (!has(d)) d = addDays(d, -1);
  while (has(d)) {
    streak++;
    d = addDays(d, -1);
  }
  return streak;
}

function viewManifest() {
  const mf = state.manifest;
  const aff = affirmationOfDay();
  const t = todayISO();
  const todayGrat = mf.gratitude[t] || ['', '', ''];
  const dreams = mf.dreams.slice().sort((a, b) => Number(a.manifested) - Number(b.manifested) || (a.date || '9').localeCompare(b.date || '9'));
  const manifested = mf.dreams.filter((d) => d.manifested).length;
  const streak = gratitudeStreak();

  const dreamsHTML = dreams
    .map((d) => {
      const bg = d.image ? ` style="background-image:url('${esc(d.image)}')"` : '';
      const when = d.date && !d.manifested ? `<span>${esc(daysBetween(t, d.date) >= 0 ? inDays(daysBetween(t, d.date)) : fmtDate(d.date))}</span>` : '';
      return `<div class="dream ${d.image ? '' : 'no-img'} ${d.manifested ? 'manifested' : ''}" data-action="edit-dream" data-id="${d.id}"${bg} role="button" tabindex="0">
        ${d.image ? '' : `<span class="dream-emoji">${esc(d.emoji || '✨')}</span>`}
        ${d.manifested ? '<span class="ribbon">Manifesté ✨</span>' : ''}
        <div class="dream-text">
          <div class="dream-title">${d.image ? esc(d.emoji || '') + ' ' : ''}${esc(d.title)}</div>
          <div class="dream-meta"><span>${esc(DREAM_CATEGORIES[d.category] || '')}</span>${when}</div>
        </div>
      </div>`;
    })
    .join('');

  const history = Object.keys(mf.gratitude)
    .filter((day) => day < t && mf.gratitude[day].some((x) => x.trim()))
    .sort()
    .reverse()
    .slice(0, 7)
    .map((day) => `<div class="gratitude-day"><div class="small muted">${esc(capitalize(dateLong.format(parseISO(day))))}</div><ul>${mf.gratitude[day].filter((x) => x.trim()).map((x) => `<li>${esc(x)}</li>`).join('')}</ul></div>`)
    .join('');

  return `
  <header class="page-head">
    <div><h1>✨ Manifestation</h1><div class="sub">Visualise, remercie, attire.</div></div>
    <div class="head-actions"><button class="btn primary" data-action="add-dream">+ Nouveau rêve</button></div>
  </header>

  <section class="affirmation leopard">
    <div class="affirmation-inner">
      <div class="kicker">Mon affirmation du jour</div>
      <blockquote>${aff ? `« ${esc(aff.text)} »` : 'Ajoute ta première affirmation ci-dessous 💕'}</blockquote>
      ${mf.affirmations.length > 1 ? '<button class="btn small" data-action="next-affirmation">🔄 Une autre</button>' : ''}
    </div>
  </section>

  <div class="grid grid-tiles section">
    ${tile('Rêves en cours', mf.dreams.length - manifested, '', 'accent')}
    ${tile('Déjà manifestés', manifested, manifested ? 'la preuve que ça marche ✨' : 'le premier arrive…', 'accent')}
    ${tile('Gratitude', `${streak} jour${streak > 1 ? 's' : ''}`, 'de suite', 'accent')}
  </div>

  <div class="section">
    <div class="section-head"><h2>💖 Mon vision board</h2><span class="hint">Touche un rêve pour le modifier ou ajouter une photo</span></div>
    <div class="dreams">${dreamsHTML}<button class="dream-add" data-action="add-dream">+ Ajouter un rêve</button></div>
  </div>

  <div class="grid grid-2 section">
    <div class="card">
      <div class="section-head"><h2>🙏 Gratitude du jour</h2><span class="hint">3 choses pour lesquelles je dis merci</span></div>
      <form class="gratitude-form" data-form="gratitude">
        ${[0, 1, 2].map((i) => `<label><span class="n">${i + 1}</span><input class="input" name="g${i}" value="${esc(todayGrat[i] || '')}" placeholder="${['Aujourd’hui je suis reconnaissante pour…', 'Une personne qui compte pour moi…', 'Une petite victoire du jour…'][i]}" autocomplete="off" /></label>`).join('')}
        <div><button class="btn primary small" type="submit">Enregistrer</button></div>
      </form>
      ${history ? `<div class="group-label">Les jours précédents</div>${history}` : ''}
    </div>
    <div class="card">
      <div class="section-head"><h2>💬 Mes affirmations</h2><span class="hint">${mf.affirmations.length}</span></div>
      <ul class="list">${mf.affirmations
        .map((a) => `<li class="row"><div class="grow"><div class="title" style="font-style:italic">${esc(a.text)}</div></div><button class="icon-btn" data-action="del-affirmation" data-id="${a.id}" aria-label="Retirer">✕</button></li>`)
        .join('')}</ul>
      <form class="inline-add" data-form="add-affirmation">
        <input name="text" placeholder="J’attire… / Je suis… / Je mérite…" autocomplete="off" />
        <button class="btn small" type="submit">Ajouter</button>
      </form>
    </div>
  </div>`;
}

/* ============================================================
   Vue : Réglages
   ============================================================ */

function viewSettings() {
  const theme = document.documentElement.dataset.theme || 'auto';
  return `
  <header class="page-head"><div><h1>⚙️ Réglages</h1><div class="sub">Tes données restent sur cet appareil.</div></div></header>
  <div class="grid grid-2">
    <div class="card stack">
      <h3>Profil</h3>
      <form class="inline-add" data-form="set-name">
        <input name="name" value="${esc(state.settings.name)}" placeholder="Prénom" />
        <button class="btn small" type="submit">Enregistrer</button>
      </form>
      <h3 style="margin-top:18px">Apparence</h3>
      <div class="chips">
        ${[['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']].map(([v, l]) => `<button class="chip ${theme === v ? 'active' : ''}" data-action="theme" data-theme="${v}">${l}</button>`).join('')}
      </div>
    </div>
    <div class="card stack">
      <h3>Sauvegarde</h3>
      <p class="small muted">Les données sont enregistrées dans ce navigateur. Exporte-les régulièrement pour ne rien perdre, ou pour les transférer sur un autre appareil.</p>
      <div class="head-actions">
        <button class="btn" data-action="export">⬇️ Exporter (JSON)</button>
        <label class="btn">⬆️ Importer<input type="file" accept="application/json,.json" data-action="import" hidden /></label>
      </div>
      <h3 style="margin-top:18px">Remise à zéro</h3>
      <div class="head-actions">
        <button class="btn danger" data-action="reset-empty">Tout effacer</button>
        <button class="btn" data-action="reset-sample">Recharger l’exemple</button>
      </div>
    </div>
  </div>`;
}

/* ============================================================
   Routage & rendu
   ============================================================ */

const ROUTES = {
  aujourdhui: viewToday,
  argent: viewMoney,
  travail: () => viewArea('travail'),
  ecole: () => viewArea('ecole'),
  voyages: viewTrips,
  quotidien: () => viewArea('quotidien'),
  manifestation: viewManifest,
  reglages: viewSettings,
};

function currentRoute() {
  const r = location.hash.replace(/^#\/?/, '');
  return ROUTES[r] ? r : 'aujourdhui';
}

function render() {
  const route = currentRoute();
  $('#view').innerHTML = ROUTES[route]();
  document.querySelectorAll('.nav a[data-route]').forEach((a) => a.classList.toggle('active', a.dataset.route === route));
}

/* ============================================================
   Actions
   ============================================================ */

const money = () => state.money;

const actions = {
  goto: (el) => { location.hash = el.dataset.href; },
  'quick-add': () => {
    openForm({
      title: 'Ajouter…',
      fields: [{ name: 'area', label: 'Dans quel espace ?', type: 'select', options: Object.entries(AREAS).map(([k, v]) => [k, `${v.emoji} ${v.label}`]) }],
      submitLabel: 'Continuer',
      onSubmit: (d) => setTimeout(() => itemForm(d.area), 0),
    });
  },
  'quick-expense': () => expenseForm(),
  'add-item': (el) => itemForm(el.dataset.area, null, el.dataset.kind || undefined),
  'edit-item': (el) => {
    const i = findById(state.items, el.dataset.id);
    if (i) itemForm(i.area, i);
  },
  'toggle-item': (el) => {
    const i = findById(state.items, el.dataset.id);
    if (!i) return;
    i.done = !i.done;
    commit(i.done ? 'Bravo, c’est fait ✓' : null);
  },
  filter: (el) => {
    ui.filters[el.dataset.area] = el.dataset.kind;
    render();
  },
  'toggle-show-done': (el) => {
    ui.showDone[el.dataset.area] = !ui.showDone[el.dataset.area];
    render();
  },
  'clear-done': (el) => {
    if (!confirm('Supprimer définitivement les éléments terminés de cet espace ?')) return;
    state.items = state.items.filter((i) => !(i.area === el.dataset.area && i.done));
    commit('Éléments terminés supprimés');
  },
  'toggle-routine': (el) => {
    const r = findById(state.routines, el.dataset.id);
    if (!r) return;
    const t = todayISO();
    if (r.log[t]) delete r.log[t];
    else r.log[t] = true;
    commit(r.log[t] ? `${r.emoji} ${r.label} ✓` : null);
  },
  'add-routine': () => routineForm(),
  'edit-routine': (el) => routineForm(findById(state.routines, el.dataset.id)),

  // Argent
  'add-expense': () => expenseForm(),
  'edit-expense': (el) => expenseForm(findById(money().expenses, el.dataset.id)),
  'add-bill': (el) => billForm(null, el.dataset.category),
  'edit-bill': (el) => billForm(findById(money().bills, el.dataset.id)),
  'toggle-bill': (el) => {
    const b = findById(money().bills, el.dataset.id);
    const m = monthKey();
    b.paid = b.paid.includes(m) ? b.paid.filter((x) => x !== m) : [...b.paid, m];
    commit();
  },
  'pay-bill': (el) => {
    const b = findById(money().bills, el.dataset.id);
    const m = el.dataset.month;
    if (!b.paid.includes(m)) b.paid.push(m);
    commit(`${b.label} payé ✓`);
  },
  'add-income': () => recurringIncomeForm(),
  'edit-income': (el) => recurringIncomeForm(findById(money().recurringIncomes, el.dataset.id)),
  'toggle-income': (el) => {
    const inc = findById(money().recurringIncomes, el.dataset.id);
    const m = monthKey();
    const had = inc.received.includes(m);
    inc.received = had ? inc.received.filter((x) => x !== m) : [...inc.received, m];
    commit(had ? null : `${inc.label} reçu 💶`);
  },
  'add-extra': () => extraIncomeForm(),
  'edit-extra': (el) => extraIncomeForm(findById(money().extraIncomes, el.dataset.id)),
  'toggle-extra': (el) => {
    const x = findById(money().extraIncomes, el.dataset.id);
    x.received = !x.received;
    if (x.received && x.date > todayISO()) x.date = todayISO();
    commit(x.received ? `+${eur(x.amount)} 💶` : null);
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
      fields: [{ name: 'carry', label: 'Ce que tu avais sur ton compte le 1er (salaire du mois dernier compris)', type: 'number' }],
      values: { carry: money().carry[m] || 0 },
      onSubmit: (d) => {
        money().carry[m] = d.carry;
        commit('Solde de départ mis à jour ✓');
      },
    });
  },

  // Voyages
  'add-trip': () => tripForm(),
  'edit-trip': (el) => tripForm(findById(state.trips, el.dataset.id)),
  'toggle-trip': (el) => {
    const id = el.dataset.id;
    if (ui.openTrips.has(id)) ui.openTrips.delete(id);
    else ui.openTrips.add(id);
    render();
  },
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
  'add-dream': () => dreamForm(),
  'edit-dream': (el) => dreamForm(findById(state.manifest.dreams, el.dataset.id)),
  'next-affirmation': () => {
    ui.affShift++;
    render();
  },
  'del-affirmation': (el) => {
    state.manifest.affirmations = state.manifest.affirmations.filter((a) => a.id !== el.dataset.id);
    commit();
  },

  // Réglages
  theme: (el) => {
    const v = el.dataset.theme;
    try {
      if (v === 'auto') localStorage.removeItem(`${STORAGE_KEY}:theme`);
      else localStorage.setItem(`${STORAGE_KEY}:theme`, v);
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
    const name = state.settings.name;
    state = emptyState();
    state.settings.name = name;
    commit('Tout est effacé — page blanche ✨');
  },
  'reset-sample': () => {
    if (!confirm('Remplacer tes données par l’exemple ?')) return;
    state = sampleState();
    commit('Exemple rechargé');
  },
};

document.addEventListener('click', (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || el.dataset.action === 'import') return;
  // closest() renvoie l'élément le plus proche : une case à cocher placée dans
  // une ligne cliquable déclenche sa propre action, pas l'édition de la ligne.
  actions[el.dataset.action]?.(el, e);
});

document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches?.('.dream[data-action]')) {
    e.preventDefault();
    actions[e.target.dataset.action]?.(e.target, e);
  }
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
  if (form.dataset.form === 'add-check') {
    const text = form.elements.text.value.trim();
    if (!text) return;
    const tr = findById(state.trips, form.dataset.trip);
    tr.checklist.push({ id: uid(), text, done: false });
    commit();
    $(`form[data-form="add-check"][data-trip="${tr.id}"] input`)?.focus();
  } else if (form.dataset.form === 'gratitude') {
    const entries = [0, 1, 2].map((i) => form.elements[`g${i}`].value.trim());
    state.manifest.gratitude[todayISO()] = entries;
    commit(entries.some(Boolean) ? 'Merci, merci, merci 🙏✨' : null);
  } else if (form.dataset.form === 'add-affirmation') {
    const text = form.elements.text.value.trim();
    if (!text) return;
    state.manifest.affirmations.push({ id: uid(), text });
    commit('Affirmation ajoutée 💕');
    $('form[data-form="add-affirmation"] input')?.focus();
  } else if (form.dataset.form === 'set-name') {
    state.settings.name = form.elements.name.value.trim() || 'Marie';
    commit('Profil mis à jour ✓');
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
  render();
  window.scrollTo(0, 0);
});

// Rafraîchit la vue au changement de jour si l'app reste ouverte.
let lastDay = todayISO();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayISO() !== lastDay) {
    lastDay = todayISO();
    render();
  }
});

applyTheme();
save();
render();
