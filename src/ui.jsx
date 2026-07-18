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
