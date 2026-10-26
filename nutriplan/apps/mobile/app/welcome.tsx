import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Button, FadeIn, Notice } from '../src/components/ui';
import { StorageNotice } from '../src/components/storage-notice';
import { APP_NAME, isApiConfigured, LOCAL_MODE } from '../src/lib/config';
import { useAuth } from '../src/lib/auth';
import { colors, maxContentWidth, radius, spacing } from '../src/theme/tokens';

export default function Welcome() {
  const { configured } = useAuth();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.cream }}>
      <View style={{ flex: 1, padding: spacing.xl, justifyContent: 'space-between', width: '100%', maxWidth: maxContentWidth, alignSelf: 'center' }}>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <FadeIn>
            <View style={{ width: 84, height: 84, borderRadius: radius.lg, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl }} accessibilityLabel={`Logo ${APP_NAME}`} accessible>
              <Ionicons name="leaf" size={44} color={colors.sageLight} />
            </View>
            <AppText variant="display" accessibilityRole="header">
              {APP_NAME}
            </AppText>
            <AppText variant="title" color={colors.primary} style={{ marginTop: spacing.sm, fontWeight: '500' }}>
              Des repas qui vous ressemblent, des courses qui respectent votre budget.
            </AppText>
            <AppText color={colors.textMuted} style={{ marginTop: spacing.lg }}>
              Un programme alimentaire personnalisé selon vos goûts, vos allergies et votre temps — et la liste de courses qui va avec.
            </AppText>
          </FadeIn>
        </View>
        <FadeIn delay={150}>
          <StorageNotice />
          {!LOCAL_MODE && (!configured || !isApiConfigured) ? (
            <Notice tone="warning" title="Configuration requise">
              Les services de connexion ou d’API ne sont pas configurés sur cette version de l’application (voir le fichier .env.example).
            </Notice>
          ) : null}
          <View style={{ gap: spacing.md }}>
            <Button label="Commencer" icon="arrow-forward" onPress={() => router.push('/onboarding')} disabled={!isApiConfigured} />
            {LOCAL_MODE ? null : <Button label="Se connecter" variant="secondary" onPress={() => router.push('/auth/sign-in')} disabled={!configured} />}
          </View>
        </FadeIn>
      </View>
    </SafeAreaView>
  );
}
