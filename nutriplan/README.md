# NutriPlan

Application mobile de nutrition et de planification alimentaire : un programme de repas personnalisé
selon vos objectifs, vos goûts, vos allergies, votre budget et votre temps, avec la liste de courses qui va avec.
Elle est conçue pour le marché français (euros, grammes et millilitres, ingrédients de supermarché, interface en français).

| Accueil | Planning | Remplacer un repas | Courses | Suivi |
|---|---|---|---|---|
| ![](docs/screenshots/12b-tableau-de-bord-complet.png) | ![](docs/screenshots/13-planning.png) | ![](docs/screenshots/15-remplacer.png) | ![](docs/screenshots/19-courses-coche.png) | ![](docs/screenshots/20-suivi.png) |

> Captures prises dans Chromium (version web de l'app Expo) contre l'API et la base PostgreSQL réelles.

* **Architecture, décisions, modèle de données, sécurité** : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
* **API documentée** (Swagger) : `http://localhost:3000/docs` une fois l'API lancée

## Contenu

| Dossier | Rôle | Technologies |
|---|---|---|
| `packages/core` | Règles métier partagées et schémas de validation | TypeScript, Zod, Vitest |
| `apps/api` | API REST, base de données, authentification, IA | NestJS 11, Prisma 6, PostgreSQL, jose, SDK Anthropic |
| `apps/mobile` | Application iOS / Android (et web pour les tests) | Expo SDK 58, Expo Router, TanStack Query, React Hook Form, Zod, Supabase JS |

Fonctionnalités du MVP : écran de bienvenue ; questionnaire en 12 étapes, avec barre de progression, retour arrière sans perte et brouillon sauvegardé sur l'appareil ; inscription et connexion Supabase ; tableau de bord ; planning sur 1 à 14 jours (remplacer, déplacer, changer les portions, marquer comme réalisé, favori) ; générateur de menus sous contraintes avec explication en cas de budget insuffisant ; catalogue de 43 recettes de démonstration avec recherche et filtres ; liste de courses intelligente (regroupement, conversions, déduction du stock, rayons, cases à cocher, articles manuels, quantités modifiables, budget recalculé) ; suivi bienveillant (repas préparés, habitudes, objectifs, poids facultatif) ; profil et paramètres (modification, rappel quotidien, confidentialité, export et suppression des données) ; idées de recettes par IA avec repli sur le catalogue.

## Prérequis

* Node.js **22.9 ou plus récent** et npm 10
* PostgreSQL 14 ou plus récent (local, Docker, ou base Supabase)
* Un projet [Supabase](https://supabase.com) (offre gratuite suffisante) pour l'authentification
* Facultatif : une clé API [Anthropic](https://console.anthropic.com) pour les idées de recettes par IA
* Pour tester sur téléphone : l'application **Expo Go**, ou un build de développement

## Installation

```bash
cd nutriplan
npm install          # installe tout, compile @nutriplan/core et génère le client Prisma
```

## Configuration des services externes

### 1. PostgreSQL

Créez une base et un utilisateur, par exemple en local :

```sql
CREATE USER nutriplan WITH PASSWORD 'nutriplan' CREATEDB;
CREATE DATABASE nutriplan OWNER nutriplan;
CREATE DATABASE nutriplan_test OWNER nutriplan;   -- pour les tests de bout en bout
```

Pour utiliser la base Supabase : *Project Settings → Database → Connection string*. Prenez l'URI de connexion directe (ou le *session pooler*) pour `DATABASE_URL`. La migration `enable_rls` empêche l'API REST automatique de Supabase d'exposer les tables.

### 2. Supabase Auth — action manuelle requise

1. Créez un projet Supabase.
2. *Authentication → Providers → Email* : activez l'inscription par e-mail. La confirmation d'adresse est recommandée ; l'app gère le cas « Confirmez votre adresse e-mail ».
3. *Project Settings → API* : notez **Project URL** et la **clé publique** (*anon* / *publishable*). Elles vont dans l'app mobile.
4. Vérification des jetons par l'API :
   * Projets récents, à **clés de signature asymétriques** : laissez `SUPABASE_JWT_SECRET` vide. L'API télécharge les clés publiques depuis `SUPABASE_URL/auth/v1/.well-known/jwks.json`.
   * Projets utilisant le **secret JWT historique** : copiez-le (*Project Settings → API → JWT Settings*) dans `SUPABASE_JWT_SECRET`.
5. Facultatif : la **clé `service_role`** (secrète, serveur uniquement) dans `SUPABASE_SERVICE_ROLE_KEY` permet à l'API de supprimer aussi le compte d'authentification quand un utilisateur supprime son compte. Sans elle, les données NutriPlan sont bien supprimées, mais l'identifiant de connexion doit être retiré manuellement depuis le tableau de bord Supabase (l'app le signale).

### 3. API

```bash
cp apps/api/.env.example apps/api/.env      # puis complétez les valeurs
npm run prisma:deploy -w @nutriplan/api     # applique les migrations
npm run seed -w @nutriplan/api              # charge le catalogue de démonstration (idempotent)
```

Variables de `apps/api/.env` (voir [`apps/api/.env.example`](apps/api/.env.example)) : `DATABASE_URL`, `PORT`, `CORS_ORIGINS`, `SUPABASE_URL`, `SUPABASE_JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY` (facultatif), `AI_MODEL` (par défaut `claude-opus-5-5`), `RETENTION_MONTHS`.

### 4. Application mobile

```bash
cp apps/mobile/.env.example apps/mobile/.env
```

Renseignez `EXPO_PUBLIC_API_URL`, `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY`. Pour tester sur un téléphone, `EXPO_PUBLIC_API_URL` doit être l'adresse IP de l'ordinateur sur le réseau local (par exemple `http://192.168.1.20:3000`), pas `localhost`. Le nom affiché se change avec `EXPO_PUBLIC_APP_NAME`. **Ces variables sont publiques** : n'y mettez jamais de secret.

Si la configuration est absente, l'écran d'accueil affiche « Configuration requise » et désactive les boutons concernés. L'app ne simule jamais une connexion.

## Lancement en local

```bash
# Terminal 1 — API (http://localhost:3000, documentation sur /docs)
npm run api:dev

# Terminal 2 — application
npm run mobile:start          # puis « i » (iOS), « a » (Android), « w » (web) ou QR code avec Expo Go
```

## Tests

```bash
npm test                         # cœur métier (Vitest) + tests unitaires de l'API (Jest)
npm run test:e2e                 # API de bout en bout sur PostgreSQL (base *_test obligatoire)
npm run typecheck                # TypeScript sur les trois paquets
```

Les tests de bout en bout utilisent `TEST_DATABASE_URL` (par défaut `postgresql://nutriplan:nutriplan@localhost:5432/nutriplan_test`). Ils refusent toute base dont le nom ne se termine pas par `_test`. Ils appliquent les migrations, vident les données utilisateur, chargent le catalogue, puis signent de vrais jetons HS256 avec un secret de test : aucune authentification n'est simulée côté API.

Couverture :

| Domaine | Où |
|---|---|
| Validation des formulaires | `packages/core/test/validation.test.ts`, e2e « Profil » |
| Création et modification du profil | e2e « Profil » |
| Génération du planning, variété, stock prioritaire | `core.test.ts` « générateur », e2e « Génération » |
| Respect des allergies (y compris traces) et exclusions | `core.test.ts` « allergies », e2e « Génération » et « remplacement refusé » |
| Calcul des portions | `core.test.ts` « portions », e2e « fiche recette » |
| Liste de courses, conversions, unités incompatibles | `core.test.ts` « liste de courses », e2e |
| Déduction du stock | `core.test.ts`, e2e (riz en stock) |
| Budget, conditionnements, budget insuffisant | `core.test.ts`, e2e « Budget et cas impossibles » |
| Authentification (absente, mal signée, expirée, autre émetteur, anonyme, valide) | e2e « Authentification » |
| Permissions entre utilisateurs | e2e « Permissions entre utilisateurs » |
| Erreurs de l'API, limitation des requêtes | `src/common/errors.spec.ts`, e2e « Erreurs » |
| Export et suppression RGPD | e2e « RGPD » |

## Ce qui a été vérifié — et ce qui ne l'a pas été

Vérifié dans l'environnement de développement :

* `packages/core` : 40 tests réussis ; API : 5 tests unitaires et 27 tests de bout en bout réussis sur PostgreSQL 16 ; typecheck réussi sur les trois paquets.
* Les migrations s'appliquent ; le seed charge 74 ingrédients et 43 recettes ; l'API démarre et sert Swagger.
* L'application compile (`expo export --platform web`) et le parcours complet a été joué dans Chromium avec Playwright contre l'API réelle, sans erreur JavaScript : questionnaire avec retour arrière, enregistrement du profil, génération du programme, tableau de bord, planning, fiche repas, remplacement, repas réalisé, recettes et filtres, courses, suivi, paramètres. Pour les écrans connectés, la session a été injectée avec un jeton signé par le secret de développement local, faute de projet Supabase.

**Non vérifié** (à faire de votre côté) :

* La connexion et l'inscription contre un **vrai projet Supabase** (aucun projet n'était disponible).
* Le fonctionnement sur **appareils iOS et Android** réels ou en simulateur (non disponibles ici) ; seule la version web a été exécutée.
* Les **appels réels à l'API Claude** (pas de clé) : seul le repli sur le catalogue a été testé.
* Le **build Docker** de l'API : les registres d'images ont refusé le téléchargement de l'image Node (limite de débit). Le Dockerfile n'a donc pas été construit.
* Le workflow GitHub Actions n'a pas été exécuté.

## Déploiement

### API

1. **Base** : PostgreSQL managé (Supabase, Neon, Scaleway, OVHcloud…), de préférence hébergé dans l'UE.
2. **Image** : `docker build -f apps/api/Dockerfile -t nutriplan-api .` depuis `nutriplan/` (non testé, voir ci-dessus). Au démarrage, le conteneur applique les migrations (`prisma migrate deploy`, non destructif) puis lance l'API. Pour éviter la limite de Docker Hub : `--build-arg NODE_IMAGE=<miroir>/node:22-bookworm-slim`.
3. **Hébergement** : toute plateforme de conteneurs (Render, Fly.io, Railway, Scaleway Serverless Containers, Clever Cloud…). Variables d'environnement à définir comme dans `.env.example`, HTTPS obligatoire, `NODE_ENV=production`, `CORS_ORIGINS` limité aux domaines web éventuels.
4. **Catalogue** : lancez une fois `npm run seed -w @nutriplan/api` avec la `DATABASE_URL` de production. Remplacez d'abord les données de démonstration par des données vérifiées.

### Application mobile

1. Installez EAS : `npm i -g eas-cli`, puis `eas login` et `eas build:configure` dans `apps/mobile`.
2. Définissez les variables `EXPO_PUBLIC_*` de production (EAS → *Environment variables*).
3. `eas build --platform ios` / `--platform android`, puis `eas submit`.
4. Avant publication sur les stores : icônes et écran de démarrage définitifs, politique de confidentialité hébergée (avec l'identité du responsable de traitement), formulaires « Data safety » (Google) et « App Privacy » (Apple) cohérents avec les données collectées.

## Avant une mise en production

* Remplacer les prix et valeurs nutritionnelles de démonstration par des données sourcées et datées (table Ciqual de l'ANSES, relevés de prix), et ajouter des photos sous licence.
* Faire relire la politique de confidentialité et les mentions (RGPD, données de santé) par un·e juriste ; tenir le registre des traitements et réaliser une AIPD si nécessaire.
* Configurer la supervision (erreurs, disponibilité) et les sauvegardes de la base.
