# Passage au multi-utilisateur — marche à suivre

Le code est prêt. Il reste des opérations à faire **sur la base**, dans un ordre
qui compte. Compter une demi-heure, et le faire quand tu as le temps de vérifier
derrière : entre l'étape 1 et l'étape 5, l'appli en production ne fonctionne plus
normalement.

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

Déploie la preview (`npm run deploy:preview`) et ouvre-la. L'appli demande ton
adresse, envoie un code, puis propose de créer un carnet : mets **Kori**, mode
**journal + entraînement**.

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

Après l'étape 4, une ligne sans carnet n'est plus lisible par personne. Si tu
t'aperçois qu'il en reste, remets temporairement des règles ouvertes depuis le
tableau de bord InstantDB, relance `npm run migrate -- --apply`, puis repousse
les permissions.

## Ce qui reste à faire ensuite

- **Bouton « Continuer avec Google »** : demande un projet Google Cloud, un OAuth
  client ID, et les URLs de redirection déclarées côté Netlify et InstantDB.
- **Sortir « Kori » du contenu** : le nom du chien est maintenant une donnée du
  carnet et s'affiche partout où c'est de l'interface, mais il reste écrit en dur
  dans les textes pédagogiques de `skills-data.js` (48 occurrences) et dans deux
  ou trois phrases d'`insights.js` et `carnet.jsx`. Sans effet pour toi, un peu
  étrange pour ton éduc.
