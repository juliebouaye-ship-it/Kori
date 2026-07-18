import { useMemo } from 'react';
import { SKILLS, CATEGORIES } from '../skills-data.js';
import { localDate, daysBetween } from '../date-utils.js';
import { deriveInsights } from '../insights.js';
import {
  SKILL_BY_ID,
  CAT_BY_ID,
  LOC_BY_ID,
  TRIGGER_BY_ID,
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
export function StatsTab({ state, onAddFirst }) {
  const monthStats = trainingMonthStats(state.sessions, state.walks);
  const { current: tier, next: nextTier } = tierFor(state.lifetime);
  const tierRatio = nextTier ? (state.lifetime - tier.min) / (nextTier.min - tier.min) : 1;
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekStart = localDate(weekAgo);
  const paliersDoneCount = Object.keys(state.paliersDone).length;
  const totalPaliers = SKILLS.reduce((n, s) => n + s.paliers.length, 0);

  const insights = useMemo(
    () => deriveInsights(state, { SKILL_BY_ID, LOC_BY_ID, TRIGGER_BY_ID }),
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

  // Balades sur 14 jours : un jour est classé par sa pire sortie.
  const walkStats = useMemo(() => {
    const today = localDate();
    const byDay = {};
    for (const w of state.walks) {
      const diff = daysBetween(today, w.date);
      if (diff < 0 || diff > 13) continue;
      const rank = { vert: 1, jaune: 2, rouge: 3 };
      if (!byDay[w.date] || rank[w.level] > rank[byDay[w.date]]) byDay[w.date] = w.level;
    }
    const days = Object.values(byDay);
    return {
      total: days.length,
      vert: days.filter((l) => l === 'vert').length,
      jaune: days.filter((l) => l === 'jaune').length,
      rouge: days.filter((l) => l === 'rouge').length,
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
            <span style={{ fontSize: 14, color: 'var(--ink-soft)' }}>/{totalPaliers}</span>
          </div>
          <div className="stat-label">paliers franchis</div>
        </div>
      </div>

      <div className="card">
        <h2>Balades sur 14 jours 🚶</h2>
        {walkStats.total === 0 ? (
          <p className="muted">Pas encore de balade notée.</p>
        ) : (
          <>
            <div className="walk-stat-row">
              <span className="ws-cell">
                <span className="ws-num" style={{ color: '#5f7046' }}>
                  {walkStats.vert}
                </span>
                <span className="ws-lbl">🟢 sereins</span>
              </span>
              <span className="ws-cell">
                <span className="ws-num" style={{ color: '#a97e21' }}>
                  {walkStats.jaune}
                </span>
                <span className="ws-lbl">🟡 chargés</span>
              </span>
              <span className="ws-cell">
                <span className="ws-num" style={{ color: 'var(--danger)' }}>
                  {walkStats.rouge}
                </span>
                <span className="ws-lbl">🔴 stackés</span>
              </span>
            </div>
            <p className="muted" style={{ marginTop: 6 }}>
              {walkStats.rouge === 0
                ? 'Aucune balade débordée sur 2 semaines. Beau travail 🐾'
                : `${walkStats.rouge} jour${walkStats.rouge > 1 ? 's' : ''} stacké${walkStats.rouge > 1 ? 's' : ''} sur 2 semaines. Le journal aide à repérer les lieux et créneaux à éviter.`}
            </p>
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
