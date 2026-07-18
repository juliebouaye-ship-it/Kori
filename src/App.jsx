import { useEffect, useMemo, useState } from 'react';
import {
  SKILLS,
  CATEGORIES,
  DIAGS,
  TIERS,
  RATINGS,
  LOCATIONS,
  WALK_TRIGGERS,
  CUP_LEVELS,
  CALM_ACTIVITIES,
  validateDag,
} from './skills-data.js';
import { useKoriSync } from './store.js';
import { deriveInsights } from './insights.js';
import { MealsSection, RemindersSection, FirstsTimeline } from './carnet.jsx';
import { InfoTip, SectionTitle } from './ui.jsx';
import { computeTreeLayout } from './tree-layout.js';
import {
  DEFAULT_MEAL,
  DEFAULT_MEALS_PER_DAY,
  REMINDER_TYPE_BY_ID,
  reminderStatus,
} from './health-data.js';

// ============================================================
// Helpers
// ============================================================
const SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
const CAT_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c]));
const LOC_BY_ID = Object.fromEntries(LOCATIONS.map((l) => [l.id, l]));
const TRIGGER_BY_ID = Object.fromEntries(WALK_TRIGGERS.map((t) => [t.id, t]));
const CUP_BY_ID = Object.fromEntries(CUP_LEVELS.map((c) => [c.id, c]));

const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const DEFAULT_STATE = {
  onboarded: false,
  wallet: 12, // portefeuille dépensable (🦴) — baisse quand on débloque
  lifetime: 0, // total cumulé à vie — fait monter le niveau, ne baisse jamais
  skillProgress: [], // { id, skillId, status: 'known'|'learning'|'mastered' }
  palierDone: [], // { id, palierId, skillId, doneAt }
  sessions: [], // { id, date, skillId, palierId, rating, xp }
  walks: [], // { id, date, ts, level: 'vert'|'jaune'|'rouge', location, triggers: [], note }
  cues: {}, // skillId -> { word, gesture } — antisèche partagée, éditable
  care: [], // { id, date, ts, kind: 'repas'|'friandise', label, grams?, treatId? }
  reminders: [], // { id, type, label, dueDate, note }
  firsts: [], // { id, date, title, note } — « premières fois » à célébrer
};

// Les éléments (balades, séances, repas…) deviennent chacun une ligne InstantDB :
// leur id doit être un UUID valide. crypto.randomUUID est dispo en https/localhost.
const newId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  // repli UUID v4 (contextes anciens / non sécurisés)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
};

// Antisèche : mot + geste effectifs (override utilisateur, sinon défaut du skill).
const cueFor = (state, skill) => ({
  word: state.cues?.[skill.id]?.word ?? skill.cue ?? '',
  gesture: state.cues?.[skill.id]?.gesture ?? skill.signal ?? '',
});

// nb de jours calendaires entre deux dates AAAA-MM-JJ (a - b, positif si a après b)
const daysBetween = (a, b) =>
  Math.round((new Date(a + 'T00:00') - new Date(b + 'T00:00')) / 86400000);

// une séance en catégorie « balade » comptée un jour où une balade a débordé (🔴)
// = gestion (on protège, on n'entraîne pas) → exclue de la progression de compétence.
const isBaladeSkill = (skillId) => SKILL_BY_ID[skillId]?.category === 'balade';
const dayHasRedWalk = (walks, date) =>
  walks.some((w) => w.date === date && w.level === 'rouge');
const sessionIsGestion = (walks, s) =>
  isBaladeSkill(s.skillId) && dayHasRedWalk(walks, s.date);

// jour de décompression : une balade 🔴 aujourd'hui ou dans les 2 jours précédents
// (le cortisol met ~48-72 h à retomber).
function decompressionInfo(walks, today = localDate()) {
  const reds = walks
    .filter((w) => w.level === 'rouge')
    .map((w) => w.date)
    .filter((d) => {
      const diff = daysBetween(today, d);
      return diff >= 0 && diff <= 2;
    })
    .sort();
  if (reds.length === 0) return { active: false };
  const last = reds[reds.length - 1];
  return { active: true, since: last, dayOffset: daysBetween(today, last) };
}


