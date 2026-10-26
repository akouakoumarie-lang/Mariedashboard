import { describe, expect, it } from 'vitest';
import { allergiesSchema, inventoryItemSchema, preferencesSchema, profileSchema, updatePlannedMealSchema } from '../src';

const validProfile = {
  age: 32,
  activityLevel: 'modere',
  goal: 'equilibre',
  householdSize: 2,
  weeklyBudgetCents: 6000,
  mealsPerDay: 3,
  planningDays: 7,
  equipment: ['plaques', 'four'],
  diets: [],
};

describe('validation des formulaires', () => {
  it('accepte un profil valide avec données sensibles facultatives', () => {
    expect(profileSchema.safeParse(validProfile).success).toBe(true);
    expect(profileSchema.safeParse({ ...validProfile, heightCm: null, weightKg: null, sex: null }).success).toBe(true);
  });
  it('refuse un âge inférieur à 15 ans avec un message clair', () => {
    const r = profileSchema.safeParse({ ...validProfile, age: 12 });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]!.message).toContain('15 ans');
  });
  it('n’impose pas de budget minimum arbitraire mais refuse un budget nul', () => {
    expect(profileSchema.safeParse({ ...validProfile, weeklyBudgetCents: 500 }).success).toBe(true);
    expect(profileSchema.safeParse({ ...validProfile, weeklyBudgetCents: null }).success).toBe(true);
    expect(profileSchema.safeParse({ ...validProfile, weeklyBudgetCents: 0 }).success).toBe(false);
  });
  it('refuse des valeurs hors limites', () => {
    expect(profileSchema.safeParse({ ...validProfile, heightCm: 20 }).success).toBe(false);
    expect(profileSchema.safeParse({ ...validProfile, mealsPerDay: 9 }).success).toBe(false);
    expect(profileSchema.safeParse({ ...validProfile, goal: 'jeune_extreme' }).success).toBe(false);
  });
  it('refuse un aliment à la fois aimé et exclu', () => {
    const id = '0b6b2c1e-6f4e-4a8e-9b1a-2f3c4d5e6f70';
    const r = preferencesSchema.safeParse({ likedIngredientIds: [id], dislikedIngredientIds: [id] });
    expect(r.success).toBe(false);
  });
  it('refuse un allergène déclaré deux fois', () => {
    expect(allergiesSchema.safeParse({ allergies: [{ allergen: 'lait' }, { allergen: 'lait' }] }).success).toBe(false);
    expect(allergiesSchema.safeParse({ allergies: [{ allergen: 'lait', severity: 'severe' }] }).success).toBe(true);
  });
  it('valide le stock et les modifications de repas', () => {
    expect(inventoryItemSchema.safeParse({ ingredientId: 'pas-un-uuid', quantity: 1, unit: 'g' }).success).toBe(false);
    expect(updatePlannedMealSchema.safeParse({}).success).toBe(false);
    expect(updatePlannedMealSchema.safeParse({ servings: 0 }).success).toBe(false);
    expect(updatePlannedMealSchema.safeParse({ servings: 3, date: '2026-11-03' }).success).toBe(true);
  });
});
