import type {
  Allergen,
  AllergySeverity,
  Diet,
  DietFlag,
  Equipment,
  Goal,
  IngredientCategory,
  MealType,
  RecipeCategory,
} from './domain';
import type { BaseUnit, Unit } from './units';

/** Valeurs nutritionnelles pour 100 g (ou 100 ml) d'ingrédient. */
export interface NutritionPer100 {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
}

export interface IngredientInfo {
  id: string;
  name: string;
  category: IngredientCategory;
  unit: BaseUnit;
  gramsPerPiece?: number | null;
  densityGPerMl?: number | null;
  allergens: Allergen[];
  /** Allergènes présents à l'état de traces possibles (« peut contenir »). */
  mayContain: Allergen[];
  dietFlags: DietFlag[];
  nutrition?: NutritionPer100 | null;
  /** Prix estimé, en centimes, pour `priceQuantity` unités de base (ex. 189 c pour 1000 g). */
  priceCents?: number | null;
  priceQuantity?: number | null;
  /** Taille d'un conditionnement courant, en unité de base (ex. 500 g). */
  packageSize?: number | null;
  /** Produit de placard utilisé en petite quantité (sel, huile, épices…). */
  isPantryStaple?: boolean;
}

export interface RecipeIngredientInfo {
  ingredientId: string;
  quantity: number;
  unit: Unit;
}

export interface RecipeInfo {
  id: string;
  name: string;
  category: RecipeCategory;
  /** 'petit_dejeuner' | 'repas' | 'collation' */
  slotKinds: Array<'petit_dejeuner' | 'repas' | 'collation'>;
  preparationTime: number;
  cookingTime: number;
  servings: number;
  equipment: Equipment[];
  ingredients: RecipeIngredientInfo[];
}

export interface AllergyInfo {
  allergen: Allergen;
  severity?: AllergySeverity | null;
}

/** Contraintes alimentaires d'un utilisateur. */
export interface DietaryConstraints {
  allergies: AllergyInfo[];
  diets: Diet[];
  /** Ingrédients que l'utilisateur ne veut jamais consommer (exclusion stricte). */
  excludedIngredientIds: string[];
  /** Équipements disponibles ; liste vide = non renseigné (aucun filtre). */
  equipment: Equipment[];
  /** Temps total maximal (préparation + cuisson) en minutes ; null = pas de limite. */
  maxTotalTime?: number | null;
}

export interface InventoryEntry {
  ingredientId: string;
  quantity: number;
  unit: Unit;
}

export interface PlannedMealInput {
  recipeId: string;
  servings: number;
}

export interface PlanSlot {
  date: string; // AAAA-MM-JJ
  mealType: MealType;
}

export interface GeneratorInput {
  recipes: RecipeInfo[];
  ingredients: Map<string, IngredientInfo>;
  constraints: DietaryConstraints;
  likedIngredientIds: string[];
  favoriteRecipeIds: string[];
  inventory: InventoryEntry[];
  startDate: string;
  days: number;
  mealsPerDay: number;
  householdSize: number;
  /** Budget hebdomadaire en centimes ; null = pas de contrainte de budget. */
  weeklyBudgetCents: number | null;
  /** Objectif énergétique quotidien par personne (kcal), si estimé. */
  dailyKcalTarget?: number | null;
  goal?: Goal | null;
  seed?: number;
}
