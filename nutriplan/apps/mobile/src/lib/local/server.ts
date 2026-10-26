import {
  addDays,
  aiRecipeIdeasSchema,
  allergiesSchema,
  buildShoppingList,
  checkRecipe,
  convertToBase,
  estimateDailyEnergy,
  estimatePurchaseCostCents,
  generateMealPlan,
  generatePlanSchema,
  groupByCategory,
  INGREDIENT_CATEGORY_LABELS,
  inventoryItemSchema,
  inventoryUpdateSchema,
  isSafetyReason,
  manualShoppingItemSchema,
  MEAL_TYPES,
  notificationSettingsSchema,
  NUTRITION_DISCLAIMER,
  personalGoalSchema,
  preferencesSchema,
  profileSchema,
  recipeCost,
  recipeNutritionPerServing,
  recipeQuerySchema,
  recipeSlotKind,
  scaleRecipeIngredients,
  suggestAlternatives,
  sumEstimatedCents,
  updatePlannedMealSchema,
  updateShoppingItemSchema,
  weightEntrySchema,
  type DietaryConstraints,
  type MealType,
} from '@nutriplan/core';
import { z, ZodError } from 'zod';
import { ApiError } from '../api';
import { INGREDIENT_MAP, NUTRITION_SOURCE, PRICE_UPDATED_AT, RECIPE_MAP, RECIPES, type CatalogRecipe } from './catalog';
import { loadState, persist, wipe, type LocalPlan, type LocalState } from './store';

/**
 * « Serveur » de la version web autonome : mêmes routes et mêmes réponses que l'API NestJS,
 * exécutées dans le navigateur avec les règles de @nutriplan/core.
 */

const PRICE_NOTICE = 'Prix estimés à titre indicatif à partir d’une base de prix modifiable : ce ne sont pas des prix garantis ni relevés en magasin.';
const MAX_PLANS = 8; // historique conservé (la place est limitée)

const uid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
const now = () => new Date().toISOString();
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const notFound = (what: string) => new ApiError(404, 'NOT_FOUND', `${what} introuvable.`);
const parse = <T extends z.ZodType>(schema: T, value: unknown): z.output<T> => schema.parse(value ?? {});

function constraints(s: LocalState): DietaryConstraints {
  return {
    allergies: s.allergies,
    diets: s.profile?.diets ?? [],
    excludedIngredientIds: s.disliked,
    equipment: s.profile?.equipment ?? [],
    maxTotalTime: s.profile?.cookingTimePreference ?? null,
  };
}

function requireProfile(s: LocalState) {
  if (!s.profile) throw new ApiError(409, 'PROFILE_REQUIRED', "Complétez d'abord votre profil pour générer un programme.");
  return s.profile;
}

function energy(s: LocalState) {
  return s.profile ? estimateDailyEnergy(s.profile) : null;
}

/* ─── Recettes ─────────────────────────────────────────────────────────── */

function recipeSummary(r: CatalogRecipe, s: LocalState, servings: number) {
  const check = checkRecipe(r, constraints(s), INGREDIENT_MAP, { ignoreTime: true });
  const cost = recipeCost(r, servings, INGREDIENT_MAP);
  const nutrition = recipeNutritionPerServing(r, INGREDIENT_MAP);
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    imageUrl: r.imageUrl,
    preparationTime: r.preparationTime,
    cookingTime: r.cookingTime,
    totalTime: r.preparationTime + r.cookingTime,
    tags: r.tags,
    equipment: r.equipment,
    isDemo: r.isDemo,
    isFavorite: s.favorites.some((f) => f.recipeId === r.id),
    costPerServingCents: cost.complete ? cost.perServingCents : null,
    nutritionPerServing: { ...nutrition, isEstimate: true },
    allergens: [...new Set(r.ingredients.flatMap((i) => INGREDIENT_MAP.get(i.ingredientId)?.allergens ?? []))],
    compatibility: { allowed: check.allowed, reasons: check.reasons.map((x) => x.message), warnings: check.warnings },
  };
}

