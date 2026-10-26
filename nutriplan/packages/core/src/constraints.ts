import { ALLERGEN_LABELS, DIET_LABELS, DIET_RULES, EQUIPMENT_LABELS, type Allergen } from './domain';
import type { DietaryConstraints, IngredientInfo, RecipeInfo } from './types';

export type ExclusionReason =
  | { code: 'ALLERGEN'; allergen: Allergen; ingredientId: string; message: string }
  | { code: 'ALLERGEN_TRACES'; allergen: Allergen; ingredientId: string; message: string }
  | { code: 'DIET'; ingredientId: string; message: string }
  | { code: 'EXCLUDED_INGREDIENT'; ingredientId: string; message: string }
  | { code: 'UNKNOWN_INGREDIENT'; ingredientId: string; message: string }
  | { code: 'EQUIPMENT'; message: string }
  | { code: 'TIME'; message: string };

export interface RecipeCheck {
  allowed: boolean;
  /** Raisons d'exclusion (stricte). */
  reasons: ExclusionReason[];
  /** Avertissements non bloquants (traces possibles pour une allergie non sévère). */
  warnings: string[];
}

/**
 * Vérifie une recette contre les contraintes d'un utilisateur.
 * Les allergies, les régimes et les ingrédients exclus sont des contraintes strictes.
 * Un ingrédient inconnu de la base est refusé par prudence : on ne peut pas vérifier ses allergènes.
 */
export function checkRecipe(
  recipe: RecipeInfo,
  constraints: DietaryConstraints,
  ingredients: Map<string, IngredientInfo>,
  options: { ignoreTime?: boolean } = {},
): RecipeCheck {
  const reasons: ExclusionReason[] = [];
  const warnings: string[] = [];
  const excluded = new Set(constraints.excludedIngredientIds);
  const dietFlags = new Set(constraints.diets.flatMap((d) => DIET_RULES[d].flags));
  const dietAllergens = new Set(constraints.diets.flatMap((d) => DIET_RULES[d].allergens));

  for (const ri of recipe.ingredients) {
    const info = ingredients.get(ri.ingredientId);
    if (!info) {
      reasons.push({
        code: 'UNKNOWN_INGREDIENT',
        ingredientId: ri.ingredientId,
        message: 'Ingrédient inconnu : impossible de vérifier ses allergènes.',
      });
      continue;
    }
    if (excluded.has(info.id)) {
      reasons.push({ code: 'EXCLUDED_INGREDIENT', ingredientId: info.id, message: `Contient ${info.name}, que vous avez exclu.` });
    }
    for (const allergy of constraints.allergies) {
      if (info.allergens.includes(allergy.allergen)) {
        reasons.push({
          code: 'ALLERGEN',
          allergen: allergy.allergen,
          ingredientId: info.id,
          message: `${info.name} contient l'allergène ${ALLERGEN_LABELS[allergy.allergen].toLowerCase()}.`,
        });
      } else if (info.mayContain.includes(allergy.allergen)) {
        const msg = `${info.name} peut contenir des traces de ${ALLERGEN_LABELS[allergy.allergen].toLowerCase()} : vérifiez l'étiquette.`;
        // Les traces sont exclues pour une allergie sévère ou de gravité non précisée (principe de précaution).
        if (allergy.severity === 'intolerance' || allergy.severity === 'allergie') warnings.push(msg);
        else reasons.push({ code: 'ALLERGEN_TRACES', allergen: allergy.allergen, ingredientId: info.id, message: msg });
      }
    }
    for (const flag of info.dietFlags) {
      if (dietFlags.has(flag)) {
        const diet = constraints.diets.find((d) => DIET_RULES[d].flags.includes(flag))!;
        reasons.push({ code: 'DIET', ingredientId: info.id, message: `${info.name} n'est pas compatible avec le régime ${DIET_LABELS[diet].toLowerCase()}.` });
      }
    }
    for (const a of info.allergens) {
      if (dietAllergens.has(a)) {
        reasons.push({ code: 'DIET', ingredientId: info.id, message: `${info.name} contient du ${ALLERGEN_LABELS[a].toLowerCase()}.` });
      }
    }
  }

  if (constraints.equipment.length > 0) {
    const missing = recipe.equipment.filter((e) => !constraints.equipment.includes(e));
    if (missing.length > 0) {
      reasons.push({ code: 'EQUIPMENT', message: `Nécessite : ${missing.map((e) => EQUIPMENT_LABELS[e].toLowerCase()).join(', ')}.` });
    }
  }

  if (!options.ignoreTime && constraints.maxTotalTime != null) {
    const total = recipe.preparationTime + recipe.cookingTime;
    if (total > constraints.maxTotalTime) {
      reasons.push({ code: 'TIME', message: `Demande ${total} min (maximum souhaité : ${constraints.maxTotalTime} min).` });
    }
  }

  return { allowed: reasons.length === 0, reasons, warnings };
}

/** Raisons strictement liées à la sécurité alimentaire (jamais assouplies par le générateur). */
export function isSafetyReason(reason: ExclusionReason): boolean {
  return reason.code !== 'TIME' && reason.code !== 'EQUIPMENT';
}
