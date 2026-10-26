import type {
  AllergiesInput,
  InventoryItemInput,
  ManualShoppingItemInput,
  MealType,
  PreferencesInput,
  ProfileInput,
  RecipeQuery,
  UpdatePlannedMealInput,
} from '@nutriplan/core';
import { keepPreviousData, QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from './api';
import type {
  AllergyItem,
  Alternative,
  Dashboard,
  EnergyEstimate,
  Ingredient,
  IngredientRef,
  InventoryItem,
  MealPlan,
  PlanHistoryItem,
  Profile,
  Progress,
  RecipeDetail,
  RecipeIdea,
  RecipeSummary,
  ShoppingList,
} from './types';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // On ne réessaie pas les erreurs « métier » (4xx) : seules les erreurs réseau/serveur.
      retry: (count, error) => count < 2 && (!(error instanceof ApiError) || error.status === 0 || error.status >= 500),
    },
  },
});

/* ─── Lectures ──────────────────────────────────────────────────────────── */

export const useAccount = (enabled = true) =>
  useQuery({ queryKey: ['me'], queryFn: () => api<{ id: string; email: string | null; hasProfile: boolean }>('/me'), enabled });

export const useProfile = () =>
  useQuery({ queryKey: ['profile'], queryFn: () => api<{ profile: Profile | null; energyEstimate: EnergyEstimate | null }>('/me/profile') });

export const usePreferences = () =>
  useQuery({ queryKey: ['preferences'], queryFn: () => api<{ liked: IngredientRef[]; disliked: IngredientRef[] }>('/me/preferences') });

export const useAllergies = () => useQuery({ queryKey: ['allergies'], queryFn: () => api<AllergyItem[]>('/me/allergies') });

export const useInventory = () => useQuery({ queryKey: ['inventory'], queryFn: () => api<InventoryItem[]>('/me/inventory') });

/** Catalogue d'ingrédients : public, utilisable avant l'inscription. */
export const useIngredients = (search: string) =>
  useQuery({
    queryKey: ['ingredients', search],
    queryFn: () => api<Ingredient[]>(`/ingredients${search ? `?search=${encodeURIComponent(search)}` : ''}`, { auth: false }),
    placeholderData: keepPreviousData,
    staleTime: 5 * 60_000,
  });

