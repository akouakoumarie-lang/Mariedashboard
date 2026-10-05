# Marie Dashboard

Mon cockpit personnel : toute ma vie au même endroit.

- **☀️ Aujourd'hui** : tâches pro et école du jour, paiements à prévoir, routines (sport, courses…), budget restant, jours avant le prochain salaire, ce qui arrive dans les 7 prochains jours et à l'horizon (examens, voyages, revenus exceptionnels).
- **💰 Argent** : salaire et CAF (reçu / attendu), revenus exceptionnels, loyers et charges mensuelles, dépenses du mois par catégorie, dettes, épargne, budget disponible jusqu'à la fin du mois (avec le détail du calcul).
- **💼 Travail** : tâches Safran, projets, personnes à contacter, candidatures CDI, opportunités, formations, compétences (avec statuts).
- **🎓 École** : devoirs, examens, rattrapages, échéances, TOEIC, documents importants.
- **✈️ Voyages** : destination, dates, compte à rebours, budget prévu et dépensé, billets et hôtels, checklist, documents.
- **🏠 Quotidien** : courses, démarches administratives, renouvellement de documents, rappels, routines, abonnements et factures.

## Utilisation

Aucune installation : c'est une page web statique (HTML, CSS, JS, sans dépendance).

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

On peut aussi l'héberger gratuitement avec GitHub Pages (Settings → Pages → branche principale) et l'ajouter à l'écran d'accueil du téléphone.

## Données

- Tout est enregistré **localement dans le navigateur** (localStorage). Rien n'est envoyé sur internet.
- Au premier lancement, des **données d'exemple** sont chargées. Dans *Réglages*, « Tout effacer » permet de repartir de zéro.
- Pour faire une sauvegarde ou passer sur un autre appareil : *Réglages → Exporter / Importer* (fichier JSON).

## Calcul du budget restant

```
Solde au début du mois (salaire du mois dernier compris)
+ revenus reçus ce mois (salaire, CAF, revenus exceptionnels marqués « reçus »)
− loyers, factures et abonnements du mois
− dépenses du mois
= budget disponible jusqu'à la fin du mois
```
