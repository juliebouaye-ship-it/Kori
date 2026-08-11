// ============================================================
// Logique de domaine du Carnet de Kori (pure, sans React)
// ============================================================
// Annuaires (lookups) et dérivations partagés par plusieurs onglets, jusqu'ici
// mélangés au corps d'App.jsx. Tout est pur → testable au Node comme insights /
// tree-layout.

import {
  SKILLS,
  CATEGORIES,
  LEGACY_LOCATIONS,
  PLACE_ICON,
  WALK_TRIGGERS,
  RETIRED_TRIGGERS,
  CUP_LEVELS,
  TIERS,
  HARD_PREREQS,
} from './skills-data.js';
import { reminderStatus } from './health-data.js';
import { localDate, daysBetween } from './date-utils.js';
import { uuid } from './sync-core.js';

// Génération d'id : les éléments deviennent des lignes InstantDB → id = UUID.
// On réutilise l'implémentation unique de sync-core (identique à l'ancien newId).
export { uuid as newId };

// ---- Annuaires (id -> objet de contenu statique) --------------------------
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
export const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
// Les déclencheurs retirés du sélecteur restent dans l'annuaire : une balade
// enregistrée avant leur retrait doit continuer à afficher son tag.
export const TRIGGER_BY_ID = Object.fromEntries(
  [...WALK_TRIGGERS, ...RETIRED_TRIGGERS].map((t) => [t.id, t]),
);
export const CUP_BY_ID = Object.fromEntries(CUP_LEVELS.map((c) => [c.id, c]));

// ---- État par défaut ------------------------------------------------------
export const DEFAULT_STATE = {
  onboarded: false,
  wallet: 12, // portefeuille dépensable (🦴) — baisse quand on débloque
  lifetime: 0, // total cumulé à vie — fait monter le niveau, ne baisse jamais
  skillProgress: [], // { id, skillId, status: 'known'|'learning'|'mastered' }
  palierDone: [], // { id, palierId, skillId, doneAt }
  sessions: [], // { id, date, skillId, palierId, rating, xp }
  walks: [], // { id, date, ts, level: 'vert'|'jaune'|'rouge', location, duration, triggers: [], note }
  places: [], // { slug, label, icon } — lieux du carnet, alimentés au fil des balades
  cues: {}, // skillId -> { word, gesture } — antisèche partagée, éditable
  decompOff: [], // dates « elle va bien » : l'observation prime sur la règle
  care: [], // { id, date, ts, kind: 'repas'|'friandise', label, grams?, treatId? }
  reminders: [], // { id, type, label, dueDate, note }
  firsts: [], // { id, date, title, note } — « premières fois » à célébrer
};

// Antisèche : mot + geste effectifs (override utilisateur, sinon défaut du skill).
export const cueFor = (state, skill) => ({
  word: state.cues?.[skill.id]?.word ?? skill.cue ?? '',
  gesture: state.cues?.[skill.id]?.gesture ?? skill.signal ?? '',
});

// ---- Lieux de balade ------------------------------------------------------
// Les lieux appartiennent au carnet, pas au code : la liste s'alimente au fil
// des balades. On évite ainsi de demander une saisie initiale (fastidieuse, et
// on ne connaît pas ses lieux avant de les avoir parcourus) tout en gardant des
// puces à taper plutôt qu'un champ libre à chaque sortie.
//
// Une balade référence son lieu par `slug` (chaîne stable) et non par l'index de
// ligne : renommer un lieu plus tard n'orphelinera pas l'historique.

// Slug lisible et stable dérivé du libellé, suffixé si le nom est déjà pris.
export function slugify(label, taken = []) {
  const base =
    label
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // marques diacritiques
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 24) || 'lieu';
  if (!taken.includes(base)) return base;
  let n = 2;
  while (taken.includes(`${base}-${n}`)) n++;
  return `${base}-${n}`;
}

// Migration one-shot : un carnet antérieur aux lieux dynamiques a des balades
// qui pointent vers les identifiants historiques ('foret', 'lidl'…). On
// reconstitue la liste À PARTIR DES BALADES RÉELLES — donc un carnet neuf, qui
// n'a aucune balade, démarre bien avec une liste vide au lieu d'hériter des
// lieux d'un autre foyer.
export function ensurePlaces(state) {
  if (state.places?.length) return state;
  const used = [...new Set((state.walks || []).map((w) => w.location).filter(Boolean))];
  if (used.length === 0) return state;
  const places = used.map((slug) => {
    const legacy = LEGACY_LOCATIONS.find((l) => l.id === slug);
    return legacy
      ? { slug, label: legacy.label, icon: legacy.icon }
      : { slug, label: slug, icon: PLACE_ICON };
  });
  return { ...state, places };
}

export const placeBySlug = (state) =>
  Object.fromEntries((state.places || []).map((p) => [p.slug, p]));

export const placeLabel = (state, slug) =>
  (state.places || []).find((p) => p.slug === slug)?.label ?? slug;

// Lieux triés par fréquence d'usage puis par ordre alphabétique : les habitudes
// remontent naturellement en tête sans qu'on ait à les classer à la main.
export function orderedPlaces(state) {
  const counts = {};
  for (const w of state.walks || []) if (w.location) counts[w.location] = (counts[w.location] || 0) + 1;
  return [...(state.places || [])].sort(
    (a, b) => (counts[b.slug] || 0) - (counts[a.slug] || 0) || a.label.localeCompare(b.label),
  );
}

