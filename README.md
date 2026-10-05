# Marie Dashboard

Mon cockpit personnel : toute ma vie au même endroit.

- **☀️ Aujourd'hui** : tâches pro et école du jour, paiements à prévoir, routines (sport, courses…), budget restant, jours avant le prochain salaire, ce qui arrive dans les 7 prochains jours et à l'horizon (examens, voyages, revenus exceptionnels).
- **💰 Argent** : salaire et CAF (reçu / attendu), revenus exceptionnels, loyers et charges mensuelles, dépenses du mois par catégorie, dettes, épargne, budget disponible jusqu'à la fin du mois (avec le détail du calcul).
- **💼 Travail** : tâches Safran, projets, personnes à contacter, candidatures CDI, opportunités, formations, compétences (avec statuts).
- **🎓 École** : devoirs, examens, rattrapages, échéances, TOEIC, documents importants.
- **✈️ Voyages** : destination, dates, compte à rebours, budget prévu et dépensé, billets et hôtels, checklist, documents.
- **🏠 Quotidien** : courses, démarches administratives, renouvellement de documents, rappels, routines, abonnements et factures.
- **✨ Manifestation** : affirmation du jour (aussi en haut de la page Aujourd'hui), vision board avec photos, rêves « manifestés », 3 gratitudes par jour avec série de jours, liste d'affirmations personnalisable.

Le tout en **rose et léopard** 🐆💕, en mode clair ou sombre.

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
