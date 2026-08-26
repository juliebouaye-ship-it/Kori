// ============================================================
// Retours envoyés depuis les réglages (diagnostic)
// ============================================================
//   node scripts/feedback.mjs
//
// Lecture seule, via le jeton admin — ces lignes ne sont jamais lisibles
// depuis le client (voir instant.perms.ts).

import { adminDb } from './_admin.mjs';

const db = adminDb();
const { feedback } = await db.query({ feedback: { carnet: {} } });

// Même piège de cardinalité que dans events.mjs / _admin.mjs.
const carnetOf = (row) => {
  const c = row.carnet;
  if (!c) return null;
  return Array.isArray(c) ? (c[0] ?? null) : c;
};

if (!feedback.length) {
  console.log('\nAucun retour pour l’instant.');
} else {
  const sorted = feedback.slice().sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  console.log(`\n${feedback.length} retour(s)\n`);
  for (const f of sorted) {
    const date = f.createdAt ? new Date(f.createdAt).toLocaleString('fr-FR') : '';
    const dogName = carnetOf(f)?.dogName ?? '(sans carnet)';
    console.log(`— ${date} · ${dogName}`);
    console.log(`  ${f.text}\n`);
  }
}
