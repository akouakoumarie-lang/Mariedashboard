/**
 * Vocabulaire métier partagé entre l'API et l'application mobile.
 * Les identifiants techniques sont en snake_case sans accents ; les libellés
 * affichés à l'utilisateur sont en français.
 */

export const GOALS = ['perte_de_poids', 'maintien', 'prise_de_muscle', 'equilibre'] as const;
export type Goal = (typeof GOALS)[number];
export const GOAL_LABELS: Record<Goal, string> = {
  perte_de_poids: 'Perdre du poids en douceur',
  maintien: 'Maintenir mon poids',
  prise_de_muscle: 'Prendre du muscle',
  equilibre: 'Manger plus équilibré',
};

export const ACTIVITY_LEVELS = ['sedentaire', 'leger', 'modere', 'actif', 'tres_actif'] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentaire: 'Sédentaire (peu de marche)',
  leger: 'Légèrement actif',
  modere: 'Modérément actif',
  actif: 'Actif',
  tres_actif: 'Très actif',
};

export const SEXES = ['femme', 'homme', 'non_precise'] as const;
export type Sex = (typeof SEXES)[number];

/** Les 14 allergènes à déclaration obligatoire dans l'Union européenne (règlement INCO 1169/2011). */
export const ALLERGENS = [
  'gluten',
  'crustaces',
  'oeufs',
  'poissons',
  'arachides',
  'soja',
  'lait',
  'fruits_a_coque',
  'celeri',
  'moutarde',
  'sesame',
  'sulfites',
  'lupin',
  'mollusques',
] as const;
export type Allergen = (typeof ALLERGENS)[number];
export const ALLERGEN_LABELS: Record<Allergen, string> = {
  gluten: 'Gluten',
  crustaces: 'Crustacés',
  oeufs: 'Œufs',
  poissons: 'Poissons',
  arachides: 'Arachides',
  soja: 'Soja',
  lait: 'Lait',
  fruits_a_coque: 'Fruits à coque',
  celeri: 'Céleri',
  moutarde: 'Moutarde',
  sesame: 'Sésame',
  sulfites: 'Sulfites',
  lupin: 'Lupin',
  mollusques: 'Mollusques',
};

export const ALLERGY_SEVERITIES = ['intolerance', 'allergie', 'severe'] as const;
export type AllergySeverity = (typeof ALLERGY_SEVERITIES)[number];
export const ALLERGY_SEVERITY_LABELS: Record<AllergySeverity, string> = {
  intolerance: 'Intolérance',
  allergie: 'Allergie',
  severe: 'Allergie sévère (traces exclues)',
};

/** Caractéristiques d'un ingrédient utilisées pour appliquer les régimes alimentaires. */
export const DIET_FLAGS = [
  'viande',
  'porc',
  'volaille',
  'poisson',
  'fruits_de_mer',
  'laitier',
  'lactose',
  'oeuf',
  'miel',
  'gelatine',
  'alcool',
] as const;
export type DietFlag = (typeof DIET_FLAGS)[number];

export const DIETS = [
  'vegetarien',
  'vegan',
  'pescetarien',
  'sans_porc',
  'sans_gluten',
  'sans_lactose',
  'sans_alcool',
] as const;
export type Diet = (typeof DIETS)[number];
export const DIET_LABELS: Record<Diet, string> = {
  vegetarien: 'Végétarien',
  vegan: 'Végan',
  pescetarien: 'Pescétarien',
  sans_porc: 'Sans porc',
  sans_gluten: 'Sans gluten',
  sans_lactose: 'Sans lactose',
  sans_alcool: 'Sans alcool',
};

