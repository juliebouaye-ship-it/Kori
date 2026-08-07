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
// Le script recopie aussi la configuration (portefeuille, niveau, antisèche…)
// sur le carnet, si le carnet ne l'a pas déjà. Elle est cherchée dans l'ancienne
// ligne `meta` — et à défaut dans une sauvegarde, car pousser le schéma peut
// avoir supprimé cette table :
//
//   npm run migrate -- --from-backup backups/carnet-AAAA-MM-JJ-HHMM.json --apply
//
// Les LIEUX ne s'y trouvent pas forcément, et c'est sans conséquence :
// `ensurePlaces` les reconstitue tout seul à partir des balades au chargement.

import { readFileSync } from 'node:fs';
import { adminDb, COLLECTIONS, CARNET_FIELDS, isOrphan, carnetIdOf } from './_admin.mjs';

const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const APPLY = argv.includes('--apply');
const wanted = arg('--carnet');

async function main() {
  const db = adminDb();

  const query = { carnets: { members: {} }, meta: {} };
  for (const c of COLLECTIONS) query[c] = { carnet: {} };
  const data = await db.query(query);

  const carnets = data.carnets || [];
  if (carnets.length === 0) {
    console.error('\n✗ Aucun carnet dans la base.');
    console.error('  Connecte-toi sur la preview et crée ton carnet, puis relance.');
    process.exitCode = 1;
      return;
  }

  const carnet = wanted
    ? carnets.find((c) => c.id === wanted)
    : carnets.length === 1
      ? carnets[0]
      : null;

  if (!carnet) {
    console.error('\n✗ Plusieurs carnets — précise lequel avec --carnet <id> :');
    for (const c of carnets) console.error(`    ${c.dogName}  ${c.id}`);
    process.exitCode = 1;
      return;
  }

  if (!(carnet.members || []).length) {
    console.error(`\n✗ Le carnet « ${carnet.dogName} » n'a aucun membre.`);
    console.error("  Rattacher des données à un carnet sans membre les rendrait");
    console.error('  définitivement illisibles. Reconnecte-toi dans l’appli d’abord.');
    process.exitCode = 1;
      return;
  }

  // --- ce qu'il y a à faire ----------------------------------------------------
  const orphans = {};
  let total = 0;
  for (const c of COLLECTIONS) {
    orphans[c] = (data[c] || []).filter(isOrphan).map((r) => r.id);
    total += orphans[c].length;
  }

  // Source de la configuration : la ligne `meta` si elle existe encore, sinon la
  // sauvegarde fournie. Pousser le schéma peut avoir supprimé la table `meta`.
  let metaRow = (data.meta || [])[0] || {};
  let metaSource = (data.meta || []).length ? 'ligne meta' : null;

  const backupPath = arg('--from-backup');
  if (backupPath && !metaSource) {
    const backup = JSON.parse(readFileSync(backupPath, 'utf8'));
    const fromBackup = (backup?.data?.meta || [])[0];
    if (!fromBackup) {
      console.error(`\n✗ Aucune ligne meta dans ${backupPath}.`);
      process.exitCode = 1;
      return;
    }
    metaRow = fromBackup;
    metaSource = `sauvegarde ${backupPath}`;
  }

  // Un carnet qui vient d'être créé porte les valeurs par défaut, pas des
  // valeurs vides : le portefeuille démarre à 12 🦴, ce qui écraserait un vrai
  // solde de 34 si on ne reprenait que les champs « vides ». On considère donc
  // qu'un carnet SANS AUCUNE ligne rattachée et sans niveau acquis est neuf, et
  // on y recopie toute la configuration.
  const linkedRows = COLLECTIONS.reduce(
    (n, c) => n + (data[c] || []).filter((r) => carnetIdOf(r) === carnet.id).length,
    0,
  );
  const carnetIsFresh = linkedRows === 0 && !carnet.lifetime;

  const carried = {};
  for (const f of CARNET_FIELDS) {
    const already = carnet[f];
    const isEmpty =
      carnetIsFresh ||
      already === undefined ||
      already === null ||
      (Array.isArray(already) && already.length === 0) ||
      (typeof already === 'object' && !Array.isArray(already) && Object.keys(already).length === 0);
    if (metaRow[f] !== undefined && metaRow[f] !== null && isEmpty) carried[f] = metaRow[f];
  }

  console.log(`\nCarnet cible : « ${carnet.dogName} » (${carnet.id})`);
  console.log('Membres      :', (carnet.members || []).map((m) => m.email || m.id).join(', '));
  console.log(
    'État         :',
    carnetIsFresh
      ? 'neuf (aucune ligne rattachée) — la config sera intégralement reprise'
      : `déjà utilisé (${linkedRows} ligne(s)) — seuls les champs vides seront complétés`,
  );
  console.log('\nLignes à rattacher :');
  console.table(
    COLLECTIONS.map((c) => ({ table: c, orphelines: orphans[c].length })),
  );
  console.log('Total :', total);
  console.log('Source de la config :', metaSource || 'AUCUNE');
  console.log(
    'Config reprise :',
    Object.keys(carried).length
      ? Object.entries(carried)
          .map(([k, v]) => `${k}=${JSON.stringify(v).slice(0, 40)}`)
          .join(' · ')
      : '(rien à reprendre)',
  );
  if (!metaSource) {
    console.log(
      '  ⚠️  Ni ligne `meta` ni sauvegarde : portefeuille, niveau et antisèche\n' +
        '      repartiraient de zéro. Ajoute --from-backup <fichier> si tu en as une.',
    );
  }

  if (!APPLY) {
    console.log('\nRien n’a été écrit. Relance avec --apply pour appliquer.');
    process.exitCode = 0;
      return;
  }

  if (total === 0 && Object.keys(carried).length === 0) {
    console.log('\n✓ Rien à faire.');
    process.exitCode = 0;
      return;
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

}

await main();
