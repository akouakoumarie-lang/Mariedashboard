import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, maxContentWidth, radius, shadow, spacing, touchTarget, typography, type TypographyVariant } from '../theme/tokens';

export type IconName = ComponentProps<typeof Ionicons>['name'];

/* ─── Texte ─────────────────────────────────────────────────────────────── */

export function AppText({
  variant = 'body',
  color = colors.text,
  style,
  ...props
}: TextProps & { variant?: TypographyVariant; color?: string }) {
  return <Text {...props} style={[typography[variant], { color }, style]} maxFontSizeMultiplier={1.6} />;
}

/* ─── Mise en page ──────────────────────────────────────────────────────── */

export function Screen({
  children,
  scroll = true,
  padded = true,
  footer,
  refreshControl,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  footer?: ReactNode;
  refreshControl?: ComponentProps<typeof ScrollView>['refreshControl'];
}) {
  const content = <View style={[styles.content, padded && styles.padded]}>{children}</View>;
  return (
    <SafeAreaView style={styles.screen} edges={['left', 'right', 'bottom']}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </SafeAreaView>
  );
}

export function Card({ children, style, onPress, accessibilityLabel }: { children: ReactNode; style?: StyleProp<ViewStyle>; onPress?: () => void; accessibilityLabel?: string }) {
  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }, style]}
      >
        {children}
      </Pressable>
    );
  }
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, gap = spacing.sm, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function SectionHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: spacing.xl, marginBottom: spacing.sm }}>
      <AppText variant="heading" accessibilityRole="header">
        {title}
      </AppText>
      {action}
    </Row>
  );
}

/** Apparition en fondu, discrète. */
export function FadeIn({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(6)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 260, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 260, delay, useNativeDriver: true }),
    ]).start();
  }, [opacity, translateY, delay]);
  return <Animated.View style={{ opacity, transform: [{ translateY }] }}>{children}</Animated.View>;
}

/* ─── Boutons ───────────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  small = false,
  accessibilityHint,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  small?: boolean;
  accessibilityHint?: string;
}) {
  const v = buttonVariants[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.button,
        small && styles.buttonSmall,
        { backgroundColor: pressed && !inactive ? v.pressed : v.bg, borderColor: v.border },
        inactive && { opacity: 0.55 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <Row gap={spacing.sm} style={{ justifyContent: 'center' }}>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={v.fg} /> : null}
          <AppText variant={small ? 'small' : 'bodyStrong'} color={v.fg} style={{ fontWeight: '600' }}>
            {label}
          </AppText>
        </Row>
      )}
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { bg: string; pressed: string; fg: string; border: string }> = {
  primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.onPrimary, border: colors.primary },
  secondary: { bg: colors.surface, pressed: colors.sageSoft, fg: colors.primary, border: colors.borderStrong },
  ghost: { bg: 'transparent', pressed: colors.sageSoft, fg: colors.primary, border: 'transparent' },
  danger: { bg: colors.surface, pressed: colors.dangerBg, fg: colors.danger, border: colors.danger },
};

export function IconButton({ icon, label, onPress, color = colors.primary }: { icon: IconName; label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [styles.iconButton, pressed && { backgroundColor: colors.sageSoft }]}
    >
      <Ionicons name={icon} size={22} color={color} />
    </Pressable>
  );
}

/* ─── Sélection ─────────────────────────────────────────────────────────── */

/** Carte sélectionnable (choix unique ou multiple). */
export function SelectableCard({
  title,
  description,
  icon,
  selected,
  onPress,
  multiple = false,
}: {
  title: string;
  description?: string;
  icon?: IconName;
  selected: boolean;
  onPress: () => void;
  multiple?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected, selected }}
      accessibilityLabel={description ? `${title}. ${description}` : title}
      style={({ pressed }) => [styles.selectable, selected && styles.selectableOn, pressed && { opacity: 0.9 }]}
    >
      {icon ? (
        <View style={[styles.selectableIcon, selected && { backgroundColor: colors.primary }]}>
          <Ionicons name={icon} size={20} color={selected ? colors.onPrimary : colors.primary} />
        </View>
      ) : null}
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong">{title}</AppText>
        {description ? (
          <AppText variant="small" color={colors.textMuted}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Ionicons
        name={selected ? (multiple ? 'checkbox' : 'radio-button-on') : multiple ? 'square-outline' : 'radio-button-off'}
        size={22}
        color={selected ? colors.primary : colors.borderStrong}
      />
    </Pressable>
  );
}