/** Pour chaque régime : caractéristiques d'ingrédient et allergènes exclus. */
export const DIET_RULES: Record<Diet, { flags: DietFlag[]; allergens: Allergen[] }> = {
  vegetarien: { flags: ['viande', 'porc', 'volaille', 'poisson', 'fruits_de_mer', 'gelatine'], allergens: [] },
  vegan: {
    flags: ['viande', 'porc', 'volaille', 'poisson', 'fruits_de_mer', 'gelatine', 'laitier', 'lactose', 'oeuf', 'miel'],
    allergens: [],
  },
  pescetarien: { flags: ['viande', 'porc', 'volaille', 'gelatine'], allergens: [] },
  sans_porc: { flags: ['porc'], allergens: [] },
  sans_gluten: { flags: [], allergens: ['gluten'] },
  sans_lactose: { flags: ['lactose'], allergens: [] },
  sans_alcool: { flags: ['alcool'], allergens: [] },
};

export const INGREDIENT_CATEGORIES = [
  'fruits',
  'legumes',
  'feculents',
  'proteines',
  'produits_frais',
  'epicerie',
  'autres',
] as const;
export type IngredientCategory = (typeof INGREDIENT_CATEGORIES)[number];
export const INGREDIENT_CATEGORY_LABELS: Record<IngredientCategory, string> = {
  fruits: 'Fruits',
  legumes: 'Légumes',
  feculents: 'Féculents',
  proteines: 'Protéines',
  produits_frais: 'Produits frais',
  epicerie: 'Épicerie',
  autres: 'Autres',
};

export const MEAL_TYPES = ['petit_dejeuner', 'collation', 'dejeuner', 'gouter', 'diner'] as const;
export type MealType = (typeof MEAL_TYPES)[number];
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  petit_dejeuner: 'Petit-déjeuner',
  collation: 'Collation',
  dejeuner: 'Déjeuner',
  gouter: 'Goûter',
  diner: 'Dîner',
};

/** Créneaux de repas utilisés selon le nombre de repas souhaités par jour. */
export function mealTypesForCount(mealsPerDay: number): MealType[] {
  switch (Math.max(1, Math.min(5, Math.round(mealsPerDay)))) {
    case 1:
      return ['diner'];
    case 2:
      return ['dejeuner', 'diner'];
    case 3:
      return ['petit_dejeuner', 'dejeuner', 'diner'];
    case 4:
      return ['petit_dejeuner', 'dejeuner', 'gouter', 'diner'];
    default:
      return ['petit_dejeuner', 'collation', 'dejeuner', 'gouter', 'diner'];
  }
}

/** Les recettes déclarent des « types de repas » ; collation et goûter partagent les mêmes recettes. */
export function recipeSlotKind(mealType: MealType): 'petit_dejeuner' | 'repas' | 'collation' {
  if (mealType === 'petit_dejeuner') return 'petit_dejeuner';
  if (mealType === 'collation' || mealType === 'gouter') return 'collation';
  return 'repas';
}

export const RECIPE_CATEGORIES = ['petit_dejeuner', 'entree', 'plat', 'salade', 'soupe', 'dessert', 'collation'] as const;
export type RecipeCategory = (typeof RECIPE_CATEGORIES)[number];
export const RECIPE_CATEGORY_LABELS: Record<RecipeCategory, string> = {
  petit_dejeuner: 'Petit-déjeuner',
  entree: 'Entrée',
  plat: 'Plat',
  salade: 'Salade',
  soupe: 'Soupe',
  dessert: 'Dessert',
  collation: 'Collation',
};

export const EQUIPMENT = ['plaques', 'four', 'micro_ondes', 'mixeur', 'air_fryer', 'cuiseur_vapeur'] as const;
export type Equipment = (typeof EQUIPMENT)[number];
export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  plaques: 'Plaques de cuisson',
  four: 'Four',
  micro_ondes: 'Micro-ondes',
  mixeur: 'Mixeur / blender',
  air_fryer: 'Air fryer',
  cuiseur_vapeur: 'Cuiseur vapeur',
};

export const BUDGET_PROFILES = [
  { id: 'serre', label: 'Serré', description: 'Priorité aux produits de base et au fait-maison', perPersonPerWeekCents: 2500 },
  { id: 'modere', label: 'Modéré', description: 'Équilibre entre prix et variété', perPersonPerWeekCents: 4000 },
  { id: 'confort', label: 'Confortable', description: 'Plus de choix, produits frais variés', perPersonPerWeekCents: 6000 },
] as const;
