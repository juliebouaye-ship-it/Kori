// ============================================================
// Schéma InstantDB — un carnet par chien, plusieurs membres par carnet
// ============================================================
// À pousser avec le CLI :  npx instant-cli@latest push schema
//
// Le changement de fond par rapport au modèle mono-carnet : plus aucun
// identifiant fixe. Chaque ligne de données appartient à un `carnet`, et un
// carnet a des `members` (les utilisateurs qui peuvent le lire et l'écrire).
// C'est ce lien qui permet à la fois plusieurs foyers dans la même base et deux
// téléphones sur le même carnet.
//
// Le CATALOGUE de compétences n'est volontairement PAS ici : il reste statique
// dans le bundle (identique pour tout le monde, disponible hors ligne, versionné
// par git). InstantDB ne stocke que la progression et la configuration.

import { i } from '@instantdb/core';

const _schema = i.schema({
  entities: {
    // Fourni par InstantDB : les comptes créés à la connexion.
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),

    // Le carnet lui-même. Il porte la configuration et les compteurs qui
    // vivaient dans l'ancien enregistrement `meta` d'identifiant fixe.
    carnets: i.entity({
      dogName: i.string(),
      // 'journal'  : seuls le journal de balade et les progrès sont affichés
      // 'complet'  : plus l'arbre de compétences et l'entraînement
      mode: i.string(),
      // Code court à partager pour rejoindre le carnet (conjoint, famille).
      inviteCode: i.string().unique().indexed(),
      onboarded: i.boolean().optional(),
      wallet: i.number().optional(),
      lifetime: i.number().optional(),
      // Poil du chien (réglage optionnel — voir carnets.js COAT_TYPES). Sert
      // uniquement à choisir le conseil de brossage affiché ; jamais demandé
      // au bilan de départ.
      coatType: i.string().optional(),
      // ⚠️ Pas d'attribut `cues` ici : l'antisèche a sa propre table, et le lien
      // qui la relie au carnet porte déjà le label `cues`. Un attribut et un
      // lien de même nom sur la même entité se télescopent — Instant refuse le
      // push avec « `cues` already exists on `carnets` ».
      decompOff: i.json().optional(),
      places: i.json().optional(),
      createdAt: i.number().optional(),
      updatedAt: i.number().optional(),
    }),

    walks: i.entity({
      date: i.string().indexed(),
      ts: i.number().optional(),
      level: i.string(),
      location: i.string().optional(),
      duration: i.number().optional(),
      triggers: i.json().optional(),
      note: i.string().optional(),
    }),

    sessions: i.entity({
      date: i.string().indexed(),
      skillId: i.string(),
      palierId: i.string().optional(),
      rating: i.string(),
      xp: i.number().optional(),
      ts: i.number().optional(),
    }),

    care: i.entity({
      date: i.string().indexed(),
      ts: i.number().optional(),
      kind: i.string(),
      label: i.string().optional(),
      grams: i.number().optional(),
      treatId: i.string().optional(),
    }),

    reminders: i.entity({
      type: i.string(),
      label: i.string().optional(),
      dueDate: i.string().optional(),
      note: i.string().optional(),
    }),

    firsts: i.entity({
      date: i.string().optional(),
      title: i.string(),
      note: i.string().optional(),
    }),

    skillProgress: i.entity({
      skillId: i.string().indexed(),
      status: i.string(),
    }),

    palierDone: i.entity({
      palierId: i.string().indexed(),
      skillId: i.string().optional(),
      doneAt: i.string().optional(),
    }),

    // Antisèche : le mot et le geste convenus pour une compétence. Une ligne par
    // compétence renseignée — l'Explorer devient lisible, et deux personnes qui
    // règlent des signaux différents en même temps ne s'écrasent plus (ce que
    // faisait l'ancien blob JSON unique).
    cues: i.entity({
      skillId: i.string().indexed(),
      word: i.string().optional(),
      gesture: i.string().optional(),
    }),
  },

  links: {
    // Un carnet a plusieurs membres ; une personne peut avoir plusieurs carnets
    // (plusieurs chiens, ou une éducatrice qui suit le sien en plus).
    carnetMembers: {
      forward: { on: 'carnets', has: 'many', label: 'members' },
      reverse: { on: '$users', has: 'many', label: 'carnets' },
    },

    // Chaque élément appartient à exactement un carnet. `onDelete: 'cascade'`
    // évite les lignes orphelines si un carnet est supprimé.
    walkCarnet: {
      forward: { on: 'walks', has: 'one', label: 'carnet', onDelete: 'cascade' },
      reverse: { on: 'carnets', has: 'many', label: 'walks' },
    },
    sessionCarnet: {
      forward: { on: 'sessions', has: 'one', label: 'carnet', onDelete: 'cascade' },
      reverse: { on: 'carnets', has: 'many', label: 'sessions' },
    },
    careCarnet: {
      forward: { on: 'care', has: 'one', label: 'carnet', onDelete: 'cascade' },
      reverse: { on: 'carnets', has: 'many', label: 'care' },
    },
    reminderCarnet: {
      forward: { on: 'reminders', has: 'one', label: 'carnet', onDelete: 'cascade' },
      reverse: { on: 'carnets', has: 'many', label: 'reminders' },
    },
    firstCarnet: {
      forward: { on: 'firsts', has: 'one', label: 'carnet', onDelete: 'cascade' },
      reverse: { on: 'carnets', has: 'many', label: 'firsts' },
    },
    skillProgressCarnet: {
      forward: { on: 'skillProgress', has: 'one', label: 'carnet', onDelete: 'cascade' },
      reverse: { on: 'carnets', has: 'many', label: 'skillProgress' },
    },
    palierDoneCarnet: {
      forward: { on: 'palierDone', has: 'one', label: 'carnet', onDelete: 'cascade' },
      reverse: { on: 'carnets', has: 'many', label: 'palierDone' },
    },
    cueCarnet: {
      forward: { on: 'cues', has: 'one', label: 'carnet', onDelete: 'cascade' },
      reverse: { on: 'carnets', has: 'many', label: 'cues' },
    },
  },
});

export default _schema;
