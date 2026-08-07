// Tests des règles de déblocage — `node src/domain.test.mjs`
//
// L'invariant qui compte : un prérequis CONSEILLE, il n'interdit pas. Seule la
// courte liste HARD_PREREQS (raisons physiques) verrouille réellement. On avait
// l'effet inverse au départ : impossible de noter « Calme sur tapis » déjà
// travaillé parce que « Panier » n'était pas coché.

import {
  skillUiStatus,
  missingPrereqs,
  missingHardPrereqs,
  ensurePlaces,
  orderedPlaces,
  addPlace,
  slugify,
  placeLabel,
  DEFAULT_STATE,
} from './domain.js';
import { SKILLS, HARD_PREREQS } from './skills-data.js';

const skill = (id) => {
  const s = SKILLS.find((x) => x.id === id);
  if (!s) throw new Error(`compétence inconnue : ${id}`);
  return s;
};

let failures = 0;
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(`${ok ? 'ok  ' : 'ECHEC'} ${label}${ok ? '' : ` — attendu ${JSON.stringify(expected)}, reçu ${JSON.stringify(actual)}`}`);
};

const vierge = { skillStatus: {} };

// --- un prérequis pédagogique ne verrouille pas -----------------------------
check('tapis déblocable sans panier', skillUiStatus(vierge, skill('calme-tapis')), 'available');
check('rappel au repos déblocable', skillUiStatus(vierge, skill('rappel-repos')), 'available');
check('solitude déblocable', skillUiStatus(vierge, skill('solitude')), 'available');
check('examen véto déblocable', skillUiStatus(vierge, skill('examen-veto')), 'available');

// --- un prérequis physique verrouille ---------------------------------------
check('griffes verrouillées', skillUiStatus(vierge, skill('griffes')), 'locked');
check('traction verrouillée', skillUiStatus(vierge, skill('allez')), 'locked');
check('croisement en traction verrouillé', skillUiStatus(vierge, skill('croiser-traction')), 'locked');

// --- et se déverrouille une fois le prérequis acquis ------------------------
check(
  'griffes déblocables une fois les pattes acquises',
  skillUiStatus({ skillStatus: { 'pattes-soin': 'mastered' } }, skill('griffes')),
  'available',
);

// --- le conseil reste affiché même quand c'est déblocable -------------------
check('conseil conservé sur tapis', missingPrereqs(vierge, skill('calme-tapis')), ['panier']);
check('aucun blocage dur sur tapis', missingHardPrereqs(vierge, skill('calme-tapis')), []);

// --- un statut explicite l'emporte toujours ---------------------------------
check(
  'compétence déjà en cours reste en cours',
  skillUiStatus({ skillStatus: { griffes: 'learning' } }, skill('griffes')),
  'learning',
);

// --- intégrité de HARD_PREREQS ----------------------------------------------
for (const [id, reqs] of Object.entries(HARD_PREREQS)) {
  const s = skill(id);
  for (const r of reqs) {
    skill(r); // lève si l'id n'existe pas
    check(`${r} figure bien dans les prereqs de ${id}`, s.prereqs.includes(r), true);
  }
}

// --- garde-fou : le verrouillage doit rester l'exception --------------------
const locked = SKILLS.filter((s) => skillUiStatus(vierge, s) === 'locked');
check('peu de compétences verrouillées à vide', locked.length, 3);

// ============================================================
// Lieux de balade — la liste appartient au carnet et s'alimente à l'usage
// ============================================================
const walk = (location) => ({ id: location ?? 'x', date: '2026-08-01', level: 'vert', location });

// --- migration d'un carnet existant -----------------------------------------
const ancien = ensurePlaces({ ...DEFAULT_STATE, walks: [walk('foret'), walk('lidl'), walk('foret')] });
check('libellés historiques retrouvés', ancien.places.map((p) => p.label).sort(), [
  'Petite forêt',
  'Tour Lidl',
]);
check('aucune balade orpheline', ancien.walks.filter((w) => w.location && !ancien.places.some((p) => p.slug === w.location)).length, 0);
check('migration idempotente', ensurePlaces(ancien).places.length, 2);

// --- un carnet neuf n'hérite de rien ----------------------------------------
check('carnet vierge sans lieu', ensurePlaces({ ...DEFAULT_STATE }).places, []);
check(
  'balade sans lieu ne crée aucun lieu',
  ensurePlaces({ ...DEFAULT_STATE, walks: [walk(null)] }).places,
  [],
);
check(
  'lieu inconnu conservé plutôt que perdu',
  ensurePlaces({ ...DEFAULT_STATE, walks: [walk('parc-du-coin')] }).places.map((p) => p.slug),
  ['parc-du-coin'],
);

// --- création à la volée -----------------------------------------------------
check('slug sans accent ni espace', slugify('Petite Forêt'), 'petite-foret');
check('slug dédoublonné', slugify('Forêt', ['foret']), 'foret-2');
const { places: p1, slug: s1 } = addPlace([], 'Bois du Roi');
check('lieu créé', [p1.length, s1], [1, 'bois-du-roi']);
check('même nom = même lieu', addPlace(p1, '  bois du ROI ').places.length, 1);
check('nom vide ignoré', addPlace(p1, '   ').slug, null);

// --- tri par fréquence -------------------------------------------------------
const freq = ensurePlaces({
  ...DEFAULT_STATE,
  walks: [walk('lidl'), walk('foret'), walk('foret'), walk('foret')],
});
check('le lieu le plus fréquenté passe devant', orderedPlaces(freq)[0].slug, 'foret');

// --- suppression : l'historique n'est jamais réécrit -------------------------
check(
  'balade d’un lieu supprimé garde une trace lisible',
  placeLabel({ places: [] }, 'foret'),
  'foret',
);

console.log(
  failures === 0
    ? `\nTous les tests passent (${SKILLS.length} compétences, ${locked.length} verrouillées à vide).`
    : `\n${failures} échec(s).`,
);
process.exit(failures === 0 ? 0 : 1);
