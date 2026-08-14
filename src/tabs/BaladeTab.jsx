import { useState } from 'react';
import { CUP_LEVELS, WALK_TRIGGERS, WALK_DURATIONS, OTHER_TRIGGER } from '../skills-data.js';
import { localDate, frDate } from '../date-utils.js';
import { CUP_BY_ID, TRIGGER_BY_ID, orderedPlaces, placeLabel, personalize } from '../domain.js';
import { SectionTitle } from '../ui.jsx';
import { MealsSection, RemindersSection } from '../carnet.jsx';
import { DecompBanner, HealthDueBanner } from './banners.jsx';

// ============================================================
// Onglet BALADE 🚶 — journal ultra-léger + décompression
// ============================================================

// Sélecteur de lieu : les lieux connus en puces (les plus fréquents d'abord),
// plus une puce « + autre » qui en crée un à la volée. La liste se construit
// donc à l'usage — pas de saisie initiale à faire, et un carnet neuf démarre
// vide au lieu d'hériter des habitudes de quelqu'un d'autre.
function PlacePicker({ state, value, onPick, onCreate }) {
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const places = orderedPlaces(state);

  const submit = (e) => {
    e.preventDefault();
    const slug = onCreate(label);
    if (slug) onPick(slug);
    setLabel('');
    setAdding(false);
  };

  return (
    <div className="chip-wrap">
      {places.map((p) => (
        <button
          key={p.slug}
          className={`mini-chip ${value === p.slug ? 'on' : ''}`}
          onClick={() => onPick(value === p.slug ? null : p.slug)}
        >
          {p.icon} {p.label}
        </button>
      ))}
      {adding ? (
        <form className="place-add" onSubmit={submit}>
          <input
            className="place-input"
            autoFocus
            placeholder="Nom du lieu…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onBlur={() => !label.trim() && setAdding(false)}
          />
          <button type="submit" className="place-ok" disabled={!label.trim()}>
            ✓
          </button>
        </form>
      ) : (
        <button className="mini-chip mini-chip-add" onClick={() => setAdding(true)}>
          ＋ autre
        </button>
      )}
    </div>
  );
}