function listRecipes(s: LocalState, query: Record<string, string>) {
  const q = parse(recipeQuerySchema, query);
  const servings = s.profile?.householdSize ?? 1;
  const search = q.search?.toLocaleLowerCase('fr');
  return RECIPES.filter((r) => !search || r.name.toLocaleLowerCase('fr').includes(search))
    .filter((r) => !q.category || r.category === q.category)
    .filter((r) => !q.ingredientId || r.ingredients.some((i) => i.ingredientId === q.ingredientId))
    .filter((r) => !q.diet || checkRecipe(r, { allergies: [], diets: [q.diet], excludedIngredientIds: [], equipment: [] }, INGREDIENT_MAP).allowed)
    .map((r) => recipeSummary(r, s, servings))
    .filter((r) => !q.favoritesOnly || r.isFavorite)
    .filter((r) => !(q.compatibleOnly ?? true) || r.compatibility.allowed)
    .filter((r) => q.maxTime == null || r.totalTime <= q.maxTime)
    .filter((r) => q.maxCostPerServingCents == null || (r.costPerServingCents != null && r.costPerServingCents <= q.maxCostPerServingCents));
}

function recipeDetail(s: LocalState, id: string, servingsParam?: number) {
  const r = RECIPE_MAP.get(id);
  if (!r) throw notFound('Recette');
  const servings = servingsParam ?? r.servings;
  const scaled = scaleRecipeIngredients(r, servings, INGREDIENT_MAP);
  return {
    ...recipeSummary(r, s, servings),
    description: r.description,
    instructions: r.instructions,
    servings,
    baseServings: r.servings,
    ingredients: r.ingredients.map((ri, idx) => {
      const info = INGREDIENT_MAP.get(ri.ingredientId)!;
      return { ingredientId: ri.ingredientId, name: info.name, category: info.category, quantity: scaled[idx]!.quantity, unit: ri.unit, allergens: info.allergens, mayContain: info.mayContain };
    }),
    cost: { ...recipeCost(r, servings, INGREDIENT_MAP), isEstimate: true, priceUpdatedAt: `${PRICE_UPDATED_AT}T00:00:00.000Z` },
    nutritionDisclaimer: `${NUTRITION_DISCLAIMER} Source : ${NUTRITION_SOURCE}.`,
  };
}

/* ─── Planning et courses ──────────────────────────────────────────────── */

function rebuildShopping(s: LocalState, plan: LocalPlan) {
  const result = buildShoppingList(
    plan.meals.map((m) => ({ recipe: RECIPE_MAP.get(m.recipeId)!, servings: m.servings })),
    INGREDIENT_MAP,
    s.inventory.map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity, unit: i.unit })),
  );
  const previous = new Map(plan.shopping.items.filter((i) => !i.isManual && i.ingredientId).map((i) => [`${i.ingredientId}|${i.unit}`, i]));
  const manual = plan.shopping.items.filter((i) => i.isManual);
  plan.shopping = {
    updatedAt: now(),
    items: [
      ...result.items.map((line) => {
        const prev = previous.get(`${line.ingredientId}|${line.unit}`);
        const quantity = prev?.userEdited ? prev.quantity : line.quantity;
        return {
          id: prev?.id ?? uid(),
          ingredientId: line.ingredientId,
          customName: null,
          category: line.category,
          quantity,
          unit: line.unit,
          estimatedPriceCents: prev?.userEdited && line.converted ? estimatePurchaseCostCents(INGREDIENT_MAP.get(line.ingredientId)!, quantity) : line.estimatedPriceCents,
          isPurchased: prev?.isPurchased ?? false,
          userEdited: prev?.userEdited ?? false,
          isManual: false,
          isPantryStaple: line.isPantryStaple,
        };
      }),
      ...manual,
    ],
  };
}

