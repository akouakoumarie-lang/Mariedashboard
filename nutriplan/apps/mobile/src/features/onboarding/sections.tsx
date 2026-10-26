import Ionicons from '@expo/vector-icons/Ionicons';
import {
  ACTIVITY_LABELS,
  ACTIVITY_LEVELS,
  ALLERGEN_LABELS,
  ALLERGENS,
  ALLERGY_SEVERITIES,
  ALLERGY_SEVERITY_LABELS,
  BUDGET_PROFILES,
  DIET_LABELS,
  DIETS,
  EQUIPMENT,
  EQUIPMENT_LABELS,
  GOAL_LABELS,
  GOALS,
  INGREDIENT_CATEGORY_LABELS,
  NUTRITION_DISCLAIMER,
  type AllergySeverity,
  type Goal,
} from '@nutriplan/core';
import { useState } from 'react';
import { Controller, useWatch, type Control, type FieldErrors, type UseFormSetValue } from 'react-hook-form';
import { Pressable, View } from 'react-native';
import {
  AppText,
  Card,
  Chip,
  ChipGroup,
  FieldError,
  FieldLabel,
  IconButton,
  Notice,
  NumberField,
  Row,
  SelectableCard,
  Stepper,
  TextField,
  type IconName,
} from '../../components/ui';
import { formatAmount, formatEuros } from '../../lib/format';
import { useIngredients } from '../../lib/queries';
import { colors, radius, spacing } from '../../theme/tokens';
import type { OnboardingInput } from './form';

export interface SectionProps {
  control: Control<OnboardingInput>;
  errors: FieldErrors<OnboardingInput>;
  setValue: UseFormSetValue<OnboardingInput>;
}

const GOAL_ICONS: Record<Goal, IconName> = {
  perte_de_poids: 'trending-down-outline',
  maintien: 'swap-horizontal-outline',
  prise_de_muscle: 'barbell-outline',
  equilibre: 'leaf-outline',
};
const GOAL_DESCRIPTIONS: Record<Goal, string> = {
  perte_de_poids: 'Progressivement, sans régime extrême',
  maintien: 'Stabiliser mes habitudes',
  prise_de_muscle: 'Des repas riches en protéines',
  equilibre: 'Varier et cuisiner plus maison',
};

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

/* ─── Objectif ──────────────────────────────────────────────────────────── */

export function GoalSection({ control, errors }: SectionProps) {
  return (
    <Controller
      control={control}
      name="profile.goal"
      render={({ field }) => (
        <View accessibilityRole="radiogroup">
          {GOALS.map((g) => (
            <SelectableCard key={g} title={GOAL_LABELS[g]} description={GOAL_DESCRIPTIONS[g]} icon={GOAL_ICONS[g]} selected={field.value === g} onPress={() => field.onChange(g)} />
          ))}
          <FieldError message={errors.profile?.goal?.message} />
        </View>
      )}
    />
  );
}

/* ─── À propos ──────────────────────────────────────────────────────────── */

export function AboutSection({ control, errors }: SectionProps) {
  return (
    <View>
      <Controller
        control={control}
        name="profile.displayName"
        render={({ field }) => (
          <TextField label="Prénom ou surnom" optional value={field.value ?? ''} onChangeText={(t) => field.onChange(t || null)} autoComplete="given-name" error={errors.profile?.displayName?.message} />
        )}
      />
      <Controller
        control={control}
        name="profile.age"
        render={({ field }) => <NumberField label="Âge" value={field.value} onChange={field.onChange} suffix="ans" error={errors.profile?.age?.message} />}
      />
      <Notice tone="info">Taille, poids et sexe sont facultatifs. Ils servent uniquement à estimer vos besoins énergétiques, à titre indicatif.</Notice>
      <Controller
        control={control}
        name="profile.heightCm"
        render={({ field }) => <NumberField label="Taille" optional value={field.value} onChange={field.onChange} suffix="cm" error={errors.profile?.heightCm?.message} />}
      />
      <Controller
        control={control}
        name="profile.weightKg"
        render={({ field }) => <NumberField label="Poids" optional decimal value={field.value} onChange={field.onChange} suffix="kg" error={errors.profile?.weightKg?.message} />}
      />
      <Controller
        control={control}
        name="profile.sex"
        render={({ field }) => (
          <View>
            <FieldLabel label="Sexe pour le calcul" optional />
            <ChipGroup>
              <Chip label="Femme" selected={field.value === 'femme'} onPress={() => field.onChange(field.value === 'femme' ? null : 'femme')} />
              <Chip label="Homme" selected={field.value === 'homme'} onPress={() => field.onChange(field.value === 'homme' ? null : 'homme')} />
              <Chip label="Je préfère ne pas répondre" selected={field.value === 'non_precise'} onPress={() => field.onChange('non_precise')} />
            </ChipGroup>
          </View>
        )}
      />
    </View>
  );
}

