import type { AllergySeverity, Allergen, IngredientCategory, MealType, ProfileInput, Unit } from '@nutriplan/core';

/** Données d'une personne dans la version web autonome. */
export interface LocalState {
  version: 1;
  profile: (ProfileInput & { notificationsEnabled: boolean }) | null;
  liked: string[];
  disliked: string[];
  allergies: Array<{ allergen: Allergen; severity: AllergySeverity | null }>;
  inventory: Array<{ id: string; ingredientId: string; quantity: number; unit: Unit; expirationDate: string | null }>;
  favorites: Array<{ recipeId: string; createdAt: string }>;
  plans: LocalPlan[];
  weights: Array<{ id: string; date: string; weightKg: number }>;
  goals: Array<{ id: string; title: string; done: boolean; createdAt: string }>;
}

export interface LocalPlan {
  id: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  budgetCents: number | null;
  feasible: boolean;
  issues: Array<{ code: string; message: string }>;
  suggestions: string[];
  seed: number;
  archived: boolean;
  meals: Array<{ id: string; recipeId: string; date: string; mealType: MealType; servings: number; completedAt: string | null }>;
  shopping: { updatedAt: string; items: LocalShoppingItem[] };
}

export interface LocalShoppingItem {
  id: string;
  ingredientId: string | null;
  customName: string | null;
  category: IngredientCategory;
  quantity: number;
  unit: Unit;
  estimatedPriceCents: number | null;
  isPurchased: boolean;
  isManual: boolean;
  userEdited: boolean;
  isPantryStaple: boolean;
}

export const emptyState = (): LocalState => ({
  version: 1,
  profile: null,
  liked: [],
  disliked: [],
  allergies: [],
  inventory: [],
  favorites: [],
  plans: [],
  weights: [],
  goals: [],
});

/** Où les données sont enregistrées : espace personnel claude.ai, navigateur, ou mémoire seulement. */
export type StorageKind = 'account' | 'device' | 'memory';

interface Backend {
  kind: StorageKind;
  load(): Promise<LocalState | null>;
  save(state: LocalState): Promise<void>;
  clear(): Promise<void>;
}

const LS_KEY = 'nutriplan.local.v1';

interface ClaudeDocRef {
  get(): Promise<{ exists: boolean; data(): Record<string, unknown> | undefined }>;
  set(data: Record<string, unknown>): Promise<void>;
  delete(): Promise<void>;
}
type ClaudeWindow = { claude?: { use(name: string): Promise<unknown> } };

/** Espace privé de la personne sur claude.ai (capacité `db`, sous-arbre `data/users/<id>`). */
async function accountBackend(): Promise<Backend | null> {
  const claude = (globalThis as unknown as ClaudeWindow).claude;
  if (!claude?.use) return null;
  try {
    const [db, user] = (await Promise.all([claude.use('db'), claude.use('user')])) as [
      { doc(path: string): ClaudeDocRef } | null,
      { id(): Promise<string | null>; can(name: string): Promise<boolean | null> } | null,
    ];
    const uid = db && user ? await user.id() : null;
    // Une personne en lecture seule ne peut pas écrire dans son espace : on utilise alors le navigateur.
    if (!db || !uid || (await user!.can('data.write')) === false) return null;
    const ref = db.doc(`data/users/${uid}/nutriplan`);
    return {
      kind: 'account',
      async load() {
        const snap = await ref.get();
        const json = snap.exists ? (snap.data()?.json as string | undefined) : undefined;
        return json ? (JSON.parse(json) as LocalState) : null;
      },
      save: (state) => ref.set({ json: JSON.stringify(state), savedAt: new Date().toISOString() }),
      clear: () => ref.delete(),
    };
  } catch {
    return null;
  }
}

function deviceBackend(): Backend | null {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    ls.setItem(`${LS_KEY}.probe`, '1');
    ls.removeItem(`${LS_KEY}.probe`);
    return {
      kind: 'device',
      async load() {
        const raw = ls.getItem(LS_KEY);
        return raw ? (JSON.parse(raw) as LocalState) : null;
      },
      async save(state) {
        ls.setItem(LS_KEY, JSON.stringify(state));
      },
      async clear() {
        ls.removeItem(LS_KEY);
      },
    };
  } catch {
    return null;
  }
}

const memoryBackend = (): Backend => ({ kind: 'memory', load: async () => null, save: async () => undefined, clear: async () => undefined });

let backendPromise: Promise<Backend> | null = null;
let statePromise: Promise<LocalState> | null = null;
let writeChain: Promise<void> = Promise.resolve();

function getBackend(): Promise<Backend> {
  backendPromise ??= (async () => (await accountBackend()) ?? deviceBackend() ?? memoryBackend())();
  return backendPromise;
}

export async function storageKind(): Promise<StorageKind> {
  return (await getBackend()).kind;
}

export function loadState(): Promise<LocalState> {
  statePromise ??= (async () => {
    const backend = await getBackend();
    try {
      const saved = await backend.load();
      return saved?.version === 1 ? { ...emptyState(), ...saved } : emptyState();
    } catch {
      return emptyState();
    }
  })();
  return statePromise;
}

/** Les écritures sont enchaînées une par une (jamais deux écritures simultanées du même document). */
export async function persist(state: LocalState): Promise<void> {
  const backend = await getBackend();
  const snapshot = JSON.parse(JSON.stringify(state)) as LocalState;
  writeChain = writeChain.then(() => backend.save(snapshot));
  return writeChain;
}

export async function wipe(): Promise<void> {
  const backend = await getBackend();
  writeChain = writeChain.then(() => backend.clear());
  await writeChain;
  statePromise = Promise.resolve(emptyState());
}
