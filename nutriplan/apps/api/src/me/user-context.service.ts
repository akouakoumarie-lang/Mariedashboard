import { Injectable } from '@nestjs/common';
import type { UserProfile } from '@prisma/client';
import { estimateDailyEnergy, type DietaryConstraints, type InventoryEntry } from '@nutriplan/core';
import { PrismaService } from '../prisma/prisma.service';

export interface UserContext {
  profile: UserProfile | null;
  constraints: DietaryConstraints;
  likedIngredientIds: string[];
  favoriteRecipeIds: string[];
  inventory: InventoryEntry[];
  dailyKcalTarget: number | null;
}

/** Rassemble en une fois les préférences et contraintes d'un utilisateur. */
@Injectable()
export class UserContextService {
  constructor(private readonly prisma: PrismaService) {}

  async load(userId: string): Promise<UserContext> {
    const [profile, prefs, allergies, favorites, inventory] = await Promise.all([
      this.prisma.userProfile.findUnique({ where: { userId } }),
      this.prisma.dietaryPreference.findMany({ where: { userId } }),
      this.prisma.allergy.findMany({ where: { userId } }),
      this.prisma.favoriteRecipe.findMany({ where: { userId }, select: { recipeId: true } }),
      this.prisma.foodInventory.findMany({ where: { userId } }),
    ]);
    const energy = profile ? estimateDailyEnergy(profile) : null;
    return {
      profile,
      constraints: {
        allergies: allergies.map((a) => ({ allergen: a.allergen, severity: a.severity })),
        diets: profile?.diets ?? [],
        excludedIngredientIds: prefs.filter((p) => p.preferenceType === 'DISLIKE').map((p) => p.value),
        equipment: profile?.equipment ?? [],
        maxTotalTime: profile?.cookingTimePreference ?? null,
      },
      likedIngredientIds: prefs.filter((p) => p.preferenceType === 'LIKE').map((p) => p.value),
      favoriteRecipeIds: favorites.map((f) => f.recipeId),
      inventory: inventory.map((i) => ({ ingredientId: i.ingredientId, quantity: i.quantity, unit: i.unit })),
      dailyKcalTarget: energy?.targetKcal ?? null,
    };
  }
}
