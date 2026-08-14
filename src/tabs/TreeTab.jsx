import { useState } from 'react';
import { SKILLS, CATEGORIES, GATES, SUBCATEGORIES } from '../skills-data.js';
import {
  SKILL_BY_ID,
  CAT_BY_ID,
  isAcquired,
  skillUiStatus,
  missingPrereqs,
  missingHardPrereqs,
  STATUS_LABELS,
  personalize,
} from '../domain.js';
import { CollapsibleCategory } from '../ui.jsx';

// ============================================================
// Onglet ARBRE 🌱
// ============================================================
function SkillCard({ state, skill, wallet, onUnlock }) {
  const [open, setOpen] = useState(false);
  const status = skillUiStatus(state, skill);
  const cat = CAT_BY_ID[skill.category];
  const doneCount = skill.paliers.filter((p) => state.paliersDone[p.id]).length;
  const advised = missingPrereqs(state, skill);
  const withDog = (text) => personalize(text, state.dogName);
  // Conseil de brossage : seulement si le poil a été renseigné dans Réglages
  // (jamais de valeur par défaut inventée — voir setCoatType).
  const coatTip = skill.coatTips && state.coatType ? skill.coatTips[state.coatType] : null;

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
        <>
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
          {/* Ordre conseillé, pas imposé : on peut très bien avoir commencé
              celle-ci avant. */}
          {advised.length > 0 && (
            <p className="prereq-advice">
              💡 On conseille de voir {advised.map((p) => SKILL_BY_ID[p].name).join(', ')} d’abord.
            </p>
          )}
        </>
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
          🔒 Pour son corps, d’abord :{' '}
          {missingHardPrereqs(state, skill)
            .map((p) => SKILL_BY_ID[p].name)
            .join(', ')}
        </p>
      )}

      {open && (
        <div className="skill-details">
          <p className="skill-desc">{withDog(skill.description)}</p>
          <p className="skill-purpose">{withDog(skill.purpose)}</p>
          {skill.note && <p className="skill-note">{withDog(skill.note)}</p>}
          {coatTip && <p className="skill-note">{coatTip}</p>}
          {skill.gate && GATES[skill.gate] && (
            <p className="skill-gate">
              <strong>⚕️ {GATES[skill.gate].label}</strong> {withDog(GATES[skill.gate].detail)}
            </p>
          )}
          <div className="skill-meta">
            <span>Diff. {'⭐'.repeat(skill.difficulty)}</span>
            <span>Coût {skill.cost} 🦴</span>
            <span>Bonus {skill.bonus} 🦴</span>
          </div>

          {skill.prereqs.length > 0 && (
            <>
              <div className="prereq-label">Ordre conseillé</div>
              <div className="prereq-row">
                {skill.prereqs.map((p) => (
                  <span key={p} className={`prereq-chip ${isAcquired(state, p) ? 'ok' : ''}`}>
                    {isAcquired(state, p) ? '✓' : '·'} {SKILL_BY_ID[p].name}
                  </span>
                ))}
              </div>
            </>
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
                      <strong>{p.label}</strong> — {withDog(p.criterion)}
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

function PictoTiles({ state, skills, onSelect }) {
  return (
    <div className="picto-grid">
      {skills.map((skill) => {
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
  );
}

// Grille de pictos par catégorie (remplace l'arbre visuel, jugé peu lisible).
// On garde les jolies tuiles-pictos ; tap sur une tuile → détail (SkillCard).
// Catégories repliables : avec 50+ compétences, tout déplié fait défiler très
// long. Ouverte par défaut seulement si quelque chose s'y passe déjà (une
// compétence en cours, acquise ou maîtrisée) — sinon repliée, à un tap près.
function SkillPictoGrid({ state, onSelect }) {
  return (
    <>
      {CATEGORIES.map((cat) => {
        const catSkills = SKILLS.filter((s) => s.category === cat.id);
        if (!catSkills.length) return null;
        const acquired = catSkills.filter((s) => isAcquired(state, s.id)).length;
        const defaultOpen = catSkills.some((s) =>
          ['learning', 'known', 'mastered'].includes(skillUiStatus(state, s)),
        );
        // Sous-groupes (seul « Sport canin » en a pour l'instant) : dans l'ordre
        // de SUBCATEGORIES, puis les compétences sans sous-catégorie à la fin.
        const subIds = Object.keys(SUBCATEGORIES).filter((id) =>
          catSkills.some((s) => s.subcategory === id),
        );
        const rest = catSkills.filter((s) => !s.subcategory);

        return (
          <CollapsibleCategory
            key={cat.id}
            icon={cat.icon}
            name={cat.name}
            color={cat.color}
            summary={`${acquired}/${catSkills.length}`}
            defaultOpen={defaultOpen}
          >
            {subIds.length > 0 ? (
              <>
                {subIds.map((subId) => (
                  <div key={subId} className="picto-subgroup">
                    <div className="picto-subgroup-label">
                      {SUBCATEGORIES[subId].icon} {SUBCATEGORIES[subId].name}
                    </div>
                    <PictoTiles
                      state={state}
                      skills={catSkills.filter((s) => s.subcategory === subId)}
                      onSelect={onSelect}
                    />
                  </div>
                ))}
                {rest.length > 0 && <PictoTiles state={state} skills={rest} onSelect={onSelect} />}
              </>
            ) : (
              <PictoTiles state={state} skills={catSkills} onSelect={onSelect} />
            )}
          </CollapsibleCategory>
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
