import { useState } from 'react';
import { View } from 'react-native';
import { AppText, Card, EmptyState, ErrorState, IconButton, Loading, Notice, NumberField, Row, Screen, SectionHeader } from '../../src/components/ui';
import { IngredientPicker } from '../../src/features/onboarding/sections';
import { errorMessage } from '../../src/lib/api';
import { formatAmount } from '../../src/lib/format';
import { useInventory, useInventoryMutations } from '../../src/lib/queries';
import { colors, spacing } from '../../src/theme/tokens';

const DEFAULT_QTY: Record<string, number> = { g: 500, ml: 1000, piece: 1 };

export default function InventoryScreen() {
  const { data, isLoading, isError, error, refetch } = useInventory();
  const m = useInventoryMutations();
  const [catalog, setCatalog] = useState<Record<string, { name: string; unit: string }>>({});
  const [mutationError, setMutationError] = useState<string | null>(null);
  if (isLoading) return <Loading />;
  if (isError || !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={refetch} /></Screen>;
  const onError = (e: unknown) => setMutationError(errorMessage(e));

  return (
    <Screen>
      <Notice tone="info">Ces aliments sont utilisés en priorité dans vos menus et déduits de la liste de courses lors du prochain recalcul.</Notice>
      {mutationError ? <Notice tone="danger">{mutationError}</Notice> : null}
      {data.length === 0 ? <EmptyState icon="file-tray-outline" title="Placards vides" message="Ajoutez ce que vous avez déjà pour éviter le gaspillage." /> : null}
      {data.map((item) => (
        <Card key={item.id} style={{ marginBottom: spacing.sm, paddingBottom: 0 }}>
          <Row>
            <View style={{ flex: 1 }}>
              <NumberField
                label={item.name}
                decimal
                hint={`Actuellement : ${formatAmount(item.quantity, item.unit)}`}
                suffix={formatAmount(0, item.unit).replace(/^0 /, '')}
                value={item.quantity}
                onChange={(q) => q && q > 0 && m.update.mutate({ id: item.id, quantity: q }, { onError })}
              />
            </View>
            <IconButton icon="trash-outline" color={colors.danger} label={`Retirer ${item.name}`} onPress={() => m.remove.mutate(item.id, { onError })} />
          </Row>
        </Card>
      ))}
      <SectionHeader title="Ajouter un aliment" />
      <IngredientPicker
        selected={data.map((i) => i.ingredientId)}
        catalog={{ ...catalog, ...Object.fromEntries(data.map((i) => [i.ingredientId, { name: i.name, unit: i.unit }])) }}
        onCatalog={(id, info) => setCatalog((c) => ({ ...c, [id]: info }))}
        emptyLabel=""
        onChange={(ids) => {
          const added = ids.find((id) => !data.some((i) => i.ingredientId === id));
          if (!added) return;
          const unit = (catalog[added]?.unit ?? 'g') as 'g' | 'ml' | 'piece';
          m.add.mutate({ ingredientId: added, quantity: DEFAULT_QTY[unit] ?? 1, unit }, { onError });
        }}
      />
      <AppText variant="small" color={colors.textMuted} style={{ marginTop: spacing.md }}>
        Astuce : après une modification, recalculez la liste de courses depuis l’onglet Courses.
      </AppText>
    </Screen>
  );
}
