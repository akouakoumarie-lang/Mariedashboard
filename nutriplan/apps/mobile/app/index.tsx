import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { Screen, ErrorState, Loading } from '../src/components/ui';
import { errorMessage } from '../src/lib/api';
import { useAuth } from '../src/lib/auth';
import { LOCAL_MODE } from '../src/lib/config';
import { useAccount } from '../src/lib/queries';
import { loadDraft } from '../src/features/onboarding/form';

/** Aiguillage : bienvenue, questionnaire à finaliser ou tableau de bord. */
export default function Index() {
  const { session, initializing } = useAuth();
  const account = useAccount(!!session || LOCAL_MODE);
  const [hasDraft, setHasDraft] = useState<boolean | null>(null);
  useEffect(() => {
    loadDraft().then((d) => setHasDraft(!!d));
  }, []);

  if (initializing || hasDraft === null) return <Loading />;
  if (!session && !LOCAL_MODE) return <Redirect href="/welcome" />;
  if (account.isError) {
    return (
      <Screen>
        <ErrorState message={errorMessage(account.error)} onRetry={() => account.refetch()} />
      </Screen>
    );
  }
  if (!account.data) return <Loading label="Chargement de votre compte…" />;
  if (!account.data.hasProfile) {
    if (LOCAL_MODE) return <Redirect href={hasDraft ? '/onboarding' : '/welcome'} />;
    return <Redirect href={hasDraft ? '/onboarding/finish' : '/onboarding'} />;
  }
  return <Redirect href="/(tabs)" />;
}
