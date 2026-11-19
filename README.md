# Gestion municipale des déchets

API REST de démonstration pour organiser la collecte des déchets à l’échelle d’une municipalité. Le backend est construit avec Spring Boot, Java 17 et MongoDB.

> **État de sécurité :** l’API exige un jeton JWT valide, limite les écritures aux rôles autorisés, ne permet la création d’employés qu’à un administrateur et n’accepte plus d’inscriptions publiques. Avant un déploiement réel, configurez les secrets et domaines autorisés, puis exécutez les vérifications locales ci-dessous.

## Fonctionnalités

- Gestion des zones, points de collecte, déchets, alertes, équipes, employés, véhicules et tournées.
- Suivi des alertes liées au remplissage et consultation de statistiques pour le tableau de bord.
- Création et optimisation de tournées, avec un calcul de plus court chemin par Dijkstra.
- Endpoints expérimentaux pour la prédiction du remplissage et la détection d’anomalies. Ces traitements sont heuristiques et doivent être évalués avant tout usage réel.
- Authentification JWT sans session serveur, mots de passe hachés avec BCrypt et autorisations par rôle.

## Technologies

- Java 17 et Spring Boot
- Spring Web, Spring Security et Spring Data MongoDB
- JWT (JJWT)
- Maven

## Prérequis

- JDK 17
- MongoDB accessible depuis l’application
- Maven 3.8 ou plus récent
- Node.js et npm pour le frontend

Le backend se trouve à la racine du dépôt. Le frontend Next.js est dans [frontend/](frontend/README.md).

## Configuration locale

Copiez `src/main/resources/application-local.properties.example` vers `src/main/resources/application-local.properties`, puis adaptez l’URI MongoDB et remplacez le secret JWT par une valeur aléatoire d’au moins 32 octets. Ce fichier local est ignoré par Git.

Lancez MongoDB, puis démarrez l’application depuis la racine du projet :

```powershell
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

Pour lancer la vérification Maven : `mvn test`. Le projet doit encore recevoir une suite de tests métier et de sécurité ; la compilation seule ne garantit pas le bon fonctionnement de tous les parcours.

En local, l’API écoute par défaut sur `http://localhost:18081`, comme configuré dans `.env.example` du frontend. Les routes sont préfixées par `/api` ; la connexion est disponible sous `/api/auth/login`. Les routes métier exigent `Authorization: Bearer <jeton>`.

### Création initiale de l’administrateur

Si la base ne contient pas encore d’administrateur, démarrez l’API avec un jeton de configuration temporaire. Dans PowerShell :

```powershell
$env:BOOTSTRAP_ADMIN_TOKEN = [guid]::NewGuid().ToString('N') + [guid]::NewGuid().ToString('N')
$env:BOOTSTRAP_ADMIN_TOKEN
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

Dans un autre terminal PowerShell, créez le premier compte. Choisissez un mot de passe unique d’au moins 12 caractères :

```powershell
$env:BOOTSTRAP_ADMIN_TOKEN = 'COLLER_ICI_LE_JETON_AFFICHE_DANS_LE_PREMIER_TERMINAL'
$body = @{ nom = 'Admin'; prenom = 'Principal'; username = 'admin'; password = 'CHOISIR_UN_SECRET_LONG'; email = 'admin@example.local' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri 'http://localhost:18081/api/auth/bootstrap-admin' -Headers @{ 'X-Bootstrap-Token' = $env:BOOTSTRAP_ADMIN_TOKEN } -ContentType 'application/json' -Body $body
```

Après la création, arrêtez l’API, retirez le jeton avec `Remove-Item Env:BOOTSTRAP_ADMIN_TOKEN`, puis redémarrez-la. Le point de création initial refuse toute nouvelle création dès qu’un administrateur existe. Les comptes suivants se créent depuis l’interface en étant connecté comme administrateur.

## Frontend

Dans un autre terminal, à partir du dossier `frontend` :

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

L’interface écoute sur `http://localhost:3000`. Elle utilise `NEXT_PUBLIC_API_BASE_URL` pour joindre l’API ; la valeur locale par défaut est `http://localhost:18081/api`.

Pour compiler le frontend : `npm run build`. Pour le lancer en mode production après la compilation : `npm run start`.

## Principales routes

| Domaine | Préfixe |
| --- | --- |
| Authentification | `/api/auth` |
| Alertes | `/api/alertes` |
| Points de collecte | `/api/points` |
| Tournées | `/api/tournees` |
| Employés et équipes | `/api/employes`, `/api/equipes`, `/api/chef` |
| Véhicules et zones | `/api/vehicules`, `/api/zones` |
| Statistiques et fonctions expérimentales | `/api/statistiques`, `/api/ia` |

Les contrôleurs documentent les opérations disponibles. Aucun contrat OpenAPI n’est actuellement fourni.

## Tests

```powershell
mvn test
```

La suite couvre la normalisation des rôles et la matrice d’accès réelle, en passant par la chaîne de filtres Spring Security et des jetons JWT signés : requêtes anonymes refusées, jeton invalide rejeté, agent bloqué sur les tournées, admin bloqué sur l’endpoint agent, `/api/test/**` fermé, route inconnue en 404 une fois authentifié. Aucun test ne nécessite MongoDB.

## Déploiement

Le profil `prod` exige `MONGODB_URI`, `JWT_SECRET` (au moins 32 octets aléatoires) et `CORS_ALLOWED_ORIGINS` (origines exactes, séparées par des virgules). Ne définissez `BOOTSTRAP_ADMIN_TOKEN` que pendant la création initiale du compte, puis retirez-le et redémarrez l’API. Utilisez HTTPS, un compte MongoDB aux privilèges minimaux et des secrets dédiés à chaque environnement.

### Image Docker

```powershell
docker build -t gestion-dechets .
docker run --rm -p 8080:8080 `
  -e MONGODB_URI="mongodb+srv://…" `
  -e JWT_SECRET="…" `
  -e CORS_ALLOWED_ORIGINS="https://votre-frontend" `
  gestion-dechets
```

L’image est multi-étapes (Maven puis JRE Alpine), tourne sous un utilisateur non privilégié et expose `/actuator/health` pour les sondes.

### Render

Le fichier [render.yaml](render.yaml) décrit le service web. MongoDB n’est pas fourni par Render : créez un cluster MongoDB Atlas, autorisez l’IP sortante de Render, puis renseignez `MONGODB_URI` et `CORS_ALLOWED_ORIGINS` lors du premier déploiement. `JWT_SECRET` est généré automatiquement.

Le frontend se déploie séparément (Vercel ou équivalent) avec `NEXT_PUBLIC_API_BASE_URL` pointant vers l’URL publique de l’API, suffixée de `/api`.


## État du projet

Projet de démonstration/portfolio. Les fonctions de prédiction et d’optimisation dites « IA » reposent en partie sur des heuristiques ou des données de démonstration ; elles ne constituent pas un système validé pour une exploitation municipale réelle.
