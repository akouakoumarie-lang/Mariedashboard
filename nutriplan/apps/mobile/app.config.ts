import type { ExpoConfig } from 'expo/config';

/** Le nom de l'application est configurable (EXPO_PUBLIC_APP_NAME) ; « NutriPlan » par défaut. */
const name = process.env.EXPO_PUBLIC_APP_NAME || 'NutriPlan';

const config: ExpoConfig = {
  name,
  slug: 'nutriplan',
  scheme: 'nutriplan',
  version: '0.1.0',
  orientation: 'portrait',
  userInterfaceStyle: 'light',
  backgroundColor: '#FBF9F4',
  ios: { supportsTablet: true, bundleIdentifier: 'fr.nutriplan.app' },
  android: { package: 'fr.nutriplan.app', adaptiveIcon: { backgroundColor: '#2F4A3A' } },
  web: { output: 'single', bundler: 'metro' },
  plugins: ['expo-router', 'expo-notifications'],
  experiments: { typedRoutes: false },
};

export default config;
