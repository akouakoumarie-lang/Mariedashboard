import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/lib/auth';
import { queryClient } from '../src/lib/queries';
import { colors, typography } from '../src/theme/tokens';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.primary,
              headerTitleStyle: { ...typography.heading, color: colors.text },
              headerBackButtonDisplayMode: 'minimal',
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding/index" options={{ title: '' }} />
            <Stack.Screen name="onboarding/finish" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="auth/sign-in" options={{ title: 'Connexion' }} />
            <Stack.Screen name="auth/sign-up" options={{ title: 'Créer un compte' }} />
            <Stack.Screen name="recipe/[id]" options={{ title: 'Recette' }} />
            <Stack.Screen name="meal/[planId]/[mealId]" options={{ title: 'Repas' }} />
            <Stack.Screen name="ideas" options={{ title: 'Idées avec mes placards' }} />
            <Stack.Screen name="settings/index" options={{ title: 'Profil et paramètres' }} />
            <Stack.Screen name="settings/profile" options={{ title: 'Mon profil' }} />
            <Stack.Screen name="settings/preferences" options={{ title: 'Préférences alimentaires' }} />
            <Stack.Screen name="settings/allergies" options={{ title: 'Allergies et régime' }} />
            <Stack.Screen name="settings/budget" options={{ title: 'Budget et organisation' }} />
            <Stack.Screen name="settings/inventory" options={{ title: 'Mes placards' }} />
            <Stack.Screen name="settings/privacy" options={{ title: 'Confidentialité' }} />
          </Stack>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
