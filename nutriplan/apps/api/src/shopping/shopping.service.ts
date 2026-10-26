import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import {
  buildShoppingList,
  convertToBase,
  estimatePurchaseCostCents,
  groupByCategory,
  INGREDIENT_CATEGORY_LABELS,
  sumEstimatedCents,
  type ManualShoppingItemInput,
} from '@nutriplan/core';
import { z } from 'zod';
import { updateShoppingItemSchema } from '@nutriplan/core';
import { notFound } from '../common/errors';
import { CatalogRepository, toRecipeInfo } from '../catalog/catalog.repository';
import { PrismaService } from '../prisma/prisma.service';

type Tx = Prisma.TransactionClient;

export const PRICE_NOTICE =
  'Prix estimés à titre indicatif à partir d’une base de prix modifiable : ce ne sont pas des prix garantis ni relevés en magasin.';

@Injectable()
export class ShoppingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogRepository,
  ) {}

  /**
   * (Re)calcule la liste de courses d'un planning à partir de tous ses repas.
   * Conserve : articles ajoutés manuellement, articles cochés, quantités modifiées par l'utilisateur.
   */
  async rebuild(userId: string, mealPlanId: string, tx: Tx = this.prisma): Promise<void> {
    const plan = await tx.mealPlan.findFirst({
      where: { id: mealPlanId, userId },
      include: { meals: { include: { recipe: { include: { ingredients: true } } } }, shoppingList: { include: { items: true } } },
    });
    if (!plan) throw notFound('Planning');
    const [ingredients, inventory] = await Promise.all([
      this.catalog.ingredientMap(),
      tx.foodInventory.findMany({ where: { userId } }),
    ]);
    const result = buildShoppingList(
      plan.meals.map((m) => ({ recipe: toRecipeInfo(m.recipe), servings: m.servings })),
      ingredients,
      inventory.map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity, unit: i.unit })),
    );

    const list =
      plan.shoppingList ?? (await tx.shoppingList.create({ data: { userId, mealPlanId }, include: { items: true } }));
    const previous = new Map(list.items.filter((i) => !i.isManual && i.ingredientId).map((i) => [`${i.ingredientId}|${i.unit}`, i]));

    await tx.shoppingListItem.deleteMany({ where: { shoppingListId: list.id, isManual: false } });
    await tx.shoppingListItem.createMany({
      data: result.items.map((line) => {
        const prev = previous.get(`${line.ingredientId}|${line.unit}`);
        const info = ingredients.get(line.ingredientId)!;
        const quantity = prev?.userEdited ? prev.quantity : line.quantity;
        return {
          shoppingListId: list.id,
          ingredientId: line.ingredientId,
          category: line.category,
          quantity,
          unit: line.unit,
          estimatedPriceCents: prev?.userEdited && line.converted ? estimatePurchaseCostCents(info, quantity) : line.estimatedPriceCents,
          isPurchased: prev?.isPurchased ?? false,
          userEdited: prev?.userEdited ?? false,
          isPantryStaple: line.isPantryStaple,
        };
      }),
    });
    await tx.shoppingList.update({ where: { id: list.id }, data: { updatedAt: new Date() } });
  }

  async get(userId: string, mealPlanId: string) {
    const list = await this.prisma.shoppingList.findFirst({
      where: { mealPlanId, userId },
      include: {
        mealPlan: { select: { budgetCents: true } },
        items: { include: { ingredient: { select: { name: true, priceUpdatedAt: true } } } },
      },
    });
    if (!list) throw notFound('Liste de courses');

    const items = list.items
      .map((i) => ({
        id: i.id,
        ingredientId: i.ingredientId,
        name: i.ingredient?.name ?? i.customName ?? 'Article',
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
    const dates = list.items.map((i) => i.ingredient?.priceUpdatedAt).filter((d): d is Date => !!d);
    const budgetCents = list.mealPlan.budgetCents;
    return {
      id: list.id,
      mealPlanId,
      updatedAt: list.updatedAt.toISOString(),
      budgetCents,
      totalCents,
      purchasedCents,
      remainingCents: totalCents - purchasedCents,
      overBudget: budgetCents != null && totalCents > budgetCents,
      itemsWithoutPrice: items.filter((i) => i.estimatedPriceCents === null).length,
      itemCount: items.length,
      purchasedCount: items.filter((i) => i.isPurchased).length,
      priceNotice: PRICE_NOTICE,
      pricesUpdatedAt: dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))).toISOString().slice(0, 10) : null,
      groups: groupByCategory(items).map((g) => ({ category: g.category, label: INGREDIENT_CATEGORY_LABELS[g.category], items: g.items })),
    };
  }

  async recalculate(userId: string, mealPlanId: string) {
    await this.prisma.$transaction((tx) => this.rebuild(userId, mealPlanId, tx));
    return this.get(userId, mealPlanId);
  }

  async addManualItem(userId: string, mealPlanId: string, input: ManualShoppingItemInput) {
    const list = await this.prisma.shoppingList.findFirst({ where: { mealPlanId, userId }, select: { id: true } });
    if (!list) throw notFound('Liste de courses');
    await this.prisma.shoppingListItem.create({
      data: {
        shoppingListId: list.id,
        customName: input.name,
        category: input.category,
        quantity: input.quantity,
        unit: input.unit,
        estimatedPriceCents: input.estimatedPriceCents ?? null,
        isManual: true,
      },
    });
    return this.get(userId, mealPlanId);
  }

  async updateItem(userId: string, mealPlanId: string, itemId: string, input: z.infer<typeof updateShoppingItemSchema>) {
    const item = await this.prisma.shoppingListItem.findFirst({
      where: { id: itemId, shoppingList: { mealPlanId, userId } },
      include: { ingredient: true },
    });
    if (!item) throw notFound('Article');
    let estimatedPriceCents = input.estimatedPriceCents === undefined ? item.estimatedPriceCents : input.estimatedPriceCents;
    if (input.quantity !== undefined && input.estimatedPriceCents === undefined && item.ingredient) {
      // Recalcul automatique du coût estimé lorsque la quantité change.
      const info = { unit: item.ingredient.unit, gramsPerPiece: item.ingredient.gramsPerPiece, densityGPerMl: item.ingredient.densityGPerMl };
      const base = convertToBase(input.quantity, item.unit, info);
      estimatedPriceCents =
        base === null
          ? null
          : estimatePurchaseCostCents(
              {
                ...info,
                id: item.ingredient.id,
                name: item.ingredient.name,
                category: item.ingredient.category,
                allergens: [],
                mayContain: [],
                dietFlags: [],
                priceCents: item.ingredient.priceEstimateCents,
                priceQuantity: item.ingredient.priceQuantity,
                packageSize: item.ingredient.packageSize,
                isPantryStaple: item.ingredient.isPantryStaple,
              },
              base,
            );
    }
    await this.prisma.shoppingListItem.update({
      where: { id: item.id },
      data: {
        quantity: input.quantity,
        isPurchased: input.isPurchased,
        estimatedPriceCents,
        userEdited: input.quantity !== undefined ? true : undefined,
      },
    });
    return this.get(userId, mealPlanId);
  }

  async deleteItem(userId: string, mealPlanId: string, itemId: string) {
    const res = await this.prisma.shoppingListItem.deleteMany({ where: { id: itemId, shoppingList: { mealPlanId, userId } } });
    if (res.count === 0) throw notFound('Article');
    return this.get(userId, mealPlanId);
  }
}
