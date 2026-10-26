import { onboardingFormSchema } from '../../src/features/onboarding/form';
import { AllergySection, DietSection } from '../../src/features/onboarding/sections';
import { EditForm, toFormValues } from '../../src/features/settings/edit-form';
import { toProfileInput } from '../../src/features/settings/profile-input';
import { ErrorState, Loading, Screen } from '../../src/components/ui';
import { errorMessage } from '../../src/lib/api';
import { useAllergies, useProfile, useSaveAllergies, useSaveProfile } from '../../src/lib/queries';

export default function EditAllergies() {
  const profile = useProfile();
  const allergies = useAllergies();
  const saveProfile = useSaveProfile();
  const saveAllergies = useSaveAllergies();
  if (profile.isLoading || allergies.isLoading) return <Loading />;
  if (profile.isError || allergies.isError || !profile.data?.profile || !allergies.data) {
    return <Screen><ErrorState message={errorMessage(profile.error ?? allergies.error)} onRetry={() => { void profile.refetch(); void allergies.refetch(); }} /></Screen>;
  }
  return (
    <EditForm
      intro="Les recettes concernées disparaissent immédiatement de vos suggestions. Les repas déjà planifiés qui ne conviennent plus seront signalés."
      defaultValues={toFormValues({ profile: toProfileInput(profile.data.profile), allergies: { allergies: allergies.data } })}
      schema={onboardingFormSchema.pick({ profile: true, allergies: true })}
      sections={[
        { title: 'Allergies', Section: AllergySection },
        { title: 'Régime alimentaire', Section: DietSection },
      ]}
      onSave={async (v) => {
        await saveAllergies.mutateAsync(onboardingFormSchema.shape.allergies.parse(v.allergies));
        await saveProfile.mutateAsync(onboardingFormSchema.shape.profile.parse(v.profile));
      }}
    />
  );
}
