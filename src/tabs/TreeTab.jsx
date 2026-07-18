import { useMemo, useState } from 'react';
import { SKILLS } from '../skills-data.js';
import { computeTreeLayout } from '../tree-layout.js';
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

// Arbre visuel : nœuds reliés par leurs prérequis (disposition calculée dans
// tree-layout.js). Tap sur un nœud → détail via la fiche `SkillCard` existante.
function SkillTreeGraph({ state, onSelect }) {
  const { rows, edges, xById } = useMemo(() => computeTreeLayout(SKILLS), []);
  const NODE = 74;
  const stepX = NODE + 16;
  const stepY = NODE + 42;
  const maxX = Math.max(0, ...Object.values(xById));
  const canvasW = (maxX + 1) * stepX - 16;
  const canvasH = Math.max(NODE, rows.length * stepY - 42);

  // position absolue : chaque nœud sous son parent (colonne = xById) → traits
  // courts et verticaux plutôt que de longues diagonales.
  const pos = {};
  rows.forEach((row, r) => {
    row.forEach((id) => {
      const x = xById[id] * stepX;
      const y = r * stepY;
      pos[id] = { x, y, cx: x + NODE / 2 };
    });
  });

  return (
    <div className="tree-scroll">
      <div className="tree-canvas" style={{ width: canvasW, height: canvasH }}>
        <svg className="tree-edges" width={canvasW} height={canvasH}>
          {edges.map(([from, to]) => {
            const a = pos[from];
            const b = pos[to];
            if (!a || !b) return null;
            const y1 = a.y + NODE;
            const y2 = b.y;
            const mid = (y1 + y2) / 2;
            return (
              <path
                key={from + '>' + to}
                className="tree-edge"
                fill="none"
                d={`M ${a.cx} ${y1} C ${a.cx} ${mid} ${b.cx} ${mid} ${b.cx} ${y2}`}
              />
            );
          })}
        </svg>
        {rows.flat().map((id) => {
          const skill = SKILL_BY_ID[id];
          const status = skillUiStatus(state, skill);
          const cat = CAT_BY_ID[skill.category];
          const p = pos[id];
          return (
            <button
              key={id}
              className={`tree-node status-${status}`}
              style={{ left: p.x, top: p.y, width: NODE, height: NODE, '--cat-color': cat.color }}
              onClick={() => onSelect(skill)}
            >
              <span className="tree-node-cat" />
              <span className="tree-node-icon">{skill.icon}</span>
              <span className="tree-node-name">{skill.name}</span>
              {status === 'locked' && <span className="tree-node-mark">🔒</span>}
              {status === 'mastered' && <span className="tree-node-mark">🏆</span>}
            </button>
          );
        })}
      </div>
    </div>
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
        <SkillTreeGraph state={state} onSelect={setSelected} />
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
