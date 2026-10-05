# 🔔 Activer les notifications sur le téléphone

Ce que tu reçois, **même quand l'app est fermée** :

- ☀️ **Résumé du matin**, à l'heure que tu choisis : choses à faire, paiements des 3 prochains jours, sport du jour, budget restant, jours avant le salaire.
- ⏰ **Rappel avant chaque tâche ou routine qui a une heure** : à l'heure pile, 5, 15 ou 30 min avant, ou 1 h avant.

Le fonctionnement : toutes les 5 minutes, ton projet Supabase regarde ton planning et envoie les notifications.
C'est gratuit et à configurer **une seule fois** (environ 15 minutes).

## Prérequis

1. La **synchronisation** est active (voir [SUPABASE.md](SUPABASE.md)).
2. L'app est **en ligne** sur GitHub Pages (`https://…github.io/Mariedashboard/`). Les notifications ne marchent pas sur un fichier ouvert en local.
3. **Sur iPhone** (iOS 16.4 ou plus récent) : ouvre l'app dans Safari → bouton Partager → **Sur l'écran d'accueil**, puis utilise toujours l'app depuis cette icône.
   **Sur Android** : Chrome suffit. L'installer sur l'écran d'accueil est conseillé.

## 1. Générer tes clés (dans l'app)

*Paramètres → 🔔 Notifications → **Générer mes clés***.

Une fenêtre affiche tout ce qu'il faut copier, avec des boutons « Copier ». **Garde-la ouverte** pendant les étapes suivantes : la clé privée n'est affichée qu'une fois. Si tu la perds, utilise « Refaire la configuration ».

## 2. Créer les tables

Supabase → **SQL Editor** → New query → colle le contenu de [`supabase/notifications.sql`](supabase/notifications.sql) → **Run**.

## 3. Déployer la fonction `notify`

1. Supabase → **Edge Functions** → **Deploy a new function** → **Via Editor**.
2. Nom de la fonction : `notify`.
3. Remplace tout le code par le contenu de [`supabase/functions/notify/index.ts`](supabase/functions/notify/index.ts) → **Deploy**.
4. Dans les réglages de la fonction (**Details** / **Settings**) : désactive **Verify JWT** (« Enforce JWT verification »), puis enregistre.
   La fonction vérifie elle-même qui l'appelle, avec ton `CRON_SECRET` ou ta connexion.

## 4. Ajouter les secrets

Supabase → **Edge Functions** → **Secrets** (ou *Project Settings → Edge Functions*). Ajoute ces 4 secrets, en copiant les valeurs depuis la fenêtre de l'app :

| Nom | Valeur |
| --- | --- |
| `VAPID_PUBLIC_KEY` | la clé publique |
| `VAPID_PRIVATE_KEY` | la clé privée 🔒 |
| `VAPID_SUBJECT` | `mailto:` suivi de ton email, ex. `mailto:marie@exemple.com` |
| `CRON_SECRET` | le secret 🔒 |

## 5. Lancer le planificateur

SQL Editor → nouvelle requête → colle le **script du planificateur** affiché dans la fenêtre de l'app (ton adresse et ton secret sont déjà remplis) → **Run**.

## 6. Activer chaque téléphone

Dans l'app : *Paramètres → 🔔 Notifications* :

1. **Activer sur cet appareil** → accepte la demande d'autorisation.
2. **Envoyer un test** → tu dois recevoir « Les notifications fonctionnent 💖 ».
3. Choisis l'heure du résumé du matin et le délai des rappels → **Enregistrer**.

Recommence l'étape 6 sur chaque téléphone ou ordinateur où tu veux recevoir les notifications.

## En cas de souci

- *« La fonction notify n'est pas encore déployée »* → étape 3.
- *« Les tables de notifications n'existent pas »* → étape 2.
- *« Secret manquant : … »* → étape 4. Vérifie l'orthographe du nom.
- Le test fonctionne mais pas le résumé du matin → étape 5. Dans *Integrations → Cron*, la tâche `marie-notify` doit apparaître.
- Rien sur iPhone → l'app doit être ouverte **depuis l'icône de l'écran d'accueil**, et les notifications autorisées dans *Réglages iOS → Notifications → Marie*.
- « Bloquées » dans l'app → autorise les notifications pour le site dans les réglages du navigateur ou du téléphone.
