import {
  DEMO_INGREDIENTS,
  DEMO_NUTRITION_SOURCE,
  DEMO_PRICE_DATE,
  DEMO_RECIPES,
  stableUuid,
  type IngredientInfo,
  type RecipeInfo,
} from '@nutriplan/core';

/**
 * Catalogue de démonstration embarqué dans la version web autonome.
 * Identifiants UUID stables dérivés des slugs : les données enregistrées restent valides d'une version à l'autre.
 */
export interface CatalogRecipe extends RecipeInfo {
  slug: string;
  description: string;
  instructions: string[];
  tags: string[];
  imageUrl: null;
  isDemo: true;
}

export const ingredientId = (slug: string) => stableUuid(`ingredient:${slug}`);
export const recipeId = (slug: string) => stableUuid(`recipe:${slug}`);

export const INGREDIENT_MAP = new Map<string, IngredientInfo>(
  DEMO_INGREDIENTS.map((i) => [
    ingredientId(i.slug),
    {
      id: ingredientId(i.slug),
      name: i.name,
      category: i.category,
      unit: i.unit,
      gramsPerPiece: i.gpp ?? null,
      densityGPerMl: i.density ?? null,
      allergens: i.allergens ?? [],
      mayContain: i.mayContain ?? [],
      dietFlags: i.flags ?? [],
      isPantryStaple: i.staple ?? false,
      nutrition: i.n ? { kcal: i.n[0], proteinG: i.n[1], carbsG: i.n[2], fatG: i.n[3], fiberG: i.n[4] } : null,
      priceCents: i.p?.[0] ?? null,
      priceQuantity: i.p?.[1] ?? null,
      packageSize: i.p?.[2] ?? null,
    },
  ]),
);

export const RECIPES: CatalogRecipe[] = DEMO_RECIPES.map((r): CatalogRecipe => ({
  id: recipeId(r.slug),
  slug: r.slug,
  name: r.name,
  description: r.description,
  instructions: r.steps,
  category: r.category,
  slotKinds: r.slots,
  preparationTime: r.prep,
  cookingTime: r.cook,
  servings: r.servings,
  equipment: r.equipment,
  tags: r.tags,
  imageUrl: null,
  isDemo: true,
  ingredients: r.ing.map(([slug, quantity, unit]) => ({ ingredientId: ingredientId(slug), quantity, unit })),
})).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

export const RECIPE_MAP = new Map(RECIPES.map((r) => [r.id, r]));

export const PRICE_UPDATED_AT = DEMO_PRICE_DATE;
export const NUTRITION_SOURCE = DEMO_NUTRITION_SOURCE;
