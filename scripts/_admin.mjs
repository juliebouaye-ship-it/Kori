// ============================================================
// Client admin partagé par les scripts de maintenance
// ============================================================
// Depuis la pose des règles de permissions, un accès anonyme ne voit plus rien
// — c'est exactement l'effet recherché, mais ça rend les outils de maintenance
// aveugles. Ils passent donc par l'API admin, qui court-circuite les règles.
//
// Le jeton se récupère dans le tableau de bord InstantDB : ton application →
// onglet Admin → « Admin token ». À coller dans .env (déjà hors git) :
//
//   INSTANT_ADMIN_TOKEN=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
//
// ⚠️ Ce jeton donne un accès TOTAL à la base, sans aucune règle. Il ne doit
// jamais partir dans le bundle ni dans un commit — d'où sa lecture ici, côté
// Node uniquement, et jamais via `import.meta.env`.

import { init } from '@instantdb/admin';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function readEnv(key) {
  let raw = '';
  try {
    raw = readFileSync(join(ROOT, '.env'), 'utf8');
  } catch {
    throw new Error('Fichier .env introuvable.');
  }
  const m = raw.match(new RegExp(`^\\s*${key}\\s*=\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
}

export function adminDb() {
  const appId = readEnv('VITE_INSTANT_APP_ID');
  if (!appId) throw new Error('VITE_INSTANT_APP_ID introuvable dans .env');

  const adminToken = process.env.INSTANT_ADMIN_TOKEN || readEnv('INSTANT_ADMIN_TOKEN');
  if (!adminToken) {
    throw new Error(
      'INSTANT_ADMIN_TOKEN introuvable.\n' +
        '  Tableau de bord InstantDB → ton application → onglet Admin → copie le jeton,\n' +
        '  puis ajoute cette ligne à .env :\n' +
        '    INSTANT_ADMIN_TOKEN=…',
    );
  }
  return init({ appId, adminToken });
}

export const COLLECTIONS = [
  'walks',
  'sessions',
  'care',
  'reminders',
  'firsts',
  'skillProgress',
  'palierDone',
];

export const CARNET_FIELDS = ['onboarded', 'wallet', 'lifetime', 'cues', 'decompOff', 'places'];

/**
 * Identifiant du carnet auquel une ligne est rattachée, ou null.
 *
 * ⚠️ Piège : selon que le client connaît ou non le schéma, un lien de
 * cardinalité « one » revient tantôt comme un objet, tantôt comme un TABLEAU
 * (vide s'il n'y a pas de lien). Tester `!row.carnet` ne marche donc pas — un
 * tableau vide est truthy, et toutes les lignes orphelines passaient pour
 * rattachées. C'est exactement le genre de faux négatif qui coûte des données.
 */
export function carnetIdOf(row) {
  const c = row?.carnet;
  if (!c) return null;
  if (Array.isArray(c)) return c.length ? (c[0]?.id ?? null) : null;
  return c.id ?? null;
}

export const isOrphan = (row) => carnetIdOf(row) === null;
