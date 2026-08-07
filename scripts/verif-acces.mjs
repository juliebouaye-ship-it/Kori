// ============================================================
// Vérifie qu'un visiteur NON CONNECTÉ ne voit rien
// ============================================================
//   npm run verif-acces
//
// À relancer après CHAQUE modification des règles de permissions. C'est la
// question qui compte : est-ce que quelqu'un qui ouvre l'URL, sans compte, peut
// lire le carnet ? Le reste de l'outillage passe par le jeton admin et ne peut
// donc pas y répondre — il court-circuite justement les règles.
//
// On utilise le client PUBLIC (le même que l'appli déployée), dans un vrai
// navigateur : hors navigateur, InstantDB refuse de démarrer.

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROOT } from './_admin.mjs';

function readAppId() {
  const env = readFileSync(join(ROOT, '.env'), 'utf8');
  const m = env.match(/^\s*VITE_INSTANT_APP_ID\s*=\s*(.+)$/m);
  if (!m) throw new Error('VITE_INSTANT_APP_ID introuvable dans .env');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

// Ce qu'un curieux tenterait de lire.
const TABLES = [
  'carnets',
  'walks',
  'sessions',
  'care',
  'reminders',
  'firsts',
  'skillProgress',
  'palierDone',
  '$users',
];

const umd = readFileSync(
  join(ROOT, 'node_modules/@instantdb/core/dist/standalone/index.umd.cjs'),
  'utf8',
);

const browser = await chromium.launch();
const page = await browser.newPage();
await page.route('https://kori.local/**', (route) =>
  route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }),
);
await page.goto('https://kori.local/');
await page.addScriptTag({ content: umd });

const results = await page.evaluate(
  ([appId, tables]) =>
    new Promise((resolve) => {
      const db = window.instant.init({ appId });
      const query = Object.fromEntries(tables.map((t) => [t, {}]));
      const out = { rows: {}, error: null };
      const timer = setTimeout(() => resolve(out), 20_000);
      db.subscribeQuery(query, (res) => {
        if (res.error) {
          out.error = res.error.message || String(res.error);
          clearTimeout(timer);
          resolve(out);
          return;
        }
        if (!res.data) return;
        for (const t of tables) out.rows[t] = (res.data[t] || []).length;
        clearTimeout(timer);
        resolve(out);
      });
    }),
  [readAppId(), TABLES],
);

await browser.close();

console.log('\nRequête anonyme (sans aucune connexion) :');
if (results.error) {
  console.log('  refusée —', results.error);
  console.log('\n✓ Rien n’est lisible sans compte.');
  process.exitCode = 0;
} else {
  const visible = Object.entries(results.rows).filter(([, n]) => n > 0);
  console.table(
    Object.entries(results.rows).map(([table, lignes]) => ({ table, lignes })),
  );
  if (visible.length === 0) {
    console.log('\n✓ Rien n’est lisible sans compte.');
  } else {
    console.error('\n✗ FUITE : ces tables sont lisibles publiquement —');
    for (const [t, n] of visible) console.error(`    ${t} : ${n} ligne(s)`);
    console.error('  Ne déploie pas en production tant que ce n’est pas corrigé.');
    process.exitCode = 1;
  }
}
