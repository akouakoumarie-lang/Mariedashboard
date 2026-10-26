import { checkRecipe, type RecipeCheck } from './constraints';
import { MEAL_TYPE_LABELS, mealTypesForCount, recipeSlotKind, type MealType } from './domain';
import { mealEnergyShare } from './nutrition';
import { recipeCost, recipeNutritionPerServing } from './recipes';
import { budgetForPeriodCents, buildShoppingList, formatEuros } from './shopping';
import type { GeneratorInput, RecipeInfo } from './types';

/**
 * Générateur de menus déterministe (à graine fixe) fondé sur des règles.
 *
 * 1. Filtre strict : allergies (et traces si nécessaire), régimes, ingrédients exclus,
 *    équipement, temps maximal.
 * 2. Pour chaque créneau, choix de la recette la mieux notée :
 *    goûts, stock disponible, réutilisation d'ingrédients (anti-gaspillage), favoris,
 *    coût par rapport au budget, adéquation énergétique, variété (pénalité de répétition).
 * 3. Réparation budgétaire : remplacement des repas les plus chers par des alternatives.
 * 4. Si le budget reste insuffisant, le plan est marqué « non réalisable » avec des
 *    explications et des ajustements proposés — on ne prétend jamais le contraire.
 */

export interface GeneratedMeal {
  date: string;
  mealType: MealType;
  recipeId: string;
  servings: number;
  costCents: number;
}

export type PlanIssueCode = 'NO_ELIGIBLE_RECIPE' | 'NO_RECIPE_FOR_SLOT' | 'BUDGET_INSUFFICIENT' | 'LOW_VARIETY' | 'MISSING_PRICES';

export interface PlanIssue {
  code: PlanIssueCode;
  message: string;
}

export interface GeneratedPlan {
  meals: GeneratedMeal[];
  /** Coût estimé de la liste de courses (centimes), après déduction du stock. */
  estimatedCostCents: number;
  budgetCents: number | null;
  /** Vrai si toutes les contraintes, y compris le budget, sont satisfaites. */
  feasible: boolean;
  issues: PlanIssue[];
  suggestions: string[];
  eligibleRecipeCount: number;
  excludedRecipeCount: number;
}

const MIN_DAYS_BETWEEN_REPEATS = 2;

