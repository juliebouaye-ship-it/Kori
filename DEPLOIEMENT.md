# Carnet de Kori — mise en ligne (gratuit, sans PC allumé)

Objectif : une app installable sur ton téléphone et celui de Kévin, avec un
**carnet Kori partagé en temps réel**, hébergée gratuitement, sans faire tourner
ton PC.

- **Front** : hébergé sur **Netlify** (statique, toujours allumé, gratuit).
- **Données partagées** : **InstantDB** (temps réel, gratuit, zéro serveur).
- **Livraison** : un **lien** → « Ajouter à l'écran d'accueil » (pas d'APK à renvoyer,
  l'app se met à jour toute seule).

---

## 1. Créer la base InstantDB (2 min)

1. Va sur https://instantdb.com et crée un compte (gratuit).
2. Crée une nouvelle app (ex. « Carnet de Kori »).
3. Copie son **App ID**.

C'est tout côté base : pas de table à créer à la main. L'app crée toute seule
l'enregistrement `carnet` au premier lancement (namespace « schemaless »).

## 2. Configurer l'App ID en local

1. Copie `.env.example` en `.env`.
2. Colle ton App ID :
   ```
   VITE_INSTANT_APP_ID=ton-app-id-ici
   ```
3. Lance en local pour tester :
   ```
   npm install
   npm run dev
   ```
   Saisis une séance, puis vérifie dans le **dashboard InstantDB → Explorer** que
   l'enregistrement `carnet` apparaît et se met à jour. Tes données déjà présentes
   en localStorage sont reprises automatiquement au premier lancement.

> Sans `.env`, l'app fonctionne quand même — en mode **local seul** (localStorage),
> sans synchro. Pratique pour bricoler avant d'avoir créé l'app InstantDB.

## 3. Mettre le code sur GitHub

```
git init
git add .
git commit -m "Carnet de Kori : synchro InstantDB + PWA"
```
Puis crée un repo **privé** sur GitHub et pousse-le (GitHub te donne les 2 lignes
`git remote add ...` / `git push ...`).

## 4. Héberger sur Netlify

1. Va sur https://netlify.com, connecte-toi avec GitHub.
2. « Add new site » → « Import an existing project » → choisis ton repo.
3. Réglages de build (normalement détectés automatiquement) :
   - **Build command** : `npm run build`
   - **Publish directory** : `dist`
4. **Important** : dans *Site settings → Environment variables*, ajoute
   `VITE_INSTANT_APP_ID` avec ton App ID (le même qu'en local).
5. Déploie. Netlify te donne une URL du type `https://kori-xxxx.netlify.app`.

À chaque `git push`, Netlify reconstruit et met l'app à jour toute seule.

> Variante sans GitHub : `npm run build` puis glisse-dépose le dossier `dist` sur
> Netlify (« Deploy manually »). Il faudra refaire ce geste à chaque mise à jour,
> et renseigner l'App ID en dur — GitHub reste plus simple.

## 5. Installer sur les téléphones

1. Ouvre l'URL Netlify dans **Chrome** (Android) ou **Safari** (iPhone).
2. Menu → **« Ajouter à l'écran d'accueil »**.
3. Une icône Kori apparaît ; l'app s'ouvre en plein écran, comme une vraie app.
4. Envoie simplement le **lien** à Kévin, il fait pareil.

Vous partagez le **même carnet** : une séance saisie sur un téléphone apparaît sur
l'autre en quelques secondes.

---

## Bon à savoir

- **Gratuit** sur GitHub, InstantDB et Netlify pour cet usage à deux.
- **Mises à jour** : tu modifies le code → `git push` → l'app de tout le monde est à
  jour au prochain lancement (rien à réinstaller).
- **Hors-ligne** : l'app s'ouvre et se laisse utiliser sans réseau ; les données se
  synchronisent au retour de la connexion (géré par InstantDB).
- **Sécurité** : l'App ID est public et le carnet est ouvert (pas de login). Risque
  faible pour un carnet de chien ; on pourra ajouter une connexion plus tard si besoin.