// Métrique positive du mois (entraînement uniquement, hors gestion) — remplace
// la série 🔥 : on encourage sans pénaliser les jours sautés (anti-lassitude).
function trainingMonthStats(sessions, walks, today = localDate()) {
  const month = today.slice(0, 7); // 'AAAA-MM'
  const training = sessions.filter(
    (s) => s.date.startsWith(month) && !sessionIsGestion(walks, s)
  );
  return { sessions: training.length, days: new Set(training.map((s) => s.date)).size };
}

// Rappels santé réellement dus aujourd'hui ou en retard (jamais d'alarme sur une absence).
const dueReminders = (reminders, today = localDate()) =>
  reminders.filter((r) => ['overdue', 'today'].includes(reminderStatus(r.dueDate, today)));

function tierFor(lifetime) {
  let current = TIERS[0];
  let next = null;
  for (const t of TIERS) {
    if (lifetime >= t.min) current = t;
    else {
      next = t;
      break;
    }
  }
  return { current, next };
}

const isAcquired = (state, skillId) =>
  state.skillStatus[skillId] === 'known' || state.skillStatus[skillId] === 'mastered';

const prereqsMet = (state, skill) => skill.prereqs.every((p) => isAcquired(state, p));

function skillUiStatus(state, skill) {
  const st = state.skillStatus[skill.id];
  if (st) return st; // known | learning | mastered
  return prereqsMet(state, skill) ? 'available' : 'locked';
}

// Progression rangée en lignes (table skillProgress) : upsert par compétence.
const upsertProgress = (arr, skillId, status) =>
  arr.some((r) => r.skillId === skillId)
    ? arr.map((r) => (r.skillId === skillId ? { ...r, status } : r))
    : [...arr, { id: newId(), skillId, status }];

const STATUS_LABELS = {
  locked: '🔒 Verrouillé',
  available: '✨ Déblocable',
  learning: '🎯 En cours',
  known: '✔ Acquis',
  mastered: '🏆 Maîtrisée',
};

// ============================================================
// Petits composants
// ============================================================
function Confetti({ burst }) {
  if (!burst) return null;
  const EMOJIS = ['🦴', '🎉', '✨', '🐾', '💛'];
  const pieces = Array.from({ length: 26 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    emoji: EMOJIS[i % EMOJIS.length],
    size: 16 + Math.random() * 14,
  }));
  return (
    <div className="confetti-layer" key={burst}>
      {pieces.map((p) => (
        <span
          className="confetti"
          key={p.id}
          style={{ left: `${p.left}%`, animationDelay: `${p.delay}s`, fontSize: p.size }}
        >
          {p.emoji}
        </span>
      ))}
    </div>
  );
}

function ProgressBar({ ratio }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
    </div>
  );
}