function shoppingView(plan: LocalPlan) {
  const items = plan.shopping.items
    .map((i) => ({
      id: i.id,
      ingredientId: i.ingredientId,
      name: (i.ingredientId && INGREDIENT_MAP.get(i.ingredientId)?.name) || i.customName || 'Article',
      category: i.category,
      quantity: i.quantity,
      unit: i.unit,
      estimatedPriceCents: i.estimatedPriceCents,
      isPurchased: i.isPurchased,
      isManual: i.isManual,
      isPantryStaple: i.isPantryStaple,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  const totalCents = sumEstimatedCents(items);
  const purchasedCents = sumEstimatedCents(items.filter((i) => i.isPurchased));
  return {
    id: plan.id,
    mealPlanId: plan.id,
    updatedAt: plan.shopping.updatedAt,
    budgetCents: plan.budgetCents,
    totalCents,
    purchasedCents,
    remainingCents: totalCents - purchasedCents,
    overBudget: plan.budgetCents != null && totalCents > plan.budgetCents,
    itemsWithoutPrice: items.filter((i) => i.estimatedPriceCents === null).length,
    itemCount: items.length,
    purchasedCount: items.filter((i) => i.isPurchased).length,
    priceNotice: PRICE_NOTICE,
    pricesUpdatedAt: items.some((i) => i.ingredientId) ? PRICE_UPDATED_AT : null,
    groups: groupByCategory(items).map((g) => ({ category: g.category, label: INGREDIENT_CATEGORY_LABELS[g.category], items: g.items })),
  };
}

function planView(s: LocalState, plan: LocalPlan) {
  const c = constraints(s);
  const favorites = new Set(s.favorites.map((f) => f.recipeId));
  const meals = [...plan.meals]
    .sort((a, b) => a.date.localeCompare(b.date) || MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType))
    .map((m) => {
      const r = RECIPE_MAP.get(m.recipeId)!;
      const check = checkRecipe(r, c, INGREDIENT_MAP, { ignoreTime: true });
      return {
        id: m.id,
        date: m.date,
        mealType: m.mealType,
        servings: m.servings,
        completed: !!m.completedAt,
        recipe: { id: r.id, name: r.name, category: r.category, imageUrl: r.imageUrl, preparationTime: r.preparationTime, cookingTime: r.cookingTime, isFavorite: favorites.has(r.id) },
        costCents: recipeCost(r, m.servings, INGREDIENT_MAP).totalCents,
        nutritionPerServing: { ...recipeNutritionPerServing(r, INGREDIENT_MAP), isEstimate: true },
        conflicts: check.reasons.filter(isSafetyReason).map((x) => x.message),
      };
    });
  const days: Array<{ date: string; meals: typeof meals }> = [];
  for (let d = plan.startDate; d <= plan.endDate; d = addDays(d, 1)) days.push({ date: d, meals: meals.filter((m) => m.date === d) });
  const estimatedCostCents = sumEstimatedCents(plan.shopping.items);
  return {
    id: plan.id,
    startDate: plan.startDate,
    endDate: plan.endDate,
    createdAt: plan.createdAt,
    archived: plan.archived,
    budgetCents: plan.budgetCents,
    estimatedCostCents,
    feasible: plan.feasible && (plan.budgetCents == null || estimatedCostCents <= plan.budgetCents),
    issues: plan.issues,
    suggestions: plan.suggestions,
    mealCount: meals.length,
    completedCount: meals.filter((m) => m.completed).length,
    hasConflicts: meals.some((m) => m.conflicts.length > 0),
    days,
  };
}

function findPlan(s: LocalState, id: string) {
  const plan = s.plans.find((p) => p.id === id);
  if (!plan) throw notFound('Planning');
  return plan;
}
function findMeal(plan: LocalPlan, id: string) {
  const meal = plan.meals.find((m) => m.id === id);
  if (!meal) throw notFound('Repas');
  return meal;
}

function generate(s: LocalState, body: unknown) {
  const profile = requireProfile(s);
  const input = parse(generatePlanSchema, body);
  const days = input.days ?? profile.planningDays;
  const seed = input.seed ?? Math.floor(Math.random() * 2 ** 31);
  const result = generateMealPlan({
    recipes: RECIPES,
    ingredients: INGREDIENT_MAP,
    constraints: constraints(s),
    likedIngredientIds: s.liked,
    favoriteRecipeIds: s.favorites.map((f) => f.recipeId),
    inventory: s.inventory,
    startDate: input.startDate,
    days,
    mealsPerDay: profile.mealsPerDay,
    householdSize: profile.householdSize,
    weeklyBudgetCents: profile.weeklyBudgetCents,
    dailyKcalTarget: energy(s)?.targetKcal ?? null,
    goal: profile.goal,
    seed,
  });
  if (result.meals.length === 0) {
    throw new ApiError(422, 'PLAN_GENERATION_FAILED', result.issues[0]?.message ?? 'Impossible de générer un programme.', { issues: result.issues, suggestions: result.suggestions });
  }
  s.plans.forEach((p) => (p.archived = true));
  const plan: LocalPlan = {
    id: uid(),
    startDate: input.startDate,
    endDate: addDays(input.startDate, days - 1),
    createdAt: now(),
    budgetCents: result.budgetCents,
    feasible: result.feasible,
    issues: result.issues,
    suggestions: result.suggestions,
    seed,
    archived: false,
    meals: result.meals.map((m) => ({ id: uid(), recipeId: m.recipeId, date: m.date, mealType: m.mealType, servings: m.servings, completedAt: null })),
    shopping: { updatedAt: now(), items: [] },
  };
  rebuildShopping(s, plan);
  s.plans = [plan, ...s.plans].slice(0, MAX_PLANS);
  return planView(s, plan);
}

function alternatives(s: LocalState, plan: LocalPlan, mealId: string) {
  const meal = findMeal(plan, mealId);
  const base = { recipes: RECIPES, ingredients: INGREDIENT_MAP, constraints: constraints(s), likedIngredientIds: s.liked, favoriteRecipeIds: s.favorites.map((f) => f.recipeId) };
  let list = suggestAlternatives(base, meal.mealType, [meal.recipeId, ...plan.meals.map((m) => m.recipeId)], 6);
  if (list.length === 0) list = suggestAlternatives(base, meal.mealType, [meal.recipeId], 6);
  return list.map((r) => ({ id: r.id, name: r.name, category: r.category, totalTime: r.preparationTime + r.cookingTime, costCents: recipeCost(r, meal.servings, INGREDIENT_MAP).totalCents }));
}

function updateMeal(s: LocalState, plan: LocalPlan, mealId: string, body: unknown) {
  const input = parse(updatePlannedMealSchema, body);
  const meal = findMeal(plan, mealId);
  if (input.date && (input.date < plan.startDate || input.date > plan.endDate)) {
    throw new ApiError(400, 'DATE_OUT_OF_PLAN', 'La date doit être comprise dans la période du planning.');
  }
  if (input.recipeId && input.recipeId !== meal.recipeId) {
    const r = RECIPE_MAP.get(input.recipeId);
    if (!r) throw notFound('Recette');
    const blocking = checkRecipe(r, constraints(s), INGREDIENT_MAP, { ignoreTime: true }).reasons.filter(isSafetyReason);
    if (blocking.length) {
      throw new ApiError(422, 'RECIPE_NOT_ALLOWED', 'Cette recette ne respecte pas vos allergies, régime ou exclusions.', { reasons: blocking.map((x) => x.message) });
    }
  }
  if (input.servings !== undefined) meal.servings = input.servings;
  if (input.date) meal.date = input.date;
  if (input.mealType) meal.mealType = input.mealType;
  if (input.recipeId) meal.recipeId = input.recipeId;
  if (input.completed !== undefined) meal.completedAt = input.completed ? now() : null;
  if (input.servings !== undefined || input.recipeId !== undefined) rebuildShopping(s, plan);
  return planView(s, plan);
}

function updateShoppingItem(plan: LocalPlan, itemId: string, body: unknown) {
  const input = parse(updateShoppingItemSchema, body);
  const item = plan.shopping.items.find((i) => i.id === itemId);
  if (!item) throw notFound('Article');
  if (input.isPurchased !== undefined) item.isPurchased = input.isPurchased;
  if (input.estimatedPriceCents !== undefined) item.estimatedPriceCents = input.estimatedPriceCents;
  if (input.quantity !== undefined) {
    item.quantity = input.quantity;
    item.userEdited = true;
    const info = item.ingredientId ? INGREDIENT_MAP.get(item.ingredientId) : undefined;
    if (info && input.estimatedPriceCents === undefined) {
      const base = convertToBase(input.quantity, item.unit, info);
      item.estimatedPriceCents = base === null ? null : estimatePurchaseCostCents(info, base);
    }
  }
  return shoppingView(plan);
}

/* ─── Tableau de bord et suivi ─────────────────────────────────────────── */

function currentPlan(s: LocalState) {
  return s.plans.find((p) => !p.archived) ?? null;
}

function dashboard(s: LocalState) {
  const plan = currentPlan(s);
  const t = today();
  const meals = (plan?.meals ?? [])
    .map((m) => {
      const r = RECIPE_MAP.get(m.recipeId)!;
      return {
        id: m.id,
        date: m.date,
        mealType: m.mealType,
        servings: m.servings,
        completed: !!m.completedAt,
        recipe: { id: r.id, name: r.name, imageUrl: r.imageUrl, category: r.category, preparationTime: r.preparationTime, cookingTime: r.cookingTime },
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date) || MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType));
  const favorites = [...s.favorites].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return {
    displayName: s.profile?.displayName ?? null,
    hasProfile: !!s.profile,
    today: t,
    plan: plan
      ? {
          id: plan.id,
          startDate: plan.startDate,
          endDate: plan.endDate,
          budgetCents: plan.budgetCents,
          estimatedCostCents: sumEstimatedCents(plan.shopping.items),
          mealCount: meals.length,
          recipeCount: new Set(meals.map((m) => m.recipe.id)).size,
          completedCount: meals.filter((m) => m.completed).length,
          feasible: plan.feasible,
        }
      : null,
    todayMeals: meals.filter((m) => m.date === t),
    upcomingMeals: meals.filter((m) => m.date > t).slice(0, 4),
    shopping: plan ? { itemCount: plan.shopping.items.length, purchasedCount: plan.shopping.items.filter((i) => i.isPurchased).length } : null,
    favorites: favorites.slice(0, 4).map((f) => {
      const r = RECIPE_MAP.get(f.recipeId)!;
      return { id: r.id, name: r.name, imageUrl: r.imageUrl, category: r.category };
    }),
    favoritesCount: favorites.length,
    energyEstimate: energy(s),
  };
}

function progress(s: LocalState) {
  const t = today();
  const since = addDays(t, -55);
  const meals = s.plans.flatMap((p) => p.meals).filter((m) => m.date >= since && m.date <= t);
  const weeks = Array.from({ length: 8 }, (_, i) => {
    const start = addDays(t, -7 * (7 - i) - 6);
    const end = addDays(start, 6);
    const inWeek = meals.filter((m) => m.date >= start && m.date <= end);
    return { weekStart: start, planned: inWeek.length, completed: inWeek.filter((m) => m.completedAt).length };
  });
  const completed = meals.filter((m) => m.completedAt);
  const meat = new Set(['viande', 'porc', 'volaille', 'poisson', 'fruits_de_mer', 'gelatine']);
  const byCategory = new Map<string, number>();
  const byRecipe = new Map<string, number>();
  let vegetarianMeals = 0;
  for (const m of completed) {
    const r = RECIPE_MAP.get(m.recipeId)!;
    if (!r.ingredients.some((i) => INGREDIENT_MAP.get(i.ingredientId)?.dietFlags.some((f) => meat.has(f)))) vegetarianMeals++;
    byCategory.set(r.category, (byCategory.get(r.category) ?? 0) + 1);
    byRecipe.set(r.name, (byRecipe.get(r.name) ?? 0) + 1);
  }
  return {
    goal: s.profile?.goal ?? null,
    plansCount: s.plans.length,
    completedMeals: completed.length,
    plannedMeals: meals.length,
    weeks,
    habits: {
      vegetarianMeals,
      homeCookedMeals: completed.length,
      categories: [...byCategory].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
      favoriteRecipes: [...byRecipe].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
    },
    weights: [...s.weights].sort((a, b) => a.date.localeCompare(b.date)),
    goals: s.goals.map((g) => ({ id: g.id, title: g.title, done: g.done })),
    message:
      completed.length === 0
        ? 'Chaque petit pas compte : cochez un repas lorsque vous l’avez préparé pour suivre vos habitudes.'
        : `Bravo pour ${completed.length === 1 ? 'ce premier repas préparé' : `les ${completed.length} repas préparés`} ! Les journées incomplètes font partie du quotidien.`,
  };
}

function recipeIdeas(s: LocalState, body: unknown) {
  const { mealType } = parse(aiRecipeIdeasSchema, body) as { mealType: MealType };
  const inStock = new Set(s.inventory.map((i) => i.ingredientId));
  const servings = s.profile?.householdSize ?? 2;
  const kind = recipeSlotKind(mealType);
  const ideas = RECIPES.filter((r) => r.slotKinds.includes(kind))
    .map((r) => ({ r, check: checkRecipe(r, constraints(s), INGREDIENT_MAP) }))
    .filter((x) => x.check.allowed)
    .map((x) => ({ ...x, score: x.r.ingredients.filter((i) => inStock.has(i.ingredientId)).length }))
    .sort((a, b) => b.score - a.score || a.r.name.localeCompare(b.r.name, 'fr'))
    .slice(0, 3)
    .map(({ r, check }) => {
      const cost = recipeCost(r, servings, INGREDIENT_MAP);
      const n = recipeNutritionPerServing(r, INGREDIENT_MAP);
      const factor = servings / r.servings;
      return {
        name: r.name,
        description: r.description,
        servings,
        totalTime: r.preparationTime + r.cookingTime,
        ingredients: r.ingredients.map((i) => ({ ingredientId: i.ingredientId, name: INGREDIENT_MAP.get(i.ingredientId)!.name, quantity: i.quantity * factor, unit: i.unit })),
        steps: [],
        recipeId: r.id,
        estimatedCostCents: cost.complete ? cost.totalCents : null,
        kcalPerServing: n.complete ? n.kcal : null,
        warnings: check.warnings,
      };
    });
  return { source: 'catalogue' as const, notice: 'Recettes du catalogue qui utilisent au mieux ce que vous avez déjà, choisies selon vos allergies et exclusions.', ideas };
}

/* ─── Routeur ──────────────────────────────────────────────────────────── */

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export async function localApi<T>(path: string, method: Method, body: unknown): Promise<T> {
  try {
    return (await route(path, method, body)) as T;
  } catch (e) {
    if (e instanceof ZodError) {
      throw new ApiError(400, 'VALIDATION_ERROR', 'Certaines informations sont invalides.', e.issues.map((i) => ({ path: i.path.join('.'), message: i.message })));
    }
    if (e instanceof ApiError) throw e;
    throw new ApiError(500, 'INTERNAL_ERROR', 'Une erreur inattendue est survenue. Réessayez dans quelques instants.');
  }
}

async function route(fullPath: string, method: Method, body: unknown): Promise<unknown> {
  const [path, qs = ''] = fullPath.split('?');
  const query = Object.fromEntries(new URLSearchParams(qs));
  const seg = path!.split('/').filter(Boolean);
  const s = await loadState();
  const save = async <R>(result: R): Promise<R> => {
    try {
      await persist(s);
    } catch {
      throw new ApiError(503, 'SAVE_FAILED', "Vos modifications n'ont pas pu être enregistrées. Vérifiez votre connexion puis réessayez.");
    }
    return result;
  };
  const is = (m: Method, pattern: string) => {
    if (m !== method) return false;
    const p = pattern.split('/').filter(Boolean);
    return p.length === seg.length && p.every((x, i) => x.startsWith(':') || x === seg[i]);
  };

  // Compte et profil
  if (is('GET', '/me')) return { id: 'local', email: null, hasProfile: !!s.profile };
  if (is('GET', '/me/profile')) return { profile: s.profile, energyEstimate: energy(s) };
  if (is('PUT', '/me/profile')) {
    const input = parse(profileSchema, body);
    s.profile = { ...input, displayName: input.displayName ?? null, notificationsEnabled: s.profile?.notificationsEnabled ?? false };
    return save({ profile: s.profile, energyEstimate: energy(s) });
  }
  if (is('PUT', '/me/notifications')) {
    const { notificationsEnabled } = parse(notificationSettingsSchema, body);
    requireProfile(s).notificationsEnabled = notificationsEnabled;
    return save({ notificationsEnabled });
  }
  const ref = (id: string) => {
    const i = INGREDIENT_MAP.get(id)!;
    return { id, name: i.name, category: i.category };
  };
  if (is('GET', '/me/preferences')) return { liked: s.liked.map(ref), disliked: s.disliked.map(ref) };
  if (is('PUT', '/me/preferences')) {
    const input = parse(preferencesSchema, body);
    const ids = [...input.likedIngredientIds, ...input.dislikedIngredientIds];
    if (ids.some((id) => !INGREDIENT_MAP.has(id))) throw new ApiError(400, 'UNKNOWN_INGREDIENT', 'Un ou plusieurs aliments sont introuvables.');
    s.liked = [...new Set(input.likedIngredientIds)];
    s.disliked = [...new Set(input.dislikedIngredientIds)];
    return save({ liked: s.liked.map(ref), disliked: s.disliked.map(ref) });
  }
  if (is('GET', '/me/allergies')) return s.allergies;
  if (is('PUT', '/me/allergies')) {
    s.allergies = parse(allergiesSchema, body).allergies.map((a) => ({ allergen: a.allergen, severity: a.severity ?? null }));
    return save(s.allergies);
  }
  const inventoryView = () =>
    s.inventory
      .map((i) => ({ ...i, name: INGREDIENT_MAP.get(i.ingredientId)!.name, category: INGREDIENT_MAP.get(i.ingredientId)!.category }))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  if (is('GET', '/me/inventory')) return inventoryView();
  if (is('POST', '/me/inventory')) {
    const input = parse(inventoryItemSchema, body);
    if (!INGREDIENT_MAP.has(input.ingredientId)) throw new ApiError(400, 'UNKNOWN_INGREDIENT', 'Un ou plusieurs aliments sont introuvables.');
    const existing = s.inventory.find((i) => i.ingredientId === input.ingredientId);
    const data = { quantity: input.quantity, unit: input.unit, expirationDate: input.expirationDate ?? null };
    if (existing) Object.assign(existing, data);
    else s.inventory.push({ id: uid(), ingredientId: input.ingredientId, ...data });
    return save(inventoryView());
  }
  if (is('PATCH', '/me/inventory/:id')) {
    const input = parse(inventoryUpdateSchema, body);
    const item = s.inventory.find((i) => i.id === seg[2]);
    if (!item) throw notFound('Article du stock');
    if (input.quantity !== undefined) item.quantity = input.quantity;
    if (input.unit) item.unit = input.unit;
    if (input.expirationDate !== undefined) item.expirationDate = input.expirationDate ?? null;
    return save(inventoryView());
  }
  if (is('DELETE', '/me/inventory/:id')) {
    if (!s.inventory.some((i) => i.id === seg[2])) throw notFound('Article du stock');
    s.inventory = s.inventory.filter((i) => i.id !== seg[2]);
    return save(inventoryView());
  }
  if (is('GET', '/me/export')) return { exportedAt: now(), format: 'NutriPlan export v1 (version web)', data: s };
  if (is('DELETE', '/me')) {
    await wipe();
    return { dataDeleted: true, authAccountDeleted: true, message: 'Toutes vos données NutriPlan ont été supprimées.' };
  }

  // Catalogue
  if (is('GET', '/ingredients')) {
    const search = (query.search ?? '').trim().toLocaleLowerCase('fr');
    return [...INGREDIENT_MAP.values()]
      .filter((i) => !search || i.name.toLocaleLowerCase('fr').includes(search))
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
      .map((i) => ({ id: i.id, name: i.name, category: i.category, unit: i.unit, allergens: i.allergens, mayContain: i.mayContain }));
  }
  if (is('GET', '/recipes')) return listRecipes(s, query);
  if (is('GET', '/recipes/:id')) return recipeDetail(s, seg[1]!, query.servings ? z.coerce.number().int().min(1).max(20).parse(query.servings) : undefined);
  if (is('POST', '/recipes/:id/favorite')) {
    if (!RECIPE_MAP.has(seg[1]!)) throw notFound('Recette');
    if (!s.favorites.some((f) => f.recipeId === seg[1])) s.favorites.push({ recipeId: seg[1]!, createdAt: now() });
    return save({ recipeId: seg[1], isFavorite: true });
  }
  if (is('DELETE', '/recipes/:id/favorite')) {
    s.favorites = s.favorites.filter((f) => f.recipeId !== seg[1]);
    return save({ recipeId: seg[1], isFavorite: false });
  }

  // Planning
  if (is('POST', '/meal-plans/generate')) return save(generate(s, body));
  if (is('GET', '/meal-plans/current')) {
    const p = currentPlan(s);
    return { plan: p ? planView(s, p) : null };
  }
  if (is('GET', '/meal-plans')) {
    return [...s.plans]
      .sort((a, b) => b.startDate.localeCompare(a.startDate))
      .map((p) => ({ id: p.id, startDate: p.startDate, endDate: p.endDate, archived: p.archived, feasible: p.feasible, mealCount: p.meals.length, completedCount: p.meals.filter((m) => m.completedAt).length }));
  }
  if (seg[0] === 'meal-plans' && seg[1]) {
    const plan = findPlan(s, seg[1]);
    if (is('GET', '/meal-plans/:id')) return planView(s, plan);
    if (is('PATCH', '/meal-plans/:id/meals/:mealId')) return save(updateMeal(s, plan, seg[3]!, body));
    if (is('GET', '/meal-plans/:id/meals/:mealId/alternatives')) return alternatives(s, plan, seg[3]!);
    if (is('POST', '/meal-plans/:id/meals/:mealId/replace')) {
      const alts = alternatives(s, plan, seg[3]!);
      if (!alts.length) throw new ApiError(422, 'NO_ALTERNATIVE', 'Aucune autre recette ne respecte vos contraintes pour ce repas.');
      return save(updateMeal(s, plan, seg[3]!, { recipeId: alts[0]!.id }));
    }
    if (is('GET', '/meal-plans/:id/shopping-list')) return shoppingView(plan);
    if (is('POST', '/meal-plans/:id/shopping-list/recalculate')) {
      rebuildShopping(s, plan);
      return save(shoppingView(plan));
    }
    if (is('POST', '/meal-plans/:id/shopping-list/items')) {
      const input = parse(manualShoppingItemSchema, body);
      plan.shopping.items.push({
        id: uid(),
        ingredientId: null,
        customName: input.name,
        category: input.category,
        quantity: input.quantity,
        unit: input.unit,
        estimatedPriceCents: input.estimatedPriceCents ?? null,
        isPurchased: false,
        isManual: true,
        userEdited: false,
        isPantryStaple: false,
      });
      return save(shoppingView(plan));
    }
    if (is('PATCH', '/meal-plans/:id/shopping-list/items/:itemId')) return save(updateShoppingItem(plan, seg[4]!, body));
    if (is('DELETE', '/meal-plans/:id/shopping-list/items/:itemId')) {
      if (!plan.shopping.items.some((i) => i.id === seg[4])) throw notFound('Article');
      plan.shopping.items = plan.shopping.items.filter((i) => i.id !== seg[4]);
      return save(shoppingView(plan));
    }
  }

  // Tableau de bord et suivi
  if (is('GET', '/dashboard')) return dashboard(s);
  if (is('GET', '/progress')) return progress(s);
  if (is('GET', '/progress/weights')) return progress(s).weights;
  if (is('POST', '/progress/weights')) {
    const input = parse(weightEntrySchema, body);
    s.weights = [...s.weights.filter((w) => w.date !== input.date), { id: uid(), ...input }];
    return save(progress(s).weights);
  }
  if (is('DELETE', '/progress/weights/:id')) {
    if (!s.weights.some((w) => w.id === seg[2])) throw notFound('Mesure');
    s.weights = s.weights.filter((w) => w.id !== seg[2]);
    return save(progress(s).weights);
  }
  if (is('GET', '/progress/goals')) return progress(s).goals;
  if (is('POST', '/progress/goals')) {
    const input = parse(personalGoalSchema, body);
    s.goals.push({ id: uid(), title: input.title, done: false, createdAt: now() });
    return save(progress(s).goals);
  }
  if (is('PATCH', '/progress/goals/:id')) {
    const input = parse(personalGoalSchema.partial(), body);
    const goal = s.goals.find((g) => g.id === seg[2]);
    if (!goal) throw notFound('Objectif');
    Object.assign(goal, input);
    return save(progress(s).goals);
  }
  if (is('DELETE', '/progress/goals/:id')) {
    if (!s.goals.some((g) => g.id === seg[2])) throw notFound('Objectif');
    s.goals = s.goals.filter((g) => g.id !== seg[2]);
    return save(progress(s).goals);
  }

  // Idées (sans IA dans la version web : sélection depuis le catalogue)
  if (is('GET', '/ai/status')) return { enabled: false };
  if (is('POST', '/ai/recipe-ideas')) return recipeIdeas(s, body);

  throw new ApiError(404, 'NOT_FOUND', 'Ressource introuvable.');
}
