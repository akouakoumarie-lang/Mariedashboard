import { Injectable } from '@nestjs/common';
import { addDays, estimateDailyEnergy, MEAL_TYPES } from '@nutriplan/core';
import { fromIsoDate, toIsoDate, todayIso } from '../common/dates';
import { notFound } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /** Données du tableau de bord, recalculées à chaque appel (toujours à jour après une modification). */
  async dashboard(userId: string, today = todayIso()) {
    const [profile, plan, favorites, favoritesCount] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.mealPlan.findFirst({
        where: { userId, archived: false },
        orderBy: { createdAt: 'desc' },
        include: {
          meals: { include: { recipe: { select: { id: true, name: true, imageUrl: true, category: true, preparationTime: true, cookingTime: true } } } },
          shoppingList: { include: { items: { select: { isPurchased: true, estimatedPriceCents: true } } } },
        },
      }),
      this.prisma.favoriteRecipe.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: { recipe: { select: { id: true, name: true, imageUrl: true, category: true } } },
      }),
      this.prisma.favoriteRecipe.count({ where: { userId } }),
    ]);

    const meals = (plan?.meals ?? [])
      .map((m) => ({ id: m.id, date: toIsoDate(m.date), mealType: m.mealType, servings: m.servings, completed: !!m.completedAt, recipe: m.recipe }))
      .sort((a, b) => a.date.localeCompare(b.date) || MEAL_TYPES.indexOf(a.mealType) - MEAL_TYPES.indexOf(b.mealType));
    const items = plan?.shoppingList?.items ?? [];

    return {
      displayName: profile?.displayName ?? null,
      hasProfile: !!profile,
      today,
      plan: plan
        ? {
            id: plan.id,
            startDate: toIsoDate(plan.startDate),
            endDate: toIsoDate(plan.endDate),
            budgetCents: plan.budgetCents,
            estimatedCostCents: items.reduce((s, i) => s + (i.estimatedPriceCents ?? 0), 0),
            mealCount: meals.length,
            recipeCount: new Set(meals.map((m) => m.recipe.id)).size,
            completedCount: meals.filter((m) => m.completed).length,
            feasible: plan.feasible,
          }
        : null,
      todayMeals: meals.filter((m) => m.date === today),
      upcomingMeals: meals.filter((m) => m.date > today).slice(0, 4),
      shopping: plan ? { itemCount: items.length, purchasedCount: items.filter((i) => i.isPurchased).length } : null,
      favorites: favorites.map((f) => f.recipe),
      favoritesCount,
      energyEstimate: profile ? estimateDailyEnergy(profile) : null,
    };
  }

  async progress(userId: string, today = todayIso()) {
    const since = fromIsoDate(addDays(today, -7 * 8 + 1));
    const [meals, plansCount, weights, goals, profile] = await Promise.all([
      this.prisma.plannedMeal.findMany({
        where: { mealPlan: { userId }, date: { gte: since, lte: fromIsoDate(today) } },
        include: { recipe: { select: { category: true, name: true, ingredients: { select: { ingredient: { select: { dietFlags: true } } } } } } },
      }),
      this.prisma.mealPlan.count({ where: { userId } }),
      this.prisma.weightEntry.findMany({ where: { userId }, orderBy: { date: 'asc' }, take: 104 }),
      this.prisma.personalGoal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.userProfile.findUnique({ where: { userId }, select: { goal: true } }),
    ]);

    // 8 dernières semaines : repas réalisés / repas prévus.
    const weeks = Array.from({ length: 8 }, (_, i) => {
      const start = addDays(today, -7 * (7 - i) - 6);
      const end = addDays(start, 6);
      const inWeek = meals.filter((m) => {
        const d = toIsoDate(m.date);
        return d >= start && d <= end;
      });
      return { weekStart: start, planned: inWeek.length, completed: inWeek.filter((m) => m.completedAt).length };
    });
    const completed = meals.filter((m) => m.completedAt);
    const meatFlags = new Set(['viande', 'porc', 'volaille', 'poisson', 'fruits_de_mer', 'gelatine']);
    const vegetarianMeals = completed.filter((m) => !m.recipe.ingredients.some((ri) => ri.ingredient.dietFlags.some((f) => meatFlags.has(f)))).length;
    const byCategory = new Map<string, number>();
    const byRecipe = new Map<string, number>();
    for (const m of completed) {
      byCategory.set(m.recipe.category, (byCategory.get(m.recipe.category) ?? 0) + 1);
      byRecipe.set(m.recipe.name, (byRecipe.get(m.recipe.name) ?? 0) + 1);
    }

    return {
      goal: profile?.goal ?? null,
      plansCount,
      completedMeals: completed.length,
      plannedMeals: meals.length,
      weeks,
      habits: {
        vegetarianMeals,
        homeCookedMeals: completed.length,
        categories: [...byCategory].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
        favoriteRecipes: [...byRecipe].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 5),
      },
      weights: weights.map((w) => ({ id: w.id, date: toIsoDate(w.date), weightKg: w.weightKg })),
      goals: goals.map((g) => ({ id: g.id, title: g.title, done: g.done })),
      // Message bienveillant, jamais culpabilisant.
      message:
        completed.length === 0
          ? 'Chaque petit pas compte : cochez un repas lorsque vous l’avez préparé pour suivre vos habitudes.'
          : `Bravo pour les ${completed.length} repas préparés ! Les journées incomplètes font partie du quotidien.`,
    };
  }

  async addWeight(userId: string, date: string, weightKg: number) {
    const d = fromIsoDate(date);
    await this.prisma.weightEntry.upsert({ where: { userId_date: { userId, date: d } }, create: { userId, date: d, weightKg }, update: { weightKg } });
    return this.weights(userId);
  }

  async weights(userId: string) {
    const rows = await this.prisma.weightEntry.findMany({ where: { userId }, orderBy: { date: 'asc' } });
    return rows.map((w) => ({ id: w.id, date: toIsoDate(w.date), weightKg: w.weightKg }));
  }

  async deleteWeight(userId: string, id: string) {
    const res = await this.prisma.weightEntry.deleteMany({ where: { id, userId } });
    if (res.count === 0) throw notFound('Mesure');
    return this.weights(userId);
  }

  async addGoal(userId: string, title: string) {
    await this.prisma.personalGoal.create({ data: { userId, title } });
    return this.goals(userId);
  }

  async updateGoal(userId: string, id: string, data: { title?: string; done?: boolean }) {
    const res = await this.prisma.personalGoal.updateMany({ where: { id, userId }, data });
    if (res.count === 0) throw notFound('Objectif');
    return this.goals(userId);
  }

  async deleteGoal(userId: string, id: string) {
    const res = await this.prisma.personalGoal.deleteMany({ where: { id, userId } });
    if (res.count === 0) throw notFound('Objectif');
    return this.goals(userId);
  }

  async goals(userId: string) {
    const rows = await this.prisma.personalGoal.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } });
    return rows.map((g) => ({ id: g.id, title: g.title, done: g.done }));
  }
}
