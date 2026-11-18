# Gestion municipale des déchets

API REST de démonstration pour organiser la collecte des déchets à l’échelle d’une municipalité. Le backend est construit avec Spring Boot, Java 17 et MongoDB.

> **État de sécurité :** ce dépôt est destiné à une démonstration locale. Spring Security autorise actuellement toutes les requêtes. Ne déployez pas cette API sur Internet avant d’avoir activé et vérifié l’authentification et les autorisations par rôle.

## Fonctionnalités

- Gestion des zones, points de collecte, déchets, alertes, équipes, employés, véhicules et tournées.
- Suivi des alertes liées au remplissage et consultation de statistiques pour le tableau de bord.
- Création et optimisation de tournées, avec un calcul de plus court chemin par Dijkstra.
- Endpoints expérimentaux pour la prédiction du remplissage et la détection d’anomalies. Ces traitements sont heuristiques et doivent être évalués avant tout usage réel.
- Endpoints d’authentification et service JWT présents. Le filtre JWT est désactivé et Spring Security autorise les requêtes sans authentification : les règles d’accès doivent être corrigées avant un déploiement public.

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

Copiez `src/main/resources/application-local.properties.example` vers `src/main/resources/application-local.properties`, puis adaptez l’URI MongoDB, le secret JWT et les identifiants de développement. Ce fichier local est ignoré par Git.

Lancez MongoDB, puis démarrez l’application depuis la racine du projet :

```powershell
mvn spring-boot:run "-Dspring-boot.run.profiles=local"
```

Pour lancer la vérification Maven : `mvn test`. Le dépôt ne contient pas encore de tests automatisés ; cette commande vérifie surtout la compilation.

En local, l’API écoute par défaut sur `http://localhost:18081`, comme configuré dans `.env.example` du frontend. Les routes sont préfixées par `/api` ; par exemple, l’authentification est disponible sous `/api/auth`.

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

## Déploiement

Le profil `prod` lit ses paramètres sensibles depuis les variables d’environnement `MONGODB_URI`, `JWT_SECRET`, `APP_ADMIN_USERNAME` et `APP_ADMIN_PASSWORD`. Configurez également `CORS_ALLOWED_ORIGINS` pour les domaines réellement autorisés. N’utilisez pas les valeurs de démonstration en production.

## État du projet

Projet de démonstration/portfolio. Les fonctions de prédiction et d’optimisation dites « IA » reposent en partie sur des heuristiques ou des données de démonstration ; elles ne constituent pas un système validé pour une exploitation municipale réelle.
