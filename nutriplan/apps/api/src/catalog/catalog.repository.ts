import { Injectable } from '@nestjs/common';
import type { Ingredient, Prisma, Recipe, RecipeIngredient } from '@prisma/client';
import type { IngredientInfo, NutritionPer100, RecipeInfo } from '@nutriplan/core';
import { PrismaService } from '../prisma/prisma.service';

export type RecipeWithIngredients = Recipe & { ingredients: Array<RecipeIngredient & { ingredient: Ingredient }> };

export function toIngredientInfo(i: Ingredient): IngredientInfo {
  return {
    id: i.id,
    name: i.name,
    category: i.category,
    unit: i.unit,
    gramsPerPiece: i.gramsPerPiece,
    densityGPerMl: i.densityGPerMl,
    allergens: i.allergens,
    mayContain: i.mayContain,
    dietFlags: i.dietFlags,
    nutrition: (i.nutritionalValues as NutritionPer100 | null) ?? null,
    priceCents: i.priceEstimateCents,
    priceQuantity: i.priceQuantity,
    packageSize: i.packageSize,
    isPantryStaple: i.isPantryStaple,
  };
}

export function toRecipeInfo(r: Recipe & { ingredients: RecipeIngredient[] }): RecipeInfo {
  return {
    id: r.id,
    name: r.name,
    category: r.category,
    slotKinds: r.slotKinds,
    preparationTime: r.preparationTime,
    cookingTime: r.cookingTime,
    servings: r.servings,
    equipment: r.equipment,
    ingredients: r.ingredients.map((ri) => ({ ingredientId: ri.ingredientId, quantity: ri.quantity, unit: ri.unit })),
  };
}

/** Accès au catalogue (données publiques, communes à tous les utilisateurs). */
@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  async ingredientMap(): Promise<Map<string, IngredientInfo>> {
    const rows = await this.prisma.ingredient.findMany();
    return new Map(rows.map((r) => [r.id, toIngredientInfo(r)]));
  }

  recipesWithIngredients(where: Prisma.RecipeWhereInput = {}): Promise<RecipeWithIngredients[]> {
    return this.prisma.recipe.findMany({ where, include: { ingredients: { include: { ingredient: true } } }, orderBy: { name: 'asc' } });
  }

  async recipeInfos(): Promise<RecipeInfo[]> {
    return (await this.recipesWithIngredients()).map(toRecipeInfo);
  }
}
