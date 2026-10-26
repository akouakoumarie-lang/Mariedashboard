import { zodResolver } from '@hookform/resolvers/zod';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';
import { AppText, Button, EmptyState, Notice, Screen, SelectableCard, TextField } from '../../src/components/ui';
import { AuthError, useAuth } from '../../src/lib/auth';
import { colors, spacing } from '../../src/theme/tokens';

const schema = z
  .object({
    email: z.email('Adresse e-mail invalide.'),
    password: z.string().min(8, 'Au moins 8 caractères.').max(72, '72 caractères maximum.'),
    confirm: z.string(),
    consent: z.literal(true, { message: 'Votre accord est nécessaire pour créer un compte.' }),
  })
  .refine((v) => v.password === v.confirm, { message: 'Les mots de passe ne correspondent pas.', path: ['confirm'] });
type Values = z.input<typeof schema>;

export default function SignUp() {
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { signUp } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const { control, handleSubmit, formState } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', confirm: '', consent: false as unknown as true },
  });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      const { needsConfirmation } = await signUp(email.trim(), password);
      if (needsConfirmation) return setConfirmationSent(true);
      router.replace(next === 'finish' ? '/onboarding/finish' : '/');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Inscription impossible pour le moment.');
    }
  });

  if (confirmationSent) {
    return (
      <Screen>
        <EmptyState
          icon="mail-unread-outline"
          title="Confirmez votre adresse e-mail"
          message="Nous vous avons envoyé un lien de confirmation. Une fois confirmé, connectez-vous : vos réponses au questionnaire sont conservées sur cet appareil."
          action={<Button label="Se connecter" onPress={() => router.replace('/auth/sign-in')} />}
        />
      </Screen>
    );
  }

  return (
    <Screen>
      <AppText variant="title" style={{ marginBottom: spacing.xs }}>
        Créez votre compte
      </AppText>
      <AppText color={colors.textMuted} style={{ marginBottom: spacing.xl }}>
        Pour enregistrer votre programme et le retrouver sur tous vos appareils.
      </AppText>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      <Controller control={control} name="email" render={({ field }) => <TextField label="Adresse e-mail" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} autoCapitalize="none" autoComplete="email" keyboardType="email-address" error={formState.errors.email?.message} />} />
      <Controller control={control} name="password" render={({ field }) => <TextField label="Mot de passe" hint="Au moins 8 caractères." value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} secureTextEntry autoComplete="new-password" error={formState.errors.password?.message} />} />
      <Controller control={control} name="confirm" render={({ field }) => <TextField label="Confirmer le mot de passe" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} secureTextEntry autoComplete="new-password" error={formState.errors.confirm?.message} />} />
      <Controller
        control={control}
        name="consent"
        render={({ field }) => (
          <View>
            <SelectableCard
              multiple
              title="J’accepte le traitement de mes données"
              description="Mes réponses (dont mes allergies et, si je les indique, ma taille et mon poids) servent uniquement à personnaliser mes menus. Je peux les exporter ou les supprimer à tout moment."
              selected={field.value === true}
              onPress={() => field.onChange(field.value === true ? false : true)}
            />
            {formState.errors.consent ? <Notice tone="danger">{formState.errors.consent.message ?? ''}</Notice> : null}
          </View>
        )}
      />
      <View style={{ gap: spacing.md, marginTop: spacing.md }}>
        <Button label="Créer mon compte" onPress={onSubmit} loading={formState.isSubmitting} />
        <Button label="Lire la politique de confidentialité" variant="ghost" onPress={() => router.push('/settings/privacy')} />
      </View>
    </Screen>
  );
}
