import { describe, expect, it } from 'vitest';
import {
  buildShoppingList,
  budgetForPeriodCents,
  checkRecipe,
  convertToBase,
  estimateDailyEnergy,
  estimatePurchaseCostCents,
  generateMealPlan,
  groupByCategory,
  recipeCost,
  recipeNutritionPerServing,
  scaleRecipeIngredients,
  suggestAlternatives,
  type GeneratorInput,
} from '../src';
import { ING_MAP, NO_CONSTRAINTS, RECIPES } from './fixtures';

const recipe = (id: string) => RECIPES.find((r) => r.id === id)!;

describe('conversions d’unités', () => {
  it('convertit masse et volume dans la même dimension', () => {
    expect(convertToBase(1.5, 'kg', { unit: 'g' })).toBe(1500);
    expect(convertToBase(2, 'cs', { unit: 'ml' })).toBe(30);
    expect(convertToBase(25, 'cl', { unit: 'ml' })).toBe(250);
  });
  it('convertit pièce ↔ grammes seulement si le poids unitaire est connu', () => {
    expect(convertToBase(2, 'piece', { unit: 'g', gramsPerPiece: 120 })).toBe(240);
    expect(convertToBase(2, 'piece', { unit: 'g' })).toBeNull();
    expect(convertToBase(240, 'g', { unit: 'piece', gramsPerPiece: 120 })).toBe(2);
  });
  it('refuse masse ↔ volume sans densité', () => {
    expect(convertToBase(100, 'g', { unit: 'ml' })).toBeNull();
    expect(convertToBase(100, 'ml', { unit: 'g', densityGPerMl: 0.92 })).toBeCloseTo(92);
  });
  it('refuse les quantités négatives', () => {
    expect(convertToBase(-1, 'g', { unit: 'g' })).toBeNull();
  });
});

describe('calcul des portions', () => {
  it('adapte les quantités au nombre de portions', () => {
    const scaled = scaleRecipeIngredients(recipe('pates-tomate'), 5, ING_MAP);
    expect(scaled[0]).toMatchObject({ ingredientId: 'pates', quantity: 500, baseQuantity: 500 });
    expect(scaled[1]).toMatchObject({ ingredientId: 'tomate', quantity: 5, baseQuantity: 600 });
    expect(scaled[2]!.baseQuantity).toBeCloseTo(37.5);
  });
  it('refuse un nombre de portions nul', () => {
    expect(() => scaleRecipeIngredients(recipe('pates-tomate'), 0, ING_MAP)).toThrow();
  });
  it('calcule le coût au prorata', () => {
    // 200 g pâtes (30 c) + 240 g tomate (72 c) + 15 ml huile (13,5 c) = 115,5 c pour 2 portions
    const cost = recipeCost(recipe('pates-tomate'), 2, ING_MAP);
    expect(cost.totalCents).toBe(116);
    expect(cost.perServingCents).toBe(58);
    expect(cost.complete).toBe(true);
  });
  it('signale une estimation nutritionnelle incomplète', () => {
    const full = recipeNutritionPerServing(recipe('omelette'), ING_MAP);
    expect(full.complete).toBe(true);
    expect(full.kcal).toBe(Math.round((2 * 55 * 1.4 + 60 * 0.18)));
    expect(recipeNutritionPerServing(recipe('carbonara'), ING_MAP).complete).toBe(false);
  });
});

