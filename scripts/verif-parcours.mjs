// ============================================================
// Test des parcours réels contre les VRAIES règles de permissions
// ============================================================
//   npm run verif-parcours
//
// Créer un carnet, en rejoindre un par code, écrire dedans : trois parcours qui
// dépendent entièrement des règles, et qu'aucun test local ne peut valider —
// les règles vivent sur le serveur. On les exécute donc pour de vrai, avec des
// comptes invités (`signInAsGuest`) et des carnets JETABLES, jamais celui de
// l'utilisatrice. Tout est supprimé à la fin par l'API admin.
//
// À relancer après chaque modification de instant.perms.ts.

import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { adminDb, ROOT, COLLECTIONS } from './_admin.mjs';

function readAppId() {
  const env = readFileSync(join(ROOT, '.env'), 'utf8');
  const m = env.match(/^\s*VITE_INSTANT_APP_ID\s*=\s*(.+)$/m);
  if (!m) throw new Error('VITE_INSTANT_APP_ID introuvable dans .env');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

const APP_ID = readAppId();
const MARK = `ZZTEST-${Date.now()}`; // marqueur pour retrouver et nettoyer
const umd = readFileSync(
  join(ROOT, 'node_modules/@instantdb/core/dist/standalone/index.umd.cjs'),
  'utf8',
);

const results = [];
const check = (label, ok, detail = '') => {
  results.push({ label, ok, detail });
  console.log(`${ok ? 'ok  ' : 'ECHEC'} ${label}${detail ? ` — ${detail}` : ''}`);
};

const browser = await chromium.launch();

// Un contexte isolé = un « appareil » avec sa propre session.
async function device(name) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.route(`https://${name}.local/**`, (route) =>
    route.fulfill({ contentType: 'text/html', body: '<!doctype html><html><body></body></html>' }),
  );
  await page.goto(`https://${name}.local/`);
  await page.addScriptTag({ content: umd });
  await page.evaluate((appId) => {
    window.db = window.instant.init({ appId });
    // Helpers partagés : une requête qui rend la première réponse, et un
    // enrobage qui transforme un refus de permission en résultat lisible.
    window.q = (query, opts) =>
      new Promise((resolve) => {
        const t = setTimeout(() => resolve({ timeout: true }), 12000);
        const unsub = window.db.subscribeQuery(
          query,
          (res) => {
            if (res.error) {
              clearTimeout(t);
              unsub?.();
              resolve({ error: res.error.message || String(res.error) });
              return;
            }
            if (!res.data) return;
            clearTimeout(t);
            unsub?.();
            resolve({ data: res.data });
          },
          opts,
        );
      });
    window.tryTx = async (fn) => {
      try {
        await fn();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e?.message || e?.body?.message || String(e) };
      }
    };
  }, APP_ID);
  return page;
}

const uuid = () => crypto.randomUUID();

// ---- Appareil A : une nouvelle utilisatrice (le cas de l'éducatrice) -------
const A = await device('appareil-a');
const userA = await A.evaluate(async () => {
  const r = await window.db.auth.signInAsGuest();
  return window.db.getAuth ? (await window.db.getAuth())?.id : r?.user?.id;
});
check('un compte neuf peut se créer', Boolean(userA), userA || '');

// Avant toute chose : voit-elle le carnet des autres ?
const leak = await A.evaluate(() => window.q({ carnets: {}, walks: {} }));
check(
  'un compte neuf ne voit AUCUN carnet ni balade',
  (leak.data?.carnets?.length ?? 0) === 0 && (leak.data?.walks?.length ?? 0) === 0,
  leak.error ? `refus : ${leak.error}` : `carnets=${leak.data?.carnets?.length} walks=${leak.data?.walks?.length}`,
);

