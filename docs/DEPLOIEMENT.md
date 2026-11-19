# Déploiement

Notes prises en préparant la mise en ligne. Le backend va sur Render, la base sur MongoDB Atlas, le frontend sur Vercel.

J'ai testé la configuration de production en local avant d'écrire tout ça : profil `prod`, les variables d'environnement de Render, et le frontend compilé. Si un jour quelque chose casse ici, c'est plus probablement un réglage de plateforme qu'un problème dans le code.

## La base, sur Atlas

Un cluster gratuit M0 suffit pour une démonstration.

On crée un utilisateur applicatif avec un mot de passe long, et on lui donne le rôle `readWrite` sur la seule base `gestion-dechet`. Pas le compte administrateur du cluster, jamais.

Côté réseau, il faut autoriser `0.0.0.0/0` au premier déploiement. Render n'a pas d'adresse de sortie fixe sur le plan gratuit, donc restreindre l'accès demande de passer à un plan payant. C'est un compromis à assumer, pas un oubli.

On récupère ensuite la chaîne de connexion et on y insère le mot de passe :

```
mongodb+srv://<utilisateur>:<mot-de-passe>@<cluster>.mongodb.net/gestion-dechet?retryWrites=true&w=majority
```

## L'API, sur Render

On pousse le dépôt sur GitHub, puis sur Render on choisit *New* puis *Blueprint* et on sélectionne le dépôt. Render lit `render.yaml` et demande les deux variables marquées comme secrètes :

- `MONGODB_URI`, la chaîne Atlas, base comprise.
- `CORS_ALLOWED_ORIGINS`, l'adresse du frontend sans slash final. On peut mettre `http://localhost:3000` au début et la corriger après l'étape Vercel.

`JWT_SECRET` est généré par Render, on n'a rien à faire.

Le service démarre en profil `prod`, écoute sur le port fourni par `PORT` et expose `/actuator/health`. Render ne route le trafic qu'une fois cette sonde au vert. Attention à ne jamais figer le port 8080 dans la configuration : IIS l'occupe sur certaines machines, et c'est une heure perdue à chercher une erreur qui n'est pas dans le code.

L'adresse ressemble à `https://gestion-dechets-api.onrender.com`. Sur le plan gratuit le service s'endort après quinze minutes sans requête, et la première réponse met une trentaine de secondes à revenir. C'est normal, pas un plantage.

## Le frontend, sur Vercel

*Add New*, *Project*, on importe le même dépôt, et surtout on met **Root Directory** sur `frontend`. Sinon Vercel essaie de construire le projet Maven.

Une variable à ajouter : `NEXT_PUBLIC_API_BASE_URL=https://gestion-dechets-api.onrender.com/api`.

Une fois l'adresse obtenue, on revient sur Render pour mettre à jour `CORS_ALLOWED_ORIGINS` avec cette origine exacte, et on redéploie. Sans ça, le navigateur bloque tous les appels, et le message d'erreur dans la console ne dit pas grand-chose.

## Le premier administrateur

Le dépôt ne contient aucun compte en dur, ce qui est voulu.

On ajoute `BOOTSTRAP_ADMIN_TOKEN` dans les variables Render avec une valeur aléatoire longue, on redémarre, puis on appelle l'API une seule fois :

```powershell
$body = @{
  nom      = 'Admin'
  prenom   = 'Principal'
  username = 'admin'
  password = 'CHOISIR_UN_SECRET_DE_12_CARACTERES_MINIMUM'
  email    = 'admin@example.org'
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri 'https://gestion-dechets-api.onrender.com/api/auth/bootstrap-admin' `
  -Headers @{ 'X-Bootstrap-Token' = 'LA_VALEUR_DE_BOOTSTRAP_ADMIN_TOKEN' } `
  -ContentType 'application/json' -Body $body
```

Ensuite on supprime la variable et on redémarre. L'endpoint refuse toute création dès qu'un administrateur existe, mais autant ne pas laisser le jeton traîner.

Les autres comptes se créent depuis l'interface, connecté en administrateur.

## Vérifier que ça tient debout

Trois appels suffisent à savoir si le déploiement est sain :

```powershell
# La sonde doit répondre UP
Invoke-RestMethod 'https://gestion-dechets-api.onrender.com/actuator/health'

# Un anonyme doit être refusé
try { Invoke-WebRequest 'https://gestion-dechets-api.onrender.com/api/employes' } catch { $_.Exception.Response.StatusCode }  # 401

# Le login doit fonctionner
Invoke-RestMethod -Method Post -Uri 'https://gestion-dechets-api.onrender.com/api/auth/login' `
  -ContentType 'application/json' -Body '{"username":"admin","password":"VOTRE_MOT_DE_PASSE"}'
```

Si la sonde est verte mais que la 401 ne l'est pas, la sécurité a été désactivée quelque part. Si le login échoue alors que le mot de passe est bon, c'est souvent `MONGODB_URI` qui pointe sur une base vide.

## Trois choses à ne pas oublier

Le secret JWT doit être propre à chaque environnement. L'ancien secret d'exemple traîne encore dans deux vieux commits, il ne faut jamais le réutiliser.

Les comptes `admin` / `admin123` de la base locale ne doivent pas être recréés en production.

Et HTTPS n'est pas optionnel : sans lui, les jetons circulent en clair. Render et Vercel le fournissent par défaut, mais si vous mettez autre chose devant, vérifiez.
