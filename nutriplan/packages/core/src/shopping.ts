import { INGREDIENT_CATEGORIES, type IngredientCategory } from './domain';
import { proratedCostCents, scaleRecipeIngredients } from './recipes';
import type { IngredientInfo, InventoryEntry, RecipeInfo } from './types';
import { convertToBase, roundQuantity, type BaseUnit, type Unit } from './units';

export interface ShoppingLine {
  ingredientId: string;
  name: string;
  category: IngredientCategory;
  unit: BaseUnit | Unit;
  /** Quantité totale nécessaire pour les repas planifiés. */
  neededQuantity: number;
  /** Quantité couverte par le stock déclaré (placards, réfrigérateur). */
  fromInventory: number;
  /** Quantité à acheter. */
  quantity: number;
  /** Coût estimé en centimes, ou null si le prix est inconnu. */
  estimatedPriceCents: number | null;
  isPantryStaple: boolean;
  /** Faux lorsque l'unité n'a pas pu être convertie : la ligne est conservée telle quelle. */
  converted: boolean;
}

export interface ShoppingListResult {
  items: ShoppingLine[];
  totalCents: number;
  itemsWithoutPrice: number;
  /** Ingrédients entièrement couverts par le stock (rien à acheter). */
  coveredByInventory: Array<{ ingredientId: string; name: string; quantity: number; unit: BaseUnit }>;
  warnings: string[];
}

/**
 * Coût d'achat estimé : pour un produit vendu en conditionnement, on compte le nombre
 * de paquets à acheter ; les produits de placard (sel, huile, épices) sont comptés
 * au prorata car on les achète rarement chaque semaine.
 */
export function estimatePurchaseCostCents(info: IngredientInfo, baseQuantity: number): number | null {
  if (info.priceCents == null || !info.priceQuantity || baseQuantity <= 0) return baseQuantity <= 0 ? 0 : null;
  if (info.packageSize && !info.isPantryStaple) {
    const packages = Math.ceil(baseQuantity / info.packageSize - 1e-9);
    return Math.round(proratedCostCents(info, packages * info.packageSize)!);
  }
  return Math.round(proratedCostCents(info, baseQuantity)!);
}

export function buildShoppingList(
  meals: Array<{ recipe: RecipeInfo; servings: number }>,
  ingredients: Map<string, IngredientInfo>,
  inventory: InventoryEntry[] = [],
): ShoppingListResult {
  const warnings: string[] = [];
  const base = new Map<string, number>(); // ingredientId -> quantité en unité de base
  const unconverted = new Map<string, { ingredientId: string; unit: Unit; quantity: number }>();

  for (const { recipe, servings } of meals) {
    for (const s of scaleRecipeIngredients(recipe, servings, ingredients)) {
      if (s.baseQuantity !== null) {
        base.set(s.ingredientId, (base.get(s.ingredientId) ?? 0) + s.baseQuantity);
      } else {
        // On n'additionne jamais des unités incompatibles : ligne séparée.
        const key = `${s.ingredientId}|${s.unit}`;
        const prev = unconverted.get(key);
        unconverted.set(key, { ingredientId: s.ingredientId, unit: s.unit, quantity: (prev?.quantity ?? 0) + s.quantity });
      }
    }
  }

  const stock = new Map<string, number>();
  for (const entry of inventory) {
    const info = ingredients.get(entry.ingredientId);
    if (!info) continue;
    const q = convertToBase(entry.quantity, entry.unit, info);
    if (q === null) {
      warnings.push(`Stock de ${info.name} non déduit : unité ${entry.unit} non convertible.`);
      continue;
    }
    stock.set(info.id, (stock.get(info.id) ?? 0) + q);
  }

  const items: ShoppingLine[] = [];
  const coveredByInventory: ShoppingListResult['coveredByInventory'] = [];
  for (const [ingredientId, needed] of base) {
    const info = ingredients.get(ingredientId)!;
    const fromInventory = Math.min(needed, stock.get(ingredientId) ?? 0);
    const toBuy = needed - fromInventory;
    if (toBuy <= 1e-6) {
      coveredByInventory.push({ ingredientId, name: info.name, quantity: needed, unit: info.unit });
      continue;
    }
    const quantity = roundQuantity(toBuy, info.unit);
    items.push({
      ingredientId,
      name: info.name,
      category: info.category,
      unit: info.unit,
      neededQuantity: needed,
      fromInventory,
      quantity,
      estimatedPriceCents: estimatePurchaseCostCents(info, toBuy),
      isPantryStaple: !!info.isPantryStaple,
      converted: true,
    });
  }
  for (const u of unconverted.values()) {
    const info = ingredients.get(u.ingredientId);
    if (!info) continue;
    warnings.push(`${info.name} : quantité en ${u.unit} conservée sans conversion.`);
    items.push({
      ingredientId: u.ingredientId,
      name: info.name,
      category: info.category,
      unit: u.unit,
      neededQuantity: u.quantity,
      fromInventory: 0,
      quantity: roundQuantity(u.quantity, u.unit),
      estimatedPriceCents: null,
      isPantryStaple: !!info.isPantryStaple,
      converted: false,
    });
  }

  items.sort(
    (a, b) =>
      INGREDIENT_CATEGORIES.indexOf(a.category) - INGREDIENT_CATEGORIES.indexOf(b.category) ||
      a.name.localeCompare(b.name, 'fr'),
  );

  const totalCents = items.reduce((sum, i) => sum + (i.estimatedPriceCents ?? 0), 0);
  const itemsWithoutPrice = items.filter((i) => i.estimatedPriceCents === null).length;
  return { items, totalCents, itemsWithoutPrice, coveredByInventory, warnings };
}

/** Regroupe des lignes par catégorie de rayon, dans l'ordre d'affichage. */
export function groupByCategory<T extends { category: IngredientCategory }>(items: T[]): Array<{ category: IngredientCategory; items: T[] }> {
  return INGREDIENT_CATEGORIES.map((category) => ({ category, items: items.filter((i) => i.category === category) })).filter(
    (g) => g.items.length > 0,
  );
}

/** Budget pour une période de `days` jours à partir d'un budget hebdomadaire. */
export function budgetForPeriodCents(weeklyBudgetCents: number, days: number): number {
  return Math.round((weeklyBudgetCents * days) / 7);
}

/** Total d'une liste de courses éditée (articles manuels inclus), en centimes. */
export function sumEstimatedCents(items: Array<{ estimatedPriceCents: number | null }>): number {
  return items.reduce((sum, i) => sum + (i.estimatedPriceCents ?? 0), 0);
}

export function formatEuros(cents: number): string {
  return `${(cents / 100).toFixed(2).replace('.', ',')} €`;
}