/* ─── Activité ──────────────────────────────────────────────────────────── */

export function ActivitySection({ control, errors }: SectionProps) {
  return (
    <View>
      <Controller
        control={control}
        name="profile.activityLevel"
        render={({ field }) => (
          <View accessibilityRole="radiogroup">
            {ACTIVITY_LEVELS.map((a) => (
              <SelectableCard key={a} title={ACTIVITY_LABELS[a]} selected={field.value === a} onPress={() => field.onChange(a)} />
            ))}
            <FieldError message={errors.profile?.activityLevel?.message} />
          </View>
        )}
      />
      <View style={{ height: spacing.lg }} />
      <Controller
        control={control}
        name="profile.trainingSessionsPerWeek"
        render={({ field }) => (
          <NumberField
            label="Séances de sport par semaine"
            optional
            value={field.value}
            onChange={field.onChange}
            hint="Laissez vide si vous ne souhaitez pas le renseigner."
            error={errors.profile?.trainingSessionsPerWeek?.message}
          />
        )}
      />
    </View>
  );
}

/* ─── Régime ────────────────────────────────────────────────────────────── */

export function DietSection({ control }: SectionProps) {
  return (
    <Controller
      control={control}
      name="profile.diets"
      render={({ field }) => (
        <View>
          {DIETS.map((d) => (
            <SelectableCard key={d} multiple title={DIET_LABELS[d]} selected={(field.value ?? []).includes(d)} onPress={() => field.onChange(toggle(field.value ?? [], d))} />
          ))}
          <AppText variant="small" color={colors.textMuted}>
            Aucun régime particulier ? Passez simplement à l’étape suivante.
          </AppText>
        </View>
      )}
    />
  );
}

/* ─── Allergies ─────────────────────────────────────────────────────────── */

export function AllergySection({ control, errors }: SectionProps) {
  return (
    <Controller
      control={control}
      name="allergies.allergies"
      render={({ field }) => {
        const list = field.value ?? [];
        return (
          <View>
            <Notice tone="warning" title="Les allergies sont des contraintes strictes">
              Les recettes contenant ces allergènes ne vous seront jamais proposées. En cas d’allergie sévère, les produits pouvant en contenir des traces sont aussi exclus. Vérifiez toujours les étiquettes.
            </Notice>
            <ChipGroup>
              {ALLERGENS.map((a) => {
                const selected = list.some((x) => x.allergen === a);
                return (
                  <Chip
                    key={a}
                    label={ALLERGEN_LABELS[a]}
                    selected={selected}
                    onPress={() => field.onChange(selected ? list.filter((x) => x.allergen !== a) : [...list, { allergen: a, severity: null }])}
                  />
                );
              })}
            </ChipGroup>
            {list.map((item, idx) => (
              <Card key={item.allergen} style={{ marginTop: spacing.md }}>
                <AppText variant="bodyStrong">{ALLERGEN_LABELS[item.allergen]}</AppText>
                <AppText variant="small" color={colors.textMuted} style={{ marginBottom: spacing.sm }}>
                  Gravité (facultatif — sans précision, les traces sont exclues par précaution)
                </AppText>
                <ChipGroup>
                  {ALLERGY_SEVERITIES.map((s: AllergySeverity) => (
                    <Chip
                      key={s}
                      label={ALLERGY_SEVERITY_LABELS[s]}
                      selected={item.severity === s}
                      onPress={() => field.onChange(list.map((x, i) => (i === idx ? { ...x, severity: x.severity === s ? null : s } : x)))}
                    />
                  ))}
                </ChipGroup>
              </Card>
            ))}
            <FieldError message={errors.allergies?.allergies?.message ?? errors.allergies?.message} />
          </View>
        );
      }}
    />
  );
}

/* ─── Sélecteur d'ingrédients ───────────────────────────────────────────── */

