# ☁️ Activer la synchronisation (Supabase)

Objectif : retrouver les mêmes données sur le téléphone et l'ordinateur.
Supabase est un service en ligne avec une offre **gratuite**, largement suffisante ici.
Compte environ 10 minutes, à faire **une seule fois**.

## 1. Créer le projet

1. Aller sur <https://supabase.com> → **Start your project** → créer un compte (avec GitHub ou un email).
2. **New project** :
   - *Name* : `marie-dashboard`
   - *Database password* : cliquer sur **Generate a password** (inutile de le retenir, l'app ne s'en sert pas)
   - *Region* : une région en Europe (Paris ou Francfort)
3. **Create new project**, puis attendre 1 à 2 minutes que le projet soit prêt.

## 2. Créer la table

1. Menu de gauche → **SQL Editor** → **New query**.
2. Copier-coller tout le contenu du fichier [`supabase/schema.sql`](supabase/schema.sql).
3. Cliquer sur **Run**. Le message doit être « Success. No rows returned ».

Ce script crée la table `dashboards` et active la sécurité (RLS) : chaque compte ne peut lire et modifier **que ses propres données**.

## 3. Simplifier la connexion (conseillé)

Menu **Authentication** → **Sign In / Providers** → **Email** :

- désactiver **Confirm email**, puis **Save**.

Sinon, Supabase envoie un email de confirmation à la création du compte. Le lien de cet email ouvre une adresse par défaut (localhost) : c'est normal, la confirmation est quand même prise en compte et on peut ensuite se connecter dans l'app.

*Une fois ton compte créé (étape 5), tu peux aussi désactiver **Allow new users to sign up** (même page, section « User Signups ») pour que personne d'autre ne puisse créer de compte.*

## 4. Récupérer l'adresse et la clé

Bouton **Connect** en haut du projet (ou **Project Settings** → **API Keys** / **Data API**). Il faut copier :

- **Project URL**, de la forme `https://abcdefgh.supabase.co`
- la **clé publique** : `anon public` (commence par `eyJ…`) ou `publishable` (commence par `sb_publishable_…`)

⚠️ Ne jamais utiliser la clé `service_role` / `secret`.

La clé publique peut être partagée sans risque : ce sont les règles RLS de l'étape 2 qui protègent les données.

## 5. Connecter l'app

Sur **chaque appareil** : *Réglages* (⚙️) → **☁️ Synchronisation** :

1. Coller la *Project URL* et la *clé publique* → **Enregistrer**.
2. La première fois (sur l'appareil qui a tes vraies données) : email et mot de passe, puis **Créer mon compte**.
3. Sur les autres appareils : même email et même mot de passe, puis **Se connecter**.

> Astuce : pour éviter de recopier l'adresse et la clé sur chaque appareil, on peut les écrire une fois pour toutes dans `config.js`. Il suffit ensuite de se connecter.

## Comment ça marche

- Chaque modification est envoyée automatiquement, environ 1 seconde plus tard.
- À l'ouverture de l'app (ou quand on revient dessus), elle récupère la dernière version.
- À la première connexion sur un appareil, **la version en ligne remplace** les données de cet appareil (par exemple les données d'exemple d'un nouveau téléphone).
- Si les deux appareils sont modifiés hors connexion, c'est **la modification la plus récente qui l'emporte**.
- Sans connexion internet, l'app continue de fonctionner. La synchronisation reprend au retour du réseau.

## Bon à savoir

Sur l'offre gratuite, Supabase met en pause les projets qui restent **sans aucune activité pendant une semaine**. Utiliser l'app régulièrement suffit à l'éviter. Si le projet est en pause, il suffit de le relancer depuis le site de Supabase (**Restore project**) : les données sont conservées.
