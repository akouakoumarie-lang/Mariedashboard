import Ionicons from '@expo/vector-icons/Ionicons';
import { MEAL_TYPE_LABELS, RECIPE_CATEGORY_LABELS, type MealType, type RecipeCategory } from '@nutriplan/core';
import { Image, View } from 'react-native';
import { formatEuros, formatMinutes } from '../lib/format';
import { colors, radius, spacing } from '../theme/tokens';
import { AppText, Badge, Card, Row, type IconName } from './ui';

/**
 * Visuel de recette. Le catalogue de démonstration n'a pas encore de photographies :
 * on affiche une illustration sobre par catégorie plutôt qu'une image trompeuse.
 * Les photos (Supabase Storage) s'affichent automatiquement quand `imageUrl` est renseigné.
 */
const CATEGORY_VISUALS: Record<RecipeCategory, { icon: IconName; bg: string; fg: string }> = {
  petit_dejeuner: { icon: 'cafe-outline', bg: '#F4E7D3', fg: '#7A5A2E' },
  entree: { icon: 'nutrition-outline', bg: '#E4ECE0', fg: '#2F4A3A' },
  plat: { icon: 'restaurant-outline', bg: '#DCE7D8', fg: '#2F4A3A' },
  salade: { icon: 'leaf-outline', bg: '#E3EFD9', fg: '#3C5E2E' },
  soupe: { icon: 'water-outline', bg: '#F3E3D4', fg: '#7A4A2A' },
  dessert: { icon: 'ice-cream-outline', bg: '#F5E1E1', fg: '#7A3A3A' },
  collation: { icon: 'nutrition-outline', bg: '#F2ECD8', fg: '#6A5A22' },
};

export function RecipeImage({ category, imageUrl, size = 64, rounded = radius.sm, name }: { category: RecipeCategory; imageUrl?: string | null; size?: number | '100%'; rounded?: number; name: string }) {
  const v = CATEGORY_VISUALS[category];
  const dim = size === '100%' ? { width: '100%' as const, aspectRatio: 16 / 9 } : { width: size, height: size };
  if (imageUrl) {
    return <Image source={{ uri: imageUrl }} accessibilityLabel={`Photo : ${name}`} style={[dim, { borderRadius: rounded, backgroundColor: v.bg }]} />;
  }
  return (
    <View
      accessible
      accessibilityLabel={`Illustration : ${RECIPE_CATEGORY_LABELS[category]}`}
      style={[dim, { borderRadius: rounded, backgroundColor: v.bg, alignItems: 'center', justifyContent: 'center' }]}
    >
      <Ionicons name={v.icon} size={size === '100%' ? 56 : Math.max(20, (size as number) * 0.42)} color={v.fg} />
    </View>
  );
}

export function MealCard({
  mealType,
  recipe,
  servings,
  costCents,
  completed,
  conflicts,
  onPress,
}: {
  mealType: MealType;
  recipe: { name: string; category: RecipeCategory; imageUrl: string | null; preparationTime: number; cookingTime: number };
  servings: number;
  costCents?: number;
  completed?: boolean;
  conflicts?: string[];
  onPress: () => void;
}) {
  return (
    <Card onPress={onPress} accessibilityLabel={`${MEAL_TYPE_LABELS[mealType]} : ${recipe.name}`} style={{ marginBottom: spacing.sm, padding: spacing.md }}>
      <Row gap={spacing.md}>
        <RecipeImage category={recipe.category} imageUrl={recipe.imageUrl} name={recipe.name} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="caption" color={colors.textMuted}>
            {MEAL_TYPE_LABELS[mealType].toUpperCase()}
          </AppText>
          <AppText variant="bodyStrong" numberOfLines={2}>
            {recipe.name}
          </AppText>
          <AppText variant="small" color={colors.textMuted}>
            {formatMinutes(recipe.preparationTime + recipe.cookingTime)} · {servings} portion{servings > 1 ? 's' : ''}
            {costCents != null ? ` · ≈ ${formatEuros(costCents)}` : ''}
          </AppText>
          {conflicts && conflicts.length > 0 ? <Badge tone="warning" label="Ne respecte plus vos contraintes" /> : null}
        </View>
        {completed ? <Ionicons name="checkmark-circle" size={24} color={colors.success} accessibilityLabel="Repas réalisé" /> : <Ionicons name="chevron-forward" size={18} color={colors.borderStrong} />}
      </Row>
    </Card>
  );
}

/** Histogramme simple et accessible (barres en vues natives). */
export function BarChart({ data, max, height = 120, label }: { data: Array<{ label: string; value: number; secondary?: number }>; max?: number; height?: number; label: string }) {
  const top = Math.max(1, max ?? Math.max(...data.map((d) => Math.max(d.value, d.secondary ?? 0))));
  return (
    <View accessible accessibilityLabel={`${label}. ${data.map((d) => `${d.label} : ${d.value}${d.secondary != null ? ` sur ${d.secondary}` : ''}`).join(', ')}`}>
      <Row gap={spacing.sm} style={{ alignItems: 'flex-end', height }}>
        {data.map((d, i) => (
          <View key={i} style={{ flex: 1, height: '100%', justifyContent: 'flex-end' }}>
            {d.secondary != null ? (
              <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(d.secondary / top) * 100}%`, backgroundColor: colors.sageLight, borderRadius: 6 }} />
            ) : null}
            <View style={{ height: `${(d.value / top) * 100}%`, backgroundColor: colors.primary, borderRadius: 6, minHeight: d.value > 0 ? 4 : 0 }} />
          </View>
        ))}
      </Row>
      <Row gap={spacing.sm} style={{ marginTop: spacing.xs }}>
        {data.map((d, i) => (
          <AppText key={i} variant="caption" color={colors.textMuted} style={{ flex: 1, textAlign: 'center' }}>
            {d.label}
          </AppText>
        ))}
      </Row>
    </View>
  );
}

export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card style={{ flex: 1, padding: spacing.md }}>
      <AppText variant="small" color={colors.textMuted} numberOfLines={2}>
        {label}
      </AppText>
      <AppText variant="title" style={{ marginTop: 2 }}>
        {value}
      </AppText>
      {hint ? (
        <AppText variant="caption" color={colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </Card>
  );
}