describe('allergies et exclusions', () => {
  it('exclut une recette contenant un allergène déclaré', () => {
    const check = checkRecipe(recipe('pates-tomate'), { ...NO_CONSTRAINTS, allergies: [{ allergen: 'gluten' }] }, ING_MAP);
    expect(check.allowed).toBe(false);
    expect(check.reasons[0]!.code).toBe('ALLERGEN');
  });
  it('exclut les traces pour une allergie sévère ou de gravité non précisée', () => {
    const severe = checkRecipe(recipe('banane-choco'), { ...NO_CONSTRAINTS, allergies: [{ allergen: 'fruits_a_coque', severity: 'severe' }] }, ING_MAP);
    expect(severe.allowed).toBe(false);
    expect(severe.reasons[0]!.code).toBe('ALLERGEN_TRACES');
    const unknown = checkRecipe(recipe('banane-choco'), { ...NO_CONSTRAINTS, allergies: [{ allergen: 'fruits_a_coque' }] }, ING_MAP);
    expect(unknown.allowed).toBe(false);
  });
  it('avertit seulement pour des traces en cas d’intolérance', () => {
    const check = checkRecipe(recipe('banane-choco'), { ...NO_CONSTRAINTS, allergies: [{ allergen: 'fruits_a_coque', severity: 'intolerance' }] }, ING_MAP);
    expect(check.allowed).toBe(true);
    expect(check.warnings).toHaveLength(1);
  });
  it('applique les régimes', () => {
    const veg = { ...NO_CONSTRAINTS, diets: ['vegetarien' as const] };
    expect(checkRecipe(recipe('poulet-riz'), veg, ING_MAP).allowed).toBe(false);
    expect(checkRecipe(recipe('saumon-riz'), veg, ING_MAP).allowed).toBe(false);
    expect(checkRecipe(recipe('omelette'), veg, ING_MAP).allowed).toBe(true);
    expect(checkRecipe(recipe('omelette'), { ...NO_CONSTRAINTS, diets: ['vegan'] }, ING_MAP).allowed).toBe(false);
    expect(checkRecipe(recipe('carbonara'), { ...NO_CONSTRAINTS, diets: ['sans_porc'] }, ING_MAP).allowed).toBe(false);
    expect(checkRecipe(recipe('pates-tomate'), { ...NO_CONSTRAINTS, diets: ['sans_gluten'] }, ING_MAP).allowed).toBe(false);
    expect(checkRecipe(recipe('porridge'), { ...NO_CONSTRAINTS, diets: ['sans_lactose'] }, ING_MAP).allowed).toBe(false);
  });
  it('exclut les aliments explicitement refusés, l’équipement manquant et le temps', () => {
    expect(checkRecipe(recipe('riz-tomate'), { ...NO_CONSTRAINTS, excludedIngredientIds: ['tomate'] }, ING_MAP).allowed).toBe(false);
    expect(checkRecipe(recipe('gratin'), { ...NO_CONSTRAINTS, equipment: ['plaques'] }, ING_MAP).allowed).toBe(false);
    expect(checkRecipe(recipe('gratin'), { ...NO_CONSTRAINTS, maxTotalTime: 30 }, ING_MAP).allowed).toBe(false);
  });
  it('refuse une recette dont un ingrédient est inconnu', () => {
    const r = { ...recipe('riz-tomate'), ingredients: [{ ingredientId: 'mystere', quantity: 1, unit: 'g' as const }] };
    expect(checkRecipe(r, NO_CONSTRAINTS, ING_MAP).reasons[0]!.code).toBe('UNKNOWN_INGREDIENT');
  });
});

