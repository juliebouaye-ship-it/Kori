import { useMemo } from 'react';
import { SKILLS, CATEGORIES } from '../skills-data.js';
import { localDate, daysBetween, frDate } from '../date-utils.js';
import { deriveInsights } from '../insights.js';
import {
  SKILL_BY_ID,
  CAT_BY_ID,
  placeBySlug,
  TRIGGER_BY_ID,
  CUP_BY_ID,
  isAcquired,
  sessionIsGestion,
  trainingMonthStats,
  tierFor,
} from '../domain.js';
import { SectionTitle, ProgressBar } from '../ui.jsx';
import { FirstsTimeline } from '../carnet.jsx';

// ============================================================
// Onglet PROGRÈS 📊
// ============================================================

// Minutes → « 45 min », « 1 h », « 3 h 20 ».
function formatMinutes(min) {
  if (!min) return '0 min';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m}` : `${h} h`;
}

export function StatsTab({ state, onAddFirst }) {
  const monthStats = trainingMonthStats(state.sessions, state.walks);
  const { current: tier, next: nextTier } = tierFor(state.lifetime);
  const tierRatio = nextTier ? (state.lifetime - tier.min) / (nextTier.min - tier.min) : 1;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStart = localDate(weekAgo);
  // Paliers : on ne compte QUE les compétences réellement commencées (en cours
  // ou maîtrisées). Si le total portait sur tout l'arbre, enrichir l'arbre
  // gonflerait le dénominateur et ferait « reculer » la progression alors que
  // rien n'est perdu — exactement l'effet démotivant qu'on veut éviter.
  const startedSkills = SKILLS.filter((s) => {
    const st = state.skillStatus[s.id];
    return st === 'learning' || st === 'mastered';
  });
  const totalPaliers = startedSkills.reduce((n, s) => n + s.paliers.length, 0);
  const paliersDoneCount = startedSkills.reduce(
    (n, s) => n + s.paliers.filter((p) => state.paliersDone[p.id]).length,
    0
  );

  // Les lieux vivent maintenant dans le carnet : l'annuaire se construit depuis
  // l'état plutôt que depuis une constante du code.
  const insights = useMemo(
    () => deriveInsights(state, { SKILL_BY_ID, LOC_BY_ID: placeBySlug(state), TRIGGER_BY_ID }),
    [state]
  );

  // Gestion vs entraînement : on ne compte que le VRAI entraînement dans la
  // progression de compétence (une séance rappel/laisse un jour de balade 🔴 = gestion).
  const trainingSessions = state.sessions.filter((s) => !sessionIsGestion(state.walks, s));
  const gestionCount = state.sessions.length - trainingSessions.length;
  const weekTraining = trainingSessions.filter((s) => s.date >= weekStart);

  const sessionsBySkill = useMemo(() => {
    const counts = {};
    for (const s of trainingSessions) counts[s.skillId] = (counts[s.skillId] ?? 0) + 1;
    return Object.entries(counts)
      .map(([id, count]) => ({ skill: SKILL_BY_ID[id], count }))
      .filter((e) => e.skill)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.sessions, state.walks]);

  const maxCount = Math.max(1, ...sessionsBySkill.map((e) => e.count));

  // Balades sur 14 jours : un jour est classé par sa pire sortie. On renvoie la
  // suite complète des 14 jours (du plus ancien à aujourd'hui) pour l'afficher
  // en bande — une case sans niveau = jour non noté, ce qui ne veut pas dire
  // qu'il n'y a pas eu de balade.
  const walkStats = useMemo(() => {
    const today = localDate();
    const byDay = {};
    for (const w of state.walks) {
      const diff = daysBetween(today, w.date);
      if (diff < 0 || diff > 13) continue;
      const rank = { vert: 1, jaune: 2, rouge: 3 };
      if (!byDay[w.date] || rank[w.level] > rank[byDay[w.date]]) byDay[w.date] = w.level;
    }
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const date = localDate(d);
      days.push({ date, level: byDay[date] ?? null });
    }
    // Durées : on compte les SORTIES (pas les jours), et uniquement celles qui
    // portent une durée. La durée est facultative — afficher un total comme s'il
    // couvrait toutes les balades donnerait un chiffre faux et décourageant.
    const inWindow = state.walks.filter((w) => {
      const diff = daysBetween(today, w.date);
      return diff >= 0 && diff <= 13;
    });
    const timed = inWindow.filter((w) => w.duration > 0);
    const minutes = timed.reduce((n, w) => n + w.duration, 0);

    const noted = days.filter((d) => d.level);
    return {
      days,
      total: noted.length,
      vert: noted.filter((d) => d.level === 'vert').length,
      jaune: noted.filter((d) => d.level === 'jaune').length,
      rouge: noted.filter((d) => d.level === 'rouge').length,
      walksInWindow: inWindow.length,
      timedCount: timed.length,
      minutes,
      average: timed.length ? Math.round(minutes / timed.length) : 0,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.walks]);

  return (
    <>
      <div className="tier-card">
        <div className="tier-row">
          <span className="tier-name">
            {tier.emoji} {tier.name}
          </span>
          <span className="tier-metrics">
            <span>{state.wallet} 🦴</span>
          </span>
        </div>
        <ProgressBar ratio={tierRatio} />
        <div className="tier-next">
          {nextTier
            ? `${state.lifetime} 🦴 cumulés · prochain palier à ${nextTier.min}`
            : `${state.lifetime} 🦴 cumulés · palier max atteint 👑`}
        </div>
      </div>

      {insights.length > 0 && (
        <div className="card">
          <h2>À remarquer 👀</h2>
          {insights.map((i) => (
            <div key={i.id} className={`insight insight-${i.tone}`}>
              {i.text}
            </div>
          ))}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-tile">
          <div className="stat-value">{monthStats.days}</div>
          <div className="stat-label">jours d’entraînement ce mois</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{weekTraining.length}</div>
          <div className="stat-label">séances sur 7 jours</div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">{trainingSessions.length}</div>
          <div className="stat-label">
            séances d’entraînement{gestionCount > 0 ? ` (+${gestionCount} gestion)` : ''}
          </div>
        </div>
        <div className="stat-tile">
          <div className="stat-value">
            {paliersDoneCount}
            {totalPaliers > 0 && (
              <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>/{totalPaliers}</span>
            )}
          </div>
          <div className="stat-label">
            paliers franchis{totalPaliers > 0 ? ' (compétences en cours)' : ''}
          </div>
        </div>
      </div>

      <div className="card">
        <SectionTitle
          title="Balades sur 14 jours 🚶"
          info="Une case par jour, la plus ancienne à gauche. La couleur reprend la pire sortie du jour. Une case vide veut dire « rien de noté ce jour-là » — pas « pas de balade »."
        />
        {walkStats.total === 0 ? (
          <p className="muted">Pas encore de balade notée.</p>
        ) : (
          <>
            <div className="walk-strip">
              {walkStats.days.map((d) => (
                <span
                  key={d.date}
                  className={`walk-cell walk-cell-${d.level ?? 'none'}`}
                  title={`${frDate(d.date)} · ${d.level ? CUP_BY_ID[d.level].short : 'non noté'}`}
                />
              ))}
            </div>
            <div className="walk-strip-legend">
              <span>🟢 {walkStats.vert}</span>
              <span>🟡 {walkStats.jaune}</span>
              <span>🔴 {walkStats.rouge}</span>
            </div>
            <p className="muted" style={{ marginTop: 6 }}>
              {walkStats.rouge === 0
                ? 'Aucune balade débordée sur 2 semaines. Beau travail 🐾'
                : `${walkStats.rouge} jour${walkStats.rouge > 1 ? 's' : ''} stacké${walkStats.rouge > 1 ? 's' : ''} sur 2 semaines. Le journal aide à repérer les lieux et créneaux à éviter.`}
            </p>

            {/* Temps de balade : uniquement sur les sorties qui portent une
                durée, et on le dit — sinon le total se lirait comme le temps
                total passé dehors, ce qu'il n'est pas. */}
            {walkStats.timedCount > 0 && (
              <div className="walk-time">
                <span className="wt-main">
                  ⏱️ {formatMinutes(walkStats.minutes)} · {formatMinutes(walkStats.average)} en
                  moyenne
                </span>
                <span className="wt-sub">
                  sur {walkStats.timedCount} sortie{walkStats.timedCount > 1 ? 's' : ''} minutée
                  {walkStats.timedCount > 1 ? 's' : ''}
                  {walkStats.walksInWindow > walkStats.timedCount &&
                    ` (${walkStats.walksInWindow - walkStats.timedCount} sans durée)`}
                </span>
              </div>
            )}
          </>
        )}
      </div>

      <div className="card">
        <h2>Maîtrise par catégorie</h2>
        {CATEGORIES.map((cat) => {
          const catSkills = SKILLS.filter((s) => s.category === cat.id);
          const acquired = catSkills.filter((s) => isAcquired(state, s.id)).length;
          return (
            <div className="bar-row" key={cat.id}>
              <span className="bar-label">
                {cat.icon} {cat.name}
              </span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(acquired / catSkills.length) * 100}%`,
                    background: cat.color,
                  }}
                />
              </div>
              <span className="bar-value">
                {acquired}/{catSkills.length}
              </span>
            </div>
          );
        })}
      </div>

      <div className="card">
        <SectionTitle
          title="Séances par compétence"
          info="Entraînement seul. Les séances de gestion des jours 🔴 sont mises de côté pour ne pas fausser la progression."
        />
        {sessionsBySkill.length === 0 ? (
          <p className="muted">Pas encore de séance notée.</p>
        ) : (
          sessionsBySkill.map(({ skill, count }) => (
            <div className="bar-row" key={skill.id}>
              <span className="bar-label">
                {skill.icon} {skill.name}
              </span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{
                    width: `${(count / maxCount) * 100}%`,
                    background: CAT_BY_ID[skill.category].color,
                  }}
                />
              </div>
              <span className="bar-value">{count}</span>
            </div>
          ))
        )}
      </div>

      <FirstsTimeline state={state} onAddFirst={onAddFirst} />
    </>
  );
}
