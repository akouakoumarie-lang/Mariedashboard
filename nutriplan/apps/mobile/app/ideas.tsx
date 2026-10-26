import { MEAL_TYPE_LABELS, type MealType } from '@nutriplan/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Badge, Button, Card, Chip, ChipGroup, FieldLabel, Notice, Row, Screen, SectionHeader, TextField } from '../src/components/ui';
import { errorMessage } from '../src/lib/api';
import { formatAmount, formatEuros, formatMinutes } from '../src/lib/format';
import { useAiStatus, useInventory, useRecipeIdeas } from '../src/lib/queries';
import { colors, spacing } from '../src/theme/tokens';

const TYPES: MealType[] = ['petit_dejeuner', 'dejeuner', 'diner', 'gouter'];

export default function IdeasScreen() {
  const status = useAiStatus();
  const inventory = useInventory();
  const ideas = useRecipeIdeas();
  const [mealType, setMealType] = useState<MealType>('diner');
  const [note, setNote] = useState('');

  return (
    <Screen>
      <AppText color={colors.textMuted} style={{ marginBottom: spacing.md }}>
        Des idées de recettes à partir de ce que vous avez déjà, toujours vérifiées selon vos allergies et exclusions.
      </AppText>
      {status.data && !status.data.enabled ? (
        <Notice tone="info">Les idées par IA ne sont pas activées sur ce serveur : les suggestions viennent du catalogue de recettes.</Notice>
      ) : null}
      <Card>
        <AppText variant="small" color={colors.textMuted}>
          Dans vos placards : {inventory.data?.length ? inventory.data.map((i) => i.name).join(', ') : 'rien de déclaré'}
        </AppText>
        <Button small variant="ghost" label="Modifier mes placards" onPress={() => router.push('/settings/inventory')} />
      </Card>
      <View style={{ height: spacing.lg }} />
      <FieldLabel label="Pour quel repas ?" />
      <ChipGroup>
        {TYPES.map((t) => (
          <Chip key={t} label={MEAL_TYPE_LABELS[t]} selected={mealType === t} onPress={() => setMealType(t)} />
        ))}
      </ChipGroup>
      <View style={{ height: spacing.lg }} />
      <TextField label="Une envie particulière ?" optional placeholder="ex. plutôt léger, réconfortant…" value={note} onChangeText={setNote} maxLength={200} />
      <Button label="Trouver des idées" icon="sparkles-outline" loading={ideas.isPending} onPress={() => ideas.mutate({ mealType, note: note.trim() || undefined })} />

      {ideas.isError ? (
        <View style={{ marginTop: spacing.lg }}>
          <Notice tone="danger">{errorMessage(ideas.error)}</Notice>
        </View>
      ) : null}
      {ideas.data ? (
        <>
          <SectionHeader title="Suggestions" action={<Badge label={ideas.data.source === 'ai' ? 'Générées par IA' : 'Catalogue'} tone={ideas.data.source === 'ai' ? 'warning' : 'neutral'} />} />
          <Notice tone="info">{ideas.data.notice}</Notice>
          {ideas.data.ideas.length === 0 ? <AppText color={colors.textMuted}>Aucune idée compatible avec vos contraintes pour ce repas.</AppText> : null}
          {ideas.data.ideas.map((idea, idx) => (
            <Card key={idx} style={{ marginBottom: spacing.md }} onPress={idea.recipeId ? () => router.push(`/recipe/${idea.recipeId}`) : undefined} accessibilityLabel={idea.name}>
              <AppText variant="heading">{idea.name}</AppText>
              {idea.description ? <AppText color={colors.textMuted}>{idea.description}</AppText> : null}
              <AppText variant="small" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
                {formatMinutes(idea.totalTime)} · {idea.servings} portion{idea.servings > 1 ? 's' : ''}
                {idea.estimatedCostCents != null ? ` · ≈ ${formatEuros(idea.estimatedCostCents)}` : ''}
                {idea.kcalPerServing != null ? ` · ≈ ${idea.kcalPerServing} kcal/portion` : ''}
              </AppText>
              <View style={{ marginTop: spacing.sm }}>
                {idea.ingredients.map((i) => (
                  <Row key={i.ingredientId} style={{ justifyContent: 'space-between' }}>
                    <AppText variant="small">{i.name}</AppText>
                    <AppText variant="small">{formatAmount(i.quantity, i.unit)}</AppText>
                  </Row>
                ))}
              </View>
              {idea.steps.map((s, i) => (
                <AppText key={i} variant="small" style={{ marginTop: spacing.xs }}>
                  {i + 1}. {s}
                </AppText>
              ))}
              {idea.warnings.map((w) => (
                <AppText key={w} variant="small" color={colors.warning} style={{ marginTop: spacing.xs }}>
                  {w}
                </AppText>
              ))}
              {idea.recipeId ? (
                <AppText variant="small" color={colors.primary} style={{ marginTop: spacing.sm, fontWeight: '600' }}>
                  Voir la recette →
                </AppText>
              ) : null}
            </Card>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
