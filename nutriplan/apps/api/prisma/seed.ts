/**
 * Charge le catalogue de démonstration (ingrédients + recettes) dans la base.
 * Idempotent : peut être relancé sans créer de doublons (clé : slug).
 *   npm run seed -w @nutriplan/api
 */
import { PrismaClient } from '@prisma/client';
import { convertToBase } from '@nutriplan/core';
import { INGREDIENTS } from './seed-data/ingredients';
import { RECIPES } from './seed-data/recipes';

export const DEMO_PRICE_SOURCE = 'Estimation indicative de démonstration — non relevée en magasin, à vérifier';
export const DEMO_NUTRITION_SOURCE = 'Valeurs approximatives (ordre de grandeur Ciqual/ANSES) — estimation';
export const DEMO_PRICE_DATE = new Date('2026-10-26T00:00:00Z');

export async function seedCatalog(prisma: PrismaClient): Promise<{ ingredients: number; recipes: number }> {
  const bySlug = new Map(INGREDIENTS.map((i) => [i.slug, i]));

  // Vérification d'intégrité avant toute écriture.
  for (const r of RECIPES) {
    for (const [slug, qty, unit] of r.ing) {
      const info = bySlug.get(slug);
      if (!info) throw new Error(`Recette ${r.slug} : ingrédient inconnu « ${slug} ».`);
      if (convertToBase(qty, unit, { unit: info.unit, gramsPerPiece: info.gpp, densityGPerMl: info.density }) === null) {
        throw new Error(`Recette ${r.slug} : ${qty} ${unit} de ${slug} non convertible en ${info.unit}.`);
      }
    }
  }

  const ids = new Map<string, string>();
  for (const i of INGREDIENTS) {
    const data = {
      name: i.name,
      category: i.category,
      unit: i.unit,
      gramsPerPiece: i.gpp ?? null,
      densityGPerMl: i.density ?? null,
      allergens: i.allergens ?? [],
      mayContain: i.mayContain ?? [],
      dietFlags: i.flags ?? [],
      isPantryStaple: i.staple ?? false,
      nutritionalValues: i.n ? { kcal: i.n[0], proteinG: i.n[1], carbsG: i.n[2], fatG: i.n[3], fiberG: i.n[4] } : undefined,
      nutritionSource: i.n ? DEMO_NUTRITION_SOURCE : null,
      priceEstimateCents: i.p?.[0] ?? null,
      priceQuantity: i.p?.[1] ?? null,
      packageSize: i.p?.[2] ?? null,
      priceSource: i.p ? DEMO_PRICE_SOURCE : null,
      priceUpdatedAt: i.p ? DEMO_PRICE_DATE : null,
    };
    const row = await prisma.ingredient.upsert({ where: { slug: i.slug }, create: { slug: i.slug, ...data }, update: data });
    ids.set(i.slug, row.id);
  }

  for (const r of RECIPES) {
    const data = {
      name: r.name,
      description: r.description,
      instructions: r.steps,
      preparationTime: r.prep,
      cookingTime: r.cook,
      servings: r.servings,
      category: r.category,
      slotKinds: r.slots,
      equipment: r.equipment,
      tags: r.tags,
      isDemo: true,
    };
    await prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.upsert({ where: { slug: r.slug }, create: { slug: r.slug, ...data }, update: data });
      await tx.recipeIngredient.deleteMany({ where: { recipeId: recipe.id } });
      await tx.recipeIngredient.createMany({
        data: r.ing.map(([slug, quantity, unit]) => ({ recipeId: recipe.id, ingredientId: ids.get(slug)!, quantity, unit })),
      });
    });
  }
  return { ingredients: INGREDIENTS.length, recipes: RECIPES.length };
}

if (require.main === module) {
  const prisma = new PrismaClient();
  seedCatalog(prisma)
    .then((r) => console.log(`Catalogue de démonstration chargé : ${r.ingredients} ingrédients, ${r.recipes} recettes.`))
    .catch((e) => {
      console.error(e);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
