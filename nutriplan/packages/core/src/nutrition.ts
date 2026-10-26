import type { ActivityLevel, Goal, Sex } from './domain';

/**
 * Estimation des besoins énergétiques — À TITRE INDICATIF UNIQUEMENT.
 * Formule de Mifflin-St Jeor (1990) et facteurs d'activité usuels.
 * Ce n'est ni un diagnostic ni une prescription : les besoins réels varient selon
 * chaque personne. Pour un suivi médical, consulter un·e professionnel·le de santé.
 */

export const NUTRITION_DISCLAIMER =
  "Estimation indicative calculée avec la formule de Mifflin-St Jeor. Ce n'est pas un avis médical : pour un accompagnement personnalisé, consultez un·e médecin ou un·e diététicien·ne.";

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentaire: 1.2,
  leger: 1.375,
  modere: 1.55,
  actif: 1.725,
  tres_actif: 1.9,
};

export interface EnergyInput {
  age?: number | null;
  sex?: Sex | null;
  heightCm?: number | null;
  weightKg?: number | null;
  activityLevel?: ActivityLevel | null;
  goal?: Goal | null;
}

export interface EnergyEstimate {
  /** Objectif énergétique quotidien estimé (kcal), arrondi à 50 kcal. */
  targetKcal: number;
  /** Fourchette indicative ±10 %. */
  rangeKcal: [number, number];
  maintenanceKcal: number;
  notes: string[];
  disclaimer: string;
}

/** Renvoie null si les données sont insuffisantes : l'application n'invente pas de valeur. */
export function estimateDailyEnergy(input: EnergyInput): EnergyEstimate | null {
  const { age, heightCm, weightKg } = input;
  if (!age || !heightCm || !weightKg) return null;
  const notes: string[] = [];

  const sexConstant = input.sex === 'homme' ? 5 : input.sex === 'femme' ? -161 : -78;
  if (!input.sex || input.sex === 'non_precise') notes.push('Sexe non précisé : moyenne des deux formules utilisée.');
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + sexConstant;
  const maintenance = bmr * ACTIVITY_FACTORS[input.activityLevel ?? 'leger'];

  let target = maintenance;
  const bmi = weightKg / (heightCm / 100) ** 2;
  if (input.goal === 'perte_de_poids') {
    if (age < 18) {
      notes.push("Pas d'objectif de perte de poids calculé pour les moins de 18 ans. Parlez-en à un·e professionnel·le de santé.");
    } else if (bmi < 18.5) {
      notes.push("Votre IMC estimé est bas : nous ne proposons pas de déficit calorique. Parlez-en à un·e professionnel·le de santé.");
    } else {
      // Déficit modéré (−15 %) et jamais en dessous du métabolisme de base ni de 1 200 kcal.
      target = Math.max(maintenance * 0.85, bmr, 1200);
      notes.push('Déficit modéré appliqué (au maximum 15 %) pour une évolution progressive et durable.');
    }
  } else if (input.goal === 'prise_de_muscle') {
    target = maintenance * 1.1;
    notes.push("Léger surplus (+10 %), à associer à une activité physique régulière.");
  }

  const round50 = (n: number) => Math.round(n / 50) * 50;
  return {
    targetKcal: round50(target),
    rangeKcal: [round50(target * 0.9), round50(target * 1.1)],
    maintenanceKcal: round50(maintenance),
    notes,
    disclaimer: NUTRITION_DISCLAIMER,
  };
}

/** Répartition indicative de l'énergie entre les repas de la journée. */
export function mealEnergyShare(mealType: string, mealsPerDay: number): number {
  const shares: Record<number, Record<string, number>> = {
    1: { diner: 1 },
    2: { dejeuner: 0.5, diner: 0.5 },
    3: { petit_dejeuner: 0.25, dejeuner: 0.4, diner: 0.35 },
    4: { petit_dejeuner: 0.22, dejeuner: 0.35, gouter: 0.1, diner: 0.33 },
    5: { petit_dejeuner: 0.2, collation: 0.08, dejeuner: 0.32, gouter: 0.1, diner: 0.3 },
  };
  return shares[Math.max(1, Math.min(5, mealsPerDay))]?.[mealType] ?? 0.3;
}
