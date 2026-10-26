import { MEAL_TYPE_LABELS, mealTypesForCount, MEAL_TYPES, type MealType } from '@nutriplan/core';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Button, Card, Chip, ChipGroup, ErrorState, FieldLabel, IconButton, Loading, Notice, Row, Screen, SectionHeader } from '../../../src/components/ui';
import { errorMessage } from '../../../src/lib/api';
import { capitalize, formatDayLong, formatDayShort, formatEuros, formatMinutes } from '../../../src/lib/format';
import { useAlternatives, usePlan, useRecipe, useReplaceMeal, useToggleFavorite, useUpdateMeal } from '../../../src/lib/queries';
import { colors, spacing } from '../../../src/theme/tokens';
import { RecipeDetailView } from '../../../src/components/recipe-detail';

export default function MealScreen() {
  const { planId, mealId } = useLocalSearchParams<{ planId: string; mealId: string }>();
  const plan = usePlan(planId);
  const meal = plan.data?.days.flatMap((d) => d.meals).find((m) => m.id === mealId);
  const recipe = useRecipe(meal?.recipe.id ?? '', meal?.servings);
  const update = useUpdateMeal(planId);
  const replace = useReplaceMeal(planId);
  const favorite = useToggleFavorite();
  const [mode, setMode] = useState<'none' | 'move' | 'replace'>('none');
  const alternatives = useAlternatives(planId, mealId, mode === 'replace');
  const [error, setError] = useState<string | null>(null);

  if (plan.isLoading) return <Loading />;
  if (plan.isError) return <Screen><ErrorState message={errorMessage(plan.error)} onRetry={plan.refetch} /></Screen>;
  if (!meal) return <Screen><ErrorState message="Ce repas n’existe plus dans votre programme." /></Screen>;
  const onError = (e: unknown) => setError(errorMessage(e));
  const busy = update.isPending || replace.isPending;

  return (
    <Screen
      footer={
        <Button
          label={meal.completed ? 'Marquer comme non réalisé' : 'J’ai préparé ce repas'}
          icon={meal.completed ? 'arrow-undo-outline' : 'checkmark-circle-outline'}
          variant={meal.completed ? 'secondary' : 'primary'}
          loading={update.isPending}
          onPress={() => update.mutate({ mealId, completed: !meal.completed }, { onError })}
        />
      }
    >
      <Stack.Screen
        options={{
          title: `${MEAL_TYPE_LABELS[meal.mealType]} · ${formatDayShort(meal.date).weekday} ${formatDayShort(meal.date).day}`,
          headerRight: () => (
            <IconButton
              icon={meal.recipe.isFavorite ? 'heart' : 'heart-outline'}
              color={meal.recipe.isFavorite ? colors.danger : colors.primary}
              label={meal.recipe.isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              onPress={() => favorite.mutate({ recipeId: meal.recipe.id, favorite: !meal.recipe.isFavorite })}
            />
          ),
        }}
      />
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {meal.conflicts.length > 0 ? (
        <Notice tone="warning" title="Ce repas ne respecte plus vos contraintes">
          {`${meal.conflicts.join(' ')} Remplacez-le ci-dessous.`}
        </Notice>
      ) : null}

      <Row gap={spacing.sm} style={{ marginBottom: spacing.lg }}>
        <View style={{ flex: 1 }}>
          <Button small variant={mode === 'replace' ? 'primary' : 'secondary'} icon="swap-horizontal" label="Remplacer" onPress={() => setMode(mode === 'replace' ? 'none' : 'replace')} />
        </View>
        <View style={{ flex: 1 }}>
          <Button small variant={mode === 'move' ? 'primary' : 'secondary'} icon="calendar-outline" label="Déplacer" onPress={() => setMode(mode === 'move' ? 'none' : 'move')} />
        </View>
      </Row>

      {mode === 'replace' ? (
        <Card style={{ marginBottom: spacing.lg }}>
          <AppText variant="bodyStrong" style={{ marginBottom: spacing.sm }}>
            Choisir une autre recette
          </AppText>
          <AppText variant="small" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
            Toutes les propositions respectent vos allergies, votre régime et vos exclusions. La liste de courses sera recalculée.
          </AppText>
          {alternatives.isLoading ? <AppText color={colors.textMuted}>Recherche d’alternatives…</AppText> : null}
          {alternatives.isError ? <Notice tone="danger">{errorMessage(alternatives.error)}</Notice> : null}
          {alternatives.data?.length === 0 ? <AppText color={colors.textMuted}>Aucune autre recette compatible pour ce repas.</AppText> : null}
          {alternatives.data?.map((a) => (
            <Card key={a.id} onPress={() => !busy && update.mutate({ mealId, recipeId: a.id }, { onSuccess: () => setMode('none'), onError })} accessibilityLabel={`Remplacer par ${a.name}`} style={{ marginBottom: spacing.sm, padding: spacing.md }}>
              <AppText variant="bodyStrong">{a.name}</AppText>
              <AppText variant="small" color={colors.textMuted}>
                {formatMinutes(a.totalTime)} · ≈ {formatEuros(a.costCents)} pour {meal.servings} portion{meal.servings > 1 ? 's' : ''}
              </AppText>
            </Card>
          ))}
          <Button small variant="ghost" icon="shuffle" label="Laisser NutriPlan choisir" loading={replace.isPending} onPress={() => replace.mutate(mealId, { onSuccess: () => setMode('none'), onError })} />
        </Card>
      ) : null}

      {mode === 'move' && plan.data ? (
        <MovePanel
          days={plan.data.days.map((d) => d.date)}
          current={{ date: meal.date, mealType: meal.mealType }}
          busy={busy}
          onMove={(date, mealType) => update.mutate({ mealId, date, mealType }, { onSuccess: () => setMode('none'), onError })}
        />
      ) : null}

      {recipe.data ? (
        <RecipeDetailView recipe={recipe.data} servings={meal.servings} onServings={(servings) => update.mutate({ mealId, servings }, { onError })} />
      ) : recipe.isError ? (
        <ErrorState message={errorMessage(recipe.error)} onRetry={recipe.refetch} />
      ) : (
        <Loading />
      )}
      <SectionHeader title="" />
      <Button variant="ghost" label="Voir la liste de courses" icon="basket-outline" onPress={() => router.push('/(tabs)/shopping')} />
    </Screen>
  );
}

function MovePanel({ days, current, busy, onMove }: { days: string[]; current: { date: string; mealType: MealType }; busy: boolean; onMove: (date: string, mealType: MealType) => void }) {
  const [date, setDate] = useState(current.date);
  const [mealType, setMealType] = useState<MealType>(current.mealType);
  const slots = MEAL_TYPES.filter((t) => mealTypesForCount(5).includes(t));
  return (
    <Card style={{ marginBottom: spacing.lg }}>
      <FieldLabel label="Jour" />
      <ChipGroup>
        {days.map((d) => (
          <Chip key={d} label={capitalize(`${formatDayShort(d).weekday} ${formatDayShort(d).day}`)} selected={d === date} onPress={() => setDate(d)} />
        ))}
      </ChipGroup>
      <View style={{ height: spacing.md }} />
      <FieldLabel label="Repas" />
      <ChipGroup>
        {slots.map((t) => (
          <Chip key={t} label={MEAL_TYPE_LABELS[t]} selected={t === mealType} onPress={() => setMealType(t)} />
        ))}
      </ChipGroup>
      <View style={{ height: spacing.md }} />
      <Button
        label={`Déplacer au ${formatDayLong(date)}`}
        disabled={date === current.date && mealType === current.mealType}
        loading={busy}
        onPress={() => onMove(date, mealType)}
      />
    </Card>
  );
}
