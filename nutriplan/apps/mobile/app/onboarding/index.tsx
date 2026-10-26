import { zodResolver } from '@hookform/resolvers/zod';
import { router, Stack } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { useForm } from 'react-hook-form';
import { ScrollView, View } from 'react-native';
import { AppText, Button, FadeIn, Loading, ProgressBar, Row, Screen } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { LOCAL_MODE } from '../../src/lib/config';
import { DEFAULT_VALUES, loadDraft, onboardingFormSchema, saveDraft, type OnboardingInput, type OnboardingOutput } from '../../src/features/onboarding/form';
import { STEPS } from '../../src/features/onboarding/steps';
import { colors, spacing } from '../../src/theme/tokens';

export default function Onboarding() {
  const [initial, setInitial] = useState<{ values: OnboardingInput; step: number } | null>(null);
  useEffect(() => {
    loadDraft().then((d) => setInitial(d ?? { values: DEFAULT_VALUES, step: 0 }));
  }, []);
  if (!initial) return <Loading />;
  return <OnboardingForm initialValues={initial.values} initialStep={initial.step} />;
}

function OnboardingForm({ initialValues, initialStep }: { initialValues: OnboardingInput; initialStep: number }) {
  const { session: authSession } = useAuth();
  const session = authSession || LOCAL_MODE;
  const [step, setStep] = useState(Math.min(initialStep, STEPS.length - 1));
  const scroll = useRef<ComponentRef<typeof ScrollView>>(null);
  const form = useForm<OnboardingInput, unknown, OnboardingOutput>({
    resolver: zodResolver(onboardingFormSchema),
    defaultValues: initialValues,
    mode: 'onTouched',
  });
  const { control, formState, setValue, trigger, watch, getValues } = form;

  // Sauvegarde du brouillon à chaque réponse : revenir en arrière ne fait rien perdre.
  useEffect(() => {
    const sub = watch((values) => void saveDraft({ values: values as OnboardingInput, step }));
    return () => sub.unsubscribe();
  }, [watch, step]);

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  const goTo = (next: number) => {
    setStep(next);
    void saveDraft({ values: getValues(), step: next });
    scroll.current?.scrollTo({ y: 0, animated: false });
  };

  const next = async () => {
    const valid = current.fields.length === 0 || (await trigger(current.fields, { shouldFocus: true }));
    if (!valid) return;
    if (!isLast) return goTo(step + 1);
    // Dernière étape : validation complète, puis création du compte (ou envoi si déjà connecté).
    if (!(await trigger())) {
      const firstInvalid = STEPS.findIndex((s) => s.fields.some((f) => form.getFieldState(f).invalid));
      if (firstInvalid >= 0) goTo(firstInvalid);
      return;
    }
    router.push(session ? '/onboarding/finish' : '/auth/sign-up?next=finish');
  };

  return (
    <Screen
      scroll={false}
      padded={false}
      footer={
        <Row gap={spacing.md}>
          {step > 0 ? (
            <View style={{ flex: 1 }}>
              <Button label="Retour" variant="secondary" icon="arrow-back" onPress={() => goTo(step - 1)} />
            </View>
          ) : null}
          <View style={{ flex: 2 }}>
            <Button label={isLast ? (session ? 'Créer mon programme' : 'Créer mon compte') : 'Continuer'} icon={isLast ? 'checkmark' : 'arrow-forward'} onPress={next} loading={formState.isValidating} />
          </View>
        </Row>
      }
    >
      <Stack.Screen options={{ title: `Étape ${step + 1} sur ${STEPS.length}` }} />
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.sm }}>
        <ProgressBar value={(step + 1) / STEPS.length} label={`Progression : étape ${step + 1} sur ${STEPS.length}`} />
      </View>
      <ScrollView ref={scroll} contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxxl }} keyboardShouldPersistTaps="handled">
        <FadeIn key={current.key}>
          <AppText variant="title" accessibilityRole="header">
            {current.title}
          </AppText>
          <AppText color={colors.textMuted} style={{ marginTop: spacing.xs, marginBottom: spacing.xl }}>
            {current.subtitle}
          </AppText>
          <current.Section control={control} errors={formState.errors} setValue={setValue} />
        </FadeIn>
      </ScrollView>
    </Screen>
  );
}
