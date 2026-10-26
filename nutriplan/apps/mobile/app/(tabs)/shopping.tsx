import Ionicons from '@expo/vector-icons/Ionicons';
import { zodResolver } from '@hookform/resolvers/zod';
import { INGREDIENT_CATEGORIES, INGREDIENT_CATEGORY_LABELS, manualShoppingItemSchema, UNIT_LABELS, type ManualShoppingItemInput } from '@nutriplan/core';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Pressable, RefreshControl, View } from 'react-native';
import { z } from 'zod';
import { AppText, Button, Card, Chip, ChipGroup, EmptyState, ErrorState, FieldLabel, IconButton, Loading, Notice, NumberField, ProgressBar, Row, Screen, SectionHeader, TextField } from '../../src/components/ui';
import { errorMessage } from '../../src/lib/api';
import { formatAmount, formatEuros } from '../../src/lib/format';
import { useCurrentPlan, useShoppingList, useShoppingMutations } from '../../src/lib/queries';
import type { ShoppingItem } from '../../src/lib/types';
import { colors, radius, spacing } from '../../src/theme/tokens';

export default function ShoppingScreen() {
  const plan = useCurrentPlan();
  const planId = plan.data?.id;
  const list = useShoppingList(planId);

  if (plan.isLoading || (planId && list.isLoading)) return <Loading label="Chargement de la liste…" />;
  if (plan.isError || list.isError) return <Screen><ErrorState message={errorMessage(plan.error ?? list.error)} onRetry={() => (plan.isError ? plan.refetch() : list.refetch())} /></Screen>;
  if (!planId || !list.data) {
    return (
      <Screen>
        <EmptyState icon="basket-outline" title="Pas encore de liste de courses" message="Elle est créée automatiquement avec votre programme." action={<Button label="Créer mon programme" onPress={() => router.push('/(tabs)/planning')} />} />
      </Screen>
    );
  }
  return <ShoppingContent planId={planId} />;
}

function ShoppingContent({ planId }: { planId: string }) {
  const { data, refetch, isRefetching } = useShoppingList(planId);
  const m = useShoppingMutations(planId);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  if (!data) return null;
  const onError = (e: unknown) => setMutationError(errorMessage(e));

  return (
    <Screen refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={colors.primary} />}>
      <Card>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View>
            <AppText variant="caption" color={colors.textMuted}>
              BUDGET ESTIMÉ
            </AppText>
            <AppText variant="title">{formatEuros(data.totalCents)}</AppText>
            {data.budgetCents != null ? (
              <AppText variant="small" color={data.overBudget ? colors.warning : colors.success}>
                {data.overBudget ? `Dépasse le budget de ${formatEuros(data.totalCents - data.budgetCents)}` : `Dans votre budget de ${formatEuros(data.budgetCents)}`}
              </AppText>
            ) : null}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <AppText variant="caption" color={colors.textMuted}>
              RESTE À ACHETER
            </AppText>
            <AppText variant="heading">{formatEuros(data.remainingCents)}</AppText>
          </View>
        </Row>
        <View style={{ marginTop: spacing.md }}>
          <ProgressBar value={data.itemCount ? data.purchasedCount / data.itemCount : 0} label="Articles achetés" />
          <AppText variant="small" color={colors.textMuted} style={{ marginTop: spacing.xs }}>
            {data.purchasedCount} article{data.purchasedCount > 1 ? 's' : ''} acheté{data.purchasedCount > 1 ? 's' : ''} sur {data.itemCount}
          </AppText>
        </View>
      </Card>

      <View style={{ marginTop: spacing.md }}>
        <Notice tone="info">
          {`${data.priceNotice}${data.pricesUpdatedAt ? ` Base de prix mise à jour le ${data.pricesUpdatedAt.split('-').reverse().join('/')}.` : ''}${data.itemsWithoutPrice ? ` ${data.itemsWithoutPrice} article(s) sans prix estimé.` : ''}`}
        </Notice>
      </View>
      {mutationError ? <Notice tone="danger">{mutationError}</Notice> : null}

      <Row gap={spacing.sm}>
        <View style={{ flex: 1 }}>
          <Button small variant="secondary" icon="add" label="Ajouter un article" onPress={() => setAdding(!adding)} />
        </View>
        <View style={{ flex: 1 }}>
          <Button small variant="secondary" icon="refresh" label="Recalculer" loading={m.recalculate.isPending} onPress={() => m.recalculate.mutate(undefined, { onError })} />
        </View>
      </Row>

      {adding ? <AddItemForm planId={planId} onDone={() => setAdding(false)} /> : null}

      {data.groups.length === 0 ? (
        <EmptyState icon="checkmark-done-outline" title="Rien à acheter" message="Tout est déjà dans vos placards !" />
      ) : null}

      {data.groups.map((g) => (
        <View key={g.category}>
          <SectionHeader title={g.label} />
          <Card style={{ padding: spacing.xs }}>
            {g.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                editing={editing === item.id}
                onToggle={() => m.toggle.mutate({ itemId: item.id, isPurchased: !item.isPurchased }, { onError })}
                onEdit={() => setEditing(editing === item.id ? null : item.id)}
                onSave={(quantity) => m.setQuantity.mutate({ itemId: item.id, quantity }, { onSuccess: () => setEditing(null), onError })}
                onRemove={() => m.remove.mutate(item.id, { onError })}
                saving={m.setQuantity.isPending}
              />
            ))}
          </Card>
        </View>
      ))}
    </Screen>
  );
}