// Durée : facultative, en un tap, jamais de saisie de minutes.
function DurationPicker({ value, onPick }) {
  return (
    <div className="chip-wrap">
      {WALK_DURATIONS.map((d) => (
        <button
          key={d.min}
          className={`mini-chip ${value === d.min ? 'on' : ''}`}
          onClick={() => onPick(value === d.min ? null : d.min)}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
}

// Affichage compact d'une durée enregistrée (90 → « 1 h 30 »).
export const formatDuration = (min) => {
  if (!min) return '';
  const known = WALK_DURATIONS.find((d) => d.min === min);
  if (known) return known.label;
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60 || ''}`.trim();
};
function WalkCard({ state, walk, onUpdate, onDelete, onCreatePlace }) {
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
      <PlacePicker
        state={state}
        value={walk.location}
        onPick={(slug) => onUpdate(walk.id, { location: slug })}
        onCreate={onCreatePlace}
      />

      <div className="walk-field-label">Durée (optionnel)</div>
      <DurationPicker
        value={walk.duration}
        onPick={(min) => onUpdate(walk.id, { duration: min })}
      />

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

      {/* « Autre » n'a de sens que si on peut relire ce que c'était : le champ
          s'ouvre tout seul et son texte s'affiche ensuite dans le journal. */}
      {showNote || walk.triggers.includes(OTHER_TRIGGER) ? (
        <input
          className="walk-note"
          placeholder={
            walk.triggers.includes(OTHER_TRIGGER) ? 'Autre : quoi ?' : 'Note (optionnel)…'
          }
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

function PastWalkRow({ state, walk, today }) {
  const cup = CUP_BY_ID[walk.level];
  const note = (walk.note || '').trim();
  return (
    <div className="past-walk">
      <div className="past-walk-main">
        <span className="pw-cup">{cup.emoji}</span>
        <span className="pw-date">
          {walk.date === today ? 'Aujourd’hui' : frDate(walk.date)}
        </span>
        <span className="pw-loc">{walk.location ? placeLabel(state, walk.location) : '—'}</span>
        <span className="pw-dur">{formatDuration(walk.duration)}</span>
        <span className="pw-tags">
          {walk.triggers.map((t) => TRIGGER_BY_ID[t]?.icon).filter(Boolean).join(' ')}
        </span>
      </div>
      {/* La note s'affiche ici : c'est ce qui rend le tag « Autre » relisible. */}
      {note && <div className="pw-note">{note}</div>}
    </div>
  );
}

export function BaladeTab({
  state,
  onLogWalk,
  onUpdateWalk,
  onDeleteWalk,
  onCreatePlace,
  decomp,
  care,
  onDismissDecomp,
}) {
  const today = localDate();
  const todayWalks = state.walks
    .filter((w) => w.date === today)
    .sort((a, b) => (a.ts || 0) - (b.ts || 0));
  // Journal = TOUTES les sorties, aujourd'hui compris. Une balade qu'on vient
  // d'enregistrer doit apparaître tout de suite dans le journal (avant, le
  // filtre `date !== today` l'en excluait : elle n'y entrait que le lendemain).
  // La carte « Sortie du jour » reste au-dessus : c'est la surface d'édition.
  const journalWalks = [...state.walks]
    .sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0))
    .slice(0, 14);

  // brouillon de balade : rien n'est enregistré tant qu'on ne valide pas.
  const [draft, setDraft] = useState({
    level: null,
    date: null, // null = aujourd'hui ; jamais rempli automatiquement
    location: null,
    duration: null,
    triggers: [],
    note: '',
  });
  const [pickDate, setPickDate] = useState(false);
  const canSave = Boolean(draft.level);
  const setLevel = (id) => setDraft((d) => ({ ...d, level: d.level === id ? null : id }));
  const setLocation = (slug) => setDraft((d) => ({ ...d, location: slug }));
  const setDuration = (min) => setDraft((d) => ({ ...d, duration: min }));
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
    setDraft({ level: null, date: null, location: null, duration: null, triggers: [], note: '' });
    setPickDate(false);
  };

  return (
    <>
      {decomp.active && <DecompBanner decomp={decomp} onDismiss={onDismissDecomp} />}
      <HealthDueBanner state={state} />

      <div className="card">
        <SectionTitle
          title="Comment s’est passée la sortie ? 🚶"
          info={personalize(
            'Tape le niveau du « verre » de Kori — 🟢 sous le seuil, 🟡 un ou deux déclencheurs, 🔴 débordée. Le lieu et les déclencheurs sont facultatifs. Puis enregistre.',
            state.dogName,
          )}
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
            {/* Jamais rempli tout seul : par défaut la sortie est d'aujourd'hui,
                on ne propose de changer la date que si on le demande. */}
            {pickDate ? (
              <>
                <div className="walk-field-label">Date de la sortie</div>
                <input
                  type="date"
                  className="walk-date-input"
                  value={draft.date ?? today}
                  max={today}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                />
              </>
            ) : (
              <button className="back-link" onClick={() => setPickDate(true)}>
                ＋ Noter une sortie passée
              </button>
            )}

            <div className="walk-field-label">Lieu (optionnel)</div>
            <PlacePicker
              state={state}
              value={draft.location}
              onPick={setLocation}
              onCreate={onCreatePlace}
            />

            <div className="walk-field-label">Durée (optionnel)</div>
            <DurationPicker value={draft.duration} onPick={setDuration} />

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
              placeholder={
                draft.triggers.includes(OTHER_TRIGGER) ? 'Autre : quoi ?' : 'Note (optionnel)…'
              }
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
            <WalkCard
              key={w.id}
              state={state}
              walk={w}
              onUpdate={onUpdateWalk}
              onDelete={onDeleteWalk}
              onCreatePlace={onCreatePlace}
            />
          ))}
        </div>
      )}

      {journalWalks.length > 0 && (
        <div className="card">
          <h2>Journal des balades</h2>
          {journalWalks.map((w) => (
            <PastWalkRow key={w.id} state={state} walk={w} today={today} />
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
