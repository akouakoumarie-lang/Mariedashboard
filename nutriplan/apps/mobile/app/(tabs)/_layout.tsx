import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect } from 'expo-router';
import { Platform, type ColorValue } from 'react-native';
import { Tabs } from 'expo-router/js-tabs';
import { Loading } from '../../src/components/ui';
import { useAuth } from '../../src/lib/auth';
import { LOCAL_MODE } from '../../src/lib/config';
import { colors, typography } from '../../src/theme/tokens';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
const icon = (name: IconName) => ({ color, size }: { color: ColorValue; size: number }) => <Ionicons name={name} size={size} color={color as string} />;

/** Espace privé : toutes ces routes exigent une session. */
export default function TabsLayout() {
  const { session, initializing } = useAuth();
  if (initializing) return <Loading />;
  if (!session && !LOCAL_MODE) return <Redirect href="/welcome" />;
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerShadowVisible: false,
        headerTitleStyle: { ...typography.heading, color: colors.text },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, ...(Platform.OS === 'web' ? { height: 64, paddingBottom: 8, paddingTop: 4 } : null) },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Accueil', headerShown: false, tabBarIcon: icon('home-outline') }} />
      <Tabs.Screen name="planning" options={{ title: 'Planning', tabBarIcon: icon('calendar-outline') }} />
      <Tabs.Screen name="recipes" options={{ title: 'Recettes', tabBarIcon: icon('book-outline') }} />
      <Tabs.Screen name="shopping" options={{ title: 'Courses', tabBarIcon: icon('basket-outline') }} />
      <Tabs.Screen name="progress" options={{ title: 'Suivi', tabBarIcon: icon('stats-chart-outline') }} />
    </Tabs>
  );
}