function ItemRow({ item, editing, onToggle, onEdit, onSave, onRemove, saving }: { item: ShoppingItem; editing: boolean; onToggle: () => void; onEdit: () => void; onSave: (q: number) => void; onRemove: () => void; saving: boolean }) {
  const [qty, setQty] = useState<number | null>(item.quantity);
  const invalid = qty == null || Number.isNaN(qty) || qty <= 0;
  return (
    <View style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Row style={{ paddingVertical: spacing.sm, paddingHorizontal: spacing.sm }}>
        <Pressable onPress={onToggle} accessibilityRole="checkbox" accessibilityState={{ checked: item.isPurchased }} accessibilityLabel={`${item.name}, ${formatAmount(item.quantity, item.unit)}`} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flex: 1, minHeight: 44 }}>
          <Ionicons name={item.isPurchased ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={item.isPurchased ? colors.success : colors.borderStrong} />
          <View style={{ flex: 1 }}>
            <AppText style={item.isPurchased ? { textDecorationLine: 'line-through', color: colors.textMuted } : undefined}>{item.name}</AppText>
            <AppText variant="small" color={colors.textMuted}>
              {formatAmount(item.quantity, item.unit)}
              {item.estimatedPriceCents != null ? ` · ≈ ${formatEuros(item.estimatedPriceCents)}` : ' · prix inconnu'}
              {item.isPantryStaple ? ' · produit de placard' : ''}
              {item.isManual ? ' · ajouté par vous' : ''}
            </AppText>
          </View>
        </Pressable>
        <IconButton icon={editing ? 'close' : 'create-outline'} label={editing ? 'Fermer' : `Modifier la quantité de ${item.name}`} onPress={onEdit} />
      </Row>
      {editing ? (
        <View style={{ paddingHorizontal: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.sageSoft, borderRadius: radius.sm }}>
          <NumberField label="Quantité" decimal value={qty} onChange={setQty} suffix={UNIT_LABELS[item.unit as keyof typeof UNIT_LABELS] ?? item.unit} error={invalid ? 'Indiquez une quantité positive.' : undefined} />
          <Row gap={spacing.sm}>
            <View style={{ flex: 1 }}>
              <Button small label="Enregistrer" onPress={() => !invalid && onSave(qty!)} disabled={invalid} loading={saving} />
            </View>
            <View style={{ flex: 1 }}>
              <Button small variant="danger" icon="trash-outline" label="Retirer" onPress={onRemove} />
            </View>
          </Row>
        </View>
      ) : null}
    </View>
  );
}

const addSchema = manualShoppingItemSchema.extend({ priceEuros: z.number().min(0, 'Prix invalide.').max(1000).nullable() }).omit({ estimatedPriceCents: true });
type AddValues = z.input<typeof addSchema>;

function AddItemForm({ planId, onDone }: { planId: string; onDone: () => void }) {
  const { add } = useShoppingMutations(planId);
  const { control, handleSubmit, formState } = useForm<AddValues>({
    resolver: zodResolver(addSchema),
    defaultValues: { name: '', quantity: 1, unit: 'piece', category: 'autres', priceEuros: null },
  });
  const onSubmit = handleSubmit((v) => {
    const body: ManualShoppingItemInput = { name: v.name, quantity: v.quantity, unit: v.unit, category: v.category, estimatedPriceCents: v.priceEuros == null ? null : Math.round(v.priceEuros * 100) };
    add.mutate(body, { onSuccess: onDone });
  });
  return (
    <Card style={{ marginTop: spacing.md }}>
      <Controller control={control} name="name" render={({ field }) => <TextField label="Article" value={field.value} onChangeText={field.onChange} error={formState.errors.name?.message} />} />
      <Controller control={control} name="quantity" render={({ field }) => <NumberField label="Quantité" decimal value={field.value} onChange={(v) => field.onChange(v ?? NaN)} error={formState.errors.quantity?.message} />} />
      <Controller
        control={control}
        name="unit"
        render={({ field }) => (
          <View style={{ marginBottom: spacing.lg }}>
            <FieldLabel label="Unité" />
            <ChipGroup>
              {(['piece', 'g', 'kg', 'ml', 'l'] as const).map((u) => (
                <Chip key={u} label={UNIT_LABELS[u]} selected={field.value === u} onPress={() => field.onChange(u)} />
              ))}
            </ChipGroup>
          </View>
        )}
      />
      <Controller
        control={control}
        name="category"
        render={({ field }) => (
          <View style={{ marginBottom: spacing.lg }}>
            <FieldLabel label="Rayon" />
            <ChipGroup>
              {INGREDIENT_CATEGORIES.map((c) => (
                <Chip key={c} label={INGREDIENT_CATEGORY_LABELS[c]} selected={field.value === c} onPress={() => field.onChange(c)} />
              ))}
            </ChipGroup>
          </View>
        )}
      />
      <Controller control={control} name="priceEuros" render={({ field }) => <NumberField label="Prix estimé" optional decimal suffix="€" value={field.value} onChange={field.onChange} error={formState.errors.priceEuros?.message} />} />
      {add.isError ? <Notice tone="danger">{errorMessage(add.error)}</Notice> : null}
      <Button label="Ajouter à la liste" onPress={onSubmit} loading={add.isPending} />
    </Card>
  );
}
