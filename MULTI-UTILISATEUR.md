# Passage au multi-utilisateur — marche à suivre

Le code est prêt. Il reste des opérations à faire **sur la base**, dans un ordre
qui compte. Compter une demi-heure, et le faire quand tu as le temps de vérifier
derrière : entre l'étape 1 et l'étape 5, l'appli en production ne fonctionne plus
normalement.

## ⚠️ Le jeton admin, à mettre en place d'abord

Une fois les permissions posées (étape 4), **un accès anonyme ne voit plus rien** —
y compris les outils de maintenance. `npm run backup`, `npm run etat` et
`npm run migrate` passent donc par l'API admin, qui court-circuite les règles.

Tableau de bord InstantDB → ton application → onglet **Admin** → copie le jeton,
et ajoute-le à `.env` (déjà hors git) :

```
INSTANT_ADMIN_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Ce jeton donne un accès **total** à la base, sans aucune règle. Il ne part jamais
dans le bundle : les scripts le lisent côté Node uniquement.

## Le diagnostic, à tout moment

```
npm run etat
```

Affiche les comptes, les carnets, leurs membres, et surtout le nombre de lignes
**orphelines** — celles sans carnet, que plus personne ne peut lire une fois les
permissions posées. C'est la commande à lancer dès qu'un doute apparaît.

## Ce qui change

Avant : un seul carnet, aucune authentification, l'App ID dans le bundle. Toute
personne ouvrant l'URL tombait sur le carnet de Kori, en lecture et en écriture.

Après : on se connecte avec son adresse e-mail (code à six chiffres), chaque
carnet appartient à ses membres, et une ligne n'est lisible que par eux.

## L'ordre des opérations

### 0. Sauvegarder

```
npm run backup
```

Non négociable : les étapes 2 et 3 déplacent des données réelles. Le fichier
atterrit dans `backups/`, hors git.

### 1. Pousser le schéma

```
npx instant-cli@latest login
npx instant-cli@latest push schema
```

Le `login` ouvre le navigateur : c'est **ton** compte InstantDB, je ne peux pas
le faire à ta place. Le schéma est dans `instant.schema.ts` — il ajoute la table
`carnets`, le lien `members` vers les comptes, et un lien `carnet` sur chaque
table de données.

À ce stade rien n'est encore protégé, et c'est voulu : l'étape 3 a besoin de
pouvoir écrire.

### 2. Se connecter et créer ton carnet

**Déploie d'abord la preview avec le code à jour** :

```
npm run deploy:preview
```

Puis ouvre https://preview--koritracker.netlify.app et **force le rechargement**
(l'appli est une PWA : un service worker peut servir l'ancienne version).
Vérifie que tu vois bien un écran « Le carnet » qui demande ton adresse. Si tu
tombes directement dans l'appli, c'est l'ancien bundle — recharge encore.

C'est le piège de la première tentative : une preview datant d'avant le code de
connexion affiche l'ancienne appli, qui rend son **cache local** IndexedDB. On
croit alors que rien n'a changé, alors que le serveur, lui, ne renvoie déjà plus
rien.

L'appli envoie un code par e-mail, puis propose de créer un carnet : mets
**Kori**, mode **journal + entraînement**.

Le carnet est vide à ce stade — c'est normal, tes données ne lui sont pas encore
rattachées.

### 3. Rattacher tes données existantes

```
npm run migrate            # affiche ce qui serait fait, n'écrit rien
npm run migrate -- --apply # applique
```

Le script trouve les lignes sans carnet (les tiennes, du modèle précédent), les
rattache au carnet créé à l'étape 2, et recopie les compteurs de l'ancienne ligne
`meta` (portefeuille, niveau, antisèche, lieux) sur le carnet.

Vérifie le compte affiché avant d'appliquer. Il devrait ressembler à ta
sauvegarde : une douzaine de balades, une quinzaine de séances, 36 paliers.

Recharge la preview : tout doit être revenu.

**L'ancienne ligne `meta` n'est pas supprimée**, exprès. Tu pourras la retirer
depuis l'Explorer InstantDB une fois que tu auras constaté que tout va bien.

### 4. Poser les permissions

```
npx instant-cli@latest push perms
```

C'est l'étape qui referme la porte. Les règles sont dans `instant.perms.ts` :
tout est refusé par défaut, et une ligne n'est accessible qu'aux membres de son
carnet.

**Vérifie tout de suite** : ouvre la preview dans une fenêtre de navigation
privée, sans te connecter. Tu ne dois rien voir. Si tu vois encore le carnet,
les règles ne sont pas passées — ne déploie pas en production.

### 5. Déployer en production

La prod est verrouillée de ton côté : Netlify → projet `koritracker` → Deploys →
le déploiement publié → **Unlock deploys**, puis :

```
npm run deploy:prod
```

### 6. Kévin

Il ouvre l'appli, se connecte avec **son** adresse, puis choisit « Rejoindre un
carnet existant » et saisit le code d'invitation. Tu trouves ce code dans
l'onglet **Aide**, section « Le carnet de Kori ».

Sans cette étape, il n'a plus accès à rien : son téléphone n'est plus reconnu par
l'appartenance au carnet.

### 7. Ton éduc

Même chose, mais elle **crée** son carnet au lieu d'en rejoindre un. Elle choisit
le mode **journal seul** si elle ne veut que les balades — l'arbre de compétences
et l'entraînement disparaissent alors de son écran. Ça se rebascule à tout moment
depuis l'Aide.

## Si quelque chose tourne mal

Tant que tu n'as pas poussé les permissions (étape 4), tout est réversible : la
sauvegarde de l'étape 0 contient l'état exact d'avant, et l'ancienne ligne `meta`
est toujours là.

Après l'étape 4, une ligne sans carnet n'est plus lisible par personne — mais
elle n'est pas perdue pour autant. Le jeton admin passe au-dessus des règles :

```
npm run etat                 # combien de lignes orphelines ?
npm run migrate -- --apply   # les rattacher
npm run etat                 # vérifier qu'il n'en reste aucune
```

Inutile de rouvrir les permissions pour réparer, et il ne faut surtout pas le
faire : ça rouvrirait la base à tout le monde pendant l'opération.

Le script refuse de rattacher des données à un carnet **sans membre** — ça les
rendrait définitivement illisibles.

## Ce qui reste à faire ensuite

- **Bouton « Continuer avec Google »** : demande un projet Google Cloud, un OAuth
  client ID, et les URLs de redirection déclarées côté Netlify et InstantDB.
- **Sortir « Kori » du contenu** : le nom du chien est maintenant une donnée du
  carnet et s'affiche partout où c'est de l'interface, mais il reste écrit en dur
  dans les textes pédagogiques de `skills-data.js` (48 occurrences) et dans deux
  ou trois phrases d'`insights.js` et `carnet.jsx`. Sans effet pour toi, un peu
  étrange pour ton éduc.
