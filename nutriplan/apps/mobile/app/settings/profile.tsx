import { onboardingFormSchema } from '../../src/features/onboarding/form';
import { AboutSection, ActivitySection, GoalSection } from '../../src/features/onboarding/sections';
import { EditForm, toFormValues } from '../../src/features/settings/edit-form';
import { ErrorState, Loading, Screen } from '../../src/components/ui';
import { errorMessage } from '../../src/lib/api';
import { useProfile, useSaveProfile } from '../../src/lib/queries';
import { toProfileInput } from '../../src/features/settings/profile-input';

export default function EditProfile() {
  const { data, isLoading, isError, error, refetch } = useProfile();
  const save = useSaveProfile();
  if (isLoading) return <Loading />;
  if (isError || !data?.profile) return <Screen><ErrorState message={isError ? errorMessage(error) : 'Profil introuvable.'} onRetry={refetch} /></Screen>;
  const e = data.energyEstimate;
  const intro = e
    ? `Besoins énergétiques estimés : environ ${e.targetKcal} kcal par jour (fourchette ${e.rangeKcal[0]}–${e.rangeKcal[1]} kcal). ${e.notes.join(' ')} ${e.disclaimer}`
    : 'Sans taille ni poids, aucune estimation énergétique n’est calculée : vos menus restent équilibrés et adaptés à vos préférences.';
  return (
    <EditForm
        intro={intro}
        defaultValues={toFormValues({ profile: toProfileInput(data.profile) })}
        schema={onboardingFormSchema.pick({ profile: true })}
        sections={[
          { title: 'Objectif', Section: GoalSection },
          { title: 'À propos de vous', Section: AboutSection },
          { title: 'Activité physique', Section: ActivitySection },
        ]}
        onSave={(v) => save.mutateAsync(onboardingFormSchema.shape.profile.parse(v.profile))}
      />
  );
}
