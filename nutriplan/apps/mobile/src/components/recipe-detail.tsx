import Ionicons from '@expo/vector-icons/Ionicons';
import { ALLERGEN_LABELS, RECIPE_CATEGORY_LABELS } from '@nutriplan/core';
import { View } from 'react-native';
import { formatAmount, formatEuros, formatMinutes } from '../lib/format';
import type { RecipeDetail as Detail } from '../lib/types';
import { colors, radius, spacing } from '../theme/tokens';
import { RecipeImage } from './food';
import { AppText, Badge, Card, ChipGroup, Notice, Row, SectionHeader, Stepper } from './ui';

/** Fiche recette détaillée, partagée par le catalogue et la fiche repas. */
export function RecipeDetailView({ recipe, servings, onServings }: { recipe: Detail; servings: number; onServings: (n: number) => void }) {
  const n = recipe.nutritionPerServing;
  return (
    <View>
      <RecipeImage category={recipe.category} imageUrl={recipe.imageUrl} name={recipe.name} size="100%" rounded={radius.md} />
      <Row gap={spacing.xs} style={{ marginTop: spacing.md, flexWrap: 'wrap' }}>
        <Badge label={RECIPE_CATEGORY_LABELS[recipe.category]} />
        {recipe.isDemo ? <Badge tone="demo" label="Recette de démonstration" /> : null}
        {recipe.tags.slice(0, 3).map((t) => (
          <Badge key={t} label={t} />
        ))}
      </Row>
      <AppText variant="title" accessibilityRole="header" style={{ marginTop: spacing.sm }}>
        {recipe.name}
      </AppText>
      <AppText color={colors.textMuted} style={{ marginTop: spacing.xs }}>
        {recipe.description}
      </AppText>

      {!recipe.compatibility.allowed ? (
        <View style={{ marginTop: spacing.md }}>
          <Notice tone="warning" title="Incompatible avec votre profil">
            {recipe.compatibility.reasons.join(' ')}
          </Notice>
        </View>
      ) : null}
      {recipe.compatibility.warnings.length > 0 ? (
        <View style={{ marginTop: spacing.md }}>
          <Notice tone="warning">{recipe.compatibility.warnings.join(' ')}</Notice>
        </View>
      ) : null}

      <Row gap={spacing.sm} style={{ marginTop: spacing.lg }}>
        <Info icon="time-outline" label="Préparation" value={formatMinutes(recipe.preparationTime)} />
        <Info icon="flame-outline" label="Cuisson" value={recipe.cookingTime ? formatMinutes(recipe.cookingTime) : '—'} />
        <Info icon="wallet-outline" label="Par portion" value={recipe.cost.complete ? `≈ ${formatEuros(recipe.cost.perServingCents)}` : 'n.c.'} />
      </Row>

      <Card style={{ marginTop: spacing.lg }}>
        <Stepper label="Portions" value={servings} min={1} max={20} onChange={onServings} />
        <AppText variant="small" color={colors.textMuted}>
          Coût estimé pour {servings} portion{servings > 1 ? 's' : ''} : {formatEuros(recipe.cost.totalCents)} (au prorata des quantités utilisées)
          {recipe.cost.priceUpdatedAt ? `, prix estimés au ${recipe.cost.priceUpdatedAt.slice(0, 10).split('-').reverse().join('/')}` : ''}.
        </AppText>
      </Card>

      <SectionHeader title="Ingrédients" />
      <Card>
        {recipe.ingredients.map((i) => (
          <Row key={i.ingredientId} style={{ justifyContent: 'space-between', paddingVertical: spacing.xs }}>
            <AppText style={{ flex: 1 }}>{i.name}</AppText>
            <AppText variant="bodyStrong">{formatAmount(i.quantity, i.unit)}</AppText>
          </Row>
        ))}
        {recipe.allergens.length > 0 ? (
          <AppText variant="small" color={colors.textMuted} style={{ marginTop: spacing.sm }}>
            Allergènes : {recipe.allergens.map((a) => ALLERGEN_LABELS[a].toLowerCase()).join(', ')}. Vérifiez toujours les étiquettes des produits.
          </AppText>
        ) : null}
      </Card>

      <SectionHeader title="Préparation" />
      {recipe.instructions.map((step, idx) => (
        <Row key={idx} gap={spacing.md} style={{ alignItems: 'flex-start', marginBottom: spacing.md }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center' }}>
            <AppText variant="small" color={colors.primary} style={{ fontWeight: '700' }}>
              {idx + 1}
            </AppText>
          </View>
          <AppText style={{ flex: 1 }}>{step}</AppText>
        </Row>
      ))}

      <SectionHeader title="Valeurs nutritionnelles (par portion)" />
      <Card>
        <ChipGroup>
          <Nutri label="Énergie" value={`${n.kcal} kcal`} />
          <Nutri label="Protéines" value={`${n.proteinG} g`} />
          <Nutri label="Glucides" value={`${n.carbsG} g`} />
          <Nutri label="Lipides" value={`${n.fatG} g`} />
          <Nutri label="Fibres" value={`${n.fiberG} g`} />
        </ChipGroup>
        <AppText variant="small" color={colors.textMuted} style={{ marginTop: spacing.md }}>
          Estimation{!n.complete ? ' incomplète (données manquantes pour certains ingrédients)' : ''} à partir de valeurs approximatives. {recipe.nutritionDisclaimer}
        </AppText>
      </Card>
    </View>
  );
}

function Info({ icon, label, value }: { icon: React.ComponentProps<typeof Ionicons>['name']; label: string; value: string }) {
  return (
    <Card style={{ flex: 1, padding: spacing.md, alignItems: 'center' }}>
      <Ionicons name={icon} size={20} color={colors.primary} />
      <AppText variant="caption" color={colors.textMuted} style={{ marginTop: 2 }}>
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </Card>
  );
}

function Nutri({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ backgroundColor: colors.sageSoft, borderRadius: radius.sm, padding: spacing.sm, minWidth: 92 }}>
      <AppText variant="caption" color={colors.textMuted}>
        {label}
      </AppText>
      <AppText variant="bodyStrong">{value}</AppText>
    </View>
  );
}
