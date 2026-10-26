import type { INestApplication } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { bootApp, makeUser, PROFILE, resetDatabase, type TestUser } from './setup';

let app: INestApplication;
let prisma: PrismaClient;
const api = (u?: TestUser) => {
  const agent = request(app.getHttpServer());
  const auth = (r: request.Test) => (u ? r.set('Authorization', `Bearer ${u.token}`) : r);
  return {
    get: (url: string) => auth(agent.get(url)),
    post: (url: string, body?: object) => auth(agent.post(url)).send(body ?? {}),
    put: (url: string, body: object) => auth(agent.put(url)).send(body),
    patch: (url: string, body: object) => auth(agent.patch(url)).send(body),
    delete: (url: string) => auth(agent.delete(url)),
  };
};
const ingredientId = async (slug: string) => (await prisma.ingredient.findUniqueOrThrow({ where: { slug } })).id;
const items = (list: any): any[] => list.groups.flatMap((g: any) => g.items);
const START = '2026-11-02';

beforeAll(async () => {
  prisma = await resetDatabase();
  app = await bootApp();
}, 120_000);

afterAll(async () => {
  await app?.close();
  await prisma?.$disconnect();
});

describe('Authentification', () => {
  it('refuse une requête sans jeton', async () => {
    const res = await api().get('/me');
    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ statusCode: 401, error: 'UNAUTHENTICATED' });
  });

  it('refuse un jeton mal signé, expiré, d’un autre émetteur ou anonyme', async () => {
    for (const u of [
      await makeUser({ secret: 'mauvais-secret-mauvais-secret-mauvais' }),
      await makeUser({ expiresIn: '-1m' }),
      await makeUser({ issuer: 'https://autre-projet.supabase.co/auth/v1' }),
      await makeUser({ role: 'anon' }),
    ]) {
      const res = await api(u).get('/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('INVALID_TOKEN');
    }
  });

  it('accepte un jeton valide et crée le compte applicatif', async () => {
    const u = await makeUser();
    const res = await api(u).get('/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ id: u.id, email: u.email, hasProfile: false });
    expect(await prisma.user.count({ where: { id: u.id } })).toBe(1);
  });

  it('laisse la route de santé publique', async () => {
    expect((await api().get('/health')).body).toEqual({ status: 'ok' });
  });
});