export function IngredientPicker({
  selected,
  onChange,
  disabledIds = [],
  catalog,
  onCatalog,
  emptyLabel,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  disabledIds?: string[];
  catalog: Record<string, { name: string; unit: string }>;
  onCatalog: (id: string, info: { name: string; unit: string }) => void;
  emptyLabel: string;
}) {
  const [search, setSearch] = useState('');
  const { data, isLoading, isError, refetch } = useIngredients(search.trim());
  const results = (data ?? []).filter((i) => !selected.includes(i.id)).slice(0, 14);
  return (
    <View>
      <ChipGroup>
        {selected.length === 0 ? (
          <AppText variant="small" color={colors.textMuted}>
            {emptyLabel}
          </AppText>
        ) : (
          selected.map((id) => <Chip key={id} label={`${catalog[id]?.name ?? 'Aliment'}  ✕`} selected onPress={() => onChange(selected.filter((x) => x !== id))} />)
        )}
      </ChipGroup>
      <View style={{ height: spacing.lg }} />
      <TextField label="Rechercher un aliment" placeholder="ex. tomate, riz, poulet…" value={search} onChangeText={setSearch} autoCorrect={false} />
      {isError ? (
        <Notice tone="danger" title="Liste des aliments indisponible">
          <Pressable onPress={() => refetch()} accessibilityRole="button">
            <AppText variant="small" color={colors.danger} style={{ textDecorationLine: 'underline' }}>
              Impossible de charger les aliments. Toucher pour réessayer.
            </AppText>
          </Pressable>
        </Notice>
      ) : null}
      {isLoading ? <AppText color={colors.textMuted}>Chargement des aliments…</AppText> : null}
      <View style={{ gap: spacing.xs }}>
        {results.map((i) => {
          const disabled = disabledIds.includes(i.id);
          return (
            <Pressable
              key={i.id}
              disabled={disabled}
              onPress={() => {
                onCatalog(i.id, { name: i.name, unit: i.unit });
                onChange([...selected, i.id]);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Ajouter ${i.name}`}
              accessibilityState={{ disabled }}
              style={({ pressed }) => [
                { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radius.sm, backgroundColor: pressed ? colors.sageSoft : colors.surface },
                disabled && { opacity: 0.45 },
              ]}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <AppText>{i.name}</AppText>
                <AppText variant="caption" color={colors.textMuted}>
                  {INGREDIENT_CATEGORY_LABELS[i.category]}
                  {disabled ? ' · déjà dans l’autre liste' : ''}
                </AppText>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function useCatalog(control: Control<OnboardingInput>) {
  return (useWatch({ control, name: 'catalog' }) ?? {}) as Record<string, { name: string; unit: string }>;
}

export function LikesSection({ control, setValue }: SectionProps) {
  const catalog = useCatalog(control);
  const disliked = useWatch({ control, name: 'preferences.dislikedIngredientIds' }) ?? [];
  return (
    <Controller
      control={control}
      name="preferences.likedIngredientIds"
      render={({ field }) => (
        <IngredientPicker
          selected={field.value ?? []}
          onChange={field.onChange}
          disabledIds={disliked}
          catalog={catalog}
          onCatalog={(id, info) => setValue(`catalog.${id}`, info)}
          emptyLabel="Aucun aliment sélectionné pour l’instant."
        />
      )}
    />
  );
}

export function DislikesSection({ control, setValue, errors }: SectionProps) {
  const catalog = useCatalog(control);
  const liked = useWatch({ control, name: 'preferences.likedIngredientIds' }) ?? [];
  return (
    <View>
      <Notice tone="info">Ces aliments ne vous seront jamais proposés. Pour une allergie, utilisez plutôt l’étape « Allergies ».</Notice>
      <Controller
        control={control}
        name="preferences.dislikedIngredientIds"
        render={({ field }) => (
          <IngredientPicker
            selected={field.value ?? []}
            onChange={field.onChange}
            disabledIds={liked}
            catalog={catalog}
            onCatalog={(id, info) => setValue(`catalog.${id}`, info)}
            emptyLabel="Aucun aliment exclu."
          />
        )}
      />
      <FieldError message={errors.preferences?.dislikedIngredientIds?.message} />
    </View>
  );
}

/* ─── Budget et foyer ───────────────────────────────────────────────────── */

export function BudgetSection({ control, errors }: SectionProps) {
  const household = useWatch({ control, name: 'profile.householdSize' }) ?? 1;
  const [custom, setCustom] = useState(false);
  return (
    <View>
      <Controller
        control={control}
        name="profile.householdSize"
        render={({ field }) => <Stepper label="Personnes au foyer" value={field.value ?? 1} min={1} max={12} onChange={field.onChange} />}
      />
      <View style={{ height: spacing.lg }} />
      <Controller
        control={control}
        name="profile.weeklyBudgetCents"
        render={({ field }) => {
          const presetIds = BUDGET_PROFILES.map((p) => p.perPersonPerWeekCents * household);
          const isCustom = custom || (field.value != null && !presetIds.includes(field.value));
          return (
            <View>
              <FieldLabel label="Budget alimentaire hebdomadaire" hint="Une indication pour vous aider : il n’y a pas de montant minimum." />
              {BUDGET_PROFILES.map((p) => {
                const cents = p.perPersonPerWeekCents * household;
                return (
                  <SelectableCard
                    key={p.id}
                    title={`${p.label} · environ ${formatEuros(cents)}`}
                    description={p.description}
                    selected={!isCustom && field.value === cents}
                    onPress={() => {
                      setCustom(false);
                      field.onChange(cents);
                    }}
                  />
                );
              })}
              <SelectableCard title="Montant personnalisé" selected={isCustom} onPress={() => setCustom(true)} />
              {isCustom ? (
                <NumberField
                  label="Montant par semaine"
                  decimal
                  suffix="€"
                  value={field.value == null ? null : field.value / 100}
                  onChange={(v) => field.onChange(v == null ? null : Number.isNaN(v) ? NaN : Math.round(v * 100))}
                  error={errors.profile?.weeklyBudgetCents?.message}
                />
              ) : null}
              <SelectableCard
                title="Je ne souhaite pas fixer de budget"
                selected={!isCustom && field.value == null}
                onPress={() => {
                  setCustom(false);
                  field.onChange(null);
                }}
              />
              {!isCustom ? <FieldError message={errors.profile?.weeklyBudgetCents?.message} /> : null}
            </View>
          );
        }}
      />
    </View>
  );
}

/* ─── Organisation ──────────────────────────────────────────────────────── */

const TIME_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: '15 min', value: 15 },
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 h', value: 60 },
  { label: '1 h 30', value: 90 },
  { label: 'Pas de limite', value: null },
];

export function OrganisationSection({ control }: SectionProps) {
  return (
    <View>
      <Controller control={control} name="profile.mealsPerDay" render={({ field }) => <Stepper label="Repas par jour" value={field.value ?? 3} min={1} max={5} onChange={field.onChange} />} />
      <Controller control={control} name="profile.planningDays" render={({ field }) => <Stepper label="Jours à planifier" value={field.value ?? 7} min={1} max={14} unit="j" onChange={field.onChange} />} />
      <View style={{ height: spacing.lg }} />
      <Controller
        control={control}
        name="profile.cookingTimePreference"
        render={({ field }) => (
          <View>
            <FieldLabel label="Temps maximal par recette" hint="Préparation et cuisson comprises." />
            <ChipGroup>
              {TIME_OPTIONS.map((o) => (
                <Chip key={o.label} label={o.label} selected={(field.value ?? null) === o.value} onPress={() => field.onChange(o.value)} />
              ))}
            </ChipGroup>
          </View>
        )}
      />
    </View>
  );
}

/* ─── Équipement ────────────────────────────────────────────────────────── */

const EQUIPMENT_ICONS: Record<(typeof EQUIPMENT)[number], IconName> = {
  plaques: 'flame-outline',
  four: 'grid-outline',
  micro_ondes: 'radio-outline',
  mixeur: 'color-filter-outline',
  air_fryer: 'thermometer-outline',
  cuiseur_vapeur: 'cloud-outline',
};

export function EquipmentSection({ control }: SectionProps) {
  return (
    <Controller
      control={control}
      name="profile.equipment"
      render={({ field }) => (
        <View>
          {EQUIPMENT.map((e) => (
            <SelectableCard key={e} multiple icon={EQUIPMENT_ICONS[e]} title={EQUIPMENT_LABELS[e]} selected={(field.value ?? []).includes(e)} onPress={() => field.onChange(toggle(field.value ?? [], e))} />
          ))}
          <AppText variant="small" color={colors.textMuted}>
            Si vous ne cochez rien, toutes les recettes restent possibles.
          </AppText>
        </View>
      )}
    />
  );
}

/* ─── Stock disponible ──────────────────────────────────────────────────── */

const DEFAULT_QTY: Record<string, number> = { g: 500, ml: 1000, piece: 1 };

export function InventorySection({ control, setValue, errors }: SectionProps) {
  const catalog = useCatalog(control);
  return (
    <Controller
      control={control}
      name="inventory"
      render={({ field }) => {
        const list = field.value ?? [];
        return (
          <View>
            <Notice tone="success">Les aliments déjà chez vous sont utilisés en priorité et déduits de la liste de courses.</Notice>
            {list.map((item, idx) => (
              <Row key={item.ingredientId} style={{ marginBottom: spacing.xs }}>
                <View style={{ flex: 1 }}>
                  <NumberField
                    label={catalog[item.ingredientId]?.name ?? 'Aliment'}
                    decimal
                    suffix={formatAmount(0, item.unit).replace(/^0 /, '')}
                    value={item.quantity}
                    onChange={(v) => field.onChange(list.map((x, i) => (i === idx ? { ...x, quantity: v ?? 0 } : x)))}
                    error={(errors.inventory as unknown as Array<{ quantity?: { message?: string } }> | undefined)?.[idx]?.quantity?.message}
                  />
                </View>
                <IconButton icon="trash-outline" label={`Retirer ${catalog[item.ingredientId]?.name ?? 'cet aliment'}`} color={colors.danger} onPress={() => field.onChange(list.filter((_, i) => i !== idx))} />
              </Row>
            ))}
            <IngredientPicker
              selected={list.map((i) => i.ingredientId)}
              onChange={(ids) => {
                const added = ids.find((id) => !list.some((x) => x.ingredientId === id));
                if (!added) {
                  field.onChange(list.filter((x) => ids.includes(x.ingredientId)));
                  return;
                }
                const unit = catalog[added]?.unit ?? 'g';
                field.onChange([...list, { ingredientId: added, quantity: DEFAULT_QTY[unit] ?? 1, unit }]);
              }}
              catalog={catalog}
              onCatalog={(id, info) => setValue(`catalog.${id}`, info)}
              emptyLabel="Ajoutez ce que vous avez déjà (facultatif)."
            />
          </View>
        );
      }}
    />
  );
}

/* ─── Récapitulatif ─────────────────────────────────────────────────────── */

export function SummarySection({ control }: SectionProps) {
  const v = useWatch({ control }) as OnboardingInput;
  const catalog = (v.catalog ?? {}) as Record<string, { name: string }>;
  const names = (ids?: string[]) => (ids ?? []).map((id) => catalog[id]?.name).filter(Boolean).join(', ') || '—';
  const p = v.profile ?? ({} as OnboardingInput['profile']);
  const rows: Array<[string, string]> = [
    ['Objectif', p.goal ? GOAL_LABELS[p.goal] : '—'],
    ['Activité', p.activityLevel ? ACTIVITY_LABELS[p.activityLevel] : '—'],
    ['Régime', (p.diets ?? []).map((d) => DIET_LABELS[d]).join(', ') || 'Aucun'],
    ['Allergies', (v.allergies?.allergies ?? []).map((a) => ALLERGEN_LABELS[a.allergen]).join(', ') || 'Aucune'],
    ['Aliments aimés', names(v.preferences?.likedIngredientIds)],
    ['Aliments exclus', names(v.preferences?.dislikedIngredientIds)],
    ['Foyer', `${p.householdSize ?? 1} personne(s)`],
    ['Budget', p.weeklyBudgetCents ? `${formatEuros(p.weeklyBudgetCents)} / semaine` : 'Non défini'],
    ['Organisation', `${p.mealsPerDay} repas par jour, ${p.planningDays} jours`],
    ['En stock', names((v.inventory ?? []).map((i) => i.ingredientId))],
  ];
  return (
    <View>
      <Card>
        {rows.map(([k, val]) => (
          <View key={k} style={{ paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <AppText variant="caption" color={colors.textMuted}>
              {k.toUpperCase()}
            </AppText>
            <AppText>{val}</AppText>
          </View>
        ))}
      </Card>
      <View style={{ height: spacing.lg }} />
      <Notice tone="info">{NUTRITION_DISCLAIMER}</Notice>
    </View>
  );
}
