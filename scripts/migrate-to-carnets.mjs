// ============================================================
// Rattache les données existantes (modèle mono-carnet) à un carnet
// ============================================================
//   node scripts/migrate-to-carnets.mjs [--carnet <id>] [--dry]
//
// À lancer UNE FOIS, dans cet ordre précis :
//   1. pousser le schéma        : npx instant-cli@latest push schema
//   2. se connecter dans l'appli et CRÉER son carnet
//   3. ce script                 ← les règles ne sont pas encore en place
//   4. pousser les permissions  : npx instant-cli@latest push perms
//
// L'ordre compte : une fois les permissions posées, une ligne sans carnet n'est
// plus lisible par personne (la règle exige d'être membre du carnet propriétaire).
// Il faut donc les rattacher AVANT — c'est le seul moment où c'est possible sans
// jeton admin.
//
// Par défaut le script ne fait rien sans confirmation : il commence par afficher
// ce qu'il compte faire. Ajouter --apply pour écrire.

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : null;
};
const APPLY = argv.includes('--apply');

function readAppId() {
  const env = readFileSync(join(ROOT, '.env'), 'utf8');
  const m = env.match(/^\s*VITE_INSTANT_APP_ID\s*=\s*(.+)$/m);
  if (!m) throw new Error('VITE_INSTANT_APP_ID introuvable dans .env');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

const COLLECTIONS = ['walks', 'sessions', 'care', 'reminders', 'firsts', 'skillProgress', 'palierDone'];
const CARNET_FIELDS = ['onboarded', 'wallet', 'lifetime', 'cues', 'decompOff', 'places'];

const umd = readFileSync(
  join(ROOT, 'node_modules/@instantdb/core/dist/standalone/index.umd.cjs'),
  'utf8',
);

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('console', (m) => console.log('  [navigateur]', m.text()));
await page.route('https://kori.local/**', (route) =>
  route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }),
);
await page.goto('https://kori.local/');
await page.addScriptTag({ content: umd });

const result = await page.evaluate(
  async ([appId, collections, carnetFields, wantedCarnetId, apply]) => {
    const db = window.instant.init({ appId });

    const query = { carnets: {}, meta: {} };
    for (const c of collections) query[c] = {};

    const data = await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Aucune réponse après 30 s')), 30_000);
      const unsub = db.subscribeQuery(query, (res) => {
        if (res.error) {
          clearTimeout(timer);
          unsub?.();
          reject(new Error(res.error.message || String(res.error)));
          return;
        }
        if (!res.data) return;
        clearTimeout(timer);
        unsub?.();
        resolve(res.data);
      });
    });

    const carnets = data.carnets || [];
    if (carnets.length === 0) {
      return { error: 'Aucun carnet. Connecte-toi dans l’appli et crée ton carnet d’abord.' };
    }
    const carnet = wantedCarnetId
      ? carnets.find((c) => c.id === wantedCarnetId)
      : carnets.length === 1
        ? carnets[0]
        : null;
    if (!carnet) {
      return {
        error: `Plusieurs carnets — précise lequel avec --carnet <id>. Trouvés : ${carnets
          .map((c) => `${c.dogName} (${c.id})`)
          .join(', ')}`,
      };
    }

    // Lignes sans carnet : ce sont celles du modèle mono-carnet.
    const orphans = {};
    let total = 0;
    for (const c of collections) {
      orphans[c] = (data[c] || []).filter((r) => !r.carnet).map((r) => r.id);
      total += orphans[c].length;
    }

    // Champs de configuration à déplacer de l'ancienne ligne `meta` vers le carnet.
    const metaRow = (data.meta || [])[0] || {};
    const carried = {};
    for (const f of carnetFields) {
      if (metaRow[f] !== undefined && metaRow[f] !== null) carried[f] = metaRow[f];
    }

    const plan = {
      carnetId: carnet.id,
      dogName: carnet.dogName,
      counts: Object.fromEntries(collections.map((c) => [c, orphans[c].length])),
      total,
      carried: Object.keys(carried),
      applied: false,
    };
    if (!apply) return plan;

    const txs = [];
    if (Object.keys(carried).length) {
      txs.push(db.tx.carnets[carnet.id].update({ ...carried, updatedAt: Date.now() }));
    }
    for (const c of collections) {
      for (const id of orphans[c]) txs.push(db.tx[c][id].link({ carnet: carnet.id }));
    }
    if (txs.length) await db.transact(txs);
    plan.applied = true;
    return plan;
  },
  [readAppId(), COLLECTIONS, CARNET_FIELDS, arg('--carnet'), APPLY],
);

await browser.close();

if (result.error) {
  console.error('\n✗', result.error);
  process.exit(1);
}

console.log(`\nCarnet cible : ${result.dogName} (${result.carnetId})`);
console.log('\nLignes à rattacher :');
console.table(result.counts);
console.log('Total :', result.total);
console.log('Config reprise depuis meta :', result.carried.join(', ') || '(rien)');

if (result.applied) {
  console.log('\n✓ Rattachement effectué.');
  console.log("  L'ancienne ligne `meta` est laissée en place, par sécurité.");
  console.log('  Étape suivante : npx instant-cli@latest push perms');
} else {
  console.log('\nRien n’a été écrit. Relance avec --apply pour appliquer.');
}
