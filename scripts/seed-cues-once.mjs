// ============================================================
// Verse les suggestions d'antisèche du catalogue dans le carnet, UNE FOIS
// ============================================================
//   node scripts/seed-cues-once.mjs [--carnet <id>] [--apply]
//
// Contexte : les mots/gestes affichés dans l'antisèche n'ont jamais été « à »
// l'utilisatrice au sens base de données — ce sont des suggestions écrites en
// dur dans skills-data.js, partagées par tout le monde. La table `cues` créée
// pour porter CES données par carnet est donc restée vide : rien n'y avait
// jamais été enregistré.
//
// Ce script copie une fois les valeurs actuelles du catalogue dans la table du
// carnet visé, comme de VRAIES données à lui. Après ce script, skills-data.js
// perd ses champs cue/signal (fait dans le même commit) : un carnet neuf
// démarre donc avec des champs vides plutôt que d'hériter des signaux d'un
// autre foyer.

import { adminDb } from './_admin.mjs';
import { SKILLS } from '../src/skills-data.js';

const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const APPLY = argv.includes('--apply');
const wanted = arg('--carnet');

const db = adminDb();
const data = await db.query({ carnets: { members: {} }, cues: { carnet: {} } });

const carnets = data.carnets || [];
if (carnets.length === 0) {
  console.error('\n✗ Aucun carnet.');
  process.exitCode = 1;
} else {
  const carnet = wanted ? carnets.find((c) => c.id === wanted) : carnets.length === 1 ? carnets[0] : null;
  if (!carnet) {
    console.error('\n✗ Plusieurs carnets — précise lequel avec --carnet <id> :');
    for (const c of carnets) console.error(`    ${c.dogName}  ${c.id}`);
    process.exitCode = 1;
  } else {
    const existing = new Set(
      (data.cues || [])
        .filter((r) => (Array.isArray(r.carnet) ? r.carnet[0]?.id : r.carnet?.id) === carnet.id)
        .map((r) => r.skillId),
    );

    const rows = SKILLS.filter((s) => (s.cue?.trim() || s.signal?.trim()) && !existing.has(s.id)).map(
      (s) => ({ skillId: s.id, word: s.cue || '', gesture: s.signal || '' }),
    );

    console.log(`\nCarnet : « ${carnet.dogName} »`);
    console.log(`Déjà présentes dans sa table : ${existing.size}`);
    console.log(`À verser : ${rows.length}`);
    for (const r of rows) console.log(`   ${r.skillId.padEnd(16)} ${r.word} — ${r.gesture || '(sans geste)'}`);

    if (!APPLY) {
      console.log('\nRien n’a été écrit. Relance avec --apply pour appliquer.');
    } else if (rows.length === 0) {
      console.log('\n✓ Rien à verser.');
    } else {
      await db.transact(
        rows.map((r) => db.tx.cues[crypto.randomUUID()].update(r).link({ carnet: carnet.id })),
      );
      console.log('\n✓ Versé.');
    }
  }
}
