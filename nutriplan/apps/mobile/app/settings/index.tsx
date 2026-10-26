import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, Share, Switch, View } from 'react-native';
import { AppText, Card, Divider, ListItem, Notice, Row, Screen, SectionHeader } from '../../src/components/ui';
import { api, errorMessage } from '../../src/lib/api';
import { useConfirm } from '../../src/components/confirm';
import { StorageNotice } from '../../src/components/storage-notice';
import { useAuth } from '../../src/lib/auth';
import { LOCAL_MODE } from '../../src/lib/config';
import { queryClient } from '../../src/lib/queries';
import { disableDailyReminder, enableDailyReminder, notificationsSupported } from '../../src/lib/notifications';
import { useAccount, useNotificationSetting, useProfile } from '../../src/lib/queries';
import { clearDraft } from '../../src/features/onboarding/form';
import { colors, spacing } from '../../src/theme/tokens';

export default function Settings() {
  const { signOut } = useAuth();
  const account = useAccount();
  const profile = useProfile();
  const notif = useNotificationSetting();
  const [message, setMessage] = useState<{ tone: 'success' | 'danger' | 'info'; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmEl, confirm] = useConfirm();

  const toggleNotifications = async (enabled: boolean) => {
    setMessage(null);
    try {
      if (enabled) {
        const granted = await enableDailyReminder();
        if (!granted) return setMessage({ tone: 'info', text: 'Autorisez les notifications dans les réglages du téléphone pour recevoir le rappel.' });
      } else {
        await disableDailyReminder();
      }
      await notif.mutateAsync(enabled);
    } catch (e) {
      setMessage({ tone: 'danger', text: errorMessage(e) });
    }
  };

  const exportData = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const data = await api<unknown>('/me/export');
      const json = JSON.stringify(data, null, 2);
      const claude = (globalThis as unknown as { claude?: { use(n: string): Promise<unknown> } }).claude;
      const downloads = claude?.use ? ((await claude.use('downloads')) as { save(f: { filename: string; data: string }): Promise<unknown> } | null) : null;
      if (downloads) {
        await downloads.save({ filename: 'nutriplan-mes-donnees.json', data: json });
      } else if (Platform.OS === 'web') {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'nutriplan-mes-donnees.json';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        await Share.share({ title: 'Mes données NutriPlan', message: json });
      }
      setMessage({ tone: 'success', text: 'Export de vos données prêt.' });
    } catch (e) {
      setMessage({ tone: 'danger', text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = () =>
    confirm({
      title: LOCAL_MODE ? 'Supprimer toutes mes données' : 'Supprimer mon compte',
      message: 'Toutes vos données (profil, allergies, programmes, listes de courses, suivi) seront définitivement supprimées. Cette action est irréversible.',
      confirmLabel: 'Supprimer définitivement',
      destructive: true,
      onConfirm: async () => {
      setBusy(true);
      try {
        const res = await api<{ message: string }>('/me', { method: 'DELETE' });
        await disableDailyReminder();
        await clearDraft();
        if (LOCAL_MODE) queryClient.clear();
        else await signOut();
        void res;
        router.replace('/welcome');
      } catch (e) {
        setMessage({ tone: 'danger', text: errorMessage(e) });
        setBusy(false);
      }
      },
    });

  return (
    <Screen>
      {confirmEl}
      {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
      {LOCAL_MODE ? (
        <StorageNotice />
      ) : (
        <Card>
          <AppText variant="caption" color={colors.textMuted}>
            CONNECTÉ·E AVEC
          </AppText>
          <AppText variant="bodyStrong">{account.data?.email ?? '—'}</AppText>
        </Card>
      )}

      <SectionHeader title="Mon profil" />
      <Card style={{ paddingVertical: spacing.xs }}>
        <ListItem icon="person-outline" label="Modifier mon profil" description="Objectif, âge, taille, poids, activité" onPress={() => router.push('/settings/profile')} />
        <ListItem icon="heart-outline" label="Préférences alimentaires" description="Aliments aimés et exclus" onPress={() => router.push('/settings/preferences')} />
        <ListItem icon="medkit-outline" label="Allergies et régime" onPress={() => router.push('/settings/allergies')} />
        <ListItem icon="wallet-outline" label="Budget et organisation" description="Budget, foyer, repas, temps, équipement" onPress={() => router.push('/settings/budget')} />
        <ListItem icon="file-tray-stacked-outline" label="Mes placards" description="Aliments déjà disponibles" onPress={() => router.push('/settings/inventory')} />
      </Card>

      <SectionHeader title="Notifications" />
      <Card>
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1, paddingRight: spacing.md }}>
            <AppText variant="bodyStrong">Rappel quotidien à 17 h 30</AppText>
            <AppText variant="small" color={colors.textMuted}>
              {notificationsSupported ? 'Un rappel local pour penser au repas du soir.' : 'Disponible dans l’application mobile.'}
            </AppText>
          </View>
          {notificationsSupported ? (
            <Switch
              value={!!profile.data?.profile?.notificationsEnabled}
              onValueChange={toggleNotifications}
              disabled={notif.isPending || !profile.data?.profile}
              accessibilityLabel="Rappel quotidien"
              trackColor={{ true: colors.primary, false: colors.border }}
            />
          ) : null}
        </Row>
      </Card>

      <SectionHeader title="Mes données" />
      <Card style={{ paddingVertical: spacing.xs }}>
        <ListItem icon="shield-checkmark-outline" label="Politique de confidentialité" onPress={() => router.push('/settings/privacy')} />
        <ListItem icon="download-outline" label={busy ? 'Export en cours…' : 'Exporter mes données'} description="Fichier JSON (droit à la portabilité)" onPress={() => !busy && exportData()} />
        <Divider />
        {LOCAL_MODE ? null : <ListItem icon="log-out-outline" label="Se déconnecter" onPress={async () => { await signOut(); router.replace('/welcome'); }} />}
        <ListItem icon="trash-outline" label={LOCAL_MODE ? 'Supprimer toutes mes données' : 'Supprimer mon compte et mes données'} danger onPress={() => !busy && deleteAccount()} />
      </Card>
    </Screen>
  );
}
