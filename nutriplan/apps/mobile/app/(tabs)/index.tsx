import { router } from 'expo-router';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MealCard, RecipeImage, StatTile } from '../../src/components/food';
import { AppText, Button, Card, EmptyState, ErrorState, FadeIn, IconButton, Loading, Notice, ProgressBar, Row, SectionHeader } from '../../src/components/ui';
import { errorMessage } from '../../src/lib/api';
import { APP_NAME } from '../../src/lib/config';
import { formatDayLong, formatEuros } from '../../src/lib/format';
import { useDashboard } from '../../src/lib/queries';
import { colors, maxContentWidth, spacing } from '../../src/theme/tokens';

function greeting(): string {
  const h = new Date().getHours();
  return h < 5 || h >= 18 ? 'Bonsoir' : 'Bonjour';
}

export default function DashboardScreen() {
  const { data, isLoading, isError, error, refetch, isRefetching } = useDashboard();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl, width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}
      >
        <Row style={{ justifyContent: 'space-between', marginBottom: spacing.lg }}>
          <View style={{ flex: 1 }}>
            <AppText variant="caption" color={colors.textMuted}>
              {APP_NAME.toUpperCase()}
            </AppText>
            <AppText variant="title" accessibilityRole="header">
              {greeting()}
              {data?.displayName ? ` ${data.displayName}` : ''} 🌿
            </AppText>
          </View>
          <IconButton icon="person-circle-outline" label="Profil et paramètres" onPress={() => router.push('/settings')} />
        </Row>

        {isLoading ? <Loading /> : null}
        {isError ? <ErrorState message={errorMessage(error)} onRetry={refetch} /> : null}

        {data && !data.plan ? (
          <EmptyState
            icon="calendar-outline"
            title="Pas encore de programme"
            message="Générez votre premier programme personnalisé et sa liste de courses."
            action={<Button label="Créer mon programme" icon="sparkles-outline" onPress={() => router.push('/(tabs)/planning')} />}
          />
        ) : null}

        {data?.plan ? (
          <FadeIn>
            <Card style={{ backgroundColor: colors.primary, borderColor: colors.primary }}>
              <AppText variant="caption" color={colors.sageLight}>
                PROGRAMME EN COURS
              </AppText>
              <AppText variant="heading" color={colors.onPrimary} style={{ marginTop: 2 }}>
                Du {formatDayLong(data.plan.startDate)} au {formatDayLong(data.plan.endDate)}
              </AppText>
              <View style={{ marginTop: spacing.md }}>
                <ProgressBar value={data.plan.mealCount ? data.plan.completedCount / data.plan.mealCount : 0} label="Repas réalisés" />
              </View>
              <AppText variant="small" color={colors.sageLight} style={{ marginTop: spacing.xs }}>
                {data.plan.completedCount} repas réalisé{data.plan.completedCount > 1 ? 's' : ''} sur {data.plan.mealCount}
              </AppText>
            </Card>

            <Row gap={spacing.sm} style={{ marginTop: spacing.md, alignItems: 'stretch' }}>
              <StatTile label="Budget prévu" value={data.plan.budgetCents ? formatEuros(data.plan.budgetCents) : '—'} hint={`Estimé : ${formatEuros(data.plan.estimatedCostCents)}`} />
              <StatTile label="Recettes" value={String(data.plan.recipeCount)} hint={`${data.plan.mealCount} repas planifiés`} />
            </Row>
            {data.plan.budgetCents != null && data.plan.estimatedCostCents > data.plan.budgetCents ? (
              <View style={{ marginTop: spacing.md }}>
                <Notice tone="warning">Le coût estimé dépasse votre budget. Consultez le planning pour des pistes d’ajustement.</Notice>
              </View>
            ) : null}

            <SectionHeader title="Aujourd’hui" action={<Button small variant="ghost" label="Semaine" onPress={() => router.push('/(tabs)/planning')} />} />
            {data.todayMeals.length === 0 ? (
              <AppText color={colors.textMuted}>Aucun repas prévu aujourd’hui.</AppText>
            ) : (
              data.todayMeals.map((m) => (
                <MealCard key={m.id} mealType={m.mealType} recipe={m.recipe} servings={m.servings} completed={m.completed} onPress={() => router.push(`/meal/${data.plan!.id}/${m.id}`)} />
              ))
            )}

            {data.upcomingMeals.length > 0 ? (
              <>
                <SectionHeader title="Prochains repas" />
                {data.upcomingMeals.map((m) => (
                  <View key={m.id}>
                    <AppText variant="caption" color={colors.textMuted} style={{ marginBottom: spacing.xs }}>
                      {formatDayLong(m.date).toUpperCase()}
                    </AppText>
                    <MealCard mealType={m.mealType} recipe={m.recipe} servings={m.servings} completed={m.completed} onPress={() => router.push(`/meal/${data.plan!.id}/${m.id}`)} />
                  </View>
                ))}
              </>
            ) : null}

            <SectionHeader title="Accès rapide" />
            <Row gap={spacing.sm}>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" icon="basket-outline" label={data.shopping ? `Courses (${data.shopping.itemCount - data.shopping.purchasedCount})` : 'Courses'} onPress={() => router.push('/(tabs)/shopping')} />
              </View>
              <View style={{ flex: 1 }}>
                <Button variant="secondary" icon="calendar-outline" label="Planning" onPress={() => router.push('/(tabs)/planning')} />
              </View>
            </Row>
          </FadeIn>
        ) : null}

        {data ? (
          <>
            <SectionHeader title="Recettes favorites" action={data.favoritesCount > 0 ? <Button small variant="ghost" label="Tout voir" onPress={() => router.push({ pathname: '/(tabs)/recipes', params: { favorites: '1' } })} /> : undefined} />
            {data.favorites.length === 0 ? (
              <AppText color={colors.textMuted}>Touchez le cœur d’une recette pour la retrouver ici.</AppText>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
                {data.favorites.map((f) => (
                  <Card key={f.id} onPress={() => router.push(`/recipe/${f.id}`)} accessibilityLabel={f.name} style={{ width: 150, padding: spacing.sm }}>
                    <RecipeImage category={f.category} imageUrl={f.imageUrl} name={f.name} size="100%" />
                    <AppText variant="small" numberOfLines={2} style={{ marginTop: spacing.xs, fontWeight: '600' }}>
                      {f.name}
                    </AppText>
                  </Card>
                ))}
              </ScrollView>
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
