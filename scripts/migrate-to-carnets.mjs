// ============================================================
// Rattache les lignes orphelines (modèle mono-carnet) à un carnet
// ============================================================
//   npm run migrate                      # montre ce qui serait fait
//   npm run migrate -- --apply           # applique
//   npm run migrate -- --carnet <id> --apply
//
// Passe par l'API admin : une fois les permissions posées, une ligne sans
// carnet n'est plus lisible par personne, donc plus rattachable depuis le
// client. Le jeton admin, lui, court-circuite les règles — c'est le seul moyen
// de réparer après coup. Voir scripts/_admin.mjs pour l'obtenir.
//
// Le script recopie aussi la configuration de l'ancienne ligne `meta`
// (portefeuille, niveau, antisèche, lieux) sur le carnet, si elle s'y trouve
// encore et que le carnet ne l'a pas déjà.

import { adminDb, COLLECTIONS, CARNET_FIELDS } from './_admin.mjs';

const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const APPLY = argv.includes('--apply');
const wanted = arg('--carnet');

const db = adminDb();

const query = { carnets: { members: {} }, meta: {} };
for (const c of COLLECTIONS) query[c] = { carnet: {} };
const data = await db.query(query);

const carnets = data.carnets || [];
if (carnets.length === 0) {
  console.error('\n✗ Aucun carnet dans la base.');
  console.error('  Connecte-toi sur la preview et crée ton carnet, puis relance.');
  process.exit(1);
}

const carnet = wanted
  ? carnets.find((c) => c.id === wanted)
  : carnets.length === 1
    ? carnets[0]
    : null;

if (!carnet) {
  console.error('\n✗ Plusieurs carnets — précise lequel avec --carnet <id> :');
  for (const c of carnets) console.error(`    ${c.dogName}  ${c.id}`);
  process.exit(1);
}

if (!(carnet.members || []).length) {
  console.error(`\n✗ Le carnet « ${carnet.dogName} » n'a aucun membre.`);
  console.error("  Rattacher des données à un carnet sans membre les rendrait");
  console.error('  définitivement illisibles. Reconnecte-toi dans l’appli d’abord.');
  process.exit(1);
}

// --- ce qu'il y a à faire ----------------------------------------------------
const orphans = {};
let total = 0;
for (const c of COLLECTIONS) {
  orphans[c] = (data[c] || []).filter((r) => !r.carnet).map((r) => r.id);
  total += orphans[c].length;
}

const metaRow = (data.meta || [])[0] || {};
const carried = {};
for (const f of CARNET_FIELDS) {
  const already = carnet[f];
  const isEmpty =
    already === undefined ||
    already === null ||
    (Array.isArray(already) && already.length === 0) ||
    (typeof already === 'object' && !Array.isArray(already) && Object.keys(already).length === 0) ||
    (f === 'lifetime' && already === 0) ||
    (f === 'onboarded' && already === false);
  if (metaRow[f] !== undefined && metaRow[f] !== null && isEmpty) carried[f] = metaRow[f];
}

console.log(`\nCarnet cible : « ${carnet.dogName} » (${carnet.id})`);
console.log('Membres      :', (carnet.members || []).map((m) => m.email || m.id).join(', '));
console.log('\nLignes à rattacher :');
console.table(
  COLLECTIONS.map((c) => ({ table: c, orphelines: orphans[c].length })),
);
console.log('Total :', total);
console.log(
  'Config reprise depuis meta :',
  Object.keys(carried).length ? Object.keys(carried).join(', ') : '(rien à reprendre)',
);

if (!APPLY) {
  console.log('\nRien n’a été écrit. Relance avec --apply pour appliquer.');
  process.exit(0);
}

if (total === 0 && Object.keys(carried).length === 0) {
  console.log('\n✓ Rien à faire.');
  process.exit(0);
}

// --- application -------------------------------------------------------------
const txs = [];
if (Object.keys(carried).length) {
  txs.push(db.tx.carnets[carnet.id].update({ ...carried, updatedAt: Date.now() }));
}
for (const c of COLLECTIONS) {
  for (const id of orphans[c]) txs.push(db.tx[c][id].link({ carnet: carnet.id }));
}

// Par lots : une transaction de plusieurs centaines d'opérations peut être
// refusée, et un échec partiel est plus facile à reprendre.
const BATCH = 100;
for (let i = 0; i < txs.length; i += BATCH) {
  await db.transact(txs.slice(i, i + BATCH));
  console.log(`  ${Math.min(i + BATCH, txs.length)}/${txs.length} opérations`);
}

console.log('\n✓ Rattachement effectué.');
console.log('  L’ancienne ligne `meta` est laissée en place, par sécurité.');
console.log('  Vérifie avec : npm run etat');
