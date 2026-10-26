import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState, type ComponentType } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';
import type { ZodType } from 'zod';
import { AppText, Button, Notice, Screen } from '../../components/ui';
import { errorMessage } from '../../lib/api';
import { colors, spacing } from '../../theme/tokens';
import type { OnboardingInput } from '../onboarding/form';
import type { SectionProps } from '../onboarding/sections';

/**
 * Écran d'édition réutilisant les sections du questionnaire.
 * Rien n'est annoncé comme enregistré tant que l'API n'a pas confirmé.
 */
export function EditForm({
  defaultValues,
  schema,
  sections,
  onSave,
  intro,
}: {
  defaultValues: OnboardingInput;
  schema: ZodType;
  sections: Array<{ title: string; Section: ComponentType<SectionProps> }>;
  onSave: (values: OnboardingInput) => Promise<unknown>;
  intro?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const form = useForm<OnboardingInput, unknown, any>({ resolver: zodResolver(schema as any), defaultValues, mode: 'onTouched' });
  const submit = form.handleSubmit(async () => {
    setError(null);
    setSaved(false);
    try {
      await onSave(form.getValues());
      setSaved(true);
      form.reset(form.getValues());
    } catch (e) {
      setError(errorMessage(e));
    }
  });
  return (
    <Screen
      footer={
        <View style={{ gap: spacing.sm }}>
          {saved ? <Notice tone="success">Modifications enregistrées.</Notice> : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
          {Object.keys(form.formState.errors).length > 0 ? <Notice tone="danger">Certaines informations sont invalides : vérifiez les champs signalés.</Notice> : null}
          <Button label="Enregistrer" icon="checkmark" onPress={submit} loading={form.formState.isSubmitting} disabled={!form.formState.isDirty} />
          <Button label="Fermer" variant="ghost" onPress={() => router.back()} />
        </View>
      }
    >
      {intro ? (
        <AppText color={colors.textMuted} style={{ marginBottom: spacing.lg }}>
          {intro}
        </AppText>
      ) : null}
      {sections.map(({ title, Section }) => (
        <View key={title} style={{ marginBottom: spacing.xl }}>
          <AppText variant="heading" accessibilityRole="header" style={{ marginBottom: spacing.md }}>
            {title}
          </AppText>
          <Section control={form.control} errors={form.formState.errors} setValue={form.setValue} />
        </View>
      ))}
    </Screen>
  );
}

export const toFormValues = (partial: Partial<OnboardingInput>): OnboardingInput =>
  ({ profile: {}, preferences: { likedIngredientIds: [], dislikedIngredientIds: [] }, allergies: { allergies: [] }, inventory: [], catalog: {}, ...partial }) as OnboardingInput;
