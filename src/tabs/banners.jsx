import { useState } from 'react';
import { CALM_ACTIVITIES } from '../skills-data.js';
import { REMINDER_TYPE_BY_ID } from '../health-data.js';
import { dueReminders } from '../domain.js';

// Bandeau « jour de décompression » (partagé Entraîner + Journal).
export function DecompBanner({ decomp, compact }) {
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
