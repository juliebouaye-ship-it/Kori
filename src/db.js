// ============================================================
// Client InstantDB
// ============================================================
// Un carnet par chien, plusieurs membres par carnet (deux téléphones sur le
// même carnet, ou plusieurs foyers dans la même base).
//
// Il n'y a plus AUCUN identifiant fixe ici : c'est ce que le modèle mono-carnet
// avait de bloquant. L'appartenance se lit désormais dans les données, via le
// lien `carnets.members` — voir instant.schema.ts et instant.perms.ts.
//
// L'App ID vient de VITE_INSTANT_APP_ID. Tant qu'il n'est pas renseigné, l'appli
// tourne en mode local sans persistance (`syncEnabled` vaut false, aucune
// requête réseau) — pratique comme bac à sable : écarter .env suffit.

import { init } from '@instantdb/react';
import schema from '../instant.schema.ts';

const APP_ID = import.meta.env.VITE_INSTANT_APP_ID;

// true seulement si un App ID est réellement configuré.
export const syncEnabled = Boolean(APP_ID);

// On initialise toujours le client (avec un id factice valide au besoin) pour
// que les hooks puissent être appelés de façon inconditionnelle ; les requêtes
// réelles ne partent que si syncEnabled est vrai (useQuery(null)).
export const db = init({
  appId: APP_ID || 'c0ffee00-0000-4000-8000-000000000000',
  schema,
});
