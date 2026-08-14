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

// Bandeau « offrir un café » — discret et rare par construction :
// (1) n'apparaît qu'après un vrai temps d'usage du carnet (pas dès la création) ;
// (2) une fois vu, ne revient pas avant plusieurs semaines, même sans clic ;
// (3) fermable d'un tap. Le rythme d'apparition (device-only, cosmétique — pas
// une donnée du carnet) vit dans localStorage : seule exception assumée à la
// suppression du localStorage du 18/07, puisqu'il ne s'agit pas de données mais
// d'une préférence d'affichage locale, sans conséquence si elle se perd.
const SUPPORT_SEEN_KEY = 'kori-coffee-last-seen';
const SUPPORT_MIN_USAGE_DAYS = 14;
const SUPPORT_COOLDOWN_DAYS = 21;
const DAY_MS = 86400000;

function shouldShowSupportBanner(carnetCreatedAt) {
  if (!carnetCreatedAt) return false;
  const usageDays = (Date.now() - carnetCreatedAt) / DAY_MS;
  if (usageDays < SUPPORT_MIN_USAGE_DAYS) return false;
  const lastSeen = Number(window.localStorage.getItem(SUPPORT_SEEN_KEY) || 0);
  return (Date.now() - lastSeen) / DAY_MS >= SUPPORT_COOLDOWN_DAYS;
}

export function SupportBanner({ carnetCreatedAt }) {
  const bmcUser = import.meta.env.VITE_BMC_USERNAME;

  // Décidé une seule fois par ouverture d'appli (initialiseur paresseux de
  // useState), et on marque tout de suite « vu » : le compte à rebours démarre
  // à l'affichage, pas seulement à la fermeture — sinon rouvrir l'appli
  // plusieurs fois le même jour le remontrerait.
  const [visible] = useState(() => {
    const show = Boolean(bmcUser) && shouldShowSupportBanner(carnetCreatedAt);
    if (show) window.localStorage.setItem(SUPPORT_SEEN_KEY, String(Date.now()));
    return show;
  });
  const [dismissed, setDismissed] = useState(false);

  if (!visible || dismissed) return null;
  return (
    <div className="nudge support-banner">
      <span>☕ Le Carnet te sert ? Tu peux m’offrir un café si tu veux soutenir le projet.</span>
      <div className="support-banner-row">
        <a
          className="back-link"
          href={`https://www.buymeacoffee.com/${bmcUser}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Offrir un café →
        </a>
        <button type="button" className="support-dismiss" onClick={() => setDismissed(true)} aria-label="Fermer">
          ✕
        </button>
      </div>
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
