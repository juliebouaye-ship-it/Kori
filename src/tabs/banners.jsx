import { useState } from 'react';
import { CALM_ACTIVITIES } from '../skills-data.js';
import { REMINDER_TYPE_BY_ID } from '../health-data.js';
import { dueReminders } from '../domain.js';

// Bandeau « jour de décompression » (partagé Entraîner + Journal).
// Replié par défaut partout : le rappel doit tenir en une ligne. Le détail
// reste accessible d'un tap pour qui veut les idées d'activités calmes.
export function DecompBanner({ decomp, compact, onDismiss }) {
  const [open, setOpen] = useState(false);
  const when =
    decomp.dayOffset === 0 ? 'aujourd’hui' : decomp.dayOffset === 1 ? 'hier' : 'avant-hier';
  return (
    <div className={`decomp-banner ${compact ? 'compact' : ''}`}>
      <button
        type="button"
        className="decomp-title-row"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span className="decomp-title">🟢 Jour de décompression</span>
        <span className="decomp-toggle">{open ? '▲' : '▼'}</span>
      </button>
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
          {onDismiss && (
            <button type="button" className="back-link" onClick={onDismiss}>
              Elle va bien aujourd’hui — masquer
            </button>
          )}
        </>
      )}
    </div>
  );
}

// Bandeau des rappels santé dus (jamais affiché s'il n'y a rien de dû).
export function HealthDueBanner({ state, goToWalk }) {
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
