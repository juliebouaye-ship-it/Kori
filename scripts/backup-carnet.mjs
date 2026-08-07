// ============================================================
// Sauvegarde complète de la base vers un fichier JSON local
// ============================================================
//   npm run backup
//
// Lecture seule. À lancer avant toute opération risquée.
//
// Passe par l'API admin (voir scripts/_admin.mjs) : depuis la pose des règles de
// permissions, un accès anonyme ne voit plus rien, et une sauvegarde qui renvoie
// zéro ligne serait pire qu'inutile — elle donnerait l'illusion d'un filet.
//
// Le fichier atterrit dans backups/, hors git : il contient des données réelles.

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { adminDb, ROOT, COLLECTIONS, isOrphan } from './_admin.mjs';

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

const db = adminDb();

// `meta` et `carnet` sont les tables de l'ancien modèle : on les sauvegarde tant
// qu'elles existent, elles peuvent encore servir de filet.
const query = { $users: {}, carnets: { members: {} }, meta: {}, carnet: {} };
for (const c of COLLECTIONS) query[c] = { carnet: {} };

let data;
try {
  data = await db.query(query);
} catch (err) {
  // Les tables de l'ancien modèle disparaissent une fois nettoyées : on réessaie
  // sans elles plutôt que d'échouer.
  const fallback = { $users: {}, carnets: { members: {} } };
  for (const c of COLLECTIONS) fallback[c] = { carnet: {} };
  data = await db.query(fallback);
  console.log('(tables héritées absentes — sauvegarde du modèle courant seul)');
}

const counts = Object.fromEntries(
  Object.keys(data).map((k) => [k, (data[k] || []).length]),
);

const orphans = COLLECTIONS.reduce(
  (n, c) => n + (data[c] || []).filter(isOrphan).length,
  0,
);

mkdirSync(join(ROOT, 'backups'), { recursive: true });
const out = join(ROOT, 'backups', `carnet-${stamp()}.json`);
writeFileSync(
  out,
  JSON.stringify({ savedAt: new Date().toISOString(), counts, orphans, data }, null, 2),
  'utf8',
);

console.log('Sauvegarde écrite :', out);
console.table(counts);
if (orphans) console.log(`⚠️  ${orphans} ligne(s) sans carnet — voir npm run etat`);

const totalRows = Object.values(counts).reduce((a, b) => a + b, 0);
if (totalRows === 0) {
  console.error('\n⚠️  Sauvegarde VIDE. Vérifie le jeton admin avant de continuer.');
  process.exitCode = 1;
}
