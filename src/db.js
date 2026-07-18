// ============================================================
// Client InstantDB — carnet de Kori partagé (temps réel)
// ============================================================
// Un seul carnet partagé entre les 2 téléphones : tout l'état de l'app
// (le même blob JSON qu'en localStorage) tient dans un unique enregistrement
// `carnet` d'id fixe, identique sur chaque appareil.
//
// L'App ID vient de la variable d'environnement VITE_INSTANT_APP_ID
// (voir .env.example). Tant qu'elle n'est pas renseignée, l'app fonctionne
// en mode local seul (localStorage) sans planter : `syncEnabled` vaut false
// et aucune requête réseau n'est faite.

import { init } from '@instantdb/react';

// id fixe de l'ANCIEN carnet mono-bloc (namespace `carnet`) — conservé pour
// migrer/supprimer l'ancienne ligne unique lors du passage aux vraies tables.
export const KORI_ID = 'c0ffee00-0000-4000-8000-00000000d09d';

// id fixe de l'enregistrement `meta` (compteurs + config : niveau, portefeuille,
// statuts, antisèche…). Les balades/séances/repas/rappels vivent, eux, chacun
// dans leur propre table (une ligne = un élément).
export const META_ID = 'c0ffee00-0000-4000-8000-000000000001';

const APP_ID = import.meta.env.VITE_INSTANT_APP_ID;

// true seulement si un App ID est réellement configuré.
export const syncEnabled = Boolean(APP_ID);

// On initialise toujours le client (avec un id factice valide si besoin) pour
// que le hook db.useQuery puisse être appelé de façon inconditionnelle ; les
// requêtes réelles ne partent que si syncEnabled est vrai (useQuery(null)).
export const db = init({
  appId: APP_ID || 'c0ffee00-0000-4000-8000-000000000000',
});