describe('liste de courses', () => {
  it('regroupe et additionne les ingrédients identiques avec conversion', () => {
    const list = buildShoppingList(
      [
        { recipe: recipe('pates-tomate'), servings: 2 }, // tomate : 2 pièces = 240 g
        { recipe: recipe('riz-tomate'), servings: 2 }, // tomate : 300 g
      ],
      ING_MAP,
    );
    const tomate = list.items.find((i) => i.ingredientId === 'tomate')!;
    expect(tomate.neededQuantity).toBe(540);
    expect(tomate.unit).toBe('g');
    expect(list.items.filter((i) => i.ingredientId === 'tomate')).toHaveLength(1);
  });
  it('déduit le stock disponible', () => {
    const list = buildShoppingList([{ recipe: recipe('riz-tomate'), servings: 4 }], ING_MAP, [
      { ingredientId: 'riz', quantity: 0.5, unit: 'kg' },
      { ingredientId: 'tomate', quantity: 2, unit: 'piece' },
    ]);
    expect(list.items.find((i) => i.ingredientId === 'riz')).toBeUndefined();
    expect(list.coveredByInventory.map((c) => c.ingredientId)).toContain('riz');
    const tomate = list.items.find((i) => i.ingredientId === 'tomate')!;
    expect(tomate.fromInventory).toBe(240);
    expect(tomate.quantity).toBe(360);
  });
  it('n’additionne pas des unités incompatibles', () => {
    const noWeight = new Map(ING_MAP);
    noWeight.set('tomate', { ...ING_MAP.get('tomate')!, gramsPerPiece: null });
    const list = buildShoppingList(
      [
        { recipe: recipe('pates-tomate'), servings: 2 },
        { recipe: recipe('riz-tomate'), servings: 2 },
      ],
      noWeight,
    );
    const lines = list.items.filter((i) => i.ingredientId === 'tomate');
    expect(lines).toHaveLength(2);
    expect(lines.find((l) => !l.converted)).toMatchObject({ unit: 'piece', quantity: 2, estimatedPriceCents: null });
    expect(list.itemsWithoutPrice).toBe(1);
    expect(list.warnings.length).toBeGreaterThan(0);
  });
  it('compte les conditionnements entiers, sauf pour les produits de placard', () => {
    expect(estimatePurchaseCostCents(ING_MAP.get('pates')!, 600)).toBe(150); // 2 paquets de 500 g
    expect(estimatePurchaseCostCents(ING_MAP.get('huile')!, 15)).toBe(14); // prorata
    expect(estimatePurchaseCostCents(ING_MAP.get('banane')!, 3)).toBe(75); // à l’unité
  });
  it('arrondit les articles vendus à la pièce à l’unité supérieure', () => {
    const list = buildShoppingList([{ recipe: recipe('banane-choco'), servings: 3 }], ING_MAP);
    const banane = list.items.find((i) => i.ingredientId === 'banane')!;
    expect(banane.quantity).toBe(3);
    const half = buildShoppingList([{ recipe: recipe('banane-choco'), servings: 1 }], ING_MAP, [{ ingredientId: 'banane', quantity: 0.5, unit: 'piece' }]);
    expect(half.items.find((i) => i.ingredientId === 'banane')).toMatchObject({ quantity: 1, estimatedPriceCents: 25 });
  });

  it('calcule le budget total et le regroupement par rayon', () => {
    const list = buildShoppingList([{ recipe: recipe('poulet-riz'), servings: 2 }], ING_MAP);
    // poulet 300 g → 1 paquet de 400 g = 480 c ; riz 150 g → 1 paquet de 1 kg = 200 c
    expect(list.totalCents).toBe(680);
    expect(groupByCategory(list.items).map((g) => g.category)).toEqual(['feculents', 'proteines']);
  });
  it('calcule le budget d’une période', () => {
    expect(budgetForPeriodCents(7000, 7)).toBe(7000);
    expect(budgetForPeriodCents(7000, 3)).toBe(3000);
  });
});

