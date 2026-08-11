// Cohérence du schéma InstantDB — `node src/schema.test.mjs`
//
// Ces erreurs-là ne se voient pas à la lecture : elles n'apparaissent qu'au
// `push`, souvent après avoir déjà déployé le code qui en dépend. Autant les
// attraper ici.

import schema from '../instant.schema.ts';
import { COLLECTIONS, CARNET_FIELDS, COLLECTION_FIELDS } from './sync-core.js';

let failures = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? 'ok  ' : 'ECHEC'} ${label}${ok ? '' : ` — attendu ${JSON.stringify(expected)}, reçu ${JSON.stringify(actual)}`}`,
  );
};

const entities = schema.entities;
const links = Object.values(schema.links || {});

// --- collision attribut / lien ----------------------------------------------
// Un attribut et un lien de même nom sur la même entité se télescopent : Instant
// refuse le push avec « `x` already exists on `y` ». C'est ce qui est arrivé
// avec `cues`, laissé comme blob JSON sur `carnets` alors que le lien vers la
// nouvelle table portait déjà ce label.
for (const [name, entity] of Object.entries(entities)) {
  const attrs = Object.keys(entity.attrs || {});
  const labels = links
    .flatMap((l) => [
      l.forward.on === name ? l.forward.label : null,
      l.reverse.on === name ? l.reverse.label : null,
    ])
    .filter(Boolean);
  const clash = attrs.filter((a) => labels.includes(a));
  check(`aucune collision attribut/lien sur « ${name} »`, clash, []);
}

// --- le code et le schéma parlent des mêmes tables ---------------------------
for (const c of COLLECTIONS) {
  check(`la table « ${c} » existe dans le schéma`, Boolean(entities[c]), true);
}

// --- chaque collection est rattachée à un carnet -----------------------------
// Une table sans lien `carnet` produirait des lignes que les permissions
// rendraient illisibles pour tout le monde.
for (const c of COLLECTIONS) {
  const linked = links.some(
    (l) => l.forward.on === c && l.forward.label === 'carnet' && l.reverse.on === 'carnets',
  );
  check(`« ${c} » est reliée à son carnet`, linked, true);
}

// --- les champs écrits par la synchro existent dans le schéma ----------------
for (const c of COLLECTIONS) {
  const declared = Object.keys(entities[c]?.attrs || {});
  const missing = Object.keys(COLLECTION_FIELDS[c] || {}).filter((f) => !declared.includes(f));
  check(`« ${c} » déclare tous ses champs`, missing, []);
}

const carnetAttrs = Object.keys(entities.carnets?.attrs || {});
check(
  'la ligne carnet déclare tous ses champs de config',
  CARNET_FIELDS.filter((f) => !carnetAttrs.includes(f)),
  [],
);

// --- le carnet reste rattachable à des membres -------------------------------
check(
  'les carnets ont des membres',
  links.some((l) => l.forward.on === 'carnets' && l.forward.label === 'members'),
  true,
);

console.log(failures === 0 ? '\nSchéma cohérent.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
