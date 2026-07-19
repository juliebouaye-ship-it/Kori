import { useState } from 'react';
import { SKILLS, CATEGORIES, GATES } from '../skills-data.js';
import {
  SKILL_BY_ID,
  CAT_BY_ID,
  isAcquired,
  skillUiStatus,
  STATUS_LABELS,
} from '../domain.js';

// ============================================================
// Onglet ARBRE 🌱
// ============================================================
function SkillCard({ state, skill, wallet, onUnlock }) {
  const [open, setOpen] = useState(false);
  const status = skillUiStatus(state, skill);
  const cat = CAT_BY_ID[skill.category];
  const doneCount = skill.paliers.filter((p) => state.paliersDone[p.id]).length;

  return (
    <div className="skill-card" style={{ '--cat-color': cat.color }}>
      <button
        type="button"
        className="skill-row"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="s-icon">{skill.icon}</span>
        <span className="s-name">{skill.name}</span>
        <span className={`status-chip status-${status}`}>{STATUS_LABELS[status]}</span>
        <span className="s-chevron">{open ? '▲' : '▼'}</span>
      </button>

      {/* Action / info essentielle, toujours visible selon le statut */}
      {status === 'available' && (
        <div className="unlock-row">
          <button
            className="btn btn-primary"
            disabled={wallet < skill.cost}
            onClick={() => onUnlock(skill)}
          >
            Débloquer · {skill.cost} 🦴
          </button>
          {wallet < skill.cost && (
            <span className="lock-reason">Encore {skill.cost - wallet} 🦴</span>
          )}
        </div>
      )}
      {status === 'learning' && (
        <div className="skill-mini">
          <span>
            {doneCount}/{skill.paliers.length} paliers
          </span>
          <span>maîtrise +{skill.bonus} 🦴</span>
        </div>
      )}
      {status === 'locked' && (
        <p className="lock-reason" style={{ marginTop: 6 }}>
          🔒 D’abord :{' '}
          {skill.prereqs
            .filter((p) => !isAcquired(state, p))
            .map((p) => SKILL_BY_ID[p].name)
            .join(', ')}
        </p>
      )}

      {open && (
        <div className="skill-details">
          <p className="skill-desc">{skill.description}</p>
          <p className="skill-purpose">{skill.purpose}</p>
          {skill.note && <p className="skill-note">{skill.note}</p>}
          {skill.gate && GATES[skill.gate] && (
            <p className="skill-gate">
              <strong>⚕️ {GATES[skill.gate].label}</strong> {GATES[skill.gate].detail}
            </p>
          )}
          <div className="skill-meta">
            <span>Diff. {'⭐'.repeat(skill.difficulty)}</span>
            <span>Coût {skill.cost} 🦴</span>
            <span>Bonus {skill.bonus} 🦴</span>
          </div>

          {skill.prereqs.length > 0 && (
            <div className="prereq-row">
              {skill.prereqs.map((p) => (
                <span key={p} className={`prereq-chip ${isAcquired(state, p) ? 'ok' : ''}`}>
                  {isAcquired(state, p) ? '✓' : '·'} {SKILL_BY_ID[p].name}
                </span>
              ))}
            </div>
          )}

          {status === 'known' && (
            <p className="muted" style={{ marginTop: 8 }}>
              Acquise au bilan de départ : ni coût, ni bonus.
            </p>
          )}

          {(status === 'learning' || status === 'mastered') && (
            <ul className="palier-list">
              {skill.paliers.map((p) => {
                const done = !!state.paliersDone[p.id];
                return (
                  <li key={p.id}>
                    <span className="p-check">{done ? '✅' : '⬜'}</span>
                    <span className={done ? 'p-done' : ''}>
                      <strong>{p.label}</strong> — {p.criterion}
                      {p.gate && GATES[p.gate] && (
                        <span className="p-gate"> ⚕️ {GATES[p.gate].label}</span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// Grille de pictos par catégorie (remplace l'arbre visuel, jugé peu lisible).
// On garde les jolies tuiles-pictos ; tap sur une tuile → détail (SkillCard).
function SkillPictoGrid({ state, onSelect }) {
  return (
    <>
      {CATEGORIES.map((cat) => {
        const catSkills = SKILLS.filter((s) => s.category === cat.id);
        if (!catSkills.length) return null;
        const acquired = catSkills.filter((s) => isAcquired(state, s.id)).length;
        return (
          <section key={cat.id} className="picto-cat">
            <header className="picto-cat-head" style={{ '--cat-color': cat.color }}>
              <span>
                {cat.icon} {cat.name}
              </span>
              <span className="picto-cat-count">
                {acquired}/{catSkills.length}
              </span>
            </header>
            <div className="picto-grid">
              {catSkills.map((skill) => {
                const status = skillUiStatus(state, skill);
                return (
                  <button
                    key={skill.id}
                    type="button"
                    className={`picto-tile status-${status}`}
                    onClick={() => onSelect(skill)}
                  >
                    <span className="picto-tile-icon">{skill.icon}</span>
                    <span className="picto-tile-name">{skill.name}</span>
                    {status === 'locked' && <span className="picto-tile-mark">🔒</span>}
                    {status === 'mastered' && <span className="picto-tile-mark">🏆</span>}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}

export function TreeTab({ state, onUnlock, reopenOnboarding }) {
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const filtered = q
    ? SKILLS.filter(
        (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      )
    : null;

  return (
    <>
      <div className="wallet-bar">
        <span className="wallet-pill">{state.wallet} 🦴 à dépenser</span>
        <button className="back-link" onClick={reopenOnboarding}>
          Refaire le bilan de départ
        </button>
      </div>
      <input
        className="search-input"
        placeholder="🔎 Chercher une compétence…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filtered ? (
        filtered.length === 0 ? (
          <p className="muted">Aucune compétence ne correspond à « {search} ».</p>
        ) : (
          filtered.map((s) => (
            <div key={s.id} style={{ marginBottom: 8 }}>
              <SkillCard state={state} skill={s} wallet={state.wallet} onUnlock={onUnlock} />
            </div>
          ))
        )
      ) : (
        <SkillPictoGrid state={state} onSelect={setSelected} />
      )}

      {selected && (
        <div className="tree-sheet-backdrop" onClick={() => setSelected(null)}>
          <div className="tree-sheet" onClick={(e) => e.stopPropagation()}>
            <button
              className="tree-sheet-close"
              onClick={() => setSelected(null)}
              aria-label="Fermer"
            >
              ✕
            </button>
            <SkillCard state={state} skill={selected} wallet={state.wallet} onUnlock={onUnlock} />
          </div>
        </div>
      )}
    </>
  );
}