describe('Profil', () => {
  it('valide les entrées et renvoie des messages compréhensibles', async () => {
    const u = await makeUser();
    const res = await api(u).put('/me/profile', { ...PROFILE, age: 9, mealsPerDay: 12 });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
    expect(res.body.details.map((d: { path: string }) => d.path).sort()).toEqual(['age', 'mealsPerDay']);
  });

  it('crée puis modifie un profil, avec estimation énergétique indicative', async () => {
    const u = await makeUser();
    const created = await api(u).put('/me/profile', PROFILE);
    expect(created.status).toBe(200);
    expect(created.body.profile).toMatchObject({ age: 34, householdSize: 2, weeklyBudgetCents: 8000 });
    expect(created.body.energyEstimate.disclaimer).toMatch(/pas un avis médical/);

    const updated = await api(u).put('/me/profile', { ...PROFILE, householdSize: 3, weightKg: null, heightCm: null });
    expect(updated.body.profile.householdSize).toBe(3);
    expect(updated.body.energyEstimate).toBeNull();
    expect((await api(u).get('/me')).body.hasProfile).toBe(true);
  });

  it('refuse un aliment inconnu dans les préférences', async () => {
    const u = await makeUser();
    const res = await api(u).put('/me/preferences', { likedIngredientIds: ['5a0b5a3e-1111-4222-8333-944455556666'], dislikedIngredientIds: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('UNKNOWN_INGREDIENT');
  });
});

describe('Génération du planning, allergies et liste de courses', () => {
  let user: TestUser;
  let plan: any;

  beforeAll(async () => {
    user = await makeUser();
    await api(user).put('/me/profile', PROFILE);
    await api(user).put('/me/allergies', { allergies: [{ allergen: 'gluten', severity: 'severe' }, { allergen: 'poissons' }] });
    await api(user).put('/me/preferences', {
      likedIngredientIds: [await ingredientId('poulet')],
      dislikedIngredientIds: [await ingredientId('champignons'), await ingredientId('poivron')],
    });
    await api(user).post('/me/inventory', { ingredientId: await ingredientId('riz'), quantity: 5, unit: 'kg' });
  });

  it('exige un profil avant de générer', async () => {
    const res = await api(await makeUser()).post('/meal-plans/generate', { startDate: START });
    expect(res.status).toBe(409);
    expect(res.body.error).toBe('PROFILE_REQUIRED');
  });

  it('génère un planning de 7 jours qui respecte allergies et exclusions', async () => {
    const res = await api(user).post('/meal-plans/generate', { startDate: START, seed: 7 });
    expect(res.status).toBe(201);
    plan = res.body;
    expect(plan.days).toHaveLength(7);
    expect(plan.mealCount).toBe(14);

    const recipeIds = [...new Set(plan.days.flatMap((d: any) => d.meals.map((m: any) => m.recipe.id)))] as string[];
    const recipes = await prisma.recipe.findMany({ where: { id: { in: recipeIds } }, include: { ingredients: { include: { ingredient: true } } } });
    for (const r of recipes) {
      for (const ri of r.ingredients) {
        expect(ri.ingredient.allergens).not.toContain('gluten');
        expect(ri.ingredient.mayContain).not.toContain('gluten'); // allergie sévère : traces exclues
        expect(ri.ingredient.allergens).not.toContain('poissons');
        expect(['champignons', 'poivron']).not.toContain(ri.ingredient.slug);
      }
      expect(r.preparationTime + r.cookingTime).toBeLessThanOrEqual(60);
    }
  });

  it('calcule la liste de courses en déduisant le stock et en additionnant le budget', async () => {
    const res = await api(user).get(`/meal-plans/${plan.id}/shopping-list`);
    expect(res.status).toBe(200);
    const list = items(res.body);
    expect(list.length).toBeGreaterThan(0);
    expect(list.find((i) => i.name === 'Riz long')).toBeUndefined(); // couvert par le stock
    const sum = list.reduce((s, i) => s + (i.estimatedPriceCents ?? 0), 0);
    expect(res.body.totalCents).toBe(sum);
    expect(res.body.priceNotice).toMatch(/pas des prix garantis/);
    expect(res.body.pricesUpdatedAt).toBe('2026-10-26');
    expect(plan.estimatedCostCents).toBe(sum);
    const keys = list.filter((i) => i.ingredientId).map((i) => `${i.ingredientId}|${i.unit}`);
    expect(new Set(keys).size).toBe(keys.length); // ingrédients regroupés, sans doublon
  });

  it('recalcule courses et budget quand les portions changent', async () => {
    const before = (await api(user).get(`/meal-plans/${plan.id}/shopping-list`)).body.totalCents;
    const meal = plan.days[0].meals[0];
    const res = await api(user).patch(`/meal-plans/${plan.id}/meals/${meal.id}`, { servings: 8 });
    expect(res.status).toBe(200);
    expect(res.body.days[0].meals.find((m: any) => m.id === meal.id).servings).toBe(8);
    const after = (await api(user).get(`/meal-plans/${plan.id}/shopping-list`)).body.totalCents;
    expect(after).toBeGreaterThan(before);
  });

  it('remplace un repas par une alternative compatible et refuse une recette dangereuse', async () => {
    const meal = plan.days[1].meals[1];
    const replaced = await api(user).post(`/meal-plans/${plan.id}/meals/${meal.id}/replace`);
    expect(replaced.status).toBe(201);
    const newMeal = replaced.body.days[1].meals.find((m: any) => m.id === meal.id);
    expect(newMeal.recipe.id).not.toBe(meal.recipe.id);
    expect(newMeal.conflicts).toEqual([]);

    const pasta = await prisma.recipe.findUniqueOrThrow({ where: { slug: 'pates-sauce-tomate' } });
    const refused = await api(user).patch(`/meal-plans/${plan.id}/meals/${meal.id}`, { recipeId: pasta.id });
    expect(refused.status).toBe(422);
    expect(refused.body.error).toBe('RECIPE_NOT_ALLOWED');
    expect(refused.body.details.reasons.join(' ')).toMatch(/gluten/);
  });

  it('déplace un repas uniquement dans la période du planning', async () => {
    const meal = plan.days[2].meals[0];
    const moved = await api(user).patch(`/meal-plans/${plan.id}/meals/${meal.id}`, { date: '2026-11-08', mealType: 'diner' });
    expect(moved.status).toBe(200);
    expect(moved.body.days[6].meals.map((m: any) => m.id)).toContain(meal.id);
    const out = await api(user).patch(`/meal-plans/${plan.id}/meals/${meal.id}`, { date: '2026-12-25' });
    expect(out.status).toBe(400);
    expect(out.body.error).toBe('DATE_OUT_OF_PLAN');
  });

  it('gère les articles manuels, les quantités modifiées et les achats lors d’un recalcul', async () => {
    let list = (await api(user).post(`/meal-plans/${plan.id}/shopping-list/items`, { name: 'Café moulu', quantity: 1, unit: 'piece', category: 'epicerie', estimatedPriceCents: 450 })).body;
    expect(items(list).find((i) => i.name === 'Café moulu')).toMatchObject({ isManual: true, estimatedPriceCents: 450 });
    const auto = items(list).find((i) => !i.isManual && i.estimatedPriceCents);
    list = (await api(user).patch(`/meal-plans/${plan.id}/shopping-list/items/${auto.id}`, { quantity: auto.quantity * 3, isPurchased: true })).body;
    const edited = items(list).find((i) => i.id === auto.id);
    expect(edited.estimatedPriceCents).toBeGreaterThanOrEqual(auto.estimatedPriceCents);
    expect(list.purchasedCents).toBe(edited.estimatedPriceCents);

    list = (await api(user).post(`/meal-plans/${plan.id}/shopping-list/recalculate`)).body;
    expect(items(list).find((i) => i.name === 'Café moulu')).toBeDefined();
    expect(items(list).find((i) => i.ingredientId === auto.ingredientId)).toMatchObject({ quantity: auto.quantity * 3, isPurchased: true });
  });

  it('met à jour le tableau de bord et le suivi quand un repas est réalisé', async () => {
    const meal = plan.days[0].meals[0];
    await api(user).patch(`/meal-plans/${plan.id}/meals/${meal.id}`, { completed: true });
    const dash = (await api(user).get('/dashboard')).body;
    expect(dash.plan).toMatchObject({ id: plan.id, completedCount: 1, mealCount: 14 });
    expect(dash.displayName).toBe('Camille');
    const history = (await api(user).get('/meal-plans')).body;
    expect(history[0]).toMatchObject({ id: plan.id, completedCount: 1 });
  });

  it('archive l’ancien planning lors d’une nouvelle génération', async () => {
    const res = await api(user).post('/meal-plans/generate', { startDate: '2026-11-09', days: 3 });
    expect(res.status).toBe(201);
    expect(res.body.days).toHaveLength(3);
    expect((await api(user).get('/meal-plans/current')).body.plan.id).toBe(res.body.id);
    expect((await api(user).get(`/meal-plans/${plan.id}`)).body.archived).toBe(true);
  });
});

describe('Budget et cas impossibles', () => {
  it('signale un budget insuffisant avec des ajustements au lieu de prétendre que c’est réalisable', async () => {
    const u = await makeUser();
    await api(u).put('/me/profile', { ...PROFILE, weeklyBudgetCents: 500 });
    const res = await api(u).post('/meal-plans/generate', { startDate: START, seed: 1 });
    expect(res.status).toBe(201);
    expect(res.body.feasible).toBe(false);
    expect(res.body.issues.map((i: any) => i.code)).toContain('BUDGET_INSUFFICIENT');
    expect(res.body.suggestions.length).toBeGreaterThan(0);
  });

  it('renvoie une erreur compréhensible et des pistes quand aucune recette ne convient', async () => {
    const u = await makeUser();
    await api(u).put('/me/profile', { ...PROFILE, cookingTimePreference: 5, equipment: ['air_fryer'], diets: ['vegan'] });
    const res = await api(u).post('/meal-plans/generate', { startDate: START });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('PLAN_GENERATION_FAILED');
    expect(res.body.message).toMatch(/Aucune recette/);
    expect(res.body.details.suggestions.length).toBeGreaterThan(0);
  });
});

describe('Catalogue et favoris', () => {
  it('filtre les recettes et masque par défaut celles qui sont incompatibles', async () => {
    const u = await makeUser();
    await api(u).put('/me/profile', { ...PROFILE, diets: ['vegan'] });
    const all = (await api(u).get('/recipes?compatibleOnly=false')).body;
    const compatible = (await api(u).get('/recipes')).body;
    expect(all.length).toBeGreaterThanOrEqual(40);
    expect(compatible.length).toBeLessThan(all.length);
    expect(compatible.every((r: any) => r.compatibility.allowed)).toBe(true);
    const quick = (await api(u).get('/recipes?maxTime=10&compatibleOnly=false')).body;
    expect(quick.length).toBeGreaterThan(0);
    expect(quick.every((r: any) => r.totalTime <= 10)).toBe(true);
    const search = (await api(u).get('/recipes?search=quiche&compatibleOnly=false')).body;
    expect(search.map((r: any) => r.name)).toEqual(['Quiche épinards et feta', 'Quiche lorraine']);
    expect((await api(u).get('/recipes?maxTime=abc')).status).toBe(400);
  });

  it('adapte les quantités au nombre de portions et gère les favoris', async () => {
    const u = await makeUser();
    const quiche = await prisma.recipe.findUniqueOrThrow({ where: { slug: 'quiche-lorraine' } });
    const detail = (await api(u).get(`/recipes/${quiche.id}?servings=3`)).body;
    expect(detail.baseServings).toBe(6);
    expect(detail.ingredients.find((i: any) => i.name === 'Lardons').quantity).toBe(100);
    expect(detail.cost.isEstimate).toBe(true);
    expect(detail.instructions.length).toBeGreaterThan(2);

    await api(u).post(`/recipes/${quiche.id}/favorite`);
    expect((await api(u).get('/recipes?favoritesOnly=true&compatibleOnly=false')).body.map((r: any) => r.id)).toEqual([quiche.id]);
    await api(u).delete(`/recipes/${quiche.id}/favorite`);
    expect((await api(u).get('/recipes?favoritesOnly=true')).body).toEqual([]);
  });

  it('renvoie des idées du catalogue lorsque l’IA n’est pas configurée (repli)', async () => {
    const u = await makeUser();
    await api(u).put('/me/profile', PROFILE);
    await api(u).post('/me/inventory', { ingredientId: await ingredientId('lentilles-corail'), quantity: 500, unit: 'g' });
    const res = await api(u).post('/ai/recipe-ideas', { mealType: 'diner' });
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('catalogue');
    expect(res.body.ideas[0].ingredients.map((i: any) => i.name)).toContain('Lentilles corail sèches');
  });
});

describe('Permissions entre utilisateurs', () => {
  let alice: TestUser;
  let bob: TestUser;
  let plan: any;

  beforeAll(async () => {
    alice = await makeUser();
    bob = await makeUser();
    await api(alice).put('/me/profile', PROFILE);
    await api(bob).put('/me/profile', PROFILE);
    plan = (await api(alice).post('/meal-plans/generate', { startDate: START })).body;
  });

  it('empêche Bob de lire ou modifier le planning d’Alice', async () => {
    const meal = plan.days[0].meals[0];
    expect((await api(bob).get(`/meal-plans/${plan.id}`)).status).toBe(404);
    expect((await api(bob).patch(`/meal-plans/${plan.id}/meals/${meal.id}`, { servings: 9 })).status).toBe(404);
    expect((await api(bob).post(`/meal-plans/${plan.id}/meals/${meal.id}/replace`)).status).toBe(404);
    expect((await api(bob).get(`/meal-plans/${plan.id}/meals/${meal.id}/alternatives`)).status).toBe(404);
    expect((await api(bob).get('/meal-plans/current')).body.plan).toBeNull();
    expect((await api(alice).get(`/meal-plans/${plan.id}`)).body.days[0].meals[0].servings).toBe(meal.servings);
  });

  it('empêche Bob d’accéder à la liste de courses et au stock d’Alice', async () => {
    const item = items((await api(alice).get(`/meal-plans/${plan.id}/shopping-list`)).body)[0];
    expect((await api(bob).get(`/meal-plans/${plan.id}/shopping-list`)).status).toBe(404);
    expect((await api(bob).patch(`/meal-plans/${plan.id}/shopping-list/items/${item.id}`, { isPurchased: true })).status).toBe(404);
    expect((await api(bob).delete(`/meal-plans/${plan.id}/shopping-list/items/${item.id}`)).status).toBe(404);
    expect((await api(bob).post(`/meal-plans/${plan.id}/shopping-list/items`, { name: 'x', quantity: 1, unit: 'g', category: 'autres' })).status).toBe(404);

    const inv = (await api(alice).post('/me/inventory', { ingredientId: await ingredientId('riz'), quantity: 1, unit: 'kg' })).body;
    expect((await api(bob).delete(`/me/inventory/${inv[0].id}`)).status).toBe(404);
    expect((await api(bob).get('/me/inventory')).body).toEqual([]);
  });

  it('isole les mesures de poids et objectifs', async () => {
    const weights = (await api(alice).post('/progress/weights', { date: '2026-11-01', weightKg: 64.5 })).body;
    expect((await api(bob).delete(`/progress/weights/${weights[0].id}`)).status).toBe(404);
    const goals = (await api(alice).post('/progress/goals', { title: 'Cuisiner 3 soirs par semaine' })).body;
    expect((await api(bob).patch(`/progress/goals/${goals[0].id}`, { done: true })).status).toBe(404);
    expect((await api(bob).get('/progress')).body).toMatchObject({ weights: [], goals: [] });
  });
});

describe('Erreurs de l’API', () => {
  it('renvoie un format d’erreur cohérent', async () => {
    const u = await makeUser();
    const badId = await api(u).get('/meal-plans/pas-un-uuid');
    expect(badId.status).toBe(400);
    expect(badId.body).toMatchObject({ statusCode: 400, message: expect.any(String) });
    const missing = await api(u).get('/meal-plans/7f3a1b2c-4d5e-4f60-8a1b-2c3d4e5f6a7b');
    expect(missing.body).toEqual({ statusCode: 404, error: 'NOT_FOUND', message: 'Planning introuvable.' });
    const route = await api(u).get('/route-inexistante');
    expect(route.status).toBe(404);
    expect(route.body.message).toBe('Ressource introuvable.');
  });

  it('limite les requêtes sensibles', async () => {
    const u = await makeUser();
    const codes: number[] = [];
    for (let i = 0; i < 4; i++) codes.push((await api(u).get('/me/export')).status);
    expect(codes).toEqual([200, 200, 200, 429]);
  });
});

describe('RGPD : export et suppression', () => {
  it('exporte puis supprime toutes les données de l’utilisateur', async () => {
    const u = await makeUser();
    await api(u).put('/me/profile', PROFILE);
    await api(u).put('/me/allergies', { allergies: [{ allergen: 'lait' }] });
    const plan = (await api(u).post('/meal-plans/generate', { startDate: START })).body;

    const exp = (await api(u).get('/me/export')).body;
    expect(exp.data).toMatchObject({ id: u.id, email: u.email, profile: { age: 34 } });
    expect(exp.data.mealPlans).toHaveLength(1);
    expect(exp.data.allergies[0].allergen).toBe('lait');

    const del = await api(u).delete('/me');
    expect(del.status).toBe(200);
    expect(del.body).toMatchObject({ dataDeleted: true, authAccountDeleted: false });
    expect(await prisma.user.count({ where: { id: u.id } })).toBe(0);
    expect(await prisma.mealPlan.count({ where: { id: plan.id } })).toBe(0);
    expect(await prisma.shoppingList.count({ where: { mealPlanId: plan.id } })).toBe(0);
    expect(await prisma.recipe.count()).toBeGreaterThanOrEqual(40); // le catalogue commun est intact
  });
});
