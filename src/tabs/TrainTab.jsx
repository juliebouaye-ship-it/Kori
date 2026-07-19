import { useState } from 'react';
import { SKILLS, CATEGORIES, RATINGS, GATES } from '../skills-data.js';
import { localDate } from '../date-utils.js';
import { isBaladeSkill, dayHasRedWalk } from '../domain.js';
import { InfoTip, SectionTitle } from '../ui.jsx';
import { DecompBanner, HealthDueBanner } from './banners.jsx';

// ============================================================
// Onglet ENTRAÎNER 🎾
// ============================================================
export function TrainTab({ state, onLogSession, onPalierDone, goToTree, goToHelp, goToWalk, decomp }) {
  const trainable = SKILLS.filter((s) => {
    const st = state.skillStatus[s.id];
    return st === 'learning' || st === 'mastered';
  });
  const [selectedId, setSelectedId] = useState(trainable[0]?.id ?? null);
  const skill = trainable.find((s) => s.id === selectedId) ?? trainable[0] ?? null;

  const todaySessions = state.sessions.filter((s) => s.date === localDate());

  if (trainable.length === 0) {
    return (
      <>
        {decomp.active && <DecompBanner decomp={decomp} compact />}
      <div className="card empty-state">
        <div className="big">🌱</div>
        <h2>Aucune compétence en cours</h2>
        <p className="muted">Débloque une première compétence dans l’arbre.</p>
        <button className="btn btn-primary btn-block" onClick={goToTree}>
          Ouvrir l’arbre 🌱
        </button>
      </div>
      </>
    );
  }

  const gestionToday = isBaladeSkill(skill.id) && dayHasRedWalk(state.walks, localDate());

  const mastered = state.skillStatus[skill.id] === 'mastered';
  const currentPalier = mastered
    ? skill.paliers[skill.paliers.length - 1]
    : skill.paliers.find((p) => !state.paliersDone[p.id]);
  const palierIndex = skill.paliers.indexOf(currentPalier);

  // coup de pouce anti-lassitude : 3 dernières séances de ce palier notées « Dur »
  const lastThree = state.sessions.filter((s) => s.palierId === currentPalier.id).slice(-3);
  const stuck = lastThree.length === 3 && lastThree.every((s) => s.rating === 'dur');

  return (
    <>
      {decomp.active && <DecompBanner decomp={decomp} compact />}
      <HealthDueBanner state={state} goToWalk={goToWalk} />
      <div className="card">
        <SectionTitle
          title="Séance du jour 🎾"
          info="Choisis la compétence, puis note comment ça s’est passé. 5 à 10 minutes suffisent."
        />
        {gestionToday && (
          <div className="gestion-line">
            <span className="tag-inline">🛡️ Gestion aujourd’hui</span>
            <InfoTip text="Balade débordée aujourd’hui : les séances de rappel et laisse comptent comme gestion, pas dans la progression. Elles rapportent quand même des 🦴." />
          </div>
        )}
        {(() => {
          // Regroupe les chips par catégorie (ordre de CATEGORIES) : le label
          // n'apparaît que si plusieurs catégories sont en cours, pour garder le
          // sélecteur lisible quand les compétences se multiplient.
          const groups = CATEGORIES.map((cat) => ({
            cat,
            skills: trainable.filter((s) => s.category === cat.id),
          })).filter((g) => g.skills.length > 0);
          const showLabels = groups.length > 1;
          return groups.map(({ cat, skills }) => (
            <div className="chips-group" key={cat.id}>
              {showLabels && (
                <div className="chips-cat-label" style={{ '--cat-color': cat.color }}>
                  {cat.icon} {cat.name}
                </div>
              )}
              <div className="skill-chips">
                {skills.map((s) => (
                  <button
                    key={s.id}
                    className={`chip ${s.id === skill.id ? 'active' : ''}`}
                    onClick={() => setSelectedId(s.id)}
                  >
                    {s.icon} {s.name}
                    {state.skillStatus[s.id] === 'mastered' && (
                      <span className="chip-tag">entretien</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ));
        })()}

        <div className="palier-box">
          <div className="palier-step">
            {mastered
              ? 'Entretien — compétence maîtrisée 🏆'
              : `Palier ${palierIndex + 1} / ${skill.paliers.length}`}
          </div>
          <div className="palier-label">{currentPalier.label}</div>
          <div className="palier-criterion">Acquis quand : {currentPalier.criterion}</div>
          {currentPalier.gate && GATES[currentPalier.gate] && (
            <div className="palier-gate">
              ⚕️ {GATES[currentPalier.gate].label}
              <InfoTip text={GATES[currentPalier.gate].detail} />
            </div>
          )}
        </div>

        <div className="rating-row">
          {RATINGS.map((r) => (
            <button
              key={r.id}
              className="rating-btn"
              onClick={() => onLogSession(skill, currentPalier, r)}
            >
              <span className="r-emoji">{r.emoji}</span>
              <span className="r-label">{r.label}</span>
              <span className="r-xp">+{r.xp} 🦴</span>
            </button>
          ))}
        </div>

        {stuck && (
          <div className="nudge">
            💡 Trois séances « Dur » d’affilée sur ce palier — c’est le moment de découper
            l’exercice, pas de forcer.{' '}
            <button className="back-link" onClick={goToHelp}>
              Voir « Je stagne » dans l’Aide →
            </button>
          </div>
        )}

        {!mastered && (
          <button
            className="btn btn-sage btn-block"
            onClick={() => onPalierDone(skill, currentPalier)}
          >
            ✓ Palier validé
          </button>
        )}
        <p className="today-line">
          {todaySessions.length === 0
            ? 'Rien de noté aujourd’hui.'
            : `${todaySessions.length} séance${todaySessions.length > 1 ? 's' : ''} aujourd’hui 🐾`}
        </p>
        <button className="back-link" onClick={goToWalk}>
          🚶 Noter la balade →
        </button>
      </div>
    </>
  );
}
