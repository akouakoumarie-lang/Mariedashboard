import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Rappels locaux (programmés sur le téléphone, aucune donnée envoyée à un serveur) :
 * un rappel quotidien en fin d'après-midi pour penser au repas du soir.
 */
export const notificationsSupported = Platform.OS !== 'web';

const REMINDER_ID = 'nutriplan-daily-reminder';

export async function enableDailyReminder(): Promise<boolean> {
  if (!notificationsSupported) return false;
  const current = await Notifications.getPermissionsAsync();
  const granted = current.granted || (await Notifications.requestPermissionsAsync()).granted;
  if (!granted) return false;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined);
  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_ID,
    content: { title: 'Le repas de ce soir', body: 'Jetez un œil à votre programme du jour dans NutriPlan.' },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 17, minute: 30 },
  });
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  if (!notificationsSupported) return;
  await Notifications.cancelScheduledNotificationAsync(REMINDER_ID).catch(() => undefined);
}
