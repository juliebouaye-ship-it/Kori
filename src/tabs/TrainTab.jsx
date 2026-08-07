import { useState } from 'react';
import { SKILLS, CATEGORIES, RATINGS, GATES, QUICK_XP, METHOD_BY_ID } from '../skills-data.js';
import { localDate } from '../date-utils.js';
import { isBaladeSkill, dayHasRedWalk } from '../domain.js';
import { InfoTip, SectionTitle } from '../ui.jsx';
import { DecompBanner, HealthDueBanner } from './banners.jsx';

// ============================================================
// Onglet ENTRAÎNER 🎾
// ============================================================
// Panneau « Tour rapide » : on coche les compétences vérifiées en passant,
// on valide une fois. Replié par défaut pour ne pas alourdir l'écran.
function QuickRound({ trainable, onLogQuickRound }) {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState([]);
  const toggle = (id) =>
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  if (!open) {
    return (
      <button className="btn btn-ghost btn-block quick-open" onClick={() => setOpen(true)}>
        ⚡ Tour rapide
      </button>
    );
  }
  return (
    <div className="quick-box">
      <SectionTitle
        title="Tour rapide ⚡"
        info="Quelques ordres demandés en passant, juste pour voir si ça tient. Ça rapporte des 🦴 et ça compte comme un jour d’entraînement, mais ça ne valide aucun palier."
      />
      <div className="skill-chips">
        {trainable.map((s) => (
          <button
            key={s.id}
            className={`chip ${picked.includes(s.id) ? 'active' : ''}`}
            onClick={() => toggle(s.id)}
          >
            {s.icon} {s.name}
          </button>
        ))}
      </div>
      <div className="quick-actions">
        <button
          className="btn btn-primary"
          disabled={picked.length === 0}
          onClick={() => {
            onLogQuickRound(picked);
            setPicked([]);
            setOpen(false);
          }}
        >
          Enregistrer{picked.length > 0 ? ` · +${picked.length * QUICK_XP} 🦴` : ''}
        </button>
        <button
          className="back-link"
          onClick={() => {
            setPicked([]);
            setOpen(false);
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

export function TrainTab({
  state,
  onLogSession,
  onLogQuickRound,
  onPalierDone,
  goToTree,
  goToHelp,
  goToWalk,
  decomp,
  onDismissDecomp,
}) {
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
        {decomp.active && <DecompBanner decomp={decomp} compact onDismiss={onDismissDecomp} />}
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
  // Une compétence maîtrisée n'a plus de palier « en cours » : on n'en désigne
  // aucun, sinon l'écran se lit comme une leçon inachevée (le dernier palier
  // s'affichait avec son critère, comme s'il restait à valider).
  const currentPalier = mastered
    ? null
    : skill.paliers.find((p) => !state.paliersDone[p.id]);
  const palierIndex = mastered ? -1 : skill.paliers.indexOf(currentPalier);

  // En entretien, on propose un palier à revoir — il tourne d'un jour à l'autre
  // pour ne pas toujours retester la même chose. Simple suggestion, rien à cocher.
  const revisionPalier = mastered
    ? skill.paliers[new Date().getDate() % skill.paliers.length]
    : null;

  // coup de pouce anti-lassitude : 3 dernières séances de ce palier notées « Dur ».
  // Sans objet en entretien : on ne « stagne » pas sur une compétence acquise.
  const lastThree = mastered
    ? []
    : state.sessions.filter((s) => s.palierId === currentPalier.id).slice(-3);
  const stuck = lastThree.length === 3 && lastThree.every((s) => s.rating === 'dur');

  return (
    <>
      {decomp.active && <DecompBanner decomp={decomp} compact onDismiss={onDismissDecomp} />}
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
                      <span className="chip-tag" title="Maîtrisée — en entretien">
                        🏆
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ));
        })()}

        {mastered ? (
          <div className="revision-box">
            <div className="revision-head">
              <span className="revision-badge">🏆 Maîtrisée</span>
              <InfoTip text="Tous les paliers sont franchis : il n’y a plus rien à valider ici. On la redemande de temps en temps pour qu’elle tienne, et ça rapporte quand même des 🦴." />
            </div>
            <div className="revision-line">Rien à finir — on entretient, c’est tout.</div>
            <div className="revision-hint">
              À revoir si tu veux : <em>{revisionPalier.label}</em>
            </div>
          </div>
        ) : (
          <div className="palier-box">
            <div className="palier-step">
              Palier {palierIndex + 1} / {skill.paliers.length}
            </div>
            <div className="palier-label">{currentPalier.label}</div>
            <div className="palier-criterion">Acquis quand : {currentPalier.criterion}</div>
            {currentPalier.how && METHOD_BY_ID[currentPalier.how.method] && (
              <div className="how-box">
                <div className="how-head">
                  <span className="how-label">Ce soir</span>
                  <span className="how-method">{METHOD_BY_ID[currentPalier.how.method].name}</span>
                  <InfoTip text={METHOD_BY_ID[currentPalier.how.method].detail} />
                </div>
                <div className="how-tagline">{METHOD_BY_ID[currentPalier.how.method].tagline}</div>
                <div className="how-setup">{currentPalier.how.setup}</div>
                <div className="how-pitfall">Le piège : {currentPalier.how.pitfall}</div>
              </div>
            )}
            {currentPalier.gate && GATES[currentPalier.gate] && (
              <div className="palier-gate">
                ⚕️ {GATES[currentPalier.gate].label}
                <InfoTip text={GATES[currentPalier.gate].detail} />
              </div>
            )}
          </div>
        )}

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
      <QuickRound trainable={trainable} onLogQuickRound={onLogQuickRound} />
    </>
  );
}
