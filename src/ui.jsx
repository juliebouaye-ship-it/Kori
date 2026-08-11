import { useState } from 'react';

// ============================================================
// Petits éléments d'UI partagés (App.jsx + carnet.jsx)
// Objectif : sortir les explications des cartes. Le « pourquoi » vit
// derrière un ⓘ discret, déplié à la demande — l'écran reste calme.
// ============================================================

// Bouton ⓘ autonome : déplie/replie une ligne d'explication sous lui.
export function InfoTip({ text }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="info-dot"
        aria-label="Plus d’infos"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        ⓘ
      </button>
      {open && <p className="info-text">{text}</p>}
    </>
  );
}

// Accordéon de catégorie réutilisable (bilan de départ, antisèche…). L'en-tête
// affiche un résumé optionnel pour qu'un bloc replié reste parlant.
// Même patron que InfoTip : useState + aria-expanded.
export function CollapsibleCategory({ icon, name, color, summary, defaultOpen = true, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="cat-group" style={{ '--cat-color': color }}>
      <button
        type="button"
        className="cat-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="cat-toggle-name">
          {icon} {name}
        </span>
        {summary && <span className="cat-toggle-summary">{summary}</span>}
        <span className="cat-toggle-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="cat-group-body">{children}</div>}
    </div>
  );
}

// Carte entière repliable. Repliée par défaut : l'Aide est une page qu'on
// parcourt du regard avant de choisir où entrer, pas un mur de texte à faire
// défiler. L'en-tête seul doit suffire à savoir ce qu'il y a dedans.
export function CollapsibleCard({ title, summary, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`card card-collapsible ${open ? 'is-open' : ''}`}>
      <button
        type="button"
        className="card-toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="card-toggle-title">{title}</span>
        {summary && <span className="card-toggle-summary">{summary}</span>}
        <span className="card-toggle-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="card-toggle-body">{children}</div>}
    </div>
  );
}

// Titre de carte + ⓘ optionnel. L'explication s'affiche sous le titre.
// `right` : contenu aligné à droite du titre (badge, compteur…).
export function SectionTitle({ title, info, right }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="section-head">
      <div className="section-head-row">
        <h2>{title}</h2>
        {info && (
          <button
            type="button"
            className="info-dot"
            aria-label="Plus d’infos"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
          >
            ⓘ
          </button>
        )}
        {right && <span className="section-head-right">{right}</span>}
      </div>
      {info && open && <p className="info-text">{info}</p>}
    </div>
  );
}

// Pluie d'emojis de célébration. `burst` = clé qui change à chaque déclenchement.
export function Confetti({ burst }) {
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

// Barre de progression simple (ratio 0..1).
export function ProgressBar({ ratio }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${Math.min(100, ratio * 100)}%` }} />
    </div>
  );
}
