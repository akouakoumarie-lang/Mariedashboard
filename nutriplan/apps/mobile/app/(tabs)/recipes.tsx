import Ionicons from '@expo/vector-icons/Ionicons';
import { DIET_LABELS, DIETS, RECIPE_CATEGORIES, RECIPE_CATEGORY_LABELS, type Diet, type RecipeCategory } from '@nutriplan/core';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { RecipeImage } from '../../src/components/food';
import { AppText, Badge, Card, Chip, ChipGroup, EmptyState, ErrorState, Loading, Row, Screen, TextField } from '../../src/components/ui';
import { errorMessage } from '../../src/lib/api';
import { formatEuros, formatMinutes } from '../../src/lib/format';
import { useIngredients, useRecipes } from '../../src/lib/queries';
import { colors, spacing } from '../../src/theme/tokens';

const TIMES = [15, 30, 45];
const BUDGETS = [100, 200, 300];

/** Petite temporisation de la recherche pour limiter les requêtes. */
function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

export default function RecipesScreen() {
  const params = useLocalSearchParams<{ favorites?: string }>();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<RecipeCategory | undefined>();
  const [maxTime, setMaxTime] = useState<number | undefined>();
  const [maxCost, setMaxCost] = useState<number | undefined>();
  const [diet, setDiet] = useState<Diet | undefined>();
  const [favoritesOnly, setFavoritesOnly] = useState(params.favorites === '1');
  const [showAll, setShowAll] = useState(false);
  const [ingredient, setIngredient] = useState<{ id: string; name: string } | null>(null);
  const [ingredientSearch, setIngredientSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (params.favorites === '1') setFavoritesOnly(true);
  }, [params.favorites]);

  const debounced = useDebounced(search.trim());
  const ingredientQuery = useDebounced(ingredientSearch.trim());
  const ingredients = useIngredients(ingredientQuery);
  const recipes = useRecipes({
    search: debounced || undefined,
    category,
    maxTime,
    maxCostPerServingCents: maxCost,
    diet,
    ingredientId: ingredient?.id,
    favoritesOnly: favoritesOnly || undefined,
    compatibleOnly: showAll ? false : undefined,
  });
  const activeFilters = [category, maxTime, maxCost, diet, ingredient].filter(Boolean).length + (showAll ? 1 : 0);

  return (
    <Screen>
      <TextField label="Rechercher une recette" placeholder="ex. curry, quiche, salade…" value={search} onChangeText={setSearch} returnKeyType="search" />
      <Row gap={spacing.sm} style={{ marginBottom: spacing.md, flexWrap: 'wrap' }}>
        <Chip label={showFilters ? 'Masquer les filtres' : `Filtres${activeFilters ? ` (${activeFilters})` : ''}`} icon="options-outline" selected={showFilters} onPress={() => setShowFilters(!showFilters)} />
        <Chip label="Favoris" icon="heart" selected={favoritesOnly} onPress={() => setFavoritesOnly(!favoritesOnly)} />
        <Chip label="Idées avec mes placards" icon="sparkles-outline" onPress={() => router.push('/ideas')} />
      </Row>

      {showFilters ? (
        <Card style={{ marginBottom: spacing.lg, gap: spacing.md }}>
          <FilterGroup title="Catégorie">
            {RECIPE_CATEGORIES.map((c) => (
              <Chip key={c} label={RECIPE_CATEGORY_LABELS[c]} selected={category === c} onPress={() => setCategory(category === c ? undefined : c)} />
            ))}
          </FilterGroup>
          <FilterGroup title="Temps total">
            {TIMES.map((t) => (
              <Chip key={t} label={`≤ ${t} min`} selected={maxTime === t} onPress={() => setMaxTime(maxTime === t ? undefined : t)} />
            ))}
          </FilterGroup>
          <FilterGroup title="Budget par portion">
            {BUDGETS.map((b) => (
              <Chip key={b} label={`≤ ${formatEuros(b)}`} selected={maxCost === b} onPress={() => setMaxCost(maxCost === b ? undefined : b)} />
            ))}
          </FilterGroup>
          <FilterGroup title="Régime">
            {DIETS.map((d) => (
              <Chip key={d} label={DIET_LABELS[d]} selected={diet === d} onPress={() => setDiet(diet === d ? undefined : d)} />
            ))}
          </FilterGroup>
          <View>
            <AppText variant="small" color={colors.textMuted} style={{ marginBottom: spacing.xs }}>
              Ingrédient
            </AppText>
            {ingredient ? (
              <ChipGroup>
                <Chip label={`${ingredient.name}  ✕`} selected onPress={() => setIngredient(null)} />
              </ChipGroup>
            ) : (
              <>
                <TextField label="Contient l’ingrédient" placeholder="ex. lentilles" value={ingredientSearch} onChangeText={setIngredientSearch} />
                {ingredientQuery ? (
                  <ChipGroup>
                    {(ingredients.data ?? []).slice(0, 6).map((i) => (
                      <Chip key={i.id} label={i.name} onPress={() => {
                        setIngredient({ id: i.id, name: i.name });
                        setIngredientSearch('');
                      }} />
                    ))}
                  </ChipGroup>
                ) : null}
              </>
            )}
          </View>
          <Chip label="Afficher aussi les recettes incompatibles avec mon profil" selected={showAll} onPress={() => setShowAll(!showAll)} />
        </Card>
      ) : null}

      {recipes.isLoading ? <Loading label="Chargement des recettes…" /> : null}
      {recipes.isError ? <ErrorState message={errorMessage(recipes.error)} onRetry={recipes.refetch} /> : null}
      {recipes.data && recipes.data.length === 0 ? (
        <EmptyState
          icon="search-outline"
          title="Aucune recette trouvée"
          message={favoritesOnly ? 'Vous n’avez pas encore de favori correspondant à ces critères.' : 'Essayez d’élargir vos filtres ou votre recherche.'}
        />
      ) : null}
      {recipes.data && recipes.data.length > 0 ? (
        <AppText variant="small" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
          {recipes.data.length} recette{recipes.data.length > 1 ? 's' : ''} · catalogue de démonstration
        </AppText>
      ) : null}
      {(recipes.data ?? []).map((r) => (
        <Card key={r.id} onPress={() => router.push(`/recipe/${r.id}`)} accessibilityLabel={r.name} style={{ marginBottom: spacing.sm, padding: spacing.md }}>
          <Row gap={spacing.md}>
            <RecipeImage category={r.category} imageUrl={r.imageUrl} name={r.name} size={72} />
            <View style={{ flex: 1, gap: 2 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <AppText variant="caption" color={colors.textMuted}>
                  {RECIPE_CATEGORY_LABELS[r.category].toUpperCase()}
                </AppText>
                {r.isFavorite ? <Ionicons name="heart" size={16} color={colors.danger} accessibilityLabel="Favori" /> : null}
              </Row>
              <AppText variant="bodyStrong" numberOfLines={2}>
                {r.name}
              </AppText>
              <AppText variant="small" color={colors.textMuted}>
                {formatMinutes(r.totalTime)}
                {r.costPerServingCents != null ? ` · ≈ ${formatEuros(r.costPerServingCents)} / portion` : ''}
                {r.nutritionPerServing.complete ? ` · ≈ ${r.nutritionPerServing.kcal} kcal` : ''}
              </AppText>
              {!r.compatibility.allowed ? <Badge tone="warning" label="Incompatible avec votre profil" /> : null}
            </View>
          </Row>
        </Card>
      ))}
    </Screen>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <AppText variant="small" color={colors.textMuted} style={{ marginBottom: spacing.xs }}>
        {title}
      </AppText>
      <ChipGroup>{children}</ChipGroup>
    </View>
  );
}

