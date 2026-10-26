import type { FieldPath } from 'react-hook-form';
import type { ComponentType } from 'react';
import type { OnboardingInput } from './form';
import {
  AboutSection,
  ActivitySection,
  AllergySection,
  BudgetSection,
  DietSection,
  DislikesSection,
  EquipmentSection,
  GoalSection,
  InventorySection,
  LikesSection,
  OrganisationSection,
  SummarySection,
  type SectionProps,
} from './sections';

export interface Step {
  key: string;
  title: string;
  subtitle: string;
  /** Champs validés avant de passer à l'étape suivante. */
  fields: FieldPath<OnboardingInput>[];
  Section: ComponentType<SectionProps>;
}

/** Une question par écran : le questionnaire n'affiche jamais tout d'un coup. */
export const STEPS: Step[] = [
  { key: 'goal', title: 'Quel est votre objectif ?', subtitle: 'Nous adaptons les menus à ce qui compte pour vous.', fields: ['profile.goal'], Section: GoalSection },
  { key: 'about', title: 'Faisons connaissance', subtitle: 'Seul votre âge est nécessaire.', fields: ['profile.displayName', 'profile.age', 'profile.heightCm', 'profile.weightKg', 'profile.sex'], Section: AboutSection },
  { key: 'activity', title: 'Votre activité physique', subtitle: 'Pour estimer vos besoins, à titre indicatif.', fields: ['profile.activityLevel', 'profile.trainingSessionsPerWeek'], Section: ActivitySection },
  { key: 'diet', title: 'Suivez-vous un régime alimentaire ?', subtitle: 'Plusieurs choix possibles.', fields: ['profile.diets'], Section: DietSection },
  { key: 'allergies', title: 'Avez-vous des allergies ?', subtitle: 'Les 14 allergènes réglementaires en Europe.', fields: ['allergies'], Section: AllergySection },
  { key: 'likes', title: 'Les aliments que vous aimez', subtitle: 'Ils seront mis en avant dans vos menus.', fields: ['preferences.likedIngredientIds'], Section: LikesSection },
  { key: 'dislikes', title: 'Les aliments à éviter', subtitle: 'Ceux que vous ne voulez jamais voir dans vos menus.', fields: ['preferences'], Section: DislikesSection },
  { key: 'budget', title: 'Votre foyer et votre budget', subtitle: 'Prix estimés en euros, à titre indicatif.', fields: ['profile.householdSize', 'profile.weeklyBudgetCents'], Section: BudgetSection },
  { key: 'organisation', title: 'Votre organisation', subtitle: 'Nombre de repas, durée du programme et temps disponible.', fields: ['profile.mealsPerDay', 'profile.planningDays', 'profile.cookingTimePreference'], Section: OrganisationSection },
  { key: 'equipment', title: 'Votre équipement de cuisine', subtitle: 'Nous ne proposerons que des recettes réalisables chez vous.', fields: ['profile.equipment'], Section: EquipmentSection },
  { key: 'inventory', title: 'Qu’avez-vous déjà chez vous ?', subtitle: 'Réfrigérateur, placards, congélateur…', fields: ['inventory'], Section: InventorySection },
  { key: 'summary', title: 'Tout est prêt !', subtitle: 'Vérifiez vos réponses avant de créer votre programme.', fields: [], Section: SummarySection },
];