export function recipeQueryString(q: Partial<Record<keyof RecipeQuery, string | number | boolean | undefined>>): string {
  const params = Object.entries(q)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`);
  return params.length ? `?${params.join('&')}` : '';
}

export const useRecipes = (q: Parameters<typeof recipeQueryString>[0]) =>
  useQuery({ queryKey: ['recipes', q], queryFn: () => api<RecipeSummary[]>(`/recipes${recipeQueryString(q)}`), placeholderData: keepPreviousData });

export const useRecipe = (id: string, servings?: number) =>
  useQuery({
    queryKey: ['recipe', id, servings ?? null],
    queryFn: () => api<RecipeDetail>(`/recipes/${id}${servings ? `?servings=${servings}` : ''}`),
    enabled: !!id,
    placeholderData: keepPreviousData,
  });

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: () => api<Dashboard>('/dashboard') });

export const useCurrentPlan = () => useQuery({ queryKey: ['plan', 'current'], queryFn: async () => (await api<{ plan: MealPlan | null }>('/meal-plans/current')).plan });

export const usePlan = (id: string) => useQuery({ queryKey: ['plan', id], queryFn: () => api<MealPlan>(`/meal-plans/${id}`) });

export const usePlanHistory = () => useQuery({ queryKey: ['plans'], queryFn: () => api<PlanHistoryItem[]>('/meal-plans') });

export const useAlternatives = (planId: string, mealId: string, enabled: boolean) =>
  useQuery({ queryKey: ['alternatives', planId, mealId], queryFn: () => api<Alternative[]>(`/meal-plans/${planId}/meals/${mealId}/alternatives`), enabled });

export const useShoppingList = (planId: string | undefined) =>
  useQuery({ queryKey: ['shopping', planId], queryFn: () => api<ShoppingList>(`/meal-plans/${planId}/shopping-list`), enabled: !!planId });

export const useProgress = () => useQuery({ queryKey: ['progress'], queryFn: () => api<Progress>('/progress') });

export const useAiStatus = () => useQuery({ queryKey: ['ai-status'], queryFn: () => api<{ enabled: boolean }>('/ai/status') });

/* ─── Écritures ─────────────────────────────────────────────────────────── */

/** Après toute modification du planning, tout ce qui en dépend est rafraîchi. */
function invalidatePlanData(qc: QueryClient) {
  return Promise.all(['plan', 'plans', 'shopping', 'dashboard', 'progress', 'alternatives'].map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

export function useSaveProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ProfileInput) => api<{ profile: Profile; energyEstimate: EnergyEstimate | null }>('/me/profile', { method: 'PUT', body }),
    onSuccess: (data) => {
      qc.setQueryData(['profile'], data);
      void qc.invalidateQueries({ queryKey: ['me'] });
      void qc.invalidateQueries({ queryKey: ['dashboard'] });
      void qc.invalidateQueries({ queryKey: ['recipes'] });
    },
  });
}

export function useSavePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PreferencesInput) => api<{ liked: IngredientRef[]; disliked: IngredientRef[] }>('/me/preferences', { method: 'PUT', body }),
    onSuccess: (data) => {
      qc.setQueryData(['preferences'], data);
      void qc.invalidateQueries({ queryKey: ['recipes'] });
      void qc.invalidateQueries({ queryKey: ['plan'] });
    },
  });
}

export function useSaveAllergies() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: AllergiesInput) => api<AllergyItem[]>('/me/allergies', { method: 'PUT', body }),
    onSuccess: (data) => {
      qc.setQueryData(['allergies'], data);
      void qc.invalidateQueries({ queryKey: ['recipes'] });
      void qc.invalidateQueries({ queryKey: ['plan'] });
    },
  });
}

export function useNotificationSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (enabled: boolean) => api('/me/notifications', { method: 'PUT', body: { notificationsEnabled: enabled } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}

export function useInventoryMutations() {
  const qc = useQueryClient();
  const onSuccess = (data: InventoryItem[]) => {
    qc.setQueryData(['inventory'], data);
  };
  return {
    add: useMutation({ mutationFn: (body: InventoryItemInput) => api<InventoryItem[]>('/me/inventory', { method: 'POST', body }), onSuccess }),
    update: useMutation({
      mutationFn: ({ id, quantity }: { id: string; quantity: number }) => api<InventoryItem[]>(`/me/inventory/${id}`, { method: 'PATCH', body: { quantity } }),
      onSuccess,
    }),
    remove: useMutation({ mutationFn: (id: string) => api<InventoryItem[]>(`/me/inventory/${id}`, { method: 'DELETE' }), onSuccess }),
  };
}

export function useGeneratePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { startDate: string; days?: number }) => api<MealPlan>('/meal-plans/generate', { method: 'POST', body }),
    onSuccess: async (plan) => {
      qc.setQueryData(['plan', 'current'], plan);
      await invalidatePlanData(qc);
    },
  });
}

export function useUpdateMeal(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ mealId, ...body }: UpdatePlannedMealInput & { mealId: string }) =>
      api<MealPlan>(`/meal-plans/${planId}/meals/${mealId}`, { method: 'PATCH', body }),
    onSuccess: async (plan) => {
      qc.setQueryData(['plan', planId], plan);
      await invalidatePlanData(qc);
    },
  });
}

export function useReplaceMeal(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (mealId: string) => api<MealPlan>(`/meal-plans/${planId}/meals/${mealId}/replace`, { method: 'POST' }),
    onSuccess: async (plan) => {
      qc.setQueryData(['plan', planId], plan);
      await invalidatePlanData(qc);
    },
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ recipeId, favorite }: { recipeId: string; favorite: boolean }) =>
      api(`/recipes/${recipeId}/favorite`, { method: favorite ? 'POST' : 'DELETE' }),
    onSuccess: () => Promise.all(['recipes', 'recipe', 'dashboard', 'plan'].map((k) => qc.invalidateQueries({ queryKey: [k] }))),
  });
}

export function useShoppingMutations(planId: string) {
  const qc = useQueryClient();
  const onSuccess = async (list: ShoppingList) => {
    qc.setQueryData(['shopping', planId], list);
    await qc.invalidateQueries({ queryKey: ['dashboard'] });
  };
  return {
    toggle: useMutation({
      mutationFn: ({ itemId, isPurchased }: { itemId: string; isPurchased: boolean }) =>
        api<ShoppingList>(`/meal-plans/${planId}/shopping-list/items/${itemId}`, { method: 'PATCH', body: { isPurchased } }),
      // Mise à jour optimiste : la case se coche immédiatement.
      onMutate: async ({ itemId, isPurchased }) => {
        await qc.cancelQueries({ queryKey: ['shopping', planId] });
        const previous = qc.getQueryData<ShoppingList>(['shopping', planId]);
        if (previous) {
          qc.setQueryData<ShoppingList>(['shopping', planId], {
            ...previous,
            groups: previous.groups.map((g) => ({ ...g, items: g.items.map((i) => (i.id === itemId ? { ...i, isPurchased } : i)) })),
          });
        }
        return { previous };
      },
      onError: (_e, _v, ctx) => ctx?.previous && qc.setQueryData(['shopping', planId], ctx.previous),
      onSuccess,
    }),
    setQuantity: useMutation({
      mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
        api<ShoppingList>(`/meal-plans/${planId}/shopping-list/items/${itemId}`, { method: 'PATCH', body: { quantity } }),
      onSuccess,
    }),
    add: useMutation({
      mutationFn: (body: ManualShoppingItemInput) => api<ShoppingList>(`/meal-plans/${planId}/shopping-list/items`, { method: 'POST', body }),
      onSuccess,
    }),
    remove: useMutation({
      mutationFn: (itemId: string) => api<ShoppingList>(`/meal-plans/${planId}/shopping-list/items/${itemId}`, { method: 'DELETE' }),
      onSuccess,
    }),
    recalculate: useMutation({
      mutationFn: () => api<ShoppingList>(`/meal-plans/${planId}/shopping-list/recalculate`, { method: 'POST' }),
      onSuccess,
    }),
  };
}

export function useProgressMutations() {
  const qc = useQueryClient();
  const onSuccess = () => qc.invalidateQueries({ queryKey: ['progress'] });
  return {
    addWeight: useMutation({ mutationFn: (body: { date: string; weightKg: number }) => api('/progress/weights', { method: 'POST', body }), onSuccess }),
    removeWeight: useMutation({ mutationFn: (id: string) => api(`/progress/weights/${id}`, { method: 'DELETE' }), onSuccess }),
    addGoal: useMutation({ mutationFn: (title: string) => api('/progress/goals', { method: 'POST', body: { title } }), onSuccess }),
    toggleGoal: useMutation({ mutationFn: ({ id, done }: { id: string; done: boolean }) => api(`/progress/goals/${id}`, { method: 'PATCH', body: { done } }), onSuccess }),
    removeGoal: useMutation({ mutationFn: (id: string) => api(`/progress/goals/${id}`, { method: 'DELETE' }), onSuccess }),
  };
}

export const useRecipeIdeas = () =>
  useMutation({
    mutationFn: (body: { mealType: MealType; note?: string }) =>
      api<{ source: 'ai' | 'catalogue'; notice: string; ideas: RecipeIdea[] }>('/ai/recipe-ideas', { method: 'POST', body }),
  });

/** Version web autonome : où les données sont enregistrées (espace personnel, appareil ou mémoire). */
export const useStorageKind = (enabled: boolean) =>
  useQuery({
    queryKey: ['storage-kind'],
    queryFn: async () => (await import('./local/store')).storageKind(),
    enabled,
    staleTime: Infinity,
  });
