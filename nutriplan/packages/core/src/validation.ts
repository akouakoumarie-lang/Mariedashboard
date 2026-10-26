import { z } from 'zod';
import {
  ACTIVITY_LEVELS,
  ALLERGENS,
  ALLERGY_SEVERITIES,
  DIETS,
  EQUIPMENT,
  GOALS,
  INGREDIENT_CATEGORIES,
  MEAL_TYPES,
  RECIPE_CATEGORIES,
  SEXES,
} from './domain';
import { UNITS } from './units';

/**
 * Schémas de validation partagés : utilisés par les formulaires mobiles
 * (React Hook Form) ET par l'API (validation systématique côté serveur).
 */

const id = z.uuid({ message: 'Identifiant invalide.' });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ.');
const optionalNumber = <T extends z.ZodNumber>(schema: T) => schema.nullable().optional();

export const MIN_AGE = 15;

export const profileSchema = z.object({
  displayName: z.string().trim().max(40, '40 caractères maximum.').nullable().optional(),
  age: z
    .number({ message: 'Indiquez votre âge.' })
    .int('Âge en années entières.')
    .min(MIN_AGE, `NutriPlan est réservé aux personnes de ${MIN_AGE} ans et plus.`)
    .max(110, 'Âge invalide.'),
  sex: z.enum(SEXES).nullable().optional(),
  heightCm: optionalNumber(z.number().min(100, 'Taille minimale : 100 cm.').max(250, 'Taille maximale : 250 cm.')),
  weightKg: optionalNumber(z.number().min(30, 'Poids minimal : 30 kg.').max(300, 'Poids maximal : 300 kg.')),
  activityLevel: z.enum(ACTIVITY_LEVELS, { message: "Choisissez un niveau d'activité." }),
  goal: z.enum(GOALS, { message: 'Choisissez un objectif.' }),
  trainingSessionsPerWeek: optionalNumber(z.number().int().min(0).max(14, '14 séances maximum.')),
  householdSize: z.number().int().min(1, 'Au moins 1 personne.').max(12, '12 personnes maximum.'),
  /** Budget hebdomadaire en centimes ; null = pas de contrainte de budget. Aucun minimum imposé. */
  weeklyBudgetCents: z
    .number()
    .int()
    .positive('Le budget doit être supérieur à 0 €, ou laissez le champ vide.')
    .max(200000, 'Budget maximal : 2 000 €.')
    .nullable(),
  mealsPerDay: z.number().int().min(1, 'Au moins 1 repas.').max(5, '5 repas maximum.'),
  planningDays: z.number().int().min(1, 'Au moins 1 jour.').max(14, '14 jours maximum.'),
  /** Temps maximal de préparation + cuisson, en minutes ; null = pas de limite. */
  cookingTimePreference: optionalNumber(z.number().int().min(5, '5 minutes minimum.').max(240, '240 minutes maximum.')),
  equipment: z.array(z.enum(EQUIPMENT)).max(EQUIPMENT.length),
  diets: z.array(z.enum(DIETS)).max(DIETS.length),
});
export type ProfileInput = z.infer<typeof profileSchema>;

export const preferencesSchema = z
  .object({
    likedIngredientIds: z.array(id).max(200),
    dislikedIngredientIds: z.array(id).max(200),
  })
  .refine((v) => !v.likedIngredientIds.some((i) => v.dislikedIngredientIds.includes(i)), {
    message: 'Un aliment ne peut pas être à la fois aimé et exclu.',
    path: ['dislikedIngredientIds'],
  });
export type PreferencesInput = z.infer<typeof preferencesSchema>;

export const allergiesSchema = z
  .object({
    allergies: z.array(z.object({ allergen: z.enum(ALLERGENS), severity: z.enum(ALLERGY_SEVERITIES).nullable().optional() })).max(14),
  })
  .refine((v) => new Set(v.allergies.map((a) => a.allergen)).size === v.allergies.length, {
    message: 'Chaque allergène ne peut être déclaré qu’une fois.',
    path: ['allergies'],
  });
export type AllergiesInput = z.infer<typeof allergiesSchema>;

export const inventoryItemSchema = z.object({
  ingredientId: id,
  quantity: z.number().positive('La quantité doit être positive.').max(100000),
  unit: z.enum(UNITS),
  expirationDate: isoDate.nullable().optional(),
});
export type InventoryItemInput = z.infer<typeof inventoryItemSchema>;

export const inventoryUpdateSchema = inventoryItemSchema.partial().omit({ ingredientId: true });

/** Questionnaire d'inscription complet (agrégé côté mobile à partir des étapes). */
export const onboardingSchema = z.object({
  profile: profileSchema,
  preferences: preferencesSchema,
  allergies: allergiesSchema,
  inventory: z.array(inventoryItemSchema).max(100),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const generatePlanSchema = z.object({
  startDate: isoDate,
  days: z.number().int().min(1).max(14).optional(),
  seed: z.number().int().min(0).max(2 ** 31 - 1).optional(),
});
export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;

export const updatePlannedMealSchema = z
  .object({
    servings: z.number().int().min(1, 'Au moins 1 portion.').max(20, '20 portions maximum.').optional(),
    date: isoDate.optional(),
    mealType: z.enum(MEAL_TYPES).optional(),
    recipeId: id.optional(),
    completed: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Aucune modification fournie.' });
export type UpdatePlannedMealInput = z.infer<typeof updatePlannedMealSchema>;

export const manualShoppingItemSchema = z.object({
  name: z.string().trim().min(1, 'Nom obligatoire.').max(80, '80 caractères maximum.'),
  quantity: z.number().positive('La quantité doit être positive.').max(100000),
  unit: z.enum(UNITS),
  category: z.enum(INGREDIENT_CATEGORIES),
  estimatedPriceCents: z.number().int().min(0).max(100000).nullable().optional(),
});
export type ManualShoppingItemInput = z.infer<typeof manualShoppingItemSchema>;

export const updateShoppingItemSchema = z
  .object({
    quantity: z.number().positive('La quantité doit être positive.').max(100000).optional(),
    isPurchased: z.boolean().optional(),
    estimatedPriceCents: z.number().int().min(0).max(100000).nullable().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Aucune modification fournie.' });

export const recipeQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  category: z.enum(RECIPE_CATEGORIES).optional(),
  maxTime: z.coerce.number().int().min(1).max(600).optional(),
  maxCostPerServingCents: z.coerce.number().int().min(1).max(10000).optional(),
  diet: z.enum(DIETS).optional(),
  ingredientId: id.optional(),
  favoritesOnly: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  compatibleOnly: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});
export type RecipeQuery = z.infer<typeof recipeQuerySchema>;

export const weightEntrySchema = z.object({
  date: isoDate,
  weightKg: z.number().min(30, 'Poids minimal : 30 kg.').max(300, 'Poids maximal : 300 kg.'),
});

export const personalGoalSchema = z.object({
  title: z.string().trim().min(1, 'Intitulé obligatoire.').max(120),
  done: z.boolean().optional(),
});

export const notificationSettingsSchema = z.object({
  notificationsEnabled: z.boolean(),
});

export const aiRecipeIdeasSchema = z.object({
  mealType: z.enum(MEAL_TYPES).default('diner'),
  note: z.string().trim().max(200).optional(),
});
