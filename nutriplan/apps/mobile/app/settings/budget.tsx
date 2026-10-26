import { onboardingFormSchema } from '../../src/features/onboarding/form';
import { BudgetSection, EquipmentSection, OrganisationSection } from '../../src/features/onboarding/sections';
import { EditForm, toFormValues } from '../../src/features/settings/edit-form';
import { toProfileInput } from '../../src/features/settings/profile-input';
import { ErrorState, Loading, Screen } from '../../src/components/ui';
import { errorMessage } from '../../src/lib/api';
import { useProfile, useSaveProfile } from '../../src/lib/queries';

export default function EditBudget() {
  const { data, isLoading, isError, error, refetch } = useProfile();
  const save = useSaveProfile();
  if (isLoading) return <Loading />;
  if (isError || !data?.profile) return <Screen><ErrorState message={isError ? errorMessage(error) : 'Profil introuvable.'} onRetry={refetch} /></Screen>;
  return (
    <EditForm
      intro="Ces réglages s’appliquent au prochain programme généré."
      defaultValues={toFormValues({ profile: toProfileInput(data.profile) })}
      schema={onboardingFormSchema.pick({ profile: true })}
      sections={[
        { title: 'Foyer et budget', Section: BudgetSection },
        { title: 'Organisation', Section: OrganisationSection },
        { title: 'Équipement', Section: EquipmentSection },
      ]}
      onSave={(v) => save.mutateAsync(onboardingFormSchema.shape.profile.parse(v.profile))}
    />
  );
}
