// ============================================================
// Sauvegarde du carnet InstantDB vers un fichier JSON local.
// ============================================================
// Lecture seule : aucune écriture dans la base. À lancer avant toute
// modification du modèle de données (passage au multi-utilisateur).
//
//   node scripts/backup-carnet.mjs
//
// Le fichier atterrit dans backups/carnet-AAAA-MM-JJ-HHMM.json (hors git).
//
// NB : le client InstantDB refuse de tourner hors navigateur (`queryOnce` lève
// « We can't run queryOnce on the backend », et `subscribeQuery` plante faute de
// stockage persistant). On le fait donc tourner dans un vrai Chromium via
// Playwright, sur une page servie depuis une origine factice — ce qui évite
// d'avoir à créer un jeton admin dans le tableau de bord.

import { chromium } from 'playwright';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// L'App ID vit dans .env (VITE_INSTANT_APP_ID) — on le lit sans le journaliser.
function readAppId() {
  const env = readFileSync(join(ROOT, '.env'), 'utf8');
  const m = env.match(/^\s*VITE_INSTANT_APP_ID\s*=\s*(.+)$/m);
  if (!m) throw new Error('VITE_INSTANT_APP_ID introuvable dans .env');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

// Toutes les tables du modèle actuel + l'ancien blob mono-bloc s'il traîne.
const QUERY = {
  meta: {},
  walks: {},
  sessions: {},
  care: {},
  reminders: {},
  firsts: {},
  skillProgress: {},
  palierDone: {},
  carnet: {},
};

const stamp = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
};

const umd = readFileSync(
  join(ROOT, 'node_modules/@instantdb/core/dist/standalone/index.umd.cjs'),
  'utf8',
);

const browser = await chromium.launch();
const page = await browser.newPage();

// Origine factice : InstantDB a besoin d'un vrai origin (IndexedDB) pour démarrer.
await page.route('https://kori.local/**', (route) =>
  route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }),
);
await page.goto('https://kori.local/');
await page.addScriptTag({ content: umd });

const data = await page.evaluate(
  ([appId, query]) =>
    new Promise((resolve, reject) => {
      const db = window.instant.init({ appId });
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
    }),
  [readAppId(), QUERY],
);

await browser.close();

const counts = Object.fromEntries(
  Object.keys(QUERY).map((k) => [k, (data[k] || []).length]),
);

mkdirSync(join(ROOT, 'backups'), { recursive: true });
const out = join(ROOT, 'backups', `carnet-${stamp()}.json`);
writeFileSync(
  out,
  JSON.stringify({ savedAt: new Date().toISOString(), counts, data }, null, 2),
  'utf8',
);

console.log('Sauvegarde écrite :', out);
console.table(counts);