export function Chip({ label, selected = false, onPress, icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.chip, selected && styles.chipOn, pressed && { opacity: 0.85 }]}
    >
      {icon ? <Ionicons name={icon} size={14} color={selected ? colors.onPrimary : colors.primary} /> : null}
      <AppText variant="small" color={selected ? colors.onPrimary : colors.text} style={{ fontWeight: '500' }}>
        {label}
      </AppText>
    </Pressable>
  );
}

export function ChipGroup({ children }: { children: ReactNode }) {
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>{children}</View>;
}

/* ─── Champs de formulaire ──────────────────────────────────────────────── */

export function FieldLabel({ label, optional, hint }: { label: string; optional?: boolean; hint?: string }) {
  return (
    <View style={{ marginBottom: spacing.xs }}>
      <AppText variant="bodyStrong">
        {label}
        {optional ? <AppText variant="small" color={colors.textMuted}>{'  (facultatif)'}</AppText> : null}
      </AppText>
      {hint ? (
        <AppText variant="small" color={colors.textMuted}>
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Row gap={spacing.xs} style={{ marginTop: spacing.xs }}>
      <Ionicons name="alert-circle" size={16} color={colors.danger} />
      <AppText variant="small" color={colors.danger} accessibilityLiveRegion="polite" style={{ flex: 1 }}>
        {message}
      </AppText>
    </Row>
  );
}

export function TextField({
  label,
  optional,
  hint,
  error,
  suffix,
  ...props
}: TextInputProps & { label: string; optional?: boolean; hint?: string; error?: string; suffix?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <FieldLabel label={label} optional={optional} hint={hint} />
      <View style={[styles.input, focused && { borderColor: colors.primary }, !!error && { borderColor: colors.danger }]}>
        <TextInput
          {...props}
          accessibilityLabel={label}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          style={[typography.body, { flex: 1, color: colors.text, paddingVertical: spacing.md }]}
        />
        {suffix ? <AppText color={colors.textMuted}>{suffix}</AppText> : null}
      </View>
      <FieldError message={error} />
    </View>
  );
}

/** Champ numérique : conserve la saisie en texte et renvoie un nombre (ou null si vide). */
export function NumberField({
  value,
  onChange,
  decimal = false,
  ...props
}: Omit<ComponentProps<typeof TextField>, 'value' | 'onChange' | 'onChangeText'> & {
  value: number | null | undefined;
  onChange: (v: number | null) => void;
  decimal?: boolean;
}) {
  const [text, setText] = useState(value == null ? '' : String(value).replace('.', ','));
  useEffect(() => {
    const parsed = parseNumber(text);
    if (parsed !== (value ?? null)) setText(value == null ? '' : String(value).replace('.', ','));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <TextField
      {...props}
      value={text}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      inputMode={decimal ? 'decimal' : 'numeric'}
      onChangeText={(t) => {
        setText(t);
        onChange(parseNumber(t));
      }}
    />
  );
}

export function parseNumber(text: string): number | null {
  const t = text.trim().replace(',', '.');
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

/** Sélecteur + / − pour les petites valeurs entières (portions, personnes, repas). */
export function Stepper({ label, value, onChange, min, max, unit }: { label: string; value: number; onChange: (v: number) => void; min: number; max: number; unit?: string }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: spacing.sm }}>
      <AppText variant="bodyStrong" style={{ flex: 1 }}>
        {label}
      </AppText>
      <Row gap={spacing.md}>
        <IconButton icon="remove-circle-outline" label={`Diminuer ${label.toLowerCase()}`} onPress={() => onChange(Math.max(min, value - 1))} />
        <AppText variant="heading" accessibilityLabel={`${label} : ${value}`} style={{ minWidth: 36, textAlign: 'center' }}>
          {value}
          {unit ? <AppText variant="small" color={colors.textMuted}>{` ${unit}`}</AppText> : null}
        </AppText>
        <IconButton icon="add-circle-outline" label={`Augmenter ${label.toLowerCase()}`} onPress={() => onChange(Math.min(max, value + 1))} />
      </Row>
    </Row>
  );
}

/* ─── États ─────────────────────────────────────────────────────────────── */

export function ProgressBar({ value, label }: { value: number; label?: string }) {
  const pct = Math.max(0, Math.min(1, value));
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}
      style={styles.progressTrack}
    >
      <View style={[styles.progressFill, { width: `${pct * 100}%` }]} />
    </View>
  );
}

export function Loading({ label = 'Chargement…' }: { label?: string }) {
  return (
    <View style={styles.centered} accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.primary} />
      <AppText color={colors.textMuted} style={{ marginTop: spacing.md }}>
        {label}
      </AppText>
    </View>
  );
}

