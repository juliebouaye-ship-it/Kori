import { useState } from 'react';
import { SKILLS, CATEGORIES, DIAGS, METHODS } from '../skills-data.js';
import { cueFor, personalize } from '../domain.js';
import { MODES, COAT_TYPES } from '../carnets.js';
import { CollapsibleCard, CollapsibleCategory } from '../ui.jsx';

// ============================================================
// Onglet AIDE 💡
// ============================================================
function PointsCard() {
  return (
    <CollapsibleCard title="Comment marchent les 🦴 ?">
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
    </CollapsibleCard>
  );
}

function AntisecheSection({ state, onSetCue }) {
  // La carte se replie déjà d'un cran au-dessus : plus besoin du bouton
  // « Voir / modifier » qui ajoutait un second niveau de dépliage.
  const total = SKILLS.length;
  const filledAll = SKILLS.filter((s) => {
    const c = cueFor(state, s);
    return c.word.trim() || c.gesture.trim();
  }).length;
  return (
    <CollapsibleCard title="Antisèche 🗣️" summary={`${filledAll}/${total}`}>
      <p className="muted card-intro">
        Le mot et le geste de chaque compétence, pour demander pareil à deux. Ce sont vos
        signaux, modifiables.
      </p>
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
    </CollapsibleCard>
  );
}

// Les méthodes d'entraînement, écrites une fois et pointées par les paliers.
// Repliées par défaut : on vient les lire quand on veut comprendre, pas à
// chaque séance (l'écran Entraîner en donne déjà le résumé en une ligne).
function MethodsSection() {
  const [openId, setOpenId] = useState(null);
  return (
    <CollapsibleCard title="Les méthodes 🧰" summary={`${METHODS.length}`}>
      <p className="muted card-intro">
        Les mêmes façons de faire reviennent sur toutes les compétences. Les connaître permet
        d’inventer ses propres exercices, au-delà de ce que propose l’appli.
      </p>
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
    </CollapsibleCard>
  );
}

// Suppression du carnet : irréversible et partagée (elle emporte les données
// de tout le monde qui a rejoint avec le code), donc pas un simple bouton —
// repliée par défaut, puis il faut retaper le nom du chien pour confirmer.
function DeleteCarnetZone({ carnet, onDeleteCarnet }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  if (!onDeleteCarnet) return null;

  if (!open) {
    return (
      <button type="button" className="back-link danger-link" onClick={() => setOpen(true)}>
        Supprimer ce carnet
      </button>
    );
  }

  return (
    <div className="danger-zone">
      <p className="danger-text">
        Supprime tout le carnet de {carnet.dogName} — balades, séances, progrès — pour tout le
        monde qui le partage. Irréversible.
      </p>
      <input
        className="auth-input"
        placeholder={`Tape « ${carnet.dogName} » pour confirmer`}
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
      />
      <div className="carnet-actions">
        <button
          type="button"
          className="btn btn-danger"
          disabled={busy || typed.trim() !== carnet.dogName}
          onClick={async () => {
            setBusy(true);
            await onDeleteCarnet(carnet.id);
          }}
        >
          {busy ? 'Suppression…' : 'Supprimer définitivement'}
        </button>
        <button
          type="button"
          className="back-link"
          onClick={() => {
            setOpen(false);
            setTyped('');
          }}
        >
          Annuler
        </button>
      </div>
    </div>
  );
}

// Le carnet : qui y a accès, sous quelle forme, et comment en sortir.
function CarnetSection({
  carnet,
  journalOnly,
  onSetMode,
  onSetCoatType,
  onSignOut,
  onAddCarnet,
  onJoinCarnet,
  onDeleteCarnet,
}) {
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
    <CollapsibleCard title={`Le carnet de ${carnet.dogName}`}>
      <p className="muted card-intro">
        Le code d’invitation donne accès à ce carnet, en lecture et en écriture. Ne le partage
        qu’avec les personnes qui s’occupent du chien.
      </p>

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

      {!journalOnly && (
        <>
          <p className="muted invite-hint" style={{ marginTop: 12 }}>
            Poil de {carnet.dogName} (optionnel, pour le conseil de brossage) :
          </p>
          <div className="mode-choice mode-choice-inline">
            {COAT_TYPES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`mode-btn ${carnet.coatType === c.id ? 'on' : ''}`}
                onClick={() => onSetCoatType?.(carnet.coatType === c.id ? null : c.id)}
              >
                <span className="mode-label">{c.label}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Seule entrée vers un second chien quand on n'en a qu'un : la barre du
          haut ne devient un sélecteur qu'à partir de deux carnets. */}
      <div className="carnet-actions">
        <button type="button" className="back-link" onClick={onAddCarnet}>
          ＋ Ajouter un chien
        </button>
        <button type="button" className="back-link" onClick={onJoinCarnet}>
          Rejoindre un carnet avec un code
        </button>
        <button type="button" className="back-link" onClick={onSignOut}>
          Se déconnecter
        </button>
      </div>
      <DeleteCarnetZone carnet={carnet} onDeleteCarnet={onDeleteCarnet} />
    </CollapsibleCard>
  );
}

export function HelpTab({
  state,
  onSetCue,
  carnet,
  journalOnly,
  onSetMode,
  onSetCoatType,
  onSignOut,
  onAddCarnet,
  onJoinCarnet,
  onDeleteCarnet,
}) {
  const [activeDiag, setActiveDiag] = useState(null);
  const [choice, setChoice] = useState(null);

  if (!activeDiag) {
    return (
      <>
        <div className="help-head">
          <h2>Réglages ⚙️</h2>
          <p className="muted">Tout est replié. Ouvre ce dont tu as besoin.</p>
        </div>

        {/* Ordre voulu : les points, le carnet, l'antisèche, les méthodes,
            puis les diagnostics rassemblés dans un seul bloc. */}
        {!journalOnly && <PointsCard />}
        <CarnetSection
          carnet={carnet}
          journalOnly={journalOnly}
          onSetMode={onSetMode}
          onSetCoatType={onSetCoatType}
          onSignOut={onSignOut}
          onAddCarnet={onAddCarnet}
          onJoinCarnet={onJoinCarnet}
          onDeleteCarnet={onDeleteCarnet}
        />
        {!journalOnly && <AntisecheSection state={state} onSetCue={onSetCue} />}
        {!journalOnly && <MethodsSection />}

        <CollapsibleCard title="Quand ça coince 🧭" summary={`${DIAGS.length}`}>
          <p className="muted card-intro">
            Des mini-diagnostics à lire quand une situation bloque. Jamais une case à cocher.
          </p>
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
        </CollapsibleCard>
      </>
    );
  }

  const selected = choice != null ? activeDiag.options[choice] : null;
  const withDog = (text) => personalize(text, state.dogName);

  return (
    <div className="card">
      <button className="back-link" onClick={() => setActiveDiag(null)}>
        ← Toute l’aide
      </button>
      <div className="diag-question">
        {activeDiag.icon} {withDog(activeDiag.question)}
      </div>
      {activeDiag.options.map((opt, i) => (
        <button
          key={i}
          className={`diag-option ${choice === i ? 'selected' : ''}`}
          onClick={() => setChoice(i)}
        >
          {withDog(opt.label)}
        </button>
      ))}

      {selected && (
        <>
          <div className="diag-verdict">{withDog(selected.verdict)}</div>
          <ul className="diag-actions">
            {selected.actions.map((a, i) => (
              <li key={i}>{withDog(a)}</li>
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
