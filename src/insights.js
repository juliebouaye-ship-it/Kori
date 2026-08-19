// ============================================================
// Insights automatiques — repère des patterns dans les données NOTÉES.
// Principe anti-lassitude : on ne parle que de ce qui a été saisi, avec
// bienveillance, et on se tait s'il n'y a pas assez de données.
// Fonctions pures (aucune dépendance React) → testables au Node.
// ============================================================

import { localDate, daysBetween } from './date-utils.js';

// Nb de balades 🟢 consécutives les plus récentes (par sortie notée, en
// tolérant les jours non notés — ne pas noter ≠ ne pas avoir promené).
function currentGreenRun(walks) {
  const sorted = [...walks].sort(
    (a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0)
  );
  let run = 0;
  for (const w of sorted) {
    if (w.level === 'vert') run += 1;
    else break;
  }
  return run;
}

/**
 * @param {object} state  { walks, sessions, skillStatus }
 * @param {object} deps   { SKILL_BY_ID, LOC_BY_ID, TRIGGER_BY_ID }
 * @returns {Array<{id,tone,text}>}  tone: 'info' | 'warn' | 'win'
 */
export function deriveInsights(state, deps, today = localDate()) {
  const { walks = [], sessions = [], skillStatus = {}, dogName = 'Kori' } = state;
  const { SKILL_BY_ID = {}, LOC_BY_ID = {}, TRIGGER_BY_ID = {} } = deps || {};
  const out = [];

  // ---- 1. Lieu à risque : ≥3 sorties notées à un lieu, taux 🔴 ≥ 50 % ----
  const byLoc = {};
  for (const w of walks) {
    if (!w.location) continue;
    (byLoc[w.location] ||= { total: 0, red: 0 });
    byLoc[w.location].total += 1;
    if (w.level === 'rouge') byLoc[w.location].red += 1;
  }
  for (const [loc, { total, red }] of Object.entries(byLoc)) {
    if (total >= 3 && red / total >= 0.5) {
      const name = LOC_BY_ID[loc]?.label ?? loc;
      out.push({
        id: `loc-${loc}`,
        tone: 'warn',
        text: `${name} : ${red} sortie${red > 1 ? 's' : ''} débordée${red > 1 ? 's' : ''} sur ${total} notées. Un autre créneau ou un autre itinéraire pourrait aider ${dogName} à rester sous son seuil.`,
      });
    }
  }

  // ---- 2. Déclencheur récurrent sur les jours 🔴 ----
  const trigCount = {};
  let redWalks = 0;
  for (const w of walks) {
    if (w.level !== 'rouge') continue;
    redWalks += 1;
    for (const t of w.triggers || []) trigCount[t] = (trigCount[t] || 0) + 1;
  }
  if (redWalks >= 3) {
    // « Autre » est un fourre-tout (pas un vrai déclencheur identifié) : le
    // signaler comme « à anticiper en priorité » ne veut rien dire de concret.
    const top = Object.entries(trigCount)
      .filter(([id]) => id !== 'autre')
      .sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) {
      const name = TRIGGER_BY_ID[top[0]]?.label ?? top[0];
      out.push({
        id: `trig-${top[0]}`,
        tone: 'info',
        text: `« ${name} » revient dans ${top[1]} de tes balades débordées. C'est sans doute le déclencheur à anticiper en priorité.`,
      });
    }
  }

  // ---- 3. Encouragement : série de balades 🟢 récentes ----
  const greenRun = currentGreenRun(walks);
  if (greenRun >= 3) {
    out.push({
      id: 'green-run',
      tone: 'win',
      text: `${greenRun} balades sereines 🟢 d'affilée — ${dogName} se régule de mieux en mieux. Beau travail 🎉`,
    });
  }

  // ---- 4. Entraînement en veille (soft, jamais culpabilisant) ----
  // On ne le dit que s'il y a déjà eu au moins une séance notée (sinon silence).
  if (sessions.length > 0) {
    const learning = Object.keys(skillStatus).filter((id) => skillStatus[id] === 'learning');
    const lastBySkill = {};
    for (const s of sessions) {
      if (!lastBySkill[s.skillId] || s.date > lastBySkill[s.skillId]) lastBySkill[s.skillId] = s.date;
    }
    const dormant = learning
      .filter((id) => lastBySkill[id] && daysBetween(today, lastBySkill[id]) >= 10)
      .map((id) => SKILL_BY_ID[id]?.name)
      .filter(Boolean);
    if (dormant.length) {
      out.push({
        id: 'dormant',
        tone: 'info',
        text: `Ça fait un moment que « ${dormant[0]} » n'a pas été noté — si l'envie est là, une mini-séance suffit à relancer.`,
      });
    }
  }

  return out;
}
