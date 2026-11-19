# Déploiement

Guide pas à pas pour mettre l'API et l'interface en ligne. Le backend va sur Render, la base sur MongoDB Atlas, le frontend sur Vercel.

## 1. Base de données — MongoDB Atlas

1. Créer un compte sur [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) et un cluster gratuit **M0**.
2. Dans *Database Access*, créer un utilisateur applicatif avec un mot de passe long et généré. Lui donner le rôle `readWrite` sur la base `gestion-dechet` uniquement.
3. Dans *Network Access*, autoriser `0.0.0.0/0` pour le premier déploiement (Render n'a pas d'IP sortante fixe sur le plan gratuit). À restreindre ensuite si vous passez sur un plan payant.
4. Récupérer la chaîne de connexion *Drivers* et y insérer le mot de passe :

```
mongodb+srv://<utilisateur>:<mot-de-passe>@<cluster>.mongodb.net/gestion-dechet?retryWrites=true&w=majority
```

## 2. API — Render

1. Pousser le dépôt sur GitHub (déjà fait), puis sur Render : *New → Blueprint*, sélectionner le dépôt.
2. Render lit `render.yaml` et demande les variables marquées `sync: false` :
   - `MONGODB_URI` : la chaîne Atlas ci-dessus, base incluse.
   - `CORS_ALLOWED_ORIGINS` : l'URL du frontend, sans slash final (provisoirement `http://localhost:3000`, à remplacer après l'étape 3).
3. `JWT_SECRET` est généré automatiquement par Render (valeur aléatoire suffisante).
4. Le service démarre avec le profil `prod`, écoute sur `PORT` et expose `/actuator/health` : Render ne route le trafic qu'une fois cette sonde verte.

L'URL obtenue ressemble à `https://gestion-dechets-api.onrender.com`. Le plan gratuit endort le service après 15 minutes d'inactivité : la première requête prend alors ~30 secondes.

## 3. Frontend — Vercel

1. *Add New → Project*, importer le même dépôt, et définir **Root Directory** sur `frontend`.
2. Variable d'environnement : `NEXT_PUBLIC_API_BASE_URL=https://gestion-dechets-api.onrender.com/api`.
3. Déployer. Noter l'URL obtenue, puis revenir sur Render pour mettre à jour `CORS_ALLOWED_ORIGINS` avec cette origine exacte (par exemple `https://gestion-dechets.vercel.app`) et redéployer.

## 4. Créer le premier administrateur

Le dépôt ne contient aucun compte : la création du premier admin passe par un jeton de configuration.

1. Dans Render, ajouter la variable `BOOTSTRAP_ADMIN_TOKEN` avec une valeur aléatoire longue (`BOOTSTRAP_ADMIN_TOKEN` alimente `security.bootstrap-token`).
2. Redémarrer le service, puis appeler l'API une seule fois :

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

3. **Supprimer immédiatement la variable** `BOOTSTRAP_ADMIN_TOKEN` et redémarrer. L'endpoint refuse toute nouvelle création dès qu'un administrateur existe, mais la variable ne doit pas rester en place.
4. Se connecter sur le frontend avec ce compte. Les autres comptes se créent depuis l'interface, en tant qu'administrateur.

## 5. Vérifications après déploiement

```powershell
# Sonde de santé
Invoke-RestMethod 'https://gestion-dechets-api.onrender.com/actuator/health'   # attendu : @{status='UP'}

# Une route métier doit refuser l'anonyme
try { Invoke-WebRequest 'https://gestion-dechets-api.onrender.com/api/employes' } catch { $_.Exception.Response.StatusCode }  # attendu : 401

# Le login doit fonctionner
Invoke-RestMethod -Method Post -Uri 'https://gestion-dechets-api.onrender.com/api/auth/login' `
  -ContentType 'application/json' -Body '{"username":"admin","password":"VOTRE_MOT_DE_PASSE"}'
```

## Points de vigilance

- **Rotation du secret** : si le dépôt public contient encore l'ancien secret d'exemple dans son historique, ne réutilisez jamais cette valeur en production. `JWT_SECRET` doit être unique par environnement.
- **Données de démonstration** : la base locale contient des comptes de test (`admin`/`admin123`). Ne les recréez pas en production.
- **HTTPS** : obligatoire, sinon les jetons circulent en clair. Render et Vercel le fournissent par défaut.
- **Comptes MongoDB** : privilèges minimaux (`readWrite` sur une seule base), jamais le compte administrateur du cluster.
