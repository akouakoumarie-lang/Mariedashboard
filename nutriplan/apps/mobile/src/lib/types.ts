import type {
  ActivityLevel,
  Allergen,
  AllergySeverity,
  Diet,
  Equipment,
  Goal,
  IngredientCategory,
  MealType,
  RecipeCategory,
  Sex,
} from '@nutriplan/core';

/** Formes des réponses de l'API NutriPlan (voir apps/api). */

export interface Profile {
  displayName: string | null;
  age: number;
  sex: Sex | null;
  heightCm: number | null;
  weightKg: number | null;
  activityLevel: ActivityLevel;
  goal: Goal;
  trainingSessionsPerWeek: number | null;
  householdSize: number;
  weeklyBudgetCents: number | null;
  mealsPerDay: number;
  planningDays: number;
  cookingTimePreference: number | null;
  equipment: Equipment[];
  diets: Diet[];
  notificationsEnabled: boolean;
}

export interface EnergyEstimate {
  targetKcal: number;
  rangeKcal: [number, number];
  maintenanceKcal: number;
  notes: string[];
  disclaimer: string;
}

export interface IngredientRef {
  id: string;
  name: string;
  category: IngredientCategory;
}

export interface Ingredient extends IngredientRef {
  unit: 'g' | 'ml' | 'piece';
  allergens: Allergen[];
  mayContain: Allergen[];
}

export interface InventoryItem {
  id: string;
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  quantity: number;
  unit: string;
  expirationDate: string | null;
}

export interface AllergyItem {
  allergen: Allergen;
  severity: AllergySeverity | null;
}

export interface NutritionEstimate {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  complete: boolean;
  isEstimate: true;
}

export interface RecipeSummary {
  id: string;
  name: string;
  category: RecipeCategory;
  imageUrl: string | null;
  preparationTime: number;
  cookingTime: number;
  totalTime: number;
  tags: string[];
  equipment: Equipment[];
  isDemo: boolean;
  isFavorite: boolean;
  costPerServingCents: number | null;
  nutritionPerServing: NutritionEstimate;
  allergens: Allergen[];
  compatibility: { allowed: boolean; reasons: string[]; warnings: string[] };
}

export interface RecipeDetail extends RecipeSummary {
  description: string;
  instructions: string[];
  servings: number;
  baseServings: number;
  ingredients: Array<{ ingredientId: string; name: string; quantity: number; unit: string; allergens: Allergen[]; mayContain: Allergen[] }>;
  cost: { totalCents: number; perServingCents: number; complete: boolean; isEstimate: true; priceUpdatedAt: string | null };
  nutritionDisclaimer: string;
}

export interface PlannedMeal {
  id: string;
  date: string;
  mealType: MealType;
  servings: number;
  completed: boolean;
  recipe: { id: string; name: string; category: RecipeCategory; imageUrl: string | null; preparationTime: number; cookingTime: number; isFavorite: boolean };
  costCents: number;
  nutritionPerServing: NutritionEstimate;
  conflicts: string[];
}

export interface PlanIssue {
  code: string;
  message: string;
}

export interface MealPlan {
  id: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  archived: boolean;
  budgetCents: number | null;
  estimatedCostCents: number;
  feasible: boolean;
  issues: PlanIssue[];
  suggestions: string[];
  mealCount: number;
  completedCount: number;
  hasConflicts: boolean;
  days: Array<{ date: string; meals: PlannedMeal[] }>;
}

export interface PlanHistoryItem {
  id: string;
  startDate: string;
  endDate: string;
  archived: boolean;
  feasible: boolean;
  mealCount: number;
  completedCount: number;
}

export interface Alternative {
  id: string;
  name: string;
  category: RecipeCategory;
  totalTime: number;
  costCents: number;
}

export interface ShoppingItem {
  id: string;
  ingredientId: string | null;
  name: string;
  category: IngredientCategory;
  quantity: number;
  unit: string;
  estimatedPriceCents: number | null;
  isPurchased: boolean;
  isManual: boolean;
  isPantryStaple: boolean;
}

export interface ShoppingList {
  id: string;
  mealPlanId: string;
  updatedAt: string;
  budgetCents: number | null;
  totalCents: number;
  purchasedCents: number;
  remainingCents: number;
  overBudget: boolean;
  itemsWithoutPrice: number;
  itemCount: number;
  purchasedCount: number;
  priceNotice: string;
  pricesUpdatedAt: string | null;
  groups: Array<{ category: IngredientCategory; label: string; items: ShoppingItem[] }>;
}

export interface DashboardMeal {
  id: string;
  date: string;
  mealType: MealType;
  servings: number;
  completed: boolean;
  recipe: { id: string; name: string; imageUrl: string | null; category: RecipeCategory; preparationTime: number; cookingTime: number };
}

export interface Dashboard {
  displayName: string | null;
  hasProfile: boolean;
  today: string;
  plan: null | {
    id: string;
    startDate: string;
    endDate: string;
    budgetCents: number | null;
    estimatedCostCents: number;
    mealCount: number;
    recipeCount: number;
    completedCount: number;
    feasible: boolean;
  };
  todayMeals: DashboardMeal[];
  upcomingMeals: DashboardMeal[];
  shopping: null | { itemCount: number; purchasedCount: number };
  favorites: Array<{ id: string; name: string; imageUrl: string | null; category: RecipeCategory }>;
  favoritesCount: number;
  energyEstimate: EnergyEstimate | null;
}

export interface Progress {
  goal: Goal | null;
  plansCount: number;
  completedMeals: number;
  plannedMeals: number;
  weeks: Array<{ weekStart: string; planned: number; completed: number }>;
  habits: {
    vegetarianMeals: number;
    homeCookedMeals: number;
    categories: Array<{ category: RecipeCategory; count: number }>;
    favoriteRecipes: Array<{ name: string; count: number }>;
  };
  weights: Array<{ id: string; date: string; weightKg: number }>;
  goals: Array<{ id: string; title: string; done: boolean }>;
  message: string;
}

export interface RecipeIdea {
  name: string;
  description: string;
  servings: number;
  totalTime: number;
  ingredients: Array<{ ingredientId: string; name: string; quantity: number; unit: string }>;
  steps: string[];
  recipeId: string | null;
  estimatedCostCents: number | null;
  kcalPerServing: number | null;
  warnings: string[];
}
