import { AppText, Screen, SectionHeader } from '../../src/components/ui';
import { APP_NAME } from '../../src/lib/config';
import { colors, spacing } from '../../src/theme/tokens';

const P = ({ children }: { children: string }) => (
  <AppText color={colors.text} style={{ marginBottom: spacing.sm }}>
    {children}
  </AppText>
);

/** Politique de confidentialité (à faire relire par un·e juriste avant une mise en production). */
export default function Privacy() {
  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        Politique de confidentialité
      </AppText>
      <AppText variant="small" color={colors.textMuted} style={{ marginBottom: spacing.md }}>
        Version de travail — à compléter avec l’identité du responsable de traitement avant publication.
      </AppText>

      <SectionHeader title="Données collectées" />
      <P>{`${APP_NAME} collecte uniquement les données nécessaires à la personnalisation de vos menus : adresse e-mail (connexion), âge, objectif, niveau d’activité, préférences et exclusions alimentaires, allergies, régime, budget, organisation, équipement et aliments disponibles. La taille, le poids, le sexe et le suivi du poids sont facultatifs.`}</P>

      <SectionHeader title="Données sensibles" />
      <P>Les allergies, le régime alimentaire et les mesures corporelles peuvent révéler des informations relatives à la santé. Elles ne sont utilisées que pour filtrer les recettes et estimer des besoins énergétiques à titre indicatif, ne sont jamais vendues ni partagées à des fins publicitaires, et ne sont accessibles qu’à vous.</P>

      <SectionHeader title="Base légale" />
      <P>Le traitement repose sur votre consentement explicite, recueilli à la création du compte. Vous pouvez le retirer à tout moment en supprimant votre compte.</P>

      <SectionHeader title="Hébergement et sous-traitants" />
      <P>Les données sont stockées dans une base PostgreSQL et l’authentification est assurée par Supabase. Si la fonctionnalité d’idées de recettes par IA est activée, seuls la liste d’ingrédients autorisés, le type de repas et votre éventuel souhait sont transmis au fournisseur du modèle de langage, sans e-mail ni donnée d’identification.</P>

      <SectionHeader title="Durée de conservation" />
      <P>Vos données sont conservées tant que votre compte est actif. Les programmes archivés sont supprimés automatiquement après 12 mois. La suppression du compte efface immédiatement toutes vos données de l’application.</P>

      <SectionHeader title="Vos droits" />
      <P>Conformément au RGPD, vous disposez d’un droit d’accès, de rectification, d’effacement, de portabilité et d’opposition. Vous pouvez modifier vos informations, exporter vos données et supprimer votre compte directement depuis l’application. Vous pouvez également introduire une réclamation auprès de la CNIL (cnil.fr).</P>

      <SectionHeader title="Avertissement" />
      <P>Les estimations nutritionnelles et les prix affichés sont indicatifs. Ils ne constituent ni un avis médical ni des prix garantis.</P>
    </Screen>
  );
}
