import { onboardingFormSchema } from '../../src/features/onboarding/form';
import { DislikesSection, LikesSection } from '../../src/features/onboarding/sections';
import { EditForm, toFormValues } from '../../src/features/settings/edit-form';
import { ErrorState, Loading, Screen } from '../../src/components/ui';
import { errorMessage } from '../../src/lib/api';
import { usePreferences, useSavePreferences } from '../../src/lib/queries';

export default function EditPreferences() {
  const { data, isLoading, isError, error, refetch } = usePreferences();
  const save = useSavePreferences();
  if (isLoading) return <Loading />;
  if (isError || !data) return <Screen><ErrorState message={errorMessage(error)} onRetry={refetch} /></Screen>;
  const catalog = Object.fromEntries([...data.liked, ...data.disliked].map((i) => [i.id, { name: i.name, unit: 'g' }]));
  return (
    <EditForm
      defaultValues={toFormValues({
        preferences: { likedIngredientIds: data.liked.map((i) => i.id), dislikedIngredientIds: data.disliked.map((i) => i.id) },
        catalog,
      })}
      schema={onboardingFormSchema.pick({ preferences: true })}
      sections={[
        { title: 'Aliments que j’aime', Section: LikesSection },
        { title: 'Aliments à ne jamais proposer', Section: DislikesSection },
      ]}
      onSave={(v) => save.mutateAsync(onboardingFormSchema.shape.preferences.parse(v.preferences))}
    />
  );
}
