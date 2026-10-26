import { Platform } from 'react-native';

/**
 * Système de design NutriPlan : palette naturelle (vert sauge, crème, blanc cassé, vert foncé).
 * Contrastes vérifiés pour le texte : `text` et `textMuted` sur `background` / `surface`
 * dépassent le ratio WCAG AA de 4,5:1 ; `onPrimary` sur `primary` également.
 */
export const colors = {
  background: '#FBF9F4', // blanc cassé
  surface: '#FFFFFF',
  cream: '#F4EEE2',
  sage: '#A9BEA5',
  sageLight: '#E4ECE0',
  sageSoft: '#F0F5EE',
  primary: '#2F4A3A', // vert foncé
  primaryPressed: '#243A2D',
  onPrimary: '#FFFFFF',
  text: '#1F2A22',
  textMuted: '#55615A',
  border: '#E3DED3',
  borderStrong: '#C9C2B3',
  danger: '#A1271F',
  dangerBg: '#FBEAE8',
  warning: '#7A4E00',
  warningBg: '#FFF3D6',
  success: '#2D6A3E',
  successBg: '#E3F1E6',
  info: '#24506B',
  infoBg: '#E6F0F6',
  overlay: 'rgba(31, 42, 34, 0.35)',
} as const;

export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48 } as const;

export const radius = { sm: 10, md: 16, lg: 24, pill: 999 } as const;

export const typography = {
  display: { fontSize: 30, lineHeight: 36, fontWeight: '700' as const, letterSpacing: -0.4 },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, letterSpacing: -0.2 },
  heading: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const },
  body: { fontSize: 16, lineHeight: 23, fontWeight: '400' as const },
  bodyStrong: { fontSize: 16, lineHeight: 23, fontWeight: '600' as const },
  small: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '500' as const, letterSpacing: 0.2 },
} as const;

export type TypographyVariant = keyof typeof typography;

/** Ombre légère et cohérente sur toutes les plateformes. */
export const shadow = Platform.select({
  web: { boxShadow: '0 2px 12px rgba(31, 42, 34, 0.06)' },
  android: { elevation: 2 },
  default: { shadowColor: '#1F2A22', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 2 } },
}) as object;

/** Taille minimale des zones tactiles (accessibilité). */
export const touchTarget = 44;

/** Largeur maximale du contenu sur tablette et web. */
export const maxContentWidth = 640;