/** Générateur pseudo-aléatoire reproductible (mulberry32). */
export function seededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function addDays(isoDate: string, days: number): string {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function filterEligibleRecipes(input: Pick<GeneratorInput, 'recipes' | 'constraints' | 'ingredients'>) {
  const eligible: RecipeInfo[] = [];
  const excluded: Array<{ recipe: RecipeInfo; check: RecipeCheck }> = [];
  for (const recipe of input.recipes) {
    const check = checkRecipe(recipe, input.constraints, input.ingredients);
    if (check.allowed) eligible.push(recipe);
    else excluded.push({ recipe, check });
  }
  return { eligible, excluded };
}

interface Slot {
  date: string;
  dayIndex: number;
  mealType: MealType;
}

export function generateMealPlan(input: GeneratorInput): GeneratedPlan {
  const days = Math.max(1, Math.min(14, Math.round(input.days)));
  const servings = Math.max(1, Math.round(input.householdSize));
  const rng = seededRandom(input.seed ?? 42);
  const { eligible, excluded } = filterEligibleRecipes(input);
  const issues: PlanIssue[] = [];
  const suggestions: string[] = [];

  const budgetCents = input.weeklyBudgetCents != null ? budgetForPeriodCents(input.weeklyBudgetCents, days) : null;
  const mealTypes = mealTypesForCount(input.mealsPerDay);
  const slots: Slot[] = [];
  for (let d = 0; d < days; d++) {
    for (const mealType of mealTypes) slots.push({ date: addDays(input.startDate, d), dayIndex: d, mealType });
  }

  if (eligible.length === 0) {
    issues.push({
      code: 'NO_ELIGIBLE_RECIPE',
      message: "Aucune recette du catalogue ne respecte toutes vos contraintes (allergies, régime, exclusions, équipement, temps).",
    });
    suggestions.push(...relaxationSuggestions(input, excluded));
    return {
      meals: [],
      estimatedCostCents: 0,
      budgetCents,
      feasible: false,
      issues,
      suggestions,
      eligibleRecipeCount: 0,
      excludedRecipeCount: excluded.length,
    };
  }

  const costPerServing = new Map(eligible.map((r) => [r.id, recipeCost(r, servings, input.ingredients).totalCents]));
  const kcalPerServing = new Map(eligible.map((r) => [r.id, recipeNutritionPerServing(r, input.ingredients)]));
  const liked = new Set(input.likedIngredientIds);
  const favorites = new Set(input.favoriteRecipeIds);
  const inStock = new Set(input.inventory.map((i) => i.ingredientId));
  const slotBudget = budgetCents != null && slots.length > 0 ? budgetCents / slots.length : null;

  const chosen: Array<{ slot: Slot; recipe: RecipeInfo }> = [];
  const usedIngredients = new Map<string, number>();
  const lastUsedDay = new Map<string, number>();
  const useCount = new Map<string, number>();

  const scoreRecipe = (recipe: RecipeInfo, slot: Slot): number => {
    let score = rng() * 0.5; // légère variation pour la variété, reproductible grâce à la graine
    const ids = recipe.ingredients.map((i) => i.ingredientId);
    const nonStaples = ids.filter((id) => !input.ingredients.get(id)?.isPantryStaple);
    score += Math.min(3, ids.filter((id) => liked.has(id)).length) * 1.5;
    score += Math.min(3, ids.filter((id) => inStock.has(id)).length) * 2;
    score += Math.min(3, nonStaples.filter((id) => usedIngredients.has(id)).length) * 0.75;
    if (favorites.has(recipe.id)) score += 1.5;

    const last = lastUsedDay.get(recipe.id);
    if (last !== undefined && slot.dayIndex - last < MIN_DAYS_BETWEEN_REPEATS) score -= 100;
    score -= (useCount.get(recipe.id) ?? 0) * 4;

    if (slotBudget != null) {
      const cost = costPerServing.get(recipe.id)!;
      if (cost > slotBudget) score -= ((cost - slotBudget) / slotBudget) * 4;
    }
    const kcal = kcalPerServing.get(recipe.id)!;
    if (input.dailyKcalTarget && kcal.complete && kcal.kcal > 0) {
      const target = input.dailyKcalTarget * mealEnergyShare(slot.mealType, mealTypes.length);
      score -= Math.min(3, (Math.abs(kcal.kcal - target) / target) * 3);
    }
    return score;
  };

  const record = (recipe: RecipeInfo, slot: Slot, delta: 1 | -1) => {
    useCount.set(recipe.id, (useCount.get(recipe.id) ?? 0) + delta);
    if (delta === 1) lastUsedDay.set(recipe.id, slot.dayIndex);
    for (const ri of recipe.ingredients) usedIngredients.set(ri.ingredientId, (usedIngredients.get(ri.ingredientId) ?? 0) + delta);
  };

  for (const slot of slots) {
    const kind = recipeSlotKind(slot.mealType);
    const candidates = eligible.filter((r) => r.slotKinds.includes(kind));
    if (candidates.length === 0) {
      issues.push({
        code: 'NO_RECIPE_FOR_SLOT',
        message: `Aucune recette compatible pour le créneau « ${MEAL_TYPE_LABELS[slot.mealType]} » du ${slot.date}.`,
      });
      continue;
    }
    let best = candidates[0]!;
    let bestScore = -Infinity;
    for (const r of candidates) {
      const s = scoreRecipe(r, slot);
      if (s > bestScore) {
        bestScore = s;
        best = r;
      }
    }
    chosen.push({ slot, recipe: best });
    record(best, slot, 1);
  }

  const eligibleById = new Map(eligible.map((r) => [r.id, r]));
  const planCost = () =>
    buildShoppingList(
      chosen.map((c) => ({ recipe: c.recipe, servings })),
      input.ingredients,
      input.inventory,
    );

  // Réparation budgétaire : on remplace le repas le plus cher par une alternative moins chère.
  let shopping = planCost();
  if (budgetCents != null) {
    for (let iter = 0; iter < slots.length * 2 && shopping.totalCents > budgetCents; iter++) {
      const ranked = [...chosen.keys()].sort(
        (a, b) => costPerServing.get(chosen[b]!.recipe.id)! - costPerServing.get(chosen[a]!.recipe.id)!,
      );
      let improved = false;
      for (const idx of ranked) {
        const current = chosen[idx]!;
        const currentCost = costPerServing.get(current.recipe.id)!;
        const kind = recipeSlotKind(current.slot.mealType);
        const alternatives = eligible
          .filter((r) => r.slotKinds.includes(kind) && costPerServing.get(r.id)! < currentCost && r.id !== current.recipe.id)
          .filter((r) => !violatesRepeatGap(chosen, idx, r.id))
          .sort((a, b) => costPerServing.get(a.id)! - costPerServing.get(b.id)!);
        const alt = alternatives[0];
        if (!alt) continue;
        record(current.recipe, current.slot, -1);
        chosen[idx] = { slot: current.slot, recipe: alt };
        record(alt, current.slot, 1);
        const next = planCost();
        if (next.totalCents < shopping.totalCents) {
          shopping = next;
          improved = true;
          break;
        }
        // Pas d'amélioration (effet des conditionnements) : on annule.
        record(alt, current.slot, -1);
        chosen[idx] = current;
        record(current.recipe, current.slot, 1);
      }
      if (!improved) break;
    }
  }

  const distinct = new Set(chosen.map((c) => c.recipe.id)).size;
  if (chosen.length >= 6 && distinct < Math.min(chosen.length, 4)) {
    issues.push({ code: 'LOW_VARIETY', message: 'Peu de recettes respectent vos contraintes : certains repas reviennent souvent.' });
    suggestions.push('Élargissez vos préférences ou le temps de préparation pour gagner en variété.');
  }
  if (shopping.itemsWithoutPrice > 0) {
    issues.push({ code: 'MISSING_PRICES', message: `${shopping.itemsWithoutPrice} article(s) sans prix estimé : le budget affiché est incomplet.` });
  }

  let feasible = !issues.some((i) => i.code === 'NO_RECIPE_FOR_SLOT');
  if (budgetCents != null && shopping.totalCents > budgetCents) {
    feasible = false;
    const gap = shopping.totalCents - budgetCents;
    issues.push({
      code: 'BUDGET_INSUFFICIENT',
      message: `Le budget de ${formatEuros(budgetCents)} ne suffit pas pour couvrir tous les repas avec vos contraintes : coût estimé ${formatEuros(shopping.totalCents)} (écart ${formatEuros(gap)}).`,
    });
    const perMeal = Math.round(shopping.totalCents / Math.max(1, chosen.length));
    suggestions.push(`Augmenter le budget à environ ${formatEuros(Math.ceil(shopping.totalCents / 100) * 100)} pour cette période.`);
    if (mealTypes.length > 1) {
      suggestions.push(`Réduire le nombre de repas planifiés (environ ${formatEuros(perMeal)} par repas pour le foyer).`);
    }
    if (input.constraints.maxTotalTime != null) {
      suggestions.push('Accepter des recettes un peu plus longues : les plats mijotés ou au four sont souvent plus économiques.');
    }
    suggestions.push('Déclarer les ingrédients déjà disponibles dans vos placards : ils sont déduits du budget.');
  }
  if (issues.some((i) => i.code === 'NO_RECIPE_FOR_SLOT')) {
    suggestions.push(...relaxationSuggestions(input, excluded));
  }

  return {
    meals: chosen.map((c) => ({
      date: c.slot.date,
      mealType: c.slot.mealType,
      recipeId: c.recipe.id,
      servings,
      costCents: costPerServing.get(c.recipe.id) ?? 0,
    })),
    estimatedCostCents: shopping.totalCents,
    budgetCents,
    feasible,
    issues,
    suggestions: [...new Set(suggestions)],
    eligibleRecipeCount: eligibleById.size,
    excludedRecipeCount: excluded.length,
  };
}

function violatesRepeatGap(chosen: Array<{ slot: Slot; recipe: RecipeInfo }>, idx: number, recipeId: string): boolean {
  const day = chosen[idx]!.slot.dayIndex;
  return chosen.some((c, i) => i !== idx && c.recipe.id === recipeId && Math.abs(c.slot.dayIndex - day) < MIN_DAYS_BETWEEN_REPEATS);
}

function relaxationSuggestions(
  input: Pick<GeneratorInput, 'constraints'>,
  excluded: Array<{ check: RecipeCheck }>,
): string[] {
  const out: string[] = [];
  const count = (code: string) => excluded.filter((e) => e.check.reasons.some((r) => r.code === code)).length;
  if (count('TIME') > 0 && input.constraints.maxTotalTime != null) {
    out.push(`${count('TIME')} recette(s) écartée(s) pour le temps de préparation : augmentez le temps maximal si possible.`);
  }
  if (count('EQUIPMENT') > 0) out.push(`${count('EQUIPMENT')} recette(s) écartée(s) faute d'équipement : vérifiez la liste de vos appareils.`);
  if (count('EXCLUDED_INGREDIENT') > 0) out.push('Certains aliments exclus limitent le choix : vous pouvez revoir cette liste (hors allergies).');
  return out;
}

/** Propose des recettes de remplacement pour un repas, triées par pertinence, toutes conformes aux contraintes. */
export function suggestAlternatives(
  input: Pick<GeneratorInput, 'recipes' | 'constraints' | 'ingredients' | 'likedIngredientIds' | 'favoriteRecipeIds'>,
  mealType: MealType,
  excludeRecipeIds: string[],
  limit = 5,
): RecipeInfo[] {
  const { eligible } = filterEligibleRecipes(input);
  const kind = recipeSlotKind(mealType);
  const liked = new Set(input.likedIngredientIds);
  const fav = new Set(input.favoriteRecipeIds);
  const skip = new Set(excludeRecipeIds);
  return eligible
    .filter((r) => r.slotKinds.includes(kind) && !skip.has(r.id))
    .map((r) => ({ r, s: r.ingredients.filter((i) => liked.has(i.ingredientId)).length + (fav.has(r.id) ? 2 : 0) }))
    .sort((a, b) => b.s - a.s || a.r.name.localeCompare(b.r.name, 'fr'))
    .slice(0, limit)
    .map((x) => x.r);
}

