# Guide de déploiement — ReUse EFREI

---

## PARTIE 1 — Lancement en local

### Prérequis

- [Node.js LTS](https://nodejs.org) (v20 ou v22) — vérifier avec `node --version`
- Git (optionnel mais recommandé)

---

### Étape 1 — Récupérer le projet

**Si tu as le dossier en local :**
```bash
cd C:\Users\gabri\Downloads\site_reno
```

**Si tu clones depuis GitHub :**
```bash
git clone https://github.com/TON_USER/reuse-efrei.git
cd reuse-efrei
```

---

### Étape 2 — Installer les dépendances

```bash
npm install
```

> Cela installe Express, EJS, SQLite, bcrypt, etc. depuis le `package.json`.

---

### Étape 3 — Créer le fichier d'environnement

Copie le fichier exemple :
```bash
# Windows
copy .env.example .env

# Mac / Linux
cp .env.example .env
```

Le fichier `.env` contient :
```
PORT=3000
SESSION_SECRET=reuse_efrei_dev_secret_2024
NODE_ENV=development
```

> Tu peux changer `SESSION_SECRET` par n'importe quelle chaîne aléatoire.

---

### Étape 4 — Initialiser la base de données et les données de démo

```bash
node database/seed.js
```

Résultat attendu :
```
Seed OK !
  Admin : admin@efrei.net / Admin1234!
  User  : renaud@efrei.net / User1234!
```

> Si tu vois `Base déjà peuplée — seed ignoré`, c'est normal, la base existe déjà.

---

### Étape 5 — Lancer le serveur

```bash
npm start
```

Ou directement :
```bash
node app.js
```

Résultat attendu :
```
ReUse EFREI — http://localhost:3000
```

Ouvre **http://localhost:3000** dans ton navigateur.

---

### Comptes disponibles

| Rôle | Email | Mot de passe |
|---|---|---|
| Administrateur | admin@efrei.net | Admin1234! |
| Utilisateur | renaud@efrei.net | User1234! |
| Utilisateur | camille@efrei.net | User1234! |

---

### Réinitialiser la base de données

```bash
# Supprimer la base
del database\reuse.db        # Windows
rm database/reuse.db         # Mac / Linux

# Puis relancer le seed
node database/seed.js
```

---

---

## PARTIE 2 — Déploiement en ligne sur Render (gratuit)

Render est la plateforme recommandée par le sujet pour les projets Node.js.

### Prérequis

- Un compte GitHub (gratuit) : https://github.com
- Un compte Render (gratuit) : https://render.com
- Le projet poussé sur un dépôt GitHub

---

### Étape 1 — Préparer le projet pour la production

#### 1a. Vérifier le `.gitignore`

Le fichier `.gitignore` doit contenir au minimum :
```
.env
node_modules/
database/reuse.db
public/uploads/*
!public/uploads/.gitkeep
```

> **Important** : ne jamais versionner `.env` ni la base de données.

#### 1b. Adapter `app.js` pour le port Render

Render injecte automatiquement la variable `PORT`. Le code actuel le gère déjà :
```js
const PORT = process.env.PORT || 3000;
```

#### 1c. S'assurer que `npm start` fonctionne

Dans `package.json`, la section scripts doit contenir :
```json
"scripts": {
  "start": "node app.js"
}
```

---

### Étape 2 — Pousser sur GitHub

```bash
git init
git add .
git commit -m "feat: initial commit ReUse EFREI"
git branch -M main
git remote add origin https://github.com/TON_USER/reuse-efrei.git
git push -u origin main
```

---

### Étape 3 — Créer le service sur Render

1. Va sur **https://render.com** et connecte-toi
2. Clique sur **New → Web Service**
3. Connecte ton compte GitHub si ce n'est pas fait
4. Sélectionne le dépôt **reuse-efrei**
5. Remplis le formulaire :

| Champ | Valeur |
|---|---|
| Name | reuse-efrei |
| Region | Frankfurt (EU) |
| Branch | main |
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `npm start` |
| Instance Type | **Free** |

6. Clique sur **Create Web Service**

---

### Étape 4 — Configurer les variables d'environnement sur Render

Dans l'onglet **Environment** de ton service Render, ajoute :

| Clé | Valeur |
|---|---|
| `NODE_ENV` | `production` |
| `SESSION_SECRET` | une longue chaîne aléatoire (ex: `k9#mP2xQr7!vLn4hWz8`) |

> Ne mets **pas** `PORT` — Render le définit lui-même.

---

### Étape 5 — Gérer la base de données sur Render

> **Limitation importante** : Render Free efface le disque à chaque redéploiement.  
> La base SQLite est donc remise à zéro à chaque push.

**Solution : initialiser la base au démarrage**

Modifie la commande de démarrage dans Render :

```
node database/seed.js && npm start
```

Ainsi, à chaque démarrage le seed s'exécute. Comme il vérifie si la base est déjà peuplée, il ne duplique pas les données.

---

### Étape 6 — Vérifier le déploiement

Render affiche les logs en temps réel. Attends de voir :
```
ReUse EFREI — http://localhost:10000
```
(Render utilise son propre port en interne)

Ton site est accessible à l'URL fournie par Render, du type :
```
https://reuse-efrei.onrender.com
```

---

### Étape 7 — Mettre à jour le site

Chaque `git push` sur `main` déclenche automatiquement un redéploiement :

```bash
git add .
git commit -m "fix: correction bug formulaire"
git push
```

Render redéploie en ~1 minute.

---

## Résumé des commandes

```bash
# Local — première fois
npm install
node database/seed.js
npm start

# Local — relance simple
npm start

# Mettre à jour en ligne
git add .
git commit -m "feat: ma modification"
git push
```

---

## Dépannage

| Problème | Solution |
|---|---|
| `Cannot find module 'better-sqlite3'` | Relancer `npm install` |
| Port 3000 déjà utilisé | Changer `PORT=3001` dans `.env` |
| Base vide après redéploiement Render | Normal — utiliser `node database/seed.js && npm start` comme start command |
| Erreur `SESSION_SECRET` | Vérifier que le `.env` existe et contient la clé |
| Images disparues sur Render | Normal sur le plan gratuit — les uploads sont éphémères |
