import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { View } from 'react-native';
import { z } from 'zod';
import { AppText, Button, Notice, Screen, TextField } from '../../src/components/ui';
import { AuthError, useAuth } from '../../src/lib/auth';
import { spacing } from '../../src/theme/tokens';

const schema = z.object({
  email: z.email('Adresse e-mail invalide.'),
  password: z.string().min(1, 'Saisissez votre mot de passe.'),
});
type Values = z.infer<typeof schema>;

export default function SignIn() {
  const { signIn, resetPassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const { control, handleSubmit, formState, getValues } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setError(null);
    try {
      await signIn(email.trim(), password);
      router.replace('/');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Connexion impossible pour le moment.');
    }
  });

  const onReset = async () => {
    const email = getValues('email').trim();
    if (!z.email().safeParse(email).success) return setError('Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.');
    try {
      await resetPassword(email);
      setInfo('Si un compte existe pour cette adresse, un e-mail de réinitialisation vient d’être envoyé.');
    } catch (e) {
      setError(e instanceof AuthError ? e.message : 'Envoi impossible pour le moment.');
    }
  };

  return (
    <Screen>
      <AppText variant="title" style={{ marginBottom: spacing.xl }}>
        Bon retour parmi nous
      </AppText>
      {error ? <Notice tone="danger">{error}</Notice> : null}
      {info ? <Notice tone="success">{info}</Notice> : null}
      <Controller control={control} name="email" render={({ field }) => <TextField label="Adresse e-mail" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} autoCapitalize="none" autoComplete="email" keyboardType="email-address" error={formState.errors.email?.message} />} />
      <Controller control={control} name="password" render={({ field }) => <TextField label="Mot de passe" value={field.value} onChangeText={field.onChange} onBlur={field.onBlur} secureTextEntry autoComplete="current-password" error={formState.errors.password?.message} onSubmitEditing={() => void onSubmit()} />} />
      <View style={{ gap: spacing.md }}>
        <Button label="Se connecter" onPress={onSubmit} loading={formState.isSubmitting} />
        <Button label="Mot de passe oublié ?" variant="ghost" onPress={onReset} />
        <Button label="Je n’ai pas de compte" variant="ghost" onPress={() => router.replace('/onboarding')} />
      </View>
    </Screen>
  );
}