// Ajoute un lieu s'il n'existe pas déjà (comparaison insensible à la casse et
// aux espaces, pour ne pas créer « Petite forêt » deux fois).
export function addPlace(places, rawLabel) {
  const label = rawLabel.trim().replace(/\s+/g, ' ');
  if (!label) return { places, slug: null };
  const existing = (places || []).find(
    (p) => p.label.toLowerCase() === label.toLowerCase(),
  );
  if (existing) return { places, slug: existing.slug };
  const slug = slugify(label, (places || []).map((p) => p.slug));
  return { places: [...(places || []), { slug, label, icon: PLACE_ICON }], slug };
}

// ---- Balade / gestion -----------------------------------------------------
// une séance en catégorie « balade » comptée un jour où une balade a débordé (🔴)
// = gestion (on protège, on n'entraîne pas) → exclue de la progression de compétence.
export const isBaladeSkill = (skillId) => SKILL_BY_ID[skillId]?.category === 'balade';
export const dayHasRedWalk = (walks, date) =>
  walks.some((w) => w.date === date && w.level === 'rouge');
export const sessionIsGestion = (walks, s) =>
  isBaladeSkill(s.skillId) && dayHasRedWalk(walks, s.date);

// jour de décompression : une balade 🔴 aujourd'hui ou dans les 2 jours précédents
// (le cortisol met ~48-72 h à retomber).
// `decompOff` = dates où l'utilisatrice a explicitement dit « elle va bien ».
// L'observation directe prime toujours sur la règle des 48-72 h : le bandeau
// est une suggestion, pas un diagnostic. On ne réécrit pas l'historique des
// balades pour autant — la sortie rouge reste enregistrée telle quelle.
export function decompressionInfo(walks, today = localDate(), decompOff = []) {
  if (decompOff.includes(today)) return { active: false };
  const reds = walks
    .filter((w) => w.level === 'rouge')
    .map((w) => w.date)
    .filter((d) => {
      const diff = daysBetween(today, d);
      return diff >= 0 && diff <= 2;
    })
    .sort();
  if (reds.length === 0) return { active: false };
  const last = reds[reds.length - 1];
  return { active: true, since: last, dayOffset: daysBetween(today, last) };
}

// ---- Stats / niveau -------------------------------------------------------
// Métrique positive du mois (entraînement uniquement, hors gestion) — remplace
// la série 🔥 : on encourage sans pénaliser les jours sautés (anti-lassitude).
export function trainingMonthStats(sessions, walks, today = localDate()) {
  const month = today.slice(0, 7); // 'AAAA-MM'
  const training = sessions.filter(
    (s) => s.date.startsWith(month) && !sessionIsGestion(walks, s)
  );
  return { sessions: training.length, days: new Set(training.map((s) => s.date)).size };
}

// Rappels santé réellement dus aujourd'hui ou en retard (jamais d'alarme sur une absence).
export const dueReminders = (reminders, today = localDate()) =>
  reminders.filter((r) => ['overdue', 'today'].includes(reminderStatus(r.dueDate, today)));

export function tierFor(lifetime) {
  let current = TIERS[0];
  let next = null;
  for (const t of TIERS) {
    if (lifetime >= t.min) current = t;
    else {
      next = t;
      break;
    }
  }
  return { current, next };
}

// ---- Statut d'une compétence ----------------------------------------------
export const isAcquired = (state, skillId) =>
  state.skillStatus[skillId] === 'known' || state.skillStatus[skillId] === 'mastered';

// Prérequis annoncés dans l'arbre qui ne sont pas encore acquis. Ce sont des
// CONSEILS : ils s'affichent, ils ne bloquent pas.
export const missingPrereqs = (state, skill) =>
  skill.prereqs.filter((p) => !isAcquired(state, p));

// Prérequis qui bloquent réellement (sécurité / physique — voir HARD_PREREQS).
export const missingHardPrereqs = (state, skill) =>
  (HARD_PREREQS[skill.id] || []).filter((p) => !isAcquired(state, p));

export const hardPrereqsMet = (state, skill) => missingHardPrereqs(state, skill).length === 0;

export function skillUiStatus(state, skill) {
  const st = state.skillStatus[skill.id];
  if (st) return st; // known | learning | mastered
  // Seuls les prérequis durs verrouillent : une compétence simplement « pas
  // dans l'ordre conseillé » reste déblocable, parce qu'on la travaille peut-être
  // déjà pour de vrai.
  return hardPrereqsMet(state, skill) ? 'available' : 'locked';
}

// Progression rangée en lignes (table skillProgress) : upsert par compétence.
export const upsertProgress = (arr, skillId, status) =>
  arr.some((r) => r.skillId === skillId)
    ? arr.map((r) => (r.skillId === skillId ? { ...r, status } : r))
    : [...arr, { id: uuid(), skillId, status }];

export const STATUS_LABELS = {
  locked: '🔒 Verrouillé',
  available: '✨ Déblocable',
  learning: '🎯 En cours',
  known: '✔ Acquis',
  mastered: '🏆 Maîtrisée',
};
