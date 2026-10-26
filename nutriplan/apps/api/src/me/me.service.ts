import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  estimateDailyEnergy,
  type AllergiesInput,
  type InventoryItemInput,
  type PreferencesInput,
  type ProfileInput,
} from '@nutriplan/core';
import { z } from 'zod';
import { inventoryUpdateSchema } from '@nutriplan/core';
import { APP_CONFIG, type AppConfig } from '../config';
import { fromIsoDate, toIsoDate } from '../common/dates';
import { AppError, notFound } from '../common/errors';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MeService {
  private readonly logger = new Logger('Compte');

  constructor(
    private readonly prisma: PrismaService,
    @Inject(APP_CONFIG) private readonly config: AppConfig,
  ) {}

  async getProfile(userId: string) {
    const profile = await this.prisma.userProfile.findUnique({ where: { userId } });
    return { profile, energyEstimate: profile ? estimateDailyEnergy(profile) : null };
  }

  async upsertProfile(userId: string, input: ProfileInput) {
    const data = {
      displayName: input.displayName ?? null,
      age: input.age,
      sex: input.sex ?? null,
      heightCm: input.heightCm ?? null,
      weightKg: input.weightKg ?? null,
      activityLevel: input.activityLevel,
      goal: input.goal,
      trainingSessionsPerWeek: input.trainingSessionsPerWeek ?? null,
      householdSize: input.householdSize,
      weeklyBudgetCents: input.weeklyBudgetCents,
      mealsPerDay: input.mealsPerDay,
      planningDays: input.planningDays,
      cookingTimePreference: input.cookingTimePreference ?? null,
      equipment: input.equipment,
      diets: input.diets,
    };
    await this.prisma.userProfile.upsert({ where: { userId }, create: { userId, ...data }, update: data });
    return this.getProfile(userId);
  }

  async setNotifications(userId: string, enabled: boolean) {
    const res = await this.prisma.userProfile.updateMany({ where: { userId }, data: { notificationsEnabled: enabled } });
    if (res.count === 0) throw new AppError(409, 'PROFILE_REQUIRED', "Complétez d'abord votre profil.");
    return { notificationsEnabled: enabled };
  }

  async getPreferences(userId: string) {
    const prefs = await this.prisma.dietaryPreference.findMany({
      where: { userId },
      include: { ingredient: { select: { id: true, name: true, category: true } } },
    });
    return {
      liked: prefs.filter((p) => p.preferenceType === 'LIKE').map((p) => p.ingredient),
      disliked: prefs.filter((p) => p.preferenceType === 'DISLIKE').map((p) => p.ingredient),
    };
  }

  async setPreferences(userId: string, input: PreferencesInput) {
    await this.assertIngredientsExist([...input.likedIngredientIds, ...input.dislikedIngredientIds]);
    await this.prisma.$transaction([
      this.prisma.dietaryPreference.deleteMany({ where: { userId } }),
      this.prisma.dietaryPreference.createMany({
        data: [
          ...[...new Set(input.likedIngredientIds)].map((value) => ({ userId, value, preferenceType: 'LIKE' as const })),
          ...[...new Set(input.dislikedIngredientIds)].map((value) => ({ userId, value, preferenceType: 'DISLIKE' as const })),
        ],
      }),
    ]);
    return this.getPreferences(userId);
  }

  getAllergies(userId: string) {
    return this.prisma.allergy.findMany({ where: { userId }, select: { allergen: true, severity: true }, orderBy: { allergen: 'asc' } });
  }

  async setAllergies(userId: string, input: AllergiesInput) {
    await this.prisma.$transaction([
      this.prisma.allergy.deleteMany({ where: { userId } }),
      this.prisma.allergy.createMany({ data: input.allergies.map((a) => ({ userId, allergen: a.allergen, severity: a.severity ?? null })) }),
    ]);
    return this.getAllergies(userId);
  }

  async getInventory(userId: string) {
    const rows = await this.prisma.foodInventory.findMany({
      where: { userId },
      include: { ingredient: { select: { name: true, category: true, unit: true } } },
      orderBy: { ingredient: { name: 'asc' } },
    });
    return rows.map((r) => ({
      id: r.id,
      ingredientId: r.ingredientId,
      name: r.ingredient.name,
      category: r.ingredient.category,
      quantity: r.quantity,
      unit: r.unit,
      expirationDate: r.expirationDate ? toIsoDate(r.expirationDate) : null,
    }));
  }

  async upsertInventoryItem(userId: string, input: InventoryItemInput) {
    await this.assertIngredientsExist([input.ingredientId]);
    const data = { quantity: input.quantity, unit: input.unit, expirationDate: input.expirationDate ? fromIsoDate(input.expirationDate) : null };
    await this.prisma.foodInventory.upsert({
      where: { userId_ingredientId: { userId, ingredientId: input.ingredientId } },
      create: { userId, ingredientId: input.ingredientId, ...data },
      update: data,
    });
    return this.getInventory(userId);
  }

  async updateInventoryItem(userId: string, id: string, input: z.infer<typeof inventoryUpdateSchema>) {
    const res = await this.prisma.foodInventory.updateMany({
      where: { id, userId },
      data: {
        quantity: input.quantity,
        unit: input.unit,
        expirationDate: input.expirationDate === undefined ? undefined : input.expirationDate ? fromIsoDate(input.expirationDate) : null,
      },
    });
    if (res.count === 0) throw notFound('Article du stock');
    return this.getInventory(userId);
  }

  async deleteInventoryItem(userId: string, id: string) {
    const res = await this.prisma.foodInventory.deleteMany({ where: { id, userId } });
    if (res.count === 0) throw notFound('Article du stock');
    return this.getInventory(userId);
  }

  /** Export RGPD (droit à la portabilité) : toutes les données personnelles, au format JSON. */
  async exportData(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        profile: true,
        preferences: { include: { ingredient: { select: { name: true } } } },
        allergies: true,
        inventory: { include: { ingredient: { select: { name: true } } } },
        favorites: { include: { recipe: { select: { name: true } } } },
        mealPlans: { include: { meals: { include: { recipe: { select: { name: true } } } }, shoppingList: { include: { items: true } } } },
        weightEntries: true,
        personalGoals: true,
      },
    });
    return { exportedAt: new Date().toISOString(), format: 'NutriPlan export v1', data: user };
  }

  /**
   * Suppression du compte : toutes les données de l'application sont supprimées (cascade).
   * Le compte d'authentification Supabase est supprimé si la clé de service est configurée côté serveur.
   */
  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    let authAccountDeleted = false;
    if (this.config.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const res = await fetch(`${this.config.SUPABASE_URL.replace(/\/$/, '')}/auth/v1/admin/users/${userId}`, {
          method: 'DELETE',
          headers: { apikey: this.config.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${this.config.SUPABASE_SERVICE_ROLE_KEY}` },
        });
        authAccountDeleted = res.ok;
        if (!res.ok) this.logger.warn(`Suppression du compte d'authentification refusée (HTTP ${res.status}).`);
      } catch {
        this.logger.warn("Service d'authentification injoignable lors de la suppression du compte.");
      }
    }
    return {
      dataDeleted: true,
      authAccountDeleted,
      message: authAccountDeleted
        ? 'Votre compte et toutes vos données ont été supprimés.'
        : "Toutes vos données NutriPlan ont été supprimées. La suppression de l'identifiant de connexion sera finalisée par notre équipe sous 30 jours.",
    };
  }

  private async assertIngredientsExist(ids: string[]) {
    const unique = [...new Set(ids)];
    if (unique.length === 0) return;
    const count = await this.prisma.ingredient.count({ where: { id: { in: unique } } });
    if (count !== unique.length) throw new AppError(400, 'UNKNOWN_INGREDIENT', 'Un ou plusieurs aliments sont introuvables.');
  }
}
