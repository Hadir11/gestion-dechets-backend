# Gestion des déchets — Frontend

Interface web de gestion municipale de la collecte des déchets, construite avec Next.js, React et TypeScript.

## Démarrage local

1. Installer une version LTS récente de Node.js.
2. Installer les dépendances avec `npm ci`.
3. Copier `.env.example` en `.env.local` et adapter l’adresse de l’API si nécessaire.
4. Lancer le backend, puis `npm run dev`.

L’interface est servie sur `http://localhost:3000`. Par défaut, l’API est attendue sur `http://localhost:18081/api`.

## Commandes

- `npm run dev` — serveur de développement
- `npm run build` — compilation de production
- `npm run start` — serveur Next.js de production après la compilation

## Pages principales

- Connexion et tableaux de bord selon le rôle
- Carte des points de collecte
- Alertes et affectation aux équipes
- Employés, missions, tournées et optimisation

L’application dépend du backend Spring Boot de ce projet. La sécurité côté serveur et les autorisations doivent être vérifiées avant tout déploiement public.
