import type { ProfileInput } from '@nutriplan/core';
import type { Profile } from '../../lib/types';

/** Profil renvoyé par l'API → valeurs du formulaire (sans les champs techniques). */
export function toProfileInput(p: Profile): ProfileInput {
  return {
    displayName: p.displayName,
    age: p.age,
    sex: p.sex,
    heightCm: p.heightCm,
    weightKg: p.weightKg,
    activityLevel: p.activityLevel,
    goal: p.goal,
    trainingSessionsPerWeek: p.trainingSessionsPerWeek,
    householdSize: p.householdSize,
    weeklyBudgetCents: p.weeklyBudgetCents,
    mealsPerDay: p.mealsPerDay,
    planningDays: p.planningDays,
    cookingTimePreference: p.cookingTimePreference,
    equipment: p.equipment,
    diets: p.diets,
  };
}
