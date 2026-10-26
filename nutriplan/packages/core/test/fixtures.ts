import type { IngredientInfo, RecipeInfo } from '../src';

/** Jeu de données de test reproductible (prix fictifs de test, sans valeur commerciale). */
const ing = (i: Partial<IngredientInfo> & Pick<IngredientInfo, 'id' | 'name' | 'category' | 'unit'>): IngredientInfo => ({
  allergens: [],
  mayContain: [],
  dietFlags: [],
  ...i,
});

export const INGREDIENTS: IngredientInfo[] = [
  ing({ id: 'pates', name: 'Pâtes', category: 'feculents', unit: 'g', allergens: ['gluten'], priceCents: 150, priceQuantity: 1000, packageSize: 500, nutrition: { kcal: 355, proteinG: 12, carbsG: 71, fatG: 1.5 } }),
  ing({ id: 'riz', name: 'Riz', category: 'feculents', unit: 'g', priceCents: 200, priceQuantity: 1000, packageSize: 1000, nutrition: { kcal: 350, proteinG: 7, carbsG: 78, fatG: 0.6 } }),
  ing({ id: 'tomate', name: 'Tomate', category: 'legumes', unit: 'g', gramsPerPiece: 120, priceCents: 300, priceQuantity: 1000, nutrition: { kcal: 18, proteinG: 0.9, carbsG: 3, fatG: 0.2 } }),
  ing({ id: 'poulet', name: 'Filet de poulet', category: 'proteines', unit: 'g', dietFlags: ['viande', 'volaille'], priceCents: 1200, priceQuantity: 1000, packageSize: 400, nutrition: { kcal: 120, proteinG: 23, carbsG: 0, fatG: 2.5 } }),
  ing({ id: 'lardons', name: 'Lardons', category: 'proteines', unit: 'g', dietFlags: ['viande', 'porc'], priceCents: 1000, priceQuantity: 1000, packageSize: 200 }),
  ing({ id: 'saumon', name: 'Saumon', category: 'proteines', unit: 'g', allergens: ['poissons'], dietFlags: ['poisson'], priceCents: 2500, priceQuantity: 1000, packageSize: 250 }),
  ing({ id: 'oeuf', name: 'Œuf', category: 'produits_frais', unit: 'piece', gramsPerPiece: 55, allergens: ['oeufs'], dietFlags: ['oeuf'], priceCents: 180, priceQuantity: 6, packageSize: 6, nutrition: { kcal: 140, proteinG: 12.5, carbsG: 0.5, fatG: 10 } }),
  ing({ id: 'lait', name: 'Lait demi-écrémé', category: 'produits_frais', unit: 'ml', densityGPerMl: 1.03, allergens: ['lait'], dietFlags: ['laitier', 'lactose'], priceCents: 100, priceQuantity: 1000, packageSize: 1000 }),
  ing({ id: 'flocons', name: "Flocons d'avoine", category: 'feculents', unit: 'g', allergens: ['gluten'], priceCents: 250, priceQuantity: 1000, packageSize: 500 }),
  ing({ id: 'chocolat', name: 'Chocolat noir', category: 'epicerie', unit: 'g', mayContain: ['fruits_a_coque'], priceCents: 1200, priceQuantity: 1000, packageSize: 100 }),
  ing({ id: 'huile', name: "Huile d'olive", category: 'epicerie', unit: 'ml', densityGPerMl: 0.92, isPantryStaple: true, priceCents: 900, priceQuantity: 1000, packageSize: 1000 }),
  ing({ id: 'lentilles', name: 'Lentilles vertes', category: 'feculents', unit: 'g', priceCents: 300, priceQuantity: 1000, packageSize: 500 }),
  ing({ id: 'banane', name: 'Banane', category: 'fruits', unit: 'piece', gramsPerPiece: 120, priceCents: 25, priceQuantity: 1 }),
];
export const ING_MAP = new Map(INGREDIENTS.map((i) => [i.id, i]));

const r = (x: Partial<RecipeInfo> & Pick<RecipeInfo, 'id' | 'name' | 'ingredients'>): RecipeInfo => ({
  category: 'plat',
  slotKinds: ['repas'],
  preparationTime: 10,
  cookingTime: 15,
  servings: 2,
  equipment: ['plaques'],
  ...x,
});

export const RECIPES: RecipeInfo[] = [
  r({ id: 'pates-tomate', name: 'Pâtes à la tomate', ingredients: [{ ingredientId: 'pates', quantity: 200, unit: 'g' }, { ingredientId: 'tomate', quantity: 2, unit: 'piece' }, { ingredientId: 'huile', quantity: 1, unit: 'cs' }] }),
  r({ id: 'poulet-riz', name: 'Poulet riz', ingredients: [{ ingredientId: 'poulet', quantity: 300, unit: 'g' }, { ingredientId: 'riz', quantity: 150, unit: 'g' }] }),
  r({ id: 'carbonara', name: 'Pâtes carbonara', ingredients: [{ ingredientId: 'pates', quantity: 200, unit: 'g' }, { ingredientId: 'lardons', quantity: 150, unit: 'g' }, { ingredientId: 'oeuf', quantity: 2, unit: 'piece' }] }),
  r({ id: 'saumon-riz', name: 'Saumon et riz', ingredients: [{ ingredientId: 'saumon', quantity: 250, unit: 'g' }, { ingredientId: 'riz', quantity: 150, unit: 'g' }] }),
  r({ id: 'dahl', name: 'Dahl de lentilles', cookingTime: 30, ingredients: [{ ingredientId: 'lentilles', quantity: 200, unit: 'g' }, { ingredientId: 'tomate', quantity: 200, unit: 'g' }] }),
  r({ id: 'riz-tomate', name: 'Riz à la tomate', ingredients: [{ ingredientId: 'riz', quantity: 150, unit: 'g' }, { ingredientId: 'tomate', quantity: 300, unit: 'g' }] }),
  r({ id: 'omelette', name: 'Omelette', ingredients: [{ ingredientId: 'oeuf', quantity: 4, unit: 'piece' }, { ingredientId: 'tomate', quantity: 1, unit: 'piece' }] }),
  r({ id: 'porridge', name: 'Porridge', category: 'petit_dejeuner', slotKinds: ['petit_dejeuner'], cookingTime: 5, ingredients: [{ ingredientId: 'flocons', quantity: 80, unit: 'g' }, { ingredientId: 'lait', quantity: 40, unit: 'cl' }] }),
  r({ id: 'banane-choco', name: 'Banane chocolat', category: 'collation', slotKinds: ['collation', 'petit_dejeuner'], equipment: [], cookingTime: 0, ingredients: [{ ingredientId: 'banane', quantity: 2, unit: 'piece' }, { ingredientId: 'chocolat', quantity: 20, unit: 'g' }] }),
  r({ id: 'gratin', name: 'Gratin au four', cookingTime: 60, equipment: ['four'], ingredients: [{ ingredientId: 'pates', quantity: 200, unit: 'g' }, { ingredientId: 'lait', quantity: 200, unit: 'ml' }] }),
];

export const NO_CONSTRAINTS = { allergies: [], diets: [], excludedIngredientIds: [], equipment: [], maxTotalTime: null };
