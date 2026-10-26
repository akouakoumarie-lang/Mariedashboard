import type { IngredientInfo, NutritionPer100, RecipeInfo } from './types';
import { baseToGrams, convertToBase, type BaseUnit } from './units';

export interface ScaledIngredient {
  ingredientId: string;
  /** Quantité dans l'unité de la recette, adaptée au nombre de portions. */
  quantity: number;
  unit: RecipeInfo['ingredients'][number]['unit'];
  /** Quantité convertie dans l'unité de base de l'ingrédient, ou null si conversion impossible. */
  baseQuantity: number | null;
  baseUnit: BaseUnit | null;
}

/** Facteur d'échelle pour passer des portions de la recette aux portions voulues. */
export function scaleFactor(recipeServings: number, targetServings: number): number {
  if (!(recipeServings > 0)) throw new Error('Le nombre de portions de la recette doit être positif.');
  if (!(targetServings > 0)) throw new Error('Le nombre de portions demandé doit être positif.');
  return targetServings / recipeServings;
}

export function scaleRecipeIngredients(
  recipe: RecipeInfo,
  targetServings: number,
  ingredients: Map<string, IngredientInfo>,
): ScaledIngredient[] {
  const factor = scaleFactor(recipe.servings, targetServings);
  return recipe.ingredients.map((ri) => {
    const quantity = ri.quantity * factor;
    const info = ingredients.get(ri.ingredientId);
    const baseQuantity = info ? convertToBase(quantity, ri.unit, info) : null;
    return { ingredientId: ri.ingredientId, quantity, unit: ri.unit, baseQuantity, baseUnit: info?.unit ?? null };
  });
}

/** Coût au prorata (centimes) d'une quantité en unité de base, ou null si le prix est inconnu. */
export function proratedCostCents(info: IngredientInfo, baseQuantity: number): number | null {
  if (info.priceCents == null || !info.priceQuantity) return null;
  return (baseQuantity / info.priceQuantity) * info.priceCents;
}

export interface RecipeCost {
  /** Coût total estimé (centimes) pour le nombre de portions demandé, au prorata des quantités utilisées. */
  totalCents: number;
  perServingCents: number;
  /** Faux si au moins un ingrédient n'a pas de prix ou d'unité convertible. */
  complete: boolean;
}

export function recipeCost(
  recipe: RecipeInfo,
  servings: number,
  ingredients: Map<string, IngredientInfo>,
): RecipeCost {
  let total = 0;
  let complete = true;
  for (const s of scaleRecipeIngredients(recipe, servings, ingredients)) {
    const info = ingredients.get(s.ingredientId);
    const cost = info && s.baseQuantity !== null ? proratedCostCents(info, s.baseQuantity) : null;
    if (cost === null) complete = false;
    else total += cost;
  }
  return { totalCents: Math.round(total), perServingCents: Math.round(total / servings), complete };
}

export interface NutritionEstimate extends Required<NutritionPer100> {
  /** Faux si certaines valeurs manquent : les totaux sont alors sous-estimés. */
  complete: boolean;
}

/** Estimation nutritionnelle par portion (ce n'est pas une mesure ni un avis médical). */
export function recipeNutritionPerServing(
  recipe: RecipeInfo,
  ingredients: Map<string, IngredientInfo>,
): NutritionEstimate {
  const acc = { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 };
  let complete = true;
  for (const s of scaleRecipeIngredients(recipe, 1, ingredients)) {
    const info = ingredients.get(s.ingredientId);
    const grams = info && s.baseQuantity !== null ? baseToGrams(s.baseQuantity, info) : null;
    if (!info?.nutrition || grams === null) {
      complete = false;
      continue;
    }
    const f = grams / 100;
    acc.kcal += info.nutrition.kcal * f;
    acc.proteinG += info.nutrition.proteinG * f;
    acc.carbsG += info.nutrition.carbsG * f;
    acc.fatG += info.nutrition.fatG * f;
    acc.fiberG += (info.nutrition.fiberG ?? 0) * f;
  }
  return {
    kcal: Math.round(acc.kcal),
    proteinG: round1(acc.proteinG),
    carbsG: round1(acc.carbsG),
    fatG: round1(acc.fatG),
    fiberG: round1(acc.fiberG),
    complete,
  };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
