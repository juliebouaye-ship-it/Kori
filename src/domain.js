// ============================================================
// Logique de domaine du Carnet de Kori (pure, sans React)
// ============================================================
// Annuaires (lookups) et dérivations partagés par plusieurs onglets, jusqu'ici
// mélangés au corps d'App.jsx. Tout est pur → testable au Node comme insights /
// tree-layout.

import {
  SKILLS,
  CATEGORIES,
  LOCATIONS,
  WALK_TRIGGERS,
  CUP_LEVELS,
  TIERS,
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
export const LOC_BY_ID = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]));
export const TRIGGER_BY_ID = Object.fromEntries(WALK_TRIGGERS.map((t) => [t.id, t]));
export const CUP_BY_ID = Object.fromEntries(CUP_LEVELS.map((c) => [c.id, c]));

// ---- État par défaut ------------------------------------------------------
export const DEFAULT_STATE = {
  onboarded: false,
  wallet: 12, // portefeuille dépensable (🦴) — baisse quand on débloque
  lifetime: 0, // total cumulé à vie — fait monter le niveau, ne baisse jamais
  skillProgress: [], // { id, skillId, status: 'known'|'learning'|'mastered' }
  palierDone: [], // { id, palierId, skillId, doneAt }
  sessions: [], // { id, date, skillId, palierId, rating, xp }
  walks: [], // { id, date, ts, level: 'vert'|'jaune'|'rouge', location, triggers: [], note }
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

export const prereqsMet = (state, skill) => skill.prereqs.every((p) => isAcquired(state, p));

export function skillUiStatus(state, skill) {
  const st = state.skillStatus[skill.id];
  if (st) return st; // known | learning | mastered
  return prereqsMet(state, skill) ? 'available' : 'locked';
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
