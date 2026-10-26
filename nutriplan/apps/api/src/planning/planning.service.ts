import { Injectable } from '@nestjs/common';
import {
  addDays,
  checkRecipe,
  generateMealPlan,
  isSafetyReason,
  MEAL_TYPES,
  recipeCost,
  recipeNutritionPerServing,
  suggestAlternatives,
  type GeneratePlanInput,
  type IngredientInfo,
  type UpdatePlannedMealInput,
} from '@nutriplan/core';
import { fromIsoDate, toIsoDate } from '../common/dates';
import { AppError, notFound } from '../common/errors';
import { CatalogRepository, toRecipeInfo } from '../catalog/catalog.repository';
import { UserContextService, type UserContext } from '../me/user-context.service';
import { PrismaService } from '../prisma/prisma.service';
import { ShoppingService } from '../shopping/shopping.service';

const profileRequired = () => new AppError(409, 'PROFILE_REQUIRED', "Complétez d'abord votre profil pour générer un programme.");

@Injectable()
export class PlanningService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly catalog: CatalogRepository,
    private readonly userContext: UserContextService,
    private readonly shopping: ShoppingService,
  ) {}

  async generate(userId: string, input: GeneratePlanInput) {
    const ctx = await this.userContext.load(userId);
    if (!ctx.profile) throw profileRequired();
    const [recipes, ingredients] = await Promise.all([this.catalog.recipeInfos(), this.catalog.ingredientMap()]);
    const days = input.days ?? ctx.profile.planningDays;
    const seed = input.seed ?? Math.floor(Math.random() * 2 ** 31);

    const result = generateMealPlan({
      recipes,
      ingredients,
      constraints: ctx.constraints,
      likedIngredientIds: ctx.likedIngredientIds,
      favoriteRecipeIds: ctx.favoriteRecipeIds,
      inventory: ctx.inventory,
      startDate: input.startDate,
      days,
      mealsPerDay: ctx.profile.mealsPerDay,
      householdSize: ctx.profile.householdSize,
      weeklyBudgetCents: ctx.profile.weeklyBudgetCents,
      dailyKcalTarget: ctx.dailyKcalTarget,
      goal: ctx.profile.goal,
      seed,
    });

    if (result.meals.length === 0) {
      // Solution de repli : message compréhensible et ajustements proposés, aucun plan vide enregistré.
      throw new AppError(422, 'PLAN_GENERATION_FAILED', result.issues[0]?.message ?? 'Impossible de générer un programme.', {
        issues: result.issues,
        suggestions: result.suggestions,
      });
    }

    const planId = await this.prisma.$transaction(async (tx) => {
      await tx.mealPlan.updateMany({ where: { userId, archived: false }, data: { archived: true } });
      const plan = await tx.mealPlan.create({
        data: {
          userId,
          startDate: fromIsoDate(input.startDate),
          endDate: fromIsoDate(addDays(input.startDate, days - 1)),
          budgetCents: result.budgetCents,
          feasible: result.feasible,
          generationReport: { issues: result.issues, suggestions: result.suggestions } as object,
          seed,
          meals: {
            create: result.meals.map((m) => ({ recipeId: m.recipeId, date: fromIsoDate(m.date), mealType: m.mealType, servings: m.servings })),
          },
        },
      });
      await this.shopping.rebuild(userId, plan.id, tx);
      return plan.id;
    });
    return this.get(userId, planId);
  }

  async current(userId: string) {
    const plan = await this.prisma.mealPlan.findFirst({ where: { userId, archived: false }, orderBy: { createdAt: 'desc' }, select: { id: true } });
    return plan ? this.get(userId, plan.id) : null;
  }

  async history(userId: string) {
    const plans = await this.prisma.mealPlan.findMany({
      where: { userId },
      orderBy: { startDate: 'desc' },
      include: { meals: { select: { completedAt: true } } },
      take: 52,
    });
    return plans.map((p) => ({
      id: p.id,
      startDate: toIsoDate(p.startDate),
      endDate: toIsoDate(p.endDate),
      archived: p.archived,
      feasible: p.feasible,
      mealCount: p.meals.length,
      completedCount: p.meals.filter((m) => m.completedAt).length,
    }));
  }

  async get(userId: string, planId: string) {
    const plan = await this.prisma.mealPlan.findFirst({
      where: { id: planId, userId },
      include: {
        meals: { include: { recipe: { include: { ingredients: true } } }, orderBy: [{ date: 'asc' }] },
        shoppingList: { include: { items: { select: { estimatedPriceCents: true } } } },
      },
    });
    if (!plan) throw notFound('Planning');
    const [ctx, ingredients] = await Promise.all([this.userContext.load(userId), this.catalog.ingredientMap()]);
    const favorites = new Set(ctx.favoriteRecipeIds);

    const meals = plan.meals
      .sort((a, b) => a.date.getTime() - b.date.getTime() || MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType))
      .map((m) => {
        const info = toRecipeInfo(m.recipe);
        const check = checkRecipe(info, ctx.constraints, ingredients, { ignoreTime: true });
        const safetyConflicts = check.reasons.filter(isSafetyReason).map((r) => r.message);
        return {
          id: m.id,
          date: toIsoDate(m.date),
          mealType: m.mealType,
          servings: m.servings,
          completed: !!m.completedAt,
          recipe: {
            id: m.recipe.id,
            name: m.recipe.name,
            category: m.recipe.category,
            imageUrl: m.recipe.imageUrl,
            preparationTime: m.recipe.preparationTime,
            cookingTime: m.recipe.cookingTime,
            isFavorite: favorites.has(m.recipe.id),
          },
          costCents: recipeCost(info, m.servings, ingredients).totalCents,
          nutritionPerServing: { ...recipeNutritionPerServing(info, ingredients), isEstimate: true },
          // Si les contraintes ont changé depuis la génération, on le signale clairement.
          conflicts: safetyConflicts,
        };
      });

    const days: Array<{ date: string; meals: typeof meals }> = [];
    for (let d = toIsoDate(plan.startDate); d <= toIsoDate(plan.endDate); d = addDays(d, 1)) {
      days.push({ date: d, meals: meals.filter((m) => m.date === d) });
    }
    const report = (plan.generationReport ?? { issues: [], suggestions: [] }) as { issues: unknown[]; suggestions: string[] };
    const estimatedCostCents = plan.shoppingList?.items.reduce((s, i) => s + (i.estimatedPriceCents ?? 0), 0) ?? 0;
    return {
      id: plan.id,
      startDate: toIsoDate(plan.startDate),
      endDate: toIsoDate(plan.endDate),
      createdAt: plan.createdAt.toISOString(),
      archived: plan.archived,
      budgetCents: plan.budgetCents,
      estimatedCostCents,
      feasible: plan.feasible && (plan.budgetCents == null || estimatedCostCents <= plan.budgetCents),
      issues: report.issues,
      suggestions: report.suggestions,
      mealCount: meals.length,
      completedCount: meals.filter((m) => m.completed).length,
      hasConflicts: meals.some((m) => m.conflicts.length > 0),
      days,
    };
  }

  async updateMeal(userId: string, planId: string, mealId: string, input: UpdatePlannedMealInput) {
    const meal = await this.prisma.plannedMeal.findFirst({ where: { id: mealId, mealPlanId: planId, mealPlan: { userId } }, include: { mealPlan: true } });
    if (!meal) throw notFound('Repas');

    if (input.date) {
      const date = fromIsoDate(input.date);
      if (date < meal.mealPlan.startDate || date > meal.mealPlan.endDate) {
        throw new AppError(400, 'DATE_OUT_OF_PLAN', 'La date doit être comprise dans la période du planning.');
      }
    }
    if (input.recipeId && input.recipeId !== meal.recipeId) await this.assertRecipeSafe(userId, input.recipeId);

    await this.prisma.$transaction(async (tx) => {
      await tx.plannedMeal.update({
        where: { id: meal.id },
        data: {
          servings: input.servings,
          date: input.date ? fromIsoDate(input.date) : undefined,
          mealType: input.mealType,
          recipeId: input.recipeId,
          completedAt: input.completed === undefined ? undefined : input.completed ? new Date() : null,
        },
      });
      // Les changements de recette ou de portions modifient les courses et le budget.
      if (input.servings !== undefined || input.recipeId !== undefined) await this.shopping.rebuild(userId, planId, tx);
    });
    return this.get(userId, planId);
  }

  async alternatives(userId: string, planId: string, mealId: string) {
    const meal = await this.prisma.plannedMeal.findFirst({ where: { id: mealId, mealPlanId: planId, mealPlan: { userId } } });
    if (!meal) throw notFound('Repas');
    const [ctx, recipes, ingredients, planMeals] = await Promise.all([
      this.userContext.load(userId),
      this.catalog.recipeInfos(),
      this.catalog.ingredientMap(),
      this.prisma.plannedMeal.findMany({ where: { mealPlanId: planId }, select: { recipeId: true } }),
    ]);
    const alts = suggestAlternatives(
      { recipes, ingredients, constraints: ctx.constraints, likedIngredientIds: ctx.likedIngredientIds, favoriteRecipeIds: ctx.favoriteRecipeIds },
      meal.mealType,
      [meal.recipeId, ...planMeals.map((m) => m.recipeId)],
      6,
    );
    // Si toutes les recettes sont déjà dans le planning, on autorise les doublons (sauf la recette actuelle).
    const list = alts.length > 0 ? alts : suggestAlternatives({ recipes, ingredients, constraints: ctx.constraints, likedIngredientIds: ctx.likedIngredientIds, favoriteRecipeIds: ctx.favoriteRecipeIds }, meal.mealType, [meal.recipeId], 6);
    return list.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      totalTime: r.preparationTime + r.cookingTime,
      costCents: recipeCost(r, meal.servings, ingredients).totalCents,
    }));
  }

  async replace(userId: string, planId: string, mealId: string) {
    const alts = await this.alternatives(userId, planId, mealId);
    if (alts.length === 0) {
      throw new AppError(422, 'NO_ALTERNATIVE', 'Aucune autre recette ne respecte vos contraintes pour ce repas.');
    }
    return this.updateMeal(userId, planId, mealId, { recipeId: alts[0]!.id });
  }

  /** Un remplacement choisi par l'utilisateur ne peut jamais enfreindre une allergie, un régime ou une exclusion. */
  private async assertRecipeSafe(userId: string, recipeId: string) {
    const [ctx, ingredients, rows] = await Promise.all([this.userContext.load(userId), this.catalog.ingredientMap(), this.catalog.recipesWithIngredients({ id: recipeId })]);
    if (!rows[0]) throw notFound('Recette');
    assertSafe(rows[0], ctx, ingredients);
  }
}

function assertSafe(recipe: Parameters<typeof toRecipeInfo>[0], ctx: UserContext, ingredients: Map<string, IngredientInfo>) {
  const check = checkRecipe(toRecipeInfo(recipe), ctx.constraints, ingredients, { ignoreTime: true });
  const blocking = check.reasons.filter(isSafetyReason);
  if (blocking.length > 0) {
    throw new AppError(422, 'RECIPE_NOT_ALLOWED', 'Cette recette ne respecte pas vos allergies, régime ou exclusions.', {
      reasons: blocking.map((r) => r.message),
    });
  }
}
