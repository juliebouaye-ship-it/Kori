import { useState } from 'react';
import {
  TREATS,
  TREAT_BY_ID,
  REMINDER_TYPES,
  REMINDER_TYPE_BY_ID,
  DEFAULT_MEAL,
  DEFAULT_MEALS_PER_DAY,
  reminderStatus,
} from './health-data.js';

const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const frDate = (iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(iso + 'T00:00').toLocaleDateString('fr-FR', opts);

// ============================================================
// Repas & friandises du jour (monté dans l'onglet Journal)
// Principe : rien d'obligatoire, « rien de noté » n'est jamais une alerte.
// ============================================================
export function MealsSection({ state, onAddCare, onLogDefaultMeals, onRemoveCare }) {
  const [customGrams, setCustomGrams] = useState(DEFAULT_MEAL.grams);
  const today = localDate();
  const todayCare = state.care.filter((c) => c.date === today);
  const meals = todayCare.filter((c) => c.kind === 'repas');
  const treats = todayCare.filter((c) => c.kind === 'friandise');
  const totalGrams = meals.reduce((n, m) => n + (m.grams || 0), 0);

  return (
    <div className="card">
      <h2>Repas &amp; friandises 🍽️</h2>
      <p className="muted">
        Pratique à deux : un coup d’œil pour voir ce que Kori a déjà eu aujourd’hui. Rien
        d’obligatoire.
      </p>

      <div className="care-summary">
        {todayCare.length === 0 ? (
          <span className="muted">Rien de noté aujourd’hui.</span>
        ) : (
          <>
            <span>
              🍽️ {meals.length} repas{totalGrams > 0 ? ` · ${totalGrams} g` : ''}
            </span>
            <span>🦴 {treats.length} friandise{treats.length > 1 ? 's' : ''}</span>
          </>
        )}
      </div>

      <div className="care-actions">
        <button className="btn btn-sage" onClick={onLogDefaultMeals}>
          ✓ Repas habituels ({DEFAULT_MEALS_PER_DAY} × {DEFAULT_MEAL.grams} g)
        </button>
        <div className="custom-meal">
          <input
            type="number"
            className="grams-input"
            value={customGrams}
            min={0}
            step={10}
            onChange={(e) => setCustomGrams(Number(e.target.value))}
            aria-label="Grammes du repas"
          />
          <span className="muted">g</span>
          <button
            className="btn btn-ghost"
            onClick={() => onAddCare({ kind: 'repas', label: DEFAULT_MEAL.label, grams: customGrams })}
          >
            ＋ Repas
          </button>
        </div>
      </div>

      <div className="care-field-label">Friandise donnée</div>
      <div className="chip-wrap">
        {TREATS.map((t) => (
          <button
            key={t.id}
            className="mini-chip"
            onClick={() => onAddCare({ kind: 'friandise', label: t.label, treatId: t.id })}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {todayCare.length > 0 && (
        <ul className="care-list">
          {todayCare
            .slice()
            .sort((a, b) => (a.ts || 0) - (b.ts || 0))
            .map((c) => (
              <li key={c.id}>
                <span>
                  {c.kind === 'repas'
                    ? `🍽️ ${c.label}${c.grams ? ` · ${c.grams} g` : ''}`
                    : `${TREAT_BY_ID[c.treatId]?.icon ?? '🦴'} ${c.label}`}
                </span>
                <button className="care-del" onClick={() => onRemoveCare(c.id)} aria-label="Retirer">
                  ✕
                </button>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

// ============================================================
// Rappels santé (monté dans l'onglet Journal)
// ============================================================
const STATUS_BADGE = {
  overdue: { label: 'à faire', cls: 'badge-overdue' },
  today: { label: "aujourd'hui", cls: 'badge-today' },
  soon: { label: 'bientôt', cls: 'badge-soon' },
  later: { label: '', cls: 'badge-later' },
};

export function RemindersSection({ state, onAddReminder, onCompleteReminder, onRemoveReminder }) {
  const [open, setOpen] = useState(false);
  const [typeId, setTypeId] = useState(REMINDER_TYPES[0].id);
  const [dueDate, setDueDate] = useState(localDate());
  const [note, setNote] = useState('');
  const today = localDate();

  const reminders = state.reminders
    .slice()
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));

  const submit = () => {
    if (!dueDate) return;
    const type = REMINDER_TYPE_BY_ID[typeId];
    onAddReminder({ type: typeId, label: note.trim() || type.label, dueDate, note: '' });
    setNote('');
    setDueDate(localDate());
    setOpen(false);
  };

  return (
    <div className="card">
      <h2>Rappels santé 🩺</h2>
      {reminders.length === 0 ? (
        <p className="muted">Aucun rappel pour l’instant. Ajoute vaccin, vermifuge, véto…</p>
      ) : (
        <ul className="reminder-list">
          {reminders.map((r) => {
            const type = REMINDER_TYPE_BY_ID[r.type] ?? REMINDER_TYPE_BY_ID.autre;
            const st = reminderStatus(r.dueDate, today);
            const badge = STATUS_BADGE[st];
            return (
              <li key={r.id} className="reminder-row">
                <span className="rem-icon">{type.icon}</span>
                <span className="rem-body">
                  <span className="rem-label">{r.label}</span>
                  <span className="rem-date">
                    {frDate(r.dueDate, { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </span>
                {badge?.label && <span className={`rem-badge ${badge.cls}`}>{badge.label}</span>}
                <button
                  className="btn btn-sage rem-done"
                  onClick={() => onCompleteReminder(r)}
                  title="Marquer fait (reprogramme si récurrent)"
                >
                  ✓
                </button>
                <button className="care-del" onClick={() => onRemoveReminder(r.id)} aria-label="Supprimer">
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {open ? (
        <div className="reminder-form">
          <div className="chip-wrap">
            {REMINDER_TYPES.map((t) => (
              <button
                key={t.id}
                className={`mini-chip ${typeId === t.id ? 'on' : ''}`}
                onClick={() => setTypeId(t.id)}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </div>
          <input
            className="walk-note"
            placeholder="Précision (optionnel, ex. rappel CHPPiL)…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div className="reminder-form-row">
            <input
              type="date"
              className="date-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <button className="btn btn-primary" onClick={submit}>
              Ajouter
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-ghost btn-block" onClick={() => setOpen(true)}>
          ＋ Nouveau rappel
        </button>
      )}
    </div>
  );
}

// ============================================================
// Premières fois (monté dans l'onglet Progrès)
// ============================================================
export function FirstsTimeline({ state, onAddFirst }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(localDate());

  const firsts = state.firsts
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));

  const submit = () => {
    if (!title.trim()) return;
    onAddFirst({ title: title.trim(), date, note: '' });
    setTitle('');
    setDate(localDate());
    setOpen(false);
  };

  return (
    <div className="card">
      <h2>Premières fois ⭐</h2>
      <p className="muted">
        Les vrais jalons de sa nouvelle vie, au-delà des paliers : première rencontre chat
        sereine, première sortie en ville…
      </p>

      {firsts.length > 0 && (
        <ul className="firsts-list">
          {firsts.map((f) => (
            <li key={f.id}>
              <span className="first-dot">⭐</span>
              <span className="first-body">
                <span className="first-title">{f.title}</span>
                <span className="first-date">{frDate(f.date)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}

      {open ? (
        <div className="reminder-form">
          <input
            className="walk-note"
            placeholder="Ex. Première balade en ville 🏙️"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
          <div className="reminder-form-row">
            <input
              type="date"
              className="date-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <button className="btn btn-primary" onClick={submit}>
              Célébrer 🎉
            </button>
          </div>
        </div>
      ) : (
        <button className="btn btn-ghost btn-block" onClick={() => setOpen(true)}>
          ＋ Ajouter une première fois
        </button>
      )}
    </div>
  );
}