export function EmptyState({ icon, title, message, action }: { icon: IconName; title: string; message: string; action?: ReactNode }) {
  return (
    <View style={[styles.centered, { paddingVertical: spacing.xxxl }]}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <AppText variant="heading" style={{ textAlign: 'center', marginTop: spacing.lg }}>
        {title}
      </AppText>
      <AppText color={colors.textMuted} style={{ textAlign: 'center', marginTop: spacing.xs, maxWidth: 320 }}>
        {message}
      </AppText>
      {action ? <View style={{ marginTop: spacing.lg, alignSelf: 'stretch' }}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <EmptyState
      icon="cloud-offline-outline"
      title="Un problème est survenu"
      message={message}
      action={onRetry ? <Button label="Réessayer" icon="refresh" variant="secondary" onPress={onRetry} /> : undefined}
    />
  );
}

type NoticeTone = 'info' | 'warning' | 'success' | 'danger';
const noticeTones: Record<NoticeTone, { bg: string; fg: string; icon: IconName }> = {
  info: { bg: colors.infoBg, fg: colors.info, icon: 'information-circle' },
  warning: { bg: colors.warningBg, fg: colors.warning, icon: 'warning' },
  success: { bg: colors.successBg, fg: colors.success, icon: 'checkmark-circle' },
  danger: { bg: colors.dangerBg, fg: colors.danger, icon: 'alert-circle' },
};

export function Notice({ tone = 'info', title, children }: { tone?: NoticeTone; title?: string; children?: ReactNode }) {
  const t = noticeTones[tone];
  return (
    <View style={[styles.notice, { backgroundColor: t.bg }]} accessibilityRole="summary">
      <Ionicons name={t.icon} size={20} color={t.fg} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, gap: spacing.xxs }}>
        {title ? (
          <AppText variant="bodyStrong" color={t.fg}>
            {title}
          </AppText>
        ) : null}
        {typeof children === 'string' ? (
          <AppText variant="small" color={t.fg}>
            {children}
          </AppText>
        ) : (
          children
        )}
      </View>
    </View>
  );
}

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: 'neutral' | 'success' | 'warning' | 'demo' }) {
  const map = {
    neutral: { bg: colors.sageLight, fg: colors.primary },
    success: { bg: colors.successBg, fg: colors.success },
    warning: { bg: colors.warningBg, fg: colors.warning },
    demo: { bg: colors.cream, fg: colors.textMuted },
  }[tone];
  return (
    <View style={[styles.badge, { backgroundColor: map.bg }]}>
      <AppText variant="caption" color={map.fg}>
        {label}
      </AppText>
    </View>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.md }} />;
}

/** Ligne de liste cliquable (paramètres, menus). */
export function ListItem({ icon, label, description, onPress, danger = false }: { icon: IconName; label: string; description?: string; onPress: () => void; danger?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.listItem, pressed && { backgroundColor: colors.sageSoft }]}
    >
      <Ionicons name={icon} size={22} color={danger ? colors.danger : colors.primary} />
      <View style={{ flex: 1 }}>
        <AppText variant="bodyStrong" color={danger ? colors.danger : colors.text}>
          {label}
        </AppText>
        {description ? (
          <AppText variant="small" color={colors.textMuted}>
            {description}
          </AppText>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.borderStrong} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1 },
  content: { width: '100%', maxWidth: maxContentWidth, alignSelf: 'center', flexGrow: 1 },
  padded: { padding: spacing.lg, paddingBottom: spacing.xxl },
  footer: {
    padding: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
    width: '100%',
    maxWidth: maxContentWidth,
    alignSelf: 'center',
  },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border, ...shadow },
  button: {
    minHeight: touchTarget + 6,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  buttonSmall: { minHeight: touchTarget - 4, paddingHorizontal: spacing.lg },
  iconButton: { width: touchTarget, height: touchTarget, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  selectable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    minHeight: touchTarget + 16,
  },
  selectableOn: { borderColor: colors.primary, backgroundColor: colors.sageSoft },
  selectableIcon: { width: 40, height: 40, borderRadius: radius.pill, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    minHeight: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderStrong,
  },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    minHeight: touchTarget + 4,
  },
  progressTrack: { height: 8, borderRadius: radius.pill, backgroundColor: colors.sageLight, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radius.pill, backgroundColor: colors.primary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyIcon: { width: 72, height: 72, borderRadius: radius.pill, backgroundColor: colors.sageLight, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md, borderRadius: radius.sm, marginBottom: spacing.md },
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.pill, alignSelf: 'flex-start' },
  listItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, minHeight: touchTarget + 12, borderRadius: radius.sm },
});
