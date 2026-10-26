import { Injectable } from '@nestjs/common';
import {
  checkRecipe,
  NUTRITION_DISCLAIMER,
  recipeCost,
  recipeNutritionPerServing,
  scaleRecipeIngredients,
  type IngredientInfo,
  type RecipeQuery,
} from '@nutriplan/core';
import { notFound } from '../common/errors';
import { UserContextService, type UserContext } from '../me/user-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { CatalogRepository, toRecipeInfo, type RecipeWithIngredients } from './catalog.repository';

@Injectable()
export class CatalogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly repo: CatalogRepository,
    private readonly userContext: UserContextService,
  ) {}

  async ingredients(search?: string) {
    const rows = await this.prisma.ingredient.findMany({
      where: search ? { name: { contains: search, mode: 'insensitive' } } : undefined,
      orderBy: { name: 'asc' },
      select: { id: true, name: true, category: true, unit: true, allergens: true, mayContain: true, priceEstimateCents: true, priceQuantity: true, priceUpdatedAt: true, priceSource: true },
    });
    return rows;
  }

  /** Liste filtrée. Par défaut, seules les recettes compatibles avec les contraintes de l'utilisateur sont renvoyées. */
  async list(userId: string, q: RecipeQuery) {
    const [ctx, ingredients, rows] = await Promise.all([
      this.userContext.load(userId),
      this.repo.ingredientMap(),
      this.repo.recipesWithIngredients({
        ...(q.search ? { name: { contains: q.search, mode: 'insensitive' } } : {}),
        ...(q.category ? { category: q.category } : {}),
        ...(q.ingredientId ? { ingredients: { some: { ingredientId: q.ingredientId } } } : {}),
      }),
    ]);
    const favorites = new Set(ctx.favoriteRecipeIds);
    const compatibleOnly = q.compatibleOnly ?? true;
    const servings = ctx.profile?.householdSize ?? 1;

    return rows
      .map((r) => this.summary(r, ctx, ingredients, favorites, servings))
      .filter((r) => !q.favoritesOnly || r.isFavorite)
      .filter((r) => !compatibleOnly || r.compatibility.allowed)
      .filter((r) => q.maxTime == null || r.totalTime <= q.maxTime)
      .filter((r) => q.maxCostPerServingCents == null || (r.costPerServingCents != null && r.costPerServingCents <= q.maxCostPerServingCents))
      .filter((r) => {
        if (!q.diet) return true;
        const recipe = rows.find((x) => x.id === r.id)!;
        return checkRecipe(toRecipeInfo(recipe), { allergies: [], diets: [q.diet], excludedIngredientIds: [], equipment: [] }, ingredients).allowed;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  }

  async detail(userId: string, id: string, servingsParam?: number) {
    const [ctx, ingredients, rows] = await Promise.all([this.userContext.load(userId), this.repo.ingredientMap(), this.repo.recipesWithIngredients({ id })]);
    const r = rows[0];
    if (!r) throw notFound('Recette');
    const info = toRecipeInfo(r);
    const servings = servingsParam ?? r.servings;
    const scaled = scaleRecipeIngredients(info, servings, ingredients);
    const cost = recipeCost(info, servings, ingredients);
    const priceDates = r.ingredients.map((ri) => ri.ingredient.priceUpdatedAt).filter((d): d is Date => !!d);
    return {
      ...this.summary(r, ctx, ingredients, new Set(ctx.favoriteRecipeIds), servings),
      description: r.description,
      instructions: r.instructions,
      servings,
      baseServings: r.servings,
      ingredients: r.ingredients.map((ri, idx) => ({
        ingredientId: ri.ingredientId,
        name: ri.ingredient.name,
        category: ri.ingredient.category,
        quantity: scaled[idx]!.quantity,
        unit: ri.unit,
        allergens: ri.ingredient.allergens,
        mayContain: ri.ingredient.mayContain,
      })),
      cost: { ...cost, isEstimate: true, priceUpdatedAt: priceDates.length ? new Date(Math.max(...priceDates.map((d) => d.getTime()))).toISOString() : null },
      nutritionDisclaimer: NUTRITION_DISCLAIMER,
    };
  }

  private summary(r: RecipeWithIngredients, ctx: UserContext, ingredients: Map<string, IngredientInfo>, favorites: Set<string>, servings: number) {
    const info = toRecipeInfo(r);
    const check = checkRecipe(info, ctx.constraints, ingredients, { ignoreTime: true });
    const cost = recipeCost(info, servings, ingredients);
    const nutrition = recipeNutritionPerServing(info, ingredients);
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
      isFavorite: favorites.has(r.id),
      costPerServingCents: cost.complete ? cost.perServingCents : null,
      nutritionPerServing: { ...nutrition, isEstimate: true },
      allergens: [...new Set(r.ingredients.flatMap((ri) => ri.ingredient.allergens))],
      compatibility: { allowed: check.allowed, reasons: check.reasons.map((x) => x.message), warnings: check.warnings },
    };
  }

  async addFavorite(userId: string, recipeId: string) {
    const exists = await this.prisma.recipe.count({ where: { id: recipeId } });
    if (!exists) throw notFound('Recette');
    await this.prisma.favoriteRecipe.upsert({ where: { userId_recipeId: { userId, recipeId } }, create: { userId, recipeId }, update: {} });
    return { recipeId, isFavorite: true };
  }

  async removeFavorite(userId: string, recipeId: string) {
    await this.prisma.favoriteRecipe.deleteMany({ where: { userId, recipeId } });
    return { recipeId, isFavorite: false };
  }
}
