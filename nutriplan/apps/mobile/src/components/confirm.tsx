import { useCallback, useState, type ReactNode } from 'react';
import { Modal, Pressable, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../theme/tokens';
import { AppText, Button } from './ui';

interface Request {
  title: string;
  message: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
}

/**
 * Confirmation intégrée à l'interface (identique sur iOS, Android et web,
 * y compris là où les boîtes de dialogue du navigateur sont bloquées).
 */
export function useConfirm(): [ReactNode, (r: Request) => void] {
  const [req, setReq] = useState<Request | null>(null);
  const close = () => setReq(null);
  const element = (
    <Modal visible={!!req} transparent animationType="fade" onRequestClose={close}>
      <Pressable onPress={close} accessibilityLabel="Fermer" style={{ flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl }}>
        <Pressable accessibilityRole="alert" style={{ backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, gap: spacing.md, width: '100%', maxWidth: 420, alignSelf: 'center', ...shadow }}>
          <AppText variant="heading">{req?.title}</AppText>
          <AppText color={colors.textMuted}>{req?.message}</AppText>
          <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
            <Button
              label={req?.confirmLabel ?? 'Confirmer'}
              variant={req?.destructive ? 'danger' : 'primary'}
              onPress={() => {
                const fn = req?.onConfirm;
                close();
                fn?.();
              }}
            />
            <Button label="Annuler" variant="ghost" onPress={close} />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
  const ask = useCallback((r: Request) => setReq(r), []);
  return [element, ask];
}
