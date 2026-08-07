import { useState } from 'react';
import { SKILLS, CATEGORIES, DIAGS, METHODS } from '../skills-data.js';
import { cueFor } from '../domain.js';
import { MODES } from '../carnets.js';
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

// Les méthodes d'entraînement, écrites une fois et pointées par les paliers.
// Repliées par défaut : on vient les lire quand on veut comprendre, pas à
// chaque séance (l'écran Entraîner en donne déjà le résumé en une ligne).
function MethodsSection() {
  const [openId, setOpenId] = useState(null);
  return (
    <div className="card">
      <SectionTitle
        title="Les méthodes 🧰"
        info="Les mêmes façons de faire reviennent sur toutes les compétences. Les connaître permet d’inventer ses propres exercices, au-delà de ce que propose l’appli."
      />
      {METHODS.map((m) => {
        const open = openId === m.id;
        return (
          <div className="method-item" key={m.id}>
            <button
              type="button"
              className="method-row"
              onClick={() => setOpenId(open ? null : m.id)}
              aria-expanded={open}
            >
              <span className="method-name">{m.name}</span>
              <span className="method-tagline">{m.tagline}</span>
              <span className="s-chevron">{open ? '▲' : '▼'}</span>
            </button>
            {open && (
              <div className="method-detail">
                <p>{m.detail}</p>
                <p className="method-technical">On appelle ça : {m.technical}.</p>
                {m.sources?.length > 0 && (
                  <div className="src-row">
                    {m.sources.map((s) => (
                      <a key={s.url} href={s.url} target="_blank" rel="noreferrer">
                        {s.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Le carnet : qui y a accès, sous quelle forme, et comment en sortir.
function CarnetSection({ carnet, journalOnly, onSetMode, onSignOut }) {
  const [copied, setCopied] = useState(false);
  if (!carnet) return null;

  const share = async () => {
    try {
      await navigator.clipboard.writeText(carnet.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false); // pas de presse-papier : le code reste lisible à l'écran
    }
  };

  return (
    <div className="card">
      <SectionTitle
        title={`Le carnet de ${carnet.dogName}`}
        info="Le code d’invitation donne accès à ce carnet, en lecture et en écriture. Ne le partage qu’avec les personnes qui s’occupent du chien."
      />

      <div className="invite-row">
        <code className="invite-code">{carnet.inviteCode}</code>
        <button className="btn btn-ghost" onClick={share}>
          {copied ? 'Copié ✓' : 'Copier'}
        </button>
      </div>
      <p className="muted invite-hint">
        À donner à la personne qui partage le carnet : elle le saisit à la connexion.
      </p>

      <div className="mode-choice mode-choice-inline">
        {MODES.map((m) => (
          <button
            key={m.id}
            className={`mode-btn ${carnet.mode === m.id ? 'on' : ''}`}
            onClick={() => onSetMode?.(m.id)}
          >
            <span className="mode-label">{m.label}</span>
            <span className="mode-detail">{m.detail}</span>
          </button>
        ))}
      </div>
      {journalOnly && (
        <p className="muted invite-hint">
          En journal seul, l’arbre et l’entraînement sont masqués. Rien n’est perdu.
        </p>
      )}

      <button className="back-link" onClick={onSignOut}>
        Se déconnecter
      </button>
    </div>
  );
}

export function HelpTab({ state, onSetCue, carnet, journalOnly, onSetMode, onSignOut }) {
  const [activeDiag, setActiveDiag] = useState(null);
  const [choice, setChoice] = useState(null);

  if (!activeDiag) {
    return (
      <>
        <div className="card">
          <h2>Aide 💡</h2>
          <p className="muted">Les signaux, les points, et des mini-diagnostics.</p>
        </div>
        {!journalOnly && <AntisecheSection state={state} onSetCue={onSetCue} />}
        {!journalOnly && <MethodsSection />}
        {!journalOnly && <PointsCard />}
        <CarnetSection
          carnet={carnet}
          journalOnly={journalOnly}
          onSetMode={onSetMode}
          onSignOut={onSignOut}
        />
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
