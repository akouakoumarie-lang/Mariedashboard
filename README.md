# Marie Dashboard

*My life, organized.* ✦ Mon cockpit personnel, pensé comme une app de téléphone : glam rose & léopard, inspiration Bratz.

- **Écran d'accueil** : MARIE DASHBOARD, avec ta photo en fond si tu en ajoutes une.
- **Accueil** : bonjour + rappels 🔔, affirmation du jour, « Aujourd'hui » (choses à faire, échéances, prochain salaire, sport, gratitude), tuiles Money, Career, Travel et Goals.
- **Tâches** : filtres Tout, Pro, École et Perso ; en retard, aujourd'hui (avec heures), cette semaine, plus tard.
- **Calendrier** : le mois avec des pastilles, et l'agenda du jour choisi (tâches, routines, paiements, revenus, voyages).
- **Argent** : solde disponible (masquable), revenus et dépenses du mois, prochains revenus, dépenses à venir, dépenses, épargne, dettes.
- **Carrière** : objectif CDI avec avancement, candidatures, entretiens, formations, projets.
- **École** : formation et avancement de l'année, échéances, cours et projets.
- **Voyages** : prochain voyage en photo, budget, liste avec statuts ; pour chaque voyage, billets, hôtels, checklist et documents.
- **Objectifs** : par domaine, avec barre d'avancement.
- **Manifestation** : « Tu fais déjà un super travail ♥ », autocollants, affirmation du jour, gratitude, vision board avec photos.
- **Menu** : profil avec photo, raccourcis vers tous les espaces, documents, paramètres, synchronisation.

Le bouton **+** au centre ajoute n'importe quoi : tâche, dépense, revenu, charge, objectif, voyage, routine, gratitude, document.

## Utilisation

Aucune installation : c'est une page web statique (HTML, CSS, JS, sans dépendance).

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

### Mettre l'app en ligne (GitHub Pages)

1. Sur GitHub, ouvrir le dépôt → **Settings** → **Pages**.
2. *Source* : **Deploy from a branch**.
3. *Branch* : `claude/marie-dashboard-personal-9ve4y3`, dossier **/ (root)** → **Save**.
4. Après 1 à 2 minutes, l'app est disponible à l'adresse
   `https://akouakoumarie-lang.github.io/Mariedashboard/`.

Sur le téléphone, ouvrir cette adresse puis « Ajouter à l'écran d'accueil » (Safari : bouton Partager ; Chrome : menu ⋮).
L'adresse est publique mais **les données ne le sont pas** : elles restent dans le navigateur de chaque appareil.

## Données

- Tout est enregistré **localement dans le navigateur** (localStorage).
- **Synchronisation téléphone ↔ ordinateur (facultative)** : avec un compte Supabase gratuit. Le guide pas à pas est dans [SUPABASE.md](SUPABASE.md). Sans synchronisation, rien n'est envoyé sur internet.
- Au premier lancement, des **données d'exemple** sont chargées. Dans *Réglages*, « Tout effacer » permet de repartir de zéro.
- Sauvegarde manuelle : *Réglages → Exporter / Importer* (fichier JSON).

## Calcul du budget restant

```
Solde au début du mois (salaire du mois dernier compris)
+ revenus reçus ce mois (salaire, CAF, revenus exceptionnels marqués « reçus »)
− loyers, factures et abonnements du mois
− dépenses du mois
= budget disponible jusqu'à la fin du mois
```
