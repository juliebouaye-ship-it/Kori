// Tests des helpers de carnet — `node src/carnets.test.mjs`

import {
  makeInviteCode,
  normalizeInviteCode,
  tabsForMode,
  defaultTabForMode,
  MODES,
} from './carnets.js';

let failures = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'ECHEC'} ${label}${ok ? '' : ` — attendu ${JSON.stringify(expected)}, reçu ${JSON.stringify(actual)}`}`);
};

// --- code d'invitation -------------------------------------------------------
const codes = Array.from({ length: 400 }, () => makeInviteCode());
check('code de 6 caractères', [...new Set(codes.map((c) => c.length))], [6]);
check(
  'aucun caractère ambigu (O, 0, I, 1, L)',
  codes.join('').split('').filter((c) => 'O0I1L'.includes(c)).length,
  0,
);
check('codes variés', codes.filter((c) => c === codes[0]).length < 5, true);

// --- saisie tolérante --------------------------------------------------------
check('minuscules acceptées', normalizeInviteCode('abc234'), 'ABC234');
check('espaces et tirets ignorés', normalizeInviteCode('AB C-234'), 'ABC234');
check('caractères ambigus écartés', normalizeInviteCode('AOB0C234'), 'ABC234');
check('tronqué à 6', normalizeInviteCode('ABCDEFGHJK'), 'ABCDEF');
check('entrée vide', normalizeInviteCode(''), '');
check('entrée nulle', normalizeInviteCode(null), '');

// un code généré doit toujours survivre à la normalisation
check(
  'aller-retour stable',
  codes.every((c) => normalizeInviteCode(c) === c),
  true,
);

// --- modes -------------------------------------------------------------------
const TABS = [
  { id: 'train' },
  { id: 'balade' },
  { id: 'tree' },
  { id: 'stats' },
  { id: 'help' },
];
check(
  'journal seul : ni arbre ni entraînement',
  tabsForMode('journal', TABS).map((t) => t.id),
  ['balade', 'stats', 'help'],
);
check('mode complet : tout', tabsForMode('complet', TABS).length, 5);
check('mode inconnu : tout plutôt que rien', tabsForMode(undefined, TABS).length, 5);
check('onglet d’arrivée en journal seul', defaultTabForMode('journal'), 'balade');
check('onglet d’arrivée en mode complet', defaultTabForMode('complet'), 'train');
check('deux modes proposés', MODES.map((m) => m.id), ['journal', 'complet']);

console.log(failures === 0 ? '\nTous les tests passent.' : `\n${failures} échec(s).`);
process.exit(failures === 0 ? 0 : 1);