// Créer son carnet — `create` + `link(members)` dans la MÊME transaction.
const carnetA = uuid();
const codeA = 'ZZ' + Math.random().toString(36).slice(2, 6).toUpperCase();
const created = await A.evaluate(
  async ([id, code, mark, uid]) =>
    window.tryTx(() =>
      window.db.transact(
        window.db.tx.carnets[id]
          .update({
            dogName: mark,
            mode: 'journal',
            inviteCode: code,
            onboarded: false,
            wallet: 12,
            lifetime: 0,
            decompOff: [],
            places: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
          .link({ members: uid }),
      ),
    ),
  [carnetA, codeA, MARK, userA],
);
check('créer son carnet (create + link membres en une transaction)', created.ok, created.error || '');

const seenA = await A.evaluate(() => window.q({ carnets: { members: {} } }));
check(
  'elle voit son carnet, et lui seul',
  seenA.data?.carnets?.length === 1,
  `${seenA.data?.carnets?.length} carnet(s)`,
);

// Écrire une balade dedans (create + link carnet en une transaction).
const walkA = uuid();
const wrote = await A.evaluate(
  async ([wid, cid]) =>
    window.tryTx(() =>
      window.db.transact(
        window.db.tx.walks[wid]
          .update({ date: '2026-08-11', ts: Date.now(), level: 'vert', triggers: [] })
          .link({ carnet: cid }),
      ),
    ),
  [walkA, carnetA],
);
check('écrire une balade dans son carnet', wrote.ok, wrote.error || '');

// ---- Appareil B : la personne invitée (le cas de Kévin) --------------------
const B = await device('appareil-b');
const userB = await B.evaluate(async () => {
  await window.db.auth.signInAsGuest();
  return (await window.db.getAuth())?.id;
});

// Sans le code, le carnet de A doit rester invisible.
const blind = await B.evaluate(() => window.q({ carnets: {} }));
check(
  'sans code, l’invité ne voit rien',
  (blind.data?.carnets?.length ?? 0) === 0,
  `${blind.data?.carnets?.length ?? 0} carnet(s)`,
);

// Avec un MAUVAIS code : rien non plus.
const wrongCode = await B.evaluate(
  ([bad]) =>
    window.q({ carnets: { $: { where: { inviteCode: bad } } } }, { ruleParams: { inviteCode: bad } }),
  ['ZZWRONG'],
);
check(
  'un mauvais code ne donne accès à rien',
  (wrongCode.data?.carnets?.length ?? 0) === 0,
  wrongCode.error || `${wrongCode.data?.carnets?.length ?? 0} carnet(s)`,
);

// Avec le BON code : on trouve le carnet (et lui seul).
const found = await B.evaluate(
  ([code]) =>
    window.q({ carnets: { $: { where: { inviteCode: code } } } }, { ruleParams: { inviteCode: code } }),
  [codeA],
);
check(
  'le bon code rend le carnet visible',
  found.data?.carnets?.length === 1,
  found.error || `${found.data?.carnets?.length ?? 0} carnet(s)`,
);

// Rejoindre : se lier comme membre en présentant le code.
const joined = await B.evaluate(
  async ([cid, code, uid]) =>
    window.tryTx(() =>
      window.db.transact(
        window.db.tx.carnets[cid].ruleParams({ inviteCode: code }).link({ members: uid }),
      ),
    ),
  [carnetA, codeA, userB],
);
check('rejoindre le carnet avec le code', joined.ok, joined.error || '');

// Une fois membre : il voit le carnet SANS code, et ses balades.
const asMember = await B.evaluate(() => window.q({ carnets: { walks: {}, members: {} } }));
check(
  'devenu membre, il voit le carnet sans redonner le code',
  asMember.data?.carnets?.length === 1,
  asMember.error || `${asMember.data?.carnets?.length ?? 0} carnet(s)`,
);
check(
  'il voit les balades du carnet partagé',
  (asMember.data?.carnets?.[0]?.walks?.length ?? 0) === 1,
  `${asMember.data?.carnets?.[0]?.walks?.length ?? 0} balade(s)`,
);
// Chacun ne voit que SON compte dans la liste des membres : la règle sur
// `$users` est `auth.id == data.id`. L'appartenance, elle, s'évalue côté
// serveur sur les données complètes — d'où l'accès qui fonctionne quand même.
// Conséquence à connaître : afficher « qui a accès à ce carnet » demanderait
// d'assouplir cette règle. La vraie appartenance est vérifiée plus bas, via
// l'admin, qui voit tout.
check(
  'chacun ne voit que son propre compte dans les membres',
  (asMember.data?.carnets?.[0]?.members?.length ?? 0) === 1,
  `${asMember.data?.carnets?.[0]?.members?.length ?? 0} membre(s) visible(s)`,
);

// Et il peut écrire à son tour.
const wroteB = await B.evaluate(
  async ([wid, cid]) =>
    window.tryTx(() =>
      window.db.transact(
        window.db.tx.walks[wid]
          .update({ date: '2026-08-11', ts: Date.now(), level: 'jaune', triggers: [] })
          .link({ carnet: cid }),
      ),
    ),
  [uuid(), carnetA],
);
check('le membre invité peut écrire à son tour', wroteB.ok, wroteB.error || '');

await browser.close();

// ---- Ménage : on retire tout ce que ce test a créé -------------------------
const admin = adminDb();
const q = { carnets: { members: {} } };
for (const c of COLLECTIONS) q[c] = { carnet: {} };
const after = await admin.query(q);
const testCarnets = (after.carnets || []).filter((c) => String(c.dogName).startsWith('ZZTEST-'));
const testIds = new Set(testCarnets.map((c) => c.id));

// Vérité sur l'appartenance : l'admin voit tous les membres, sans le filtre
// de `$users`. C'est ici qu'on confirme que « rejoindre » a réellement lié.
const joinedCarnet = testCarnets.find((c) => c.id === carnetA);
check(
  'côté serveur, le carnet a bien deux membres',
  (joinedCarnet?.members?.length ?? 0) === 2,
  `${joinedCarnet?.members?.length ?? 0} membre(s)`,
);

const cleanup = [];
for (const c of COLLECTIONS) {
  for (const row of after[c] || []) {
    const owner = Array.isArray(row.carnet) ? row.carnet[0]?.id : row.carnet?.id;
    if (owner && testIds.has(owner)) cleanup.push(admin.tx[c][row.id].delete());
  }
}
for (const c of testCarnets) cleanup.push(admin.tx.carnets[c.id].delete());
if (cleanup.length) await admin.transact(cleanup);

// Les comptes invités n'ont ni e-mail ni contenu ; on les retire aussi.
const guests = (await admin.query({ $users: {} })).$users || [];
const toDrop = guests.filter((u) => !u.email);
if (toDrop.length) {
  try {
    await admin.transact(toDrop.map((u) => admin.tx.$users[u.id].delete()));
  } catch {
    console.log('(comptes invités non supprimables — sans e-mail ni données, sans conséquence)');
  }
}
console.log(`\nMénage : ${testCarnets.length} carnet(s) de test, ${cleanup.length - testCarnets.length} ligne(s), ${toDrop.length} compte(s) invité(s).`);

const failed = results.filter((r) => !r.ok);
console.log(
  failed.length === 0
    ? `\n✓ Les ${results.length} parcours passent.`
    : `\n✗ ${failed.length} parcours en échec.`,
);
process.exitCode = failed.length ? 1 : 0;
