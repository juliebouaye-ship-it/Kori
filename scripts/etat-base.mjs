// ============================================================
// Photographie de l'état réel de la base (diagnostic)
// ============================================================
//   node scripts/etat-base.mjs
//
// Lecture seule. Répond aux questions qu'on ne peut plus poser depuis un accès
// anonyme : y a-t-il un carnet ? qui en est membre ? et surtout, reste-t-il des
// lignes ORPHELINES (sans carnet) — celles-ci ne sont plus lisibles par personne
// une fois les permissions posées.

import { adminDb, COLLECTIONS, CARNET_FIELDS } from './_admin.mjs';

const db = adminDb();

const query = { $users: {}, carnets: { members: {} }, meta: {} };
for (const c of COLLECTIONS) query[c] = { carnet: {} };

const data = await db.query(query);

const users = data.$users || [];
const carnets = data.carnets || [];

console.log('\n=== COMPTES ===');
if (!users.length) console.log('  aucun compte — personne ne s’est encore connecté');
for (const u of users) console.log(`  ${u.email || '(sans e-mail)'}  ${u.id}`);

console.log('\n=== CARNETS ===');
if (!carnets.length) console.log('  AUCUN CARNET');
for (const c of carnets) {
  const members = (c.members || []).map((m) => m.email || m.id).join(', ') || 'AUCUN MEMBRE';
  console.log(`  « ${c.dogName} »  (${c.mode})  code ${c.inviteCode}`);
  console.log(`     id      : ${c.id}`);
  console.log(`     membres : ${members}`);
  const config = CARNET_FIELDS.filter((f) => c[f] !== undefined && c[f] !== null);
  console.log(`     config  : ${config.join(', ') || '(vide)'}`);
  if (c.wallet !== undefined) console.log(`     wallet ${c.wallet} · lifetime ${c.lifetime}`);
}

console.log('\n=== LIGNES DE DONNÉES ===');
let orphansTotal = 0;
const rows = [];
for (const c of COLLECTIONS) {
  const all = data[c] || [];
  const orphans = all.filter((r) => !r.carnet);
  orphansTotal += orphans.length;
  rows.push({ table: c, total: all.length, orphelines: orphans.length });
}
console.table(rows);

console.log('Ancienne ligne `meta` :', (data.meta || []).length ? 'encore présente' : 'absente');

if (orphansTotal > 0) {
  console.log(`\n⚠️  ${orphansTotal} ligne(s) sans carnet.`);
  console.log('   Elles ne sont plus lisibles depuis l’appli (les règles exigent');
  console.log('   d’être membre du carnet propriétaire). À rattacher avec :');
  console.log('     npm run migrate -- --apply');
} else {
  console.log('\n✓ Aucune ligne orpheline.');
}
