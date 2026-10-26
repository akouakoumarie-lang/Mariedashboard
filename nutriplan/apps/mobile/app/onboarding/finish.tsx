import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { AppText, Button, EmptyState, Loading, Notice, Screen } from '../../src/components/ui';
import { errorMessage } from '../../src/lib/api';
import { useAuth } from '../../src/lib/auth';
import { queryClient } from '../../src/lib/queries';
import { clearDraft, loadDraft, onboardingFormSchema } from '../../src/features/onboarding/form';
import { submitOnboarding } from '../../src/features/onboarding/submit';
import { colors, spacing } from '../../src/theme/tokens';

type State = { kind: 'working'; label: string } | { kind: 'error'; message: string } | { kind: 'done'; planError: string | null } | { kind: 'missing' };

/** Envoi des réponses du questionnaire une fois le compte créé. */
export default function Finish() {
  const { session } = useAuth();
  const [state, setState] = useState<State>({ kind: 'working', label: 'Préparation…' });

  const run = useCallback(async () => {
    setState({ kind: 'working', label: 'Préparation…' });
    const draft = await loadDraft();
    const parsed = draft ? onboardingFormSchema.safeParse(draft.values) : null;
    if (!parsed?.success) return setState({ kind: 'missing' });
    try {
      const { planError } = await submitOnboarding(parsed.data, (label) => setState({ kind: 'working', label }));
      await clearDraft();
      await queryClient.invalidateQueries();
      setState({ kind: 'done', planError });
      if (!planError) router.replace('/(tabs)');
    } catch (e) {
      setState({ kind: 'error', message: errorMessage(e) });
    }
  }, []);

  useEffect(() => {
    if (session) void run();
  }, [session, run]);

  if (!session) {
    return (
      <Screen>
        <EmptyState icon="person-circle-outline" title="Connectez-vous pour continuer" message="Vos réponses sont conservées sur cet appareil." action={<Button label="Se connecter" onPress={() => router.replace('/auth/sign-in')} />} />
      </Screen>
    );
  }
  if (state.kind === 'working') return <Loading label={state.label} />;
  if (state.kind === 'missing') {
    return (
      <Screen>
        <EmptyState icon="clipboard-outline" title="Questionnaire incomplet" message="Répondez au questionnaire pour créer votre programme." action={<Button label="Reprendre le questionnaire" onPress={() => router.replace('/onboarding')} />} />
      </Screen>
    );
  }
  if (state.kind === 'error') {
    return (
      <Screen>
        <EmptyState icon="cloud-offline-outline" title="Enregistrement impossible" message={`${state.message} Vos réponses sont conservées.`} action={<Button label="Réessayer" icon="refresh" onPress={run} />} />
      </Screen>
    );
  }
  return (
    <Screen>
      <AppText variant="title" style={{ marginBottom: spacing.md }}>
        Votre profil est enregistré
      </AppText>
      <Notice tone="warning" title="Le programme n’a pas pu être généré">
        {state.planError ?? ''}
      </Notice>
      <AppText color={colors.textMuted} style={{ marginBottom: spacing.lg }}>
        Vous pouvez ajuster vos préférences ou votre temps de préparation, puis relancer la génération depuis l’onglet Planning.
      </AppText>
      <Button label="Accéder à mon espace" onPress={() => router.replace('/(tabs)')} />
    </Screen>
  );
}