// ============================================================
// Onglet ENTRAÎNER 🎾
// ============================================================
function TrainTab({ state, onLogSession, onPalierDone, goToTree, goToHelp, goToWalk, decomp }) {
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
        <div className="skill-chips">
          {trainable.map((s) => (
            <button
              key={s.id}
              className={`chip ${s.id === skill.id ? 'active' : ''}`}
              onClick={() => setSelectedId(s.id)}
            >
              {s.icon} {s.name}
              {state.skillStatus[s.id] === 'mastered' && <span className="chip-tag">entretien</span>}
            </button>
          ))}
        </div>

        <div className="palier-box">
          <div className="palier-step">
            {mastered
              ? 'Entretien — compétence maîtrisée 🏆'
              : `Palier ${palierIndex + 1} / ${skill.paliers.length}`}
          </div>
          <div className="palier-label">{currentPalier.label}</div>
          <div className="palier-criterion">Acquis quand : {currentPalier.criterion}</div>
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
  const { rows, edges } = useMemo(() => computeTreeLayout(SKILLS), []);
  const NODE = 74;
  const stepX = NODE + 16;
  const stepY = NODE + 42;
  const maxCols = Math.max(1, ...rows.map((r) => r.length));
  const canvasW = maxCols * stepX - 16;
  const canvasH = Math.max(NODE, rows.length * stepY - 42);

  // position absolue de chaque nœud (rangées centrées pour un rendu en arbre)
  const pos = {};
  rows.forEach((row, r) => {
    const rowW = row.length * stepX - 16;
    const offX = (canvasW - rowW) / 2;
    row.forEach((id, c) => {
      const x = offX + c * stepX;
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

function TreeTab({ state, onUnlock, reopenOnboarding }) {
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

// ============================================================
// Onglet PROGRÈS 📊
// ============================================================
function StatsTab({ state, onAddFirst }) {
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
          {CATEGORIES.map((cat) => (
            <div key={cat.id}>
              <div className="sheet-cat">
                {cat.icon} {cat.name}
              </div>
              {SKILLS.filter((s) => s.category === cat.id).map((s) => {
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
            </div>
          ))}
          <button className="back-link" onClick={() => setOpen(false)}>
            Replier
          </button>
        </>
      )}
    </div>
  );
}

function HelpTab({ state, onSetCue }) {
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

// ============================================================
// Onglet BALADE 🚶 — journal ultra-léger + décompression
// ============================================================
function DecompBanner({ decomp, compact }) {
  const [open, setOpen] = useState(!compact);
  const when =
    decomp.dayOffset === 0 ? 'aujourd’hui' : decomp.dayOffset === 1 ? 'hier' : 'avant-hier';
  return (
    <div className={`decomp-banner ${compact ? 'compact' : ''}`}>
      {compact ? (
        <button type="button" className="decomp-title-row" onClick={() => setOpen((o) => !o)}>
          <span className="decomp-title">🟢 Jour de décompression</span>
          <span className="decomp-toggle">{open ? '▲' : '▼'}</span>
        </button>
      ) : (
        <div className="decomp-title">🟢 Jour de décompression</div>
      )}
      {open && (
        <>
          <p className="decomp-text">
            Balade débordée {when}. Aujourd’hui on vise le calme, pas la dépense.
          </p>
          <ul className="calm-list">
            {CALM_ACTIVITIES.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

// Bandeau des rappels santé dus (jamais affiché s'il n'y a rien de dû).
function HealthDueBanner({ state, goToWalk }) {
  const due = dueReminders(state.reminders);
  if (due.length === 0) return null;
  return (
    <div className="nudge nudge-info">
      🩺 Rappel santé :{' '}
      {due.map((r) => (REMINDER_TYPE_BY_ID[r.type] ?? {}).label || r.label).join(', ')}{' '}
      {due.length === 1 ? 'est à faire' : 'sont à faire'}.{' '}
      {goToWalk && (
        <button className="back-link" onClick={goToWalk}>
          Voir dans le Journal →
        </button>
      )}
    </div>
  );
}

function WalkCard({ walk, onUpdate, onDelete }) {
  const [showNote, setShowNote] = useState(!!walk.note);
  return (
    <div className="walk-card">
      <div className="walk-card-head">
        <div className="mini-cups">
          {CUP_LEVELS.map((c) => (
            <button
              key={c.id}
              className={`mini-cup ${walk.level === c.id ? 'active' : ''}`}
              title={c.short}
              onClick={() => onUpdate(walk.id, { level: c.id })}
            >
              {c.emoji}
            </button>
          ))}
        </div>
        <span className="walk-short">{CUP_BY_ID[walk.level].short}</span>
        <button className="walk-del" onClick={() => onDelete(walk.id)} aria-label="Supprimer la sortie">
          ✕
        </button>
      </div>

      <div className="walk-field-label">Lieu</div>
      <div className="chip-wrap">
        {LOCATIONS.map((l) => (
          <button
            key={l.id}
            className={`mini-chip ${walk.location === l.id ? 'on' : ''}`}
            onClick={() => onUpdate(walk.id, { location: walk.location === l.id ? null : l.id })}
          >
            {l.icon} {l.label}
          </button>
        ))}
      </div>

      <div className="walk-field-label">Déclencheurs croisés (optionnel)</div>
      <div className="chip-wrap">
        {WALK_TRIGGERS.map((t) => {
          const on = walk.triggers.includes(t.id);
          return (
            <button
              key={t.id}
              className={`mini-chip ${on ? 'on' : ''}`}
              onClick={() =>
                onUpdate(walk.id, {
                  triggers: on
                    ? walk.triggers.filter((x) => x !== t.id)
                    : [...walk.triggers, t.id],
                })
              }
            >
              {t.icon} {t.label}
            </button>
          );
        })}
      </div>

      {showNote ? (
        <input
          className="walk-note"
          placeholder="Note (optionnel)…"
          value={walk.note}
          onChange={(e) => onUpdate(walk.id, { note: e.target.value })}
        />
      ) : (
        <button className="back-link" onClick={() => setShowNote(true)}>
          ＋ Ajouter une note
        </button>
      )}
    </div>
  );
}

function PastWalkRow({ walk }) {
  const cup = CUP_BY_ID[walk.level];
  const d = new Date(walk.date + 'T00:00');
  return (
    <div className="past-walk">
      <span className="pw-cup">{cup.emoji}</span>
      <span className="pw-date">
        {d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
      </span>
      <span className="pw-loc">{walk.location ? LOC_BY_ID[walk.location].label : '—'}</span>
      <span className="pw-tags">
        {walk.triggers.map((t) => TRIGGER_BY_ID[t]?.icon).join(' ')}
      </span>
    </div>
  );
}

function BaladeTab({ state, onLogWalk, onUpdateWalk, onDeleteWalk, decomp, care }) {
  const today = localDate();
  const todayWalks = state.walks
    .filter((w) => w.date === today)
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
  const pastWalks = state.walks
    .filter((w) => w.date !== today)
    .sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0))
    .slice(0, 14);

  // brouillon de balade : rien n'est enregistré tant qu'on ne valide pas.
  const [draft, setDraft] = useState({ level: null, location: null, triggers: [], note: '' });
  const canSave = Boolean(draft.level);
  const setLevel = (id) => setDraft((d) => ({ ...d, level: d.level === id ? null : id }));
  const setLocation = (id) => setDraft((d) => ({ ...d, location: d.location === id ? null : id }));
  const toggleTrigger = (id) =>
    setDraft((d) => ({
      ...d,
      triggers: d.triggers.includes(id)
        ? d.triggers.filter((x) => x !== id)
        : [...d.triggers, id],
    }));
  const saveWalk = () => {
    if (!canSave) return;
    onLogWalk(draft);
    setDraft({ level: null, location: null, triggers: [], note: '' });
  };

  return (
    <>
      {decomp.active && <DecompBanner decomp={decomp} />}
      <HealthDueBanner state={state} />

      <div className="card">
        <SectionTitle
          title="Comment s’est passée la sortie ? 🚶"
          info="Tape le niveau du « verre » de Kori — 🟢 sous le seuil, 🟡 un ou deux déclencheurs, 🔴 débordée. Le lieu et les déclencheurs sont facultatifs. Puis enregistre."
        />
        <div className="cup-row">
          {CUP_LEVELS.map((c) => (
            <button
              key={c.id}
              className={`cup-btn ${draft.level === c.id ? 'selected' : ''}`}
              style={{ '--cup-color': c.color }}
              onClick={() => setLevel(c.id)}
            >
              <span className="cup-emoji">{c.emoji}</span>
              <span className="cup-label">{c.short}</span>
              <span className="cup-sub">{c.label}</span>
            </button>
          ))}
        </div>

        {draft.level && (
          <div className="walk-draft">
            <div className="walk-field-label">Lieu (optionnel)</div>
            <div className="chip-wrap">
              {LOCATIONS.map((l) => (
                <button
                  key={l.id}
                  className={`mini-chip ${draft.location === l.id ? 'on' : ''}`}
                  onClick={() => setLocation(l.id)}
                >
                  {l.icon} {l.label}
                </button>
              ))}
            </div>

            <div className="walk-field-label">Déclencheurs croisés (optionnel)</div>
            <div className="chip-wrap">
              {WALK_TRIGGERS.map((t) => (
                <button
                  key={t.id}
                  className={`mini-chip ${draft.triggers.includes(t.id) ? 'on' : ''}`}
                  onClick={() => toggleTrigger(t.id)}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>

            <input
              className="walk-note"
              placeholder="Note (optionnel)…"
              value={draft.note}
              onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
            />
          </div>
        )}

        <button className="btn btn-primary btn-block" disabled={!canSave} onClick={saveWalk}>
          {canSave ? '🐾 Enregistrer la balade' : 'Choisis d’abord un niveau'}
        </button>
      </div>

      {todayWalks.length > 0 && (
        <div className="card">
          <h2>Sortie{todayWalks.length > 1 ? 's' : ''} du jour</h2>
          {todayWalks.map((w) => (
            <WalkCard key={w.id} walk={w} onUpdate={onUpdateWalk} onDelete={onDeleteWalk} />
          ))}
        </div>
      )}

      {pastWalks.length > 0 && (
        <div className="card">
          <h2>Journal des balades</h2>
          {pastWalks.map((w) => (
            <PastWalkRow key={w.id} walk={w} />
          ))}
        </div>
      )}

      <MealsSection
        state={state}
        onAddCare={care.add}
        onLogDefaultMeals={care.logDefaultMeals}
        onRemoveCare={care.remove}
      />

      <RemindersSection
        state={state}
        onAddReminder={care.addReminder}
        onCompleteReminder={care.completeReminder}
        onRemoveReminder={care.removeReminder}
      />
    </>
  );
}

// ============================================================
// Bilan de départ (bottom sheet)
// ============================================================
const BILAN_STATES = ['non', 'partiel', 'acquis'];
const BILAN_ICONS = { non: '⬜', partiel: '🌓', acquis: '✅' };

function OnboardingSheet({ state, onValidate }) {
  // pré-remplissage depuis l'état actuel (utile quand on refait le bilan)
  const [choices, setChoices] = useState(() => {
    const init = {};
    for (const s of SKILLS) {
      const st = state.skillStatus[s.id];
      if (st === 'known' || st === 'mastered') init[s.id] = 'acquis';
      else if (st === 'learning') init[s.id] = 'partiel';
      else init[s.id] = 'non';
    }
    return init;
  });

  const cycle = (id) => {
    setChoices((prev) => {
      const next = BILAN_STATES[(BILAN_STATES.indexOf(prev[id]) + 1) % BILAN_STATES.length];
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="sheet-overlay">
      <div className="sheet">
        <h2>Bilan de départ 🐕</h2>
        <div className="sheet-sub">
          Appuie sur chaque ligne : ⬜ pas encore · 🌓 en partie · ✅ acquis.
          <InfoTip text="✅ Acquis = elle le fait sur demande au calme (compté acquis, ni coût ni bonus). 🌓 En partie = ça craque dehors ou en excitation : la compétence passe « en cours » gratuitement, tu valideras toi-même les paliers déjà solides." />
        </div>
        {CATEGORIES.map((cat) => (
          <div key={cat.id}>
            <div className="sheet-cat">
              {cat.icon} {cat.name}
            </div>
            {SKILLS.filter((s) => s.category === cat.id).map((s) => (
              <button
                key={s.id}
                className={`check-row ${choices[s.id] === 'acquis' ? 'checked' : ''} ${choices[s.id] === 'partiel' ? 'partial' : ''}`}
                onClick={() => cycle(s.id)}
              >
                <span className="cr-box">{BILAN_ICONS[choices[s.id]]}</span>
                <span>
                  {s.icon} {s.name}
                </span>
                {choices[s.id] === 'partiel' && <span className="cr-tag">en partie</span>}
              </button>
            ))}
          </div>
        ))}
        <button className="btn btn-primary btn-block" onClick={() => onValidate(choices)}>
          C’est parti ! 🎾
        </button>
      </div>
    </div>
  );
}

// ============================================================
// App
// ============================================================
const TABS = [
  { id: 'train', label: 'Entraîner', icon: '🎾' },
  { id: 'balade', label: 'Journal', icon: '📓' },
  { id: 'tree', label: 'Arbre', icon: '🌱' },
  { id: 'stats', label: 'Progrès', icon: '📊' },
  { id: 'help', label: 'Aide', icon: '💡' },
];

export default function App() {
  const [state, setState] = useState(() => ({ ...DEFAULT_STATE }));
  const [tab, setTab] = useState('train');
  const [toast, setToast] = useState(null);
  const [burst, setBurst] = useState(null);
  // Réouverture manuelle du bilan (depuis l'arbre). L'affichage AUTOMATIQUE au
  // tout premier lancement se décide, lui, à partir de `state.onboarded` — donc
  // du carnet InstantDB — une fois celui-ci chargé (voir `showOnboarding`).
  const [manualOnboarding, setManualOnboarding] = useState(false);

  // garde-fou dev : le graphe de prérequis doit être un DAG valide
  useEffect(() => {
    const errors = validateDag();
    if (errors.length) console.error('⚠️ skills-data invalide :', errors);
  }, []);

  // synchro temps réel du carnet partagé (InstantDB) — unique source de vérité
  // (plus de localStorage : InstantDB garde lui-même un cache local hors-ligne).
  // `ready` passe à true une fois le carnet distant chargé.
  const ready = useKoriSync(state, setState, (remote) => ({ ...DEFAULT_STATE, ...remote }));

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2400);
  };

  const fireConfetti = () => {
    setBurst(Date.now());
    window.clearTimeout(fireConfetti._t);
    fireConfetti._t = window.setTimeout(() => setBurst(null), 1700);
  };

  const logSession = (skill, palier, rating) => {
    const gestion = isBaladeSkill(skill.id) && dayHasRedWalk(state.walks, localDate());
    setState((prev) => ({
      ...prev,
      wallet: prev.wallet + rating.xp,
      lifetime: prev.lifetime + rating.xp,
      sessions: [
        ...prev.sessions,
        {
          id: newId(),
          date: localDate(),
          skillId: skill.id,
          palierId: palier.id,
          rating: rating.id,
          xp: rating.xp,
        },
      ],
    }));
    showToast(gestion ? `+${rating.xp} 🦴 · gestion 🛡️` : `+${rating.xp} 🦴 · séance notée`);
    if (rating.id === 'top') fireConfetti();
  };

  // Enregistre une balade à partir du brouillon composé dans l'onglet
  // (niveau obligatoire ; lieu, déclencheurs et note facultatifs).
  const logWalk = (draft) => {
    const level = draft.level;
    if (!level) return;
    setState((prev) => ({
      ...prev,
      walks: [
        ...prev.walks,
        {
          id: newId(),
          date: localDate(),
          ts: Date.now(),
          level,
          location: draft.location ?? null,
          triggers: draft.triggers ?? [],
          note: (draft.note ?? '').trim(),
        },
      ],
    }));
    const cup = CUP_BY_ID[level];
    showToast(
      level === 'rouge'
        ? '🔴 Balade enregistrée · décompression activée'
        : `${cup.emoji} Balade enregistrée · ${cup.short}`
    );
    // petite fête uniquement pour une sortie sereine (jamais pour une 🔴)
    if (level === 'vert') fireConfetti();
  };

  const updateWalk = (id, patch) =>
    setState((prev) => ({
      ...prev,
      walks: prev.walks.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));

  const deleteWalk = (id) =>
    setState((prev) => ({ ...prev, walks: prev.walks.filter((w) => w.id !== id) }));

  // ---- Antisèche (mot + geste éditables) ----
  const setCue = (skillId, patch) =>
    setState((prev) => ({
      ...prev,
      cues: { ...prev.cues, [skillId]: { ...(prev.cues?.[skillId] || {}), ...patch } },
    }));

  // ---- Carnet : repas & friandises ----
  const addCare = (entry) =>
    setState((prev) => ({
      ...prev,
      care: [...prev.care, { id: newId(), date: localDate(), ts: Date.now(), ...entry }],
    }));

  const logDefaultMeals = () => {
    const date = localDate();
    setState((prev) => {
      const already = prev.care.filter((c) => c.date === date && c.kind === 'repas').length;
      const toAdd = Math.max(0, DEFAULT_MEALS_PER_DAY - already);
      if (toAdd === 0) return prev;
      const meals = Array.from({ length: toAdd }, (_, i) => ({
        id: newId(),
        date,
        ts: Date.now() + i,
        kind: 'repas',
        label: DEFAULT_MEAL.label,
        grams: DEFAULT_MEAL.grams,
      }));
      return { ...prev, care: [...prev.care, ...meals] };
    });
    showToast('🍽️ Repas du jour notés');
  };

  const removeCare = (id) =>
    setState((prev) => ({ ...prev, care: prev.care.filter((c) => c.id !== id) }));

  // ---- Carnet : rappels santé ----
  const addReminder = (r) =>
    setState((prev) => ({ ...prev, reminders: [...prev.reminders, { id: newId(), ...r }] }));

  const removeReminder = (id) =>
    setState((prev) => ({ ...prev, reminders: prev.reminders.filter((r) => r.id !== id) }));

  const completeReminder = (r) => {
    const every = REMINDER_TYPE_BY_ID[r.type]?.everyDays;
    setState((prev) => {
      if (every) {
        // récurrent → on reprogramme à la prochaine échéance
        const next = new Date(r.dueDate + 'T00:00');
        next.setDate(next.getDate() + every);
        return {
          ...prev,
          reminders: prev.reminders.map((x) =>
            x.id === r.id ? { ...x, dueDate: localDate(next) } : x
          ),
        };
      }
      // ponctuel → on le retire
      return { ...prev, reminders: prev.reminders.filter((x) => x.id !== r.id) };
    });
    showToast(every ? '✓ Fait · reprogrammé' : '✓ Fait');
  };

  // ---- Carnet : premières fois ----
  const addFirst = (f) => {
    setState((prev) => ({ ...prev, firsts: [...prev.firsts, { id: newId(), ...f }] }));
    showToast('⭐ Première fois célébrée');
    fireConfetti();
  };

  const markPalierDone = (skill, palier) => {
    setState((prev) => {
      if (prev.palierDone.some((r) => r.palierId === palier.id)) return prev; // déjà validé
      const palierDone = [
        ...prev.palierDone,
        { id: newId(), palierId: palier.id, skillId: skill.id, doneAt: localDate() },
      ];
      const doneIds = new Set(palierDone.map((r) => r.palierId));
      const allDone = skill.paliers.every((p) => doneIds.has(p.id));
      const next = { ...prev, palierDone };
      const current = prev.skillProgress.find((r) => r.skillId === skill.id);
      if (allDone && current?.status !== 'mastered') {
        next.skillProgress = upsertProgress(prev.skillProgress, skill.id, 'mastered');
        next.wallet = prev.wallet + skill.bonus;
        next.lifetime = prev.lifetime + skill.bonus;
      }
      return next;
    });
    const willMaster = skill.paliers.every(
      (p) => p.id === palier.id || state.palierDone.some((r) => r.palierId === p.id)
    );
    if (willMaster) {
      showToast(`🏆 ${skill.name} maîtrisée · +${skill.bonus} 🦴`);
      fireConfetti();
    } else {
      showToast('✓ Palier validé');
    }
  };

  const unlockSkill = (skill) => {
    if (state.wallet < skill.cost) return;
    setState((prev) => ({
      ...prev,
      wallet: prev.wallet - skill.cost,
      skillProgress: upsertProgress(prev.skillProgress, skill.id, 'learning'),
    }));
    showToast(`🌱 ${skill.name} débloquée`);
  };

  const validateOnboarding = (choices) => {
    setState((prev) => {
      let skillProgress = prev.skillProgress;
      for (const s of SKILLS) {
        const cur = skillProgress.find((r) => r.skillId === s.id);
        if (cur?.status === 'mastered') continue; // une maîtrise gagnée reste gagnée
        const c = choices[s.id] ?? 'non';
        if (c === 'acquis') skillProgress = upsertProgress(skillProgress, s.id, 'known');
        else if (c === 'partiel') skillProgress = upsertProgress(skillProgress, s.id, 'learning');
        else skillProgress = skillProgress.filter((r) => r.skillId !== s.id);
      }
      return { ...prev, skillProgress, onboarded: true };
    });
    setManualOnboarding(false);
    const hasPartial = Object.values(choices).includes('partiel');
    showToast(
      hasPartial
        ? 'Bilan enregistré · valide tes paliers dans Entraîner'
        : 'Bilan enregistré 🐾'
    );
  };

  const { current: tier } = tierFor(state.lifetime);
  const decomp = decompressionInfo(state.walks);
  const monthStats = trainingMonthStats(state.sessions, state.walks);
  const care = {
    add: addCare,
    logDefaultMeals,
    remove: removeCare,
    addReminder,
    completeReminder,
    removeReminder,
  };

  // Progression rangée en tables : on reconstruit à la volée les annuaires
  // (skillStatus/paliersDone) attendus par les composants, pour ne pas les
  // réécrire. `viewState` est un sur-ensemble de `state` passé aux onglets.
  const statusById = Object.fromEntries(
    (state.skillProgress || []).map((r) => [r.skillId, r.status])
  );
  const paliersDoneById = Object.fromEntries(
    (state.palierDone || []).map((r) => [r.palierId, r.doneAt])
  );
  const viewState = { ...state, skillStatus: statusById, paliersDone: paliersDoneById };

  // Le bilan de départ s'affiche soit sur réouverture manuelle, soit
  // automatiquement au tout premier lancement — mais seulement une fois le
  // carnet distant chargé, pour ne pas le faire clignoter pendant le chargement.
  const showOnboarding = manualOnboarding || (ready && !state.onboarded);

  // Tant que le carnet en ligne n'est pas chargé, on n'affiche encore rien de
  // décisif (évite un flash du bilan de départ à chaque ouverture).
  if (!ready) {
    return (
      <div className="app app-loading">
        <div className="loading-paw">🐾</div>
        <p className="muted">Chargement du carnet…</p>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="topbar">
        <span className="topbar-tier" title={tier.name}>
          {tier.emoji}
        </span>
        <span className="topbar-name">Kori</span>
        <span className="topbar-metrics">
          <span>{state.wallet} 🦴</span>
          <span title="Jours d’entraînement ce mois">🎾 {monthStats.days} j</span>
        </span>
      </header>

      {tab === 'train' && (
        <TrainTab
          state={viewState}
          onLogSession={logSession}
          onPalierDone={markPalierDone}
          goToTree={() => setTab('tree')}
          goToHelp={() => setTab('help')}
          goToWalk={() => setTab('balade')}
          decomp={decomp}
        />
      )}
      {tab === 'balade' && (
        <BaladeTab
          state={viewState}
          onLogWalk={logWalk}
          onUpdateWalk={updateWalk}
          onDeleteWalk={deleteWalk}
          decomp={decomp}
          care={care}
        />
      )}
      {tab === 'tree' && (
        <TreeTab
          state={viewState}
          onUnlock={unlockSkill}
          reopenOnboarding={() => setManualOnboarding(true)}
        />
      )}
      {tab === 'stats' && <StatsTab state={viewState} onAddFirst={addFirst} />}
      {tab === 'help' && <HelpTab state={viewState} onSetCue={setCue} />}

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-btn ${tab === t.id ? 'active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="n-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {showOnboarding && <OnboardingSheet state={viewState} onValidate={validateOnboarding} />}
      {toast && <div className="toast">{toast}</div>}
      <Confetti burst={burst} />
    </div>
  );
}