describe('générateur de menus', () => {
  const base: GeneratorInput = {
    recipes: RECIPES,
    ingredients: ING_MAP,
    constraints: NO_CONSTRAINTS,
    likedIngredientIds: [],
    favoriteRecipeIds: [],
    inventory: [],
    startDate: '2026-11-02',
    days: 7,
    mealsPerDay: 2,
    householdSize: 2,
    weeklyBudgetCents: null,
    seed: 1,
  };

  it('remplit chaque créneau et est reproductible', () => {
    const a = generateMealPlan(base);
    const b = generateMealPlan(base);
    expect(a.meals).toHaveLength(14);
    expect(a.meals).toEqual(b.meals);
    expect(a.feasible).toBe(true);
    expect(a.meals[0]).toMatchObject({ date: '2026-11-02', mealType: 'dejeuner', servings: 2 });
    expect(a.meals.at(-1)!.date).toBe('2026-11-08');
  });

  it('ne propose jamais un allergène ni un aliment exclu', () => {
    const plan = generateMealPlan({
      ...base,
      constraints: { ...NO_CONSTRAINTS, allergies: [{ allergen: 'gluten' }, { allergen: 'oeufs' }], excludedIngredientIds: ['poulet'] },
    });
    const forbidden = new Set(['pates-tomate', 'carbonara', 'gratin', 'omelette', 'poulet-riz', 'porridge']);
    expect(plan.meals.length).toBeGreaterThan(0);
    for (const m of plan.meals) expect(forbidden.has(m.recipeId)).toBe(false);
  });

  it('évite de répéter une recette deux jours de suite quand c’est possible', () => {
    const plan = generateMealPlan(base);
    const byRecipe = new Map<string, number[]>();
    plan.meals.forEach((m) => {
      const day = Number(m.date.slice(-2));
      byRecipe.set(m.recipeId, [...(byRecipe.get(m.recipeId) ?? []), day]);
    });
    for (const days of byRecipe.values()) {
      const sorted = [...days].sort((x, y) => x - y);
      for (let i = 1; i < sorted.length; i++) expect(sorted[i]! - sorted[i - 1]!).toBeGreaterThanOrEqual(2);
    }
  });

  it('privilégie les ingrédients déjà disponibles', () => {
    const plan = generateMealPlan({ ...base, days: 1, mealsPerDay: 1, inventory: [{ ingredientId: 'lentilles', quantity: 500, unit: 'g' }] });
    expect(plan.meals[0]!.recipeId).toBe('dahl');
  });

  it('respecte le budget lorsqu’il est suffisant', () => {
    const plan = generateMealPlan({ ...base, weeklyBudgetCents: 4000 });
    expect(plan.feasible).toBe(true);
    expect(plan.estimatedCostCents).toBeLessThanOrEqual(4000);
  });

  it('explique un budget insuffisant au lieu de prétendre que le plan est réalisable', () => {
    const plan = generateMealPlan({ ...base, weeklyBudgetCents: 300 });
    expect(plan.feasible).toBe(false);
    expect(plan.issues.map((i) => i.code)).toContain('BUDGET_INSUFFICIENT');
    expect(plan.suggestions.some((s) => s.includes('Augmenter le budget'))).toBe(true);
    expect(plan.meals).toHaveLength(14);
  });

  it('signale l’absence de recette compatible', () => {
    const plan = generateMealPlan({ ...base, constraints: { ...NO_CONSTRAINTS, maxTotalTime: 5 } });
    expect(plan.feasible).toBe(false);
    expect(plan.issues[0]!.code).toBe('NO_ELIGIBLE_RECIPE');
    expect(plan.suggestions.join(' ')).toContain('temps');
  });

  it('gère les créneaux de petit-déjeuner et de collation', () => {
    const plan = generateMealPlan({ ...base, days: 2, mealsPerDay: 4 });
    expect(plan.meals.filter((m) => m.mealType === 'petit_dejeuner')).toHaveLength(2);
    expect(plan.meals.filter((m) => m.mealType === 'gouter').every((m) => m.recipeId === 'banane-choco')).toBe(true);
  });

  it('propose des alternatives conformes', () => {
    const alts = suggestAlternatives({ ...base, constraints: { ...NO_CONSTRAINTS, diets: ['vegetarien'] } }, 'diner', ['dahl']);
    expect(alts.map((a) => a.id)).not.toContain('dahl');
    expect(alts.map((a) => a.id)).not.toContain('poulet-riz');
    expect(alts.length).toBeGreaterThan(0);
  });
});

describe('estimation énergétique', () => {
  it('renvoie null sans taille ou poids (pas de valeur inventée)', () => {
    expect(estimateDailyEnergy({ age: 30, heightCm: 170 })).toBeNull();
  });
  it('applique un déficit modéré et jamais sous le métabolisme de base', () => {
    const e = estimateDailyEnergy({ age: 30, sex: 'femme', heightCm: 165, weightKg: 70, activityLevel: 'sedentaire', goal: 'perte_de_poids' })!;
    // BMR = 700 + 1031,25 - 150 - 161 = 1420,25 ; maintien ≈ 1704 ; ×0,85 ≈ 1449
    expect(e.maintenanceKcal).toBe(1700);
    expect(e.targetKcal).toBe(1450);
    expect(e.disclaimer).toMatch(/pas un avis médical/);
  });
  it('ne calcule pas de déficit pour un·e mineur·e ou un IMC bas', () => {
    const minor = estimateDailyEnergy({ age: 16, heightCm: 170, weightKg: 70, goal: 'perte_de_poids' })!;
    expect(minor.targetKcal).toBe(minor.maintenanceKcal);
    const low = estimateDailyEnergy({ age: 30, heightCm: 180, weightKg: 55, goal: 'perte_de_poids' })!;
    expect(low.targetKcal).toBe(low.maintenanceKcal);
  });
});
