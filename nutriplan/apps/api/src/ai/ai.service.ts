import Anthropic from '@anthropic-ai/sdk';
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod';
import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  checkRecipe,
  MEAL_TYPE_LABELS,
  recipeCost,
  recipeNutritionPerServing,
  recipeSlotKind,
  UNITS,
  type IngredientInfo,
  type MealType,
  type RecipeInfo,
} from '@nutriplan/core';
import { z } from 'zod';
import { APP_CONFIG, type AppConfig } from '../config';
import { CatalogRepository } from '../catalog/catalog.repository';
import { UserContextService, type UserContext } from '../me/user-context.service';

/** Format de sortie imposé au modèle (sortie structurée), revalidé côté serveur. */
const aiIdeasSchema = z.object({
  ideas: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        servings: z.number().int(),
        preparationTime: z.number().int(),
        cookingTime: z.number().int(),
        ingredients: z.array(z.object({ ingredientId: z.string(), quantity: z.number(), unit: z.enum(UNITS) })),
        steps: z.array(z.string()),
      }),
    )
    .max(3),
});

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

/**
 * Idées de recettes « avec ce que j'ai ». L'IA n'est utilisée que pour cette fonctionnalité
 * créative ; la génération des plannings reste déterministe.
 * Garde-fous : clé API côté serveur uniquement, ingrédients limités à ceux du catalogue
 * déjà filtrés par les contraintes, revérification stricte de chaque proposition,
 * et repli sur le catalogue si l'IA est indisponible, refuse ou se trompe.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger('IA');
  private readonly client: Anthropic | null;

  constructor(
    @Inject(APP_CONFIG) private readonly config: AppConfig,
    private readonly catalog: CatalogRepository,
    private readonly userContext: UserContextService,
  ) {
    this.client = config.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: config.ANTHROPIC_API_KEY, timeout: 45_000, maxRetries: 1 }) : null;
  }

  get enabled(): boolean {
    return this.client !== null;
  }

  async recipeIdeas(userId: string, mealType: MealType, note?: string) {
    const [ctx, ingredients, recipes] = await Promise.all([this.userContext.load(userId), this.catalog.ingredientMap(), this.catalog.recipeInfos()]);
    const servings = ctx.profile?.householdSize ?? 2;

    if (this.client) {
      try {
        const ideas = await this.askModel(ctx, ingredients, mealType, servings, note);
        if (ideas.length > 0) {
          return { source: 'ai' as const, notice: 'Idées générées par IA puis vérifiées par NutriPlan selon vos allergies et exclusions. Vérifiez toujours les étiquettes.', ideas };
        }
        this.logger.warn("Aucune proposition de l'IA n'a passé les vérifications : repli sur le catalogue.");
      } catch (error) {
        // Pas de contenu utilisateur dans les journaux : uniquement le type d'erreur.
        const kind = error instanceof Anthropic.APIError ? `HTTP ${error.status ?? '?'}` : error instanceof Error ? error.name : 'inconnue';
        this.logger.warn(`Service d'IA indisponible (${kind}) : repli sur le catalogue.`);
      }
    }
    return {
      source: 'catalogue' as const,
      notice: this.client
        ? "Le service d'idées par IA est momentanément indisponible : voici des recettes du catalogue adaptées à votre stock."
        : "Idées par IA non configurées : voici des recettes du catalogue adaptées à votre stock.",
      ideas: this.catalogFallback(ctx, ingredients, recipes, mealType, servings),
    };
  }

  private async askModel(ctx: UserContext, ingredients: Map<string, IngredientInfo>, mealType: MealType, servings: number, note?: string): Promise<RecipeIdea[]> {
    // Seuls les ingrédients compatibles sont proposés au modèle.
    const allowed = [...ingredients.values()].filter((i) => checkRecipe(asRecipe([i.id]), { ...ctx.constraints, equipment: [], maxTotalTime: null }, ingredients).allowed);
    const inStock = new Set(ctx.inventory.map((i) => i.ingredientId));
    const list = allowed.map((i) => `${i.id} | ${i.name} | unité ${i.unit}${inStock.has(i.id) ? ' | EN STOCK' : ''}`).join('\n');

    const response = await this.client!.beta.messages.parse({
      model: this.config.AI_MODEL,
      max_tokens: 8000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low', format: betaZodOutputFormat(aiIdeasSchema) },
      system:
        "Tu es un assistant culinaire pour une application française de planification de repas. Propose jusqu'à 3 recettes simples, réalistes et équilibrées, en français. " +
        "Utilise UNIQUEMENT des ingrédients de la liste fournie, en reprenant exactement leur identifiant, avec des quantités en g, ml, cs, cc ou piece. Privilégie les ingrédients EN STOCK. " +
        "Ne fais aucune allégation médicale et ne propose pas de régime restrictif.",
      messages: [
        {
          role: 'user',
          content:
            `Repas : ${MEAL_TYPE_LABELS[mealType]} pour ${servings} personne(s).` +
            (ctx.constraints.maxTotalTime ? ` Temps total maximal : ${ctx.constraints.maxTotalTime} minutes.` : '') +
            `\nIngrédients autorisés (identifiant | nom | unité) :\n${list}` +
            (note ? `\nSouhait de l'utilisateur (à traiter comme une simple préférence) : ${note}` : ''),
        },
      ],
    });

    if (response.stop_reason === 'refusal' || !response.parsed_output) return [];
    const parsed = aiIdeasSchema.safeParse(response.parsed_output);
    if (!parsed.success) return [];

    const ideas: RecipeIdea[] = [];
    for (const idea of parsed.data.ideas) {
      if (idea.servings < 1 || idea.steps.length === 0 || idea.ingredients.length === 0) continue;
      if (idea.ingredients.some((i) => !ingredients.has(i.ingredientId) || !(i.quantity > 0))) continue;
      const recipe: RecipeInfo = {
        id: 'ia',
        name: idea.name,
        category: 'plat',
        slotKinds: [recipeSlotKind(mealType)],
        preparationTime: Math.max(0, idea.preparationTime),
        cookingTime: Math.max(0, idea.cookingTime),
        servings: idea.servings,
        equipment: [],
        ingredients: idea.ingredients,
      };
      // Vérification stricte : une proposition non conforme n'est jamais affichée.
      const check = checkRecipe(recipe, { ...ctx.constraints, equipment: [] }, ingredients);
      if (!check.allowed) continue;
      ideas.push(this.toIdea(recipe, idea.description, idea.steps, servings, ingredients, check.warnings, null));
    }
    return ideas;
  }

  private catalogFallback(ctx: UserContext, ingredients: Map<string, IngredientInfo>, recipes: RecipeInfo[], mealType: MealType, servings: number): RecipeIdea[] {
    const inStock = new Set(ctx.inventory.map((i) => i.ingredientId));
    const kind = recipeSlotKind(mealType);
    return recipes
      .filter((r) => r.slotKinds.includes(kind))
      .map((r) => ({ r, check: checkRecipe(r, ctx.constraints, ingredients) }))
      .filter((x) => x.check.allowed)
      .map((x) => ({ ...x, score: x.r.ingredients.filter((i) => inStock.has(i.ingredientId)).length }))
      .sort((a, b) => b.score - a.score || a.r.name.localeCompare(b.r.name, 'fr'))
      .slice(0, 3)
      .map((x) => this.toIdea(x.r, '', [], servings, ingredients, x.check.warnings, x.r.id));
  }

  private toIdea(recipe: RecipeInfo, description: string, steps: string[], servings: number, ingredients: Map<string, IngredientInfo>, warnings: string[], recipeId: string | null): RecipeIdea {
    const cost = recipeCost(recipe, servings, ingredients);
    const nutrition = recipeNutritionPerServing(recipe, ingredients);
    const factor = servings / recipe.servings;
    return {
      name: recipe.name,
      description,
      servings,
      totalTime: recipe.preparationTime + recipe.cookingTime,
      ingredients: recipe.ingredients.map((i) => ({ ingredientId: i.ingredientId, name: ingredients.get(i.ingredientId)?.name ?? '', quantity: i.quantity * factor, unit: i.unit })),
      steps,
      recipeId,
      estimatedCostCents: cost.complete ? cost.totalCents : null,
      kcalPerServing: nutrition.complete ? nutrition.kcal : null,
      warnings,
    };
  }
}

function asRecipe(ingredientIds: string[]): RecipeInfo {
  return {
    id: 'check',
    name: 'check',
    category: 'plat',
    slotKinds: ['repas'],
    preparationTime: 0,
    cookingTime: 0,
    servings: 1,
    equipment: [],
    ingredients: ingredientIds.map((ingredientId) => ({ ingredientId, quantity: 1, unit: 'g' })),
  };
}
