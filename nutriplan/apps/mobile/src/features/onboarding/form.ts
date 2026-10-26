import AsyncStorage from '@react-native-async-storage/async-storage';
import { onboardingSchema } from '@nutriplan/core';
import { z } from 'zod';

/**
 * Formulaire du questionnaire. Les ingrédients sont référencés par identifiant ;
 * `catalog` conserve leur nom et leur unité pour l'affichage (non envoyé à l'API).
 */
export const onboardingFormSchema = onboardingSchema.extend({
  catalog: z.record(z.string(), z.object({ name: z.string(), unit: z.string() })),
});

export type OnboardingInput = z.input<typeof onboardingFormSchema>;
export type OnboardingOutput = z.output<typeof onboardingFormSchema>;

export const DEFAULT_VALUES = {
  profile: {
    displayName: null,
    age: undefined,
    sex: null,
    heightCm: null,
    weightKg: null,
    activityLevel: undefined,
    goal: undefined,
    trainingSessionsPerWeek: null,
    householdSize: 1,
    weeklyBudgetCents: null,
    mealsPerDay: 3,
    planningDays: 7,
    cookingTimePreference: 45,
    equipment: ['plaques', 'four', 'micro_ondes'],
    diets: [],
  },
  preferences: { likedIngredientIds: [], dislikedIngredientIds: [] },
  allergies: { allergies: [] },
  inventory: [],
  catalog: {},
} as unknown as OnboardingInput;

/** Brouillon conservé sur l'appareil : les réponses survivent à un retour arrière ou à la fermeture de l'app. */
const DRAFT_KEY = 'nutriplan.onboarding.v1';

export interface Draft {
  values: OnboardingInput;
  step: number;
}

export async function loadDraft(): Promise<Draft | null> {
  try {
    const raw = await AsyncStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : null;
  } catch {
    return null;
  }
}

export async function saveDraft(draft: Draft): Promise<void> {
  try {
    await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Stockage indisponible : le questionnaire reste utilisable, seule la reprise est perdue.
  }
}

export async function clearDraft(): Promise<void> {
  try {
    await AsyncStorage.removeItem(DRAFT_KEY);
  } catch {
    /* rien */
  }
}
