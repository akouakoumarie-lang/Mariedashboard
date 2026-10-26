import Ionicons from '@expo/vector-icons/Ionicons';
import { GOAL_LABELS, RECIPE_CATEGORY_LABELS, weightEntrySchema } from '@nutriplan/core';
import { useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { BarChart, StatTile } from '../../src/components/food';
import { AppText, Button, Card, ErrorState, IconButton, Loading, Notice, NumberField, Row, Screen, SectionHeader, TextField } from '../../src/components/ui';
import { errorMessage } from '../../src/lib/api';
import { localToday } from '../../src/lib/format';
import { useProgress, useProgressMutations } from '../../src/lib/queries';
import { colors, spacing } from '../../src/theme/tokens';

export default function ProgressScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useProgress();
  const m = useProgressMutations();
  const [goalTitle, setGoalTitle] = useState('');
  const [showWeight, setShowWeight] = useState(false);
  const [weight, setWeight] = useState<number | null>(null);
  const [weightError, setWeightError] = useState<string | undefined>();

  if (isLoading) return <Loading label="Chargement du suivi…" />;
  if (isError || !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={refetch} /></Screen>;

  const addWeight = () => {
    const parsed = weightEntrySchema.safeParse({ date: localToday(), weightKg: weight });
    if (!parsed.success) return setWeightError(parsed.error.issues[0]?.message ?? 'Valeur invalide.');
    setWeightError(undefined);
    m.addWeight.mutate(parsed.data, { onSuccess: () => setWeight(null) });
  };

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}>
      <Notice tone="success">{data.message}</Notice>
      {data.goal ? (
        <AppText color={colors.textMuted} style={{ marginBottom: spacing.md }}>
          Objectif : {GOAL_LABELS[data.goal]}
        </AppText>
      ) : null}
      <Row gap={spacing.sm} style={{ alignItems: 'stretch' }}>
        <StatTile label="Repas préparés" value={String(data.completedMeals)} hint="8 dernières semaines" />
        <StatTile label="Repas végétariens" value={String(data.habits.vegetarianMeals)} hint="parmi les préparés" />
        <StatTile label="Programmes" value={String(data.plansCount)} hint="créés au total" />
      </Row>

      <SectionHeader title="Repas préparés par semaine" />
      <Card>
        <BarChart
          label="Repas préparés par semaine, comparés aux repas prévus"
          data={data.weeks.map((w) => ({ label: `${w.weekStart.slice(8, 10)}/${w.weekStart.slice(5, 7)}`, value: w.completed, secondary: w.planned }))}
        />
        <Row gap={spacing.md} style={{ marginTop: spacing.md }}>
          <Row gap={spacing.xs}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.primary }} />
            <AppText variant="caption" color={colors.textMuted}>Préparés</AppText>
          </Row>
          <Row gap={spacing.xs}>
            <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: colors.sageLight }} />
            <AppText variant="caption" color={colors.textMuted}>Prévus</AppText>
          </Row>
          <AppText variant="caption" color={colors.textMuted}>(semaines commençant le…)</AppText>
        </Row>
      </Card>

      <SectionHeader title="Mes habitudes" />
      <Card>
        {data.habits.categories.length === 0 ? (
          <AppText color={colors.textMuted}>Cochez « réalisé » sur vos repas pour voir apparaître vos habitudes.</AppText>
        ) : (
          <>
            {data.habits.categories.map((c) => (
              <Row key={c.category} style={{ justifyContent: 'space-between', paddingVertical: spacing.xs }}>
                <AppText>{RECIPE_CATEGORY_LABELS[c.category]}</AppText>
                <AppText variant="bodyStrong">{c.count}</AppText>
              </Row>
            ))}
            {data.habits.favoriteRecipes[0] ? (
              <AppText variant="small" color={colors.textMuted} style={{ marginTop: spacing.sm }}>
                Recette la plus cuisinée : {data.habits.favoriteRecipes[0].name}
              </AppText>
            ) : null}
          </>
        )}
      </Card>

      <SectionHeader title="Mes objectifs personnels" />
      <Card>
        {data.goals.map((g) => (
          <Row key={g.id} style={{ paddingVertical: spacing.xs }}>
            <Pressable onPress={() => m.toggleGoal.mutate({ id: g.id, done: !g.done })} accessibilityRole="checkbox" accessibilityState={{ checked: g.done }} accessibilityLabel={g.title} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1, minHeight: 44 }}>
              <Ionicons name={g.done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={g.done ? colors.success : colors.borderStrong} />
              <AppText style={{ flex: 1 }}>{g.title}</AppText>
            </Pressable>
            <IconButton icon="trash-outline" label={`Supprimer l’objectif ${g.title}`} color={colors.textMuted} onPress={() => m.removeGoal.mutate(g.id)} />
          </Row>
        ))}
        <TextField label="Nouvel objectif" placeholder="ex. Cuisiner 4 soirs par semaine" value={goalTitle} onChangeText={setGoalTitle} />
        <Button small variant="secondary" icon="add" label="Ajouter l’objectif" disabled={!goalTitle.trim()} loading={m.addGoal.isPending} onPress={() => m.addGoal.mutate(goalTitle.trim(), { onSuccess: () => setGoalTitle('') })} />
      </Card>

      <SectionHeader title="Suivi du poids (facultatif)" />
      <Card>
        {!showWeight && data.weights.length === 0 ? (
          <>
            <AppText color={colors.textMuted} style={{ marginBottom: spacing.md }}>
              Le suivi du poids n’est pas nécessaire pour utiliser NutriPlan. Activez-le seulement si cela vous aide.
            </AppText>
            <Button small variant="secondary" label="Activer le suivi du poids" onPress={() => setShowWeight(true)} />
          </>
        ) : (
          <>
            {data.weights.length > 1 ? (
              <BarChart
                label="Évolution du poids"
                height={90}
                max={Math.max(...data.weights.map((w) => w.weightKg))}
                data={data.weights.slice(-8).map((w) => ({ label: w.date.slice(8, 10) + '/' + w.date.slice(5, 7), value: w.weightKg }))}
              />
            ) : null}
            {data.weights.slice(-5).reverse().map((w) => (
              <Row key={w.id} style={{ justifyContent: 'space-between' }}>
                <AppText>
                  {w.date.split('-').reverse().join('/')} · {String(w.weightKg).replace('.', ',')} kg
                </AppText>
                <IconButton icon="trash-outline" label="Supprimer cette mesure" color={colors.textMuted} onPress={() => m.removeWeight.mutate(w.id)} />
              </Row>
            ))}
            <NumberField label="Poids du jour" decimal suffix="kg" value={weight} onChange={setWeight} error={weightError} />
            <Button small variant="secondary" label="Enregistrer" onPress={addWeight} loading={m.addWeight.isPending} />
            <AppText variant="small" color={colors.textMuted} style={{ marginTop: spacing.md }}>
              Le poids varie naturellement d’un jour à l’autre. NutriPlan n’encourage pas la perte de poids rapide : en cas de doute, parlez-en à un·e professionnel·le de santé.
            </AppText>
          </>
        )}
      </Card>
    </Screen>
  );
}
