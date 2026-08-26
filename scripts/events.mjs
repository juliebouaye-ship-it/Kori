// ============================================================
// Événements d'usage (diagnostic)
// ============================================================
//   node scripts/events.mjs
//
// Lecture seule, via le jeton admin — ces lignes ne sont jamais lisibles
// depuis le client (voir instant.perms.ts). Signal d'activation approximatif,
// pas une métrique facturée : pas de déduplication attendue.

import { adminDb } from './_admin.mjs';

const db = adminDb();
const { events } = await db.query({ events: { carnet: {} } });

// Un lien de cardinalité « one » revient tantôt en objet, tantôt en tableau
// (voir le piège documenté dans _admin.mjs pour `carnetIdOf`).
const carnetOf = (row) => {
  const c = row.carnet;
  if (!c) return null;
  return Array.isArray(c) ? (c[0] ?? null) : c;
};

if (!events.length) {
  console.log('\nAucun événement pour l’instant.');
} else {
  const rows = events
    .slice()
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .map((e) => ({
      type: e.type,
      carnet: carnetOf(e)?.dogName ?? '(sans carnet)',
      date: e.createdAt ? new Date(e.createdAt).toLocaleString('fr-FR') : '',
    }));
  console.log(`\n${events.length} événement(s)\n`);
  console.table(rows);
}
