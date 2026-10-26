import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useConfirm } from '../../src/components/confirm';
import { MealCard } from '../../src/components/food';
import { AppText, Badge, Button, Card, EmptyState, ErrorState, Loading, Notice, Row, Screen, SectionHeader } from '../../src/components/ui';
import { ApiError, errorMessage } from '../../src/lib/api';
import { capitalize, formatDayLong, formatDayShort, formatEuros, localToday } from '../../src/lib/format';
import { useCurrentPlan, useGeneratePlan, usePlanHistory } from '../../src/lib/queries';
import { colors, radius, spacing } from '../../src/theme/tokens';

export default function PlanningScreen() {
  const plan = useCurrentPlan();
  const history = usePlanHistory();
  const generate = useGeneratePlan();
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmEl, confirm] = useConfirm();
  const [failure, setFailure] = useState<{ message: string; suggestions: string[] } | null>(null);

  const days = plan.data?.days ?? [];
  useEffect(() => {
    if (!days.length) return;
    if (!selected || !days.some((d) => d.date === selected)) {
      const today = localToday();
      setSelected(days.some((d) => d.date === today) ? today : days[0]!.date);
    }
  }, [days, selected]);

  const runGenerate = () => {
    setFailure(null);
    generate.mutate(
      { startDate: localToday() },
      {
        onError: (e) => {
          const details = e instanceof ApiError ? (e.details as { suggestions?: string[] } | undefined) : undefined;
          setFailure({ message: errorMessage(e), suggestions: details?.suggestions ?? [] });
        },
      },
    );
  };
  const onGenerate = () => {
    if (plan.data) confirm({ title: 'Nouveau programme', message: 'Le programme actuel sera archivé (il reste consultable dans l’historique) et une nouvelle liste de courses sera créée.', confirmLabel: 'Générer un nouveau programme', onConfirm: runGenerate });
    else runGenerate();
  };

  if (plan.isLoading) return <Loading label="Chargement du planning…" />;
  if (plan.isError) return <Screen><ErrorState message={errorMessage(plan.error)} onRetry={plan.refetch} /></Screen>;

  const day = days.find((d) => d.date === selected);
  const p = plan.data;

  return (
    <Screen refreshControl={<RefreshControl refreshing={plan.isRefetching} onRefresh={() => void plan.refetch()} tintColor={colors.primary} />}>
      {confirmEl}
      {failure ? (
        <Notice tone="danger" title="Génération impossible">
          <AppText variant="small" color={colors.danger}>
            {failure.message}
          </AppText>
          {failure.suggestions.map((s) => (
            <AppText key={s} variant="small" color={colors.danger}>
              • {s}
            </AppText>
          ))}
          <Pressable onPress={() => router.push('/settings')} accessibilityRole="link">
            <AppText variant="small" color={colors.danger} style={{ textDecorationLine: 'underline', marginTop: spacing.xs }}>
              Ajuster mes préférences
            </AppText>
          </Pressable>
        </Notice>
      ) : null}

      {!p ? (
        <EmptyState
          icon="sparkles-outline"
          title="Créez votre programme"
          message="Nous composons vos repas selon vos goûts, vos allergies, votre budget et votre temps disponible."
          action={<Button label="Générer mon programme" icon="sparkles-outline" onPress={onGenerate} loading={generate.isPending} />}
        />
      ) : (
        <>
          <Row style={{ justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <AppText variant="small" color={colors.textMuted}>
                Du {formatDayLong(p.startDate)} au {formatDayLong(p.endDate)}
              </AppText>
              <AppText variant="bodyStrong">
                Coût estimé : {formatEuros(p.estimatedCostCents)}
                {p.budgetCents != null ? ` / budget ${formatEuros(p.budgetCents)}` : ''}
              </AppText>
            </View>
            <Button small variant="secondary" icon="refresh" label="Regénérer" onPress={onGenerate} loading={generate.isPending} />
          </Row>

          {p.hasConflicts ? (
            <View style={{ marginTop: spacing.md }}>
              <Notice tone="warning" title="Vos contraintes ont changé">
                Certains repas ne respectent plus vos allergies, régime ou exclusions. Remplacez-les ou regénérez le programme.
              </Notice>
            </View>
          ) : null}
          {!p.feasible || p.issues.length > 0 ? (
            <View style={{ marginTop: spacing.md }}>
              <Notice tone={p.feasible ? 'info' : 'warning'} title={p.feasible ? 'À savoir' : 'Programme difficile à tenir'}>
                {p.issues.map((i) => (
                  <AppText key={i.message} variant="small" color={p.feasible ? colors.info : colors.warning}>
                    {i.message}
                  </AppText>
                ))}
                {p.suggestions.length > 0 ? (
                  <AppText variant="small" color={p.feasible ? colors.info : colors.warning} style={{ marginTop: spacing.xs, fontWeight: '600' }}>
                    Pistes d’ajustement :
                  </AppText>
                ) : null}
                {p.suggestions.map((s) => (
                  <AppText key={s} variant="small" color={p.feasible ? colors.info : colors.warning}>
                    • {s}
                  </AppText>
                ))}
              </Notice>
            </View>
          ) : null}

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: spacing.sm, paddingVertical: spacing.lg, alignItems: 'flex-start' }} accessibilityRole="tablist">
            {days.map((d) => {
              const { weekday, day: num } = formatDayShort(d.date);
              const active = d.date === selected;
              const done = d.meals.length > 0 && d.meals.every((m) => m.completed);
              return (
                <Pressable
                  key={d.date}
                  onPress={() => setSelected(d.date)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={formatDayLong(d.date)}
                  style={{ width: 58, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', backgroundColor: active ? colors.primary : colors.surface, borderWidth: 1, borderColor: active ? colors.primary : colors.border }}
                >
                  <AppText variant="caption" color={active ? colors.sageLight : colors.textMuted}>
                    {capitalize(weekday)}
                  </AppText>
                  <AppText variant="heading" color={active ? colors.onPrimary : colors.text}>
                    {num}
                  </AppText>
                  <View style={{ width: 6, height: 6, borderRadius: 3, marginTop: 2, backgroundColor: done ? (active ? colors.sageLight : colors.success) : 'transparent' }} />
                </Pressable>
              );
            })}
          </ScrollView>

          {day ? (
            <>
              <AppText variant="heading" style={{ marginBottom: spacing.sm }}>
                {capitalize(formatDayLong(day.date))}
              </AppText>
              {day.meals.length === 0 ? (
                <Card>
                  <AppText color={colors.textMuted}>Aucun repas prévu ce jour-là. Vous pouvez déplacer un repas depuis sa fiche.</AppText>
                </Card>
              ) : (
                day.meals.map((m) => (
                  <MealCard key={m.id} mealType={m.mealType} recipe={m.recipe} servings={m.servings} costCents={m.costCents} completed={m.completed} conflicts={m.conflicts} onPress={() => router.push(`/meal/${p.id}/${m.id}`)} />
                ))
              )}
            </>
          ) : null}
        </>
      )}

      {history.data && history.data.length > 1 ? (
        <>
          <SectionHeader title="Historique des programmes" />
          {history.data.slice(0, 8).map((h) => (
            <Row key={h.id} style={{ justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
              <AppText variant="small" style={{ flex: 1 }}>
                {formatDayLong(h.startDate)} → {formatDayLong(h.endDate)}
              </AppText>
              <Badge label={`${h.completedCount}/${h.mealCount} repas`} tone={h.archived ? 'neutral' : 'success'} />
            </Row>
          ))}
        </>
      ) : null}
    </Screen>
  );
}
