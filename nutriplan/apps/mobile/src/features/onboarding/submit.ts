import { api, ApiError } from '../../lib/api';
import { localToday } from '../../lib/format';
import type { OnboardingOutput } from './form';

/**
 * Enregistre réellement les réponses sur le serveur, puis génère le premier programme.
 * Chaque étape est attendue : rien n'est considéré comme sauvegardé sans réponse de l'API.
 */
export async function submitOnboarding(values: OnboardingOutput, onProgress: (label: string) => void): Promise<{ planError: string | null }> {
  onProgress('Enregistrement de votre profil…');
  await api('/me/profile', { method: 'PUT', body: values.profile });
  onProgress('Enregistrement de vos préférences…');
  await api('/me/preferences', { method: 'PUT', body: values.preferences });
  await api('/me/allergies', { method: 'PUT', body: values.allergies });
  for (const item of values.inventory) {
    await api('/me/inventory', { method: 'POST', body: item });
  }
  onProgress('Création de votre programme…');
  try {
    await api('/meal-plans/generate', { method: 'POST', body: { startDate: localToday() } });
    return { planError: null };
  } catch (e) {
    // Le profil est enregistré ; le programme pourra être généré depuis le planning.
    if (e instanceof ApiError && e.status === 422) return { planError: e.message };
    throw e;
  }
}
