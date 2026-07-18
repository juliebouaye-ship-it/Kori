import { useState } from 'react';
import { SKILLS, CATEGORIES, DIAGS } from '../skills-data.js';
import { cueFor } from '../domain.js';
import { SectionTitle, CollapsibleCategory } from '../ui.jsx';

// ============================================================
// Onglet AIDE 💡
// ============================================================
function PointsCard() {
  return (
    <div className="card">
      <h2>Comment marchent les 🦴 ?</h2>
      <ul className="points-list">
        <li>
          🎾 <strong>Noter une séance</strong> rapporte des friandises : Dur +2, Correct +4,
          Au top +6 🦴.
        </li>
        <li>
          🏺 Chaque 🦴 gagné tombe dans <strong>deux pots à la fois</strong> : le{' '}
          <strong>total cumulé</strong> (la barre de niveau en haut — elle ne redescend
          jamais) et le <strong>portefeuille</strong> (le compteur 🦴, à dépenser).
        </li>
        <li>
          🌱 <strong>Débloquer une compétence</strong> dans l’arbre coûte des 🦴 du
          portefeuille uniquement — ton niveau ne bouge pas.
        </li>
        <li>
          🏆 <strong>Maîtriser une compétence</strong> (tous ses paliers validés) verse un
          bonus dans les deux pots.
        </li>
        <li>
          ✔ Les compétences marquées <strong>acquises au bilan de départ</strong> ne coûtent
          rien et ne rapportent rien : le niveau reflète le travail fait ensemble, pas le
          passé.
        </li>
      </ul>
    </div>
  );
}

function AntisecheSection({ state, onSetCue }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card">
      <SectionTitle
        title="Antisèche 🗣️"
        info="Le mot et le geste de chaque compétence, pour demander pareil à deux. Ce sont vos signaux, modifiables."
      />
      {!open ? (
        <button className="btn btn-ghost btn-block" onClick={() => setOpen(true)}>
          Voir / modifier l’antisèche
        </button>
      ) : (
        <>
          {CATEGORIES.map((cat) => {
            const catSkills = SKILLS.filter((s) => s.category === cat.id);
            const filled = catSkills.filter((s) => {
              const c = cueFor(state, s);
              return c.word.trim() || c.gesture.trim();
            }).length;
            return (
              <CollapsibleCategory
                key={cat.id}
                icon={cat.icon}
                name={cat.name}
                color={cat.color}
                summary={`${filled}/${catSkills.length} renseignés`}
                defaultOpen={false}
              >
                {catSkills.map((s) => {
                  const c = cueFor(state, s);
                  return (
                    <div className="cue-row" key={s.id} style={{ '--cat-color': cat.color }}>
                      <div className="cue-skill">
                        {s.icon} {s.name}
                      </div>
                      <label className="cue-field">
                        <span>Mot</span>
                        <input
                          className="cue-input"
                          value={c.word}
                          placeholder="ex. Ici"
                          onChange={(e) => onSetCue(s.id, { word: e.target.value })}
                        />
                      </label>
                      <label className="cue-field">
                        <span>Geste</span>
                        <input
                          className="cue-input"
                          value={c.gesture}
                          placeholder="à définir ensemble"
                          onChange={(e) => onSetCue(s.id, { gesture: e.target.value })}
                        />
                      </label>
                    </div>
                  );
                })}
              </CollapsibleCategory>
            );
          })}
          <button className="back-link" onClick={() => setOpen(false)}>
            Replier
          </button>
        </>
      )}
    </div>
  );
}

export function HelpTab({ state, onSetCue }) {
  const [activeDiag, setActiveDiag] = useState(null);
  const [choice, setChoice] = useState(null);

  if (!activeDiag) {
    return (
      <>
        <div className="card">
          <h2>Aide 💡</h2>
          <p className="muted">Les signaux, les points, et des mini-diagnostics.</p>
        </div>
        <AntisecheSection state={state} onSetCue={onSetCue} />
        <PointsCard />
        {DIAGS.map((d) => (
          <button
            key={d.id}
            className="diag-card"
            onClick={() => {
              setActiveDiag(d);
              setChoice(null);
            }}
          >
            <span className="d-icon">{d.icon}</span>
            <span>
              <span className="d-title">{d.title}</span>
              <br />
              <span className="d-sub">{d.subtitle}</span>
            </span>
          </button>
        ))}
      </>
    );
  }

  const selected = choice != null ? activeDiag.options[choice] : null;

  return (
    <div className="card">
      <button className="back-link" onClick={() => setActiveDiag(null)}>
        ← Toute l’aide
      </button>
      <div className="diag-question">
        {activeDiag.icon} {activeDiag.question}
      </div>
      {activeDiag.options.map((opt, i) => (
        <button
          key={i}
          className={`diag-option ${choice === i ? 'selected' : ''}`}
          onClick={() => setChoice(i)}
        >
          {opt.label}
        </button>
      ))}

      {selected && (
        <>
          <div className="diag-verdict">{selected.verdict}</div>
          <ul className="diag-actions">
            {selected.actions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          <div className="diag-sources">
            <div className="src-title">Sources</div>
            {selected.sources.map((s, i) => (
              <a key={i} href={s.url} target="_blank" rel="noreferrer">
                ↗ {s.label}
              </a>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
