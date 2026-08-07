// ============================================================
// Règles de permissions InstantDB
// ============================================================
// À pousser avec le CLI :  npx instant-cli@latest push perms
//
// C'est CE fichier qui referme la porte laissée ouverte par la version
// mono-carnet : jusqu'ici l'App ID était embarqué dans le bundle et aucune règle
// ne protégeait les données, donc quiconque ouvrait l'URL tombait sur le carnet
// en lecture et en écriture.
//
// Principe : une ligne n'est visible et modifiable que par les MEMBRES de son
// carnet. Tout le reste est refusé par défaut.

import type { InstantRules } from '@instantdb/core';

// Un membre du carnet auquel la ligne appartient.
const memberOfOwningCarnet = {
  bind: ['isMember', "auth.id in data.ref('carnet.members.id')"],
  allow: {
    view: 'isMember',
    create: 'isMember',
    update: 'isMember',
    delete: 'isMember',
  },
};

const rules = {
  // Refus par défaut : toute entité non listée ci-dessous est inaccessible.
  $default: {
    allow: { $default: 'false' },
  },

  // On ne voit que son propre compte.
  //
  // ⚠️ `create` doit rester autorisé : se connecter pour la première fois CRÉE
  // la ligne `$users`, et cette création passe par la vérification des
  // permissions. Un `create: 'false'` ici — écrit sur l'idée que « les comptes
  // ne se créent pas depuis le client » — rend la connexion impossible pour
  // tout le monde, avec un « Permission denied: not perms-pass? » au moment de
  // saisir le code, qui ressemble à un mauvais code.
  $users: {
    allow: {
      view: 'auth.id == data.id',
      create: 'true',
      update: 'false',
      delete: 'false',
    },
  },

  // Le carnet est visible par ses membres — ou par quelqu'un qui présente le
  // bon code d'invitation, ce qui lui permet de s'y rattacher une fois.
  carnets: {
    bind: [
      'isMember',
      "auth.id in data.ref('members.id')",
      // Pas de garde `!= null` : `inviteCode` est obligatoire côté schéma, donc
      // jamais nul sur la donnée. Une requête sans ruleParams donne simplement
      // une comparaison fausse, et non une erreur d'évaluation.
      'knowsInviteCode',
      'data.inviteCode == ruleParams.inviteCode',
    ],
    allow: {
      view: 'isMember || knowsInviteCode',
      // N'importe quel compte connecté peut créer SON carnet ; il s'y rattache
      // comme membre dans la même transaction.
      create: 'auth.id != null',
      update: 'isMember',
      delete: 'isMember',
      // Rejoindre un carnet : autorisé avec le code. Se retirer : réservé aux
      // membres.
      link: { members: 'isMember || knowsInviteCode' },
      unlink: { members: 'isMember' },
    },
  },

  walks: memberOfOwningCarnet,
  sessions: memberOfOwningCarnet,
  care: memberOfOwningCarnet,
  reminders: memberOfOwningCarnet,
  firsts: memberOfOwningCarnet,
  skillProgress: memberOfOwningCarnet,
  palierDone: memberOfOwningCarnet,

  // Le schéma est figé côté serveur : le client ne crée pas d'attributs.
  attrs: {
    allow: { $default: 'false' },
  },
} satisfies InstantRules;

export default rules;
