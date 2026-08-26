// ============================================================
// Page d'accueil — explique l'appli avant la connexion
// ============================================================
// Affichée avant l'écran de connexion : un lien qui défile dans un fil
// Discord ne dit rien de ce que fait l'appli, cette page reste consultable
// et repartageable. Elle ne remplace pas la connexion par e-mail (seule
// méthode existante), elle la précède — voir mémoire
// kori-plan-diffusion-publique.

const FEATURES = [
  {
    icon: '🚶',
    title: 'Le journal des balades',
    text: 'Après la sortie, en un geste : 🟢 sereine, 🟡 chargée, 🔴 stackée — avec le lieu et la durée si tu veux. Pas de carte, pas de suivi GPS en direct : juste de quoi se souvenir et repérer ce qui revient.',
  },
  {
    icon: '📊',
    title: 'Tes progrès en un coup d’œil',
    text: 'Balades sur 14 jours, paliers franchis, ce qui revient souvent : le carnet fait les calculs à partir de ce que tu notes au fil des sorties, à toi de repérer les tendances.',
  },
  {
    icon: '🌳',
    title: 'L’entraînement, si tu veux',
    text: 'Un arbre de compétences (rappel, laisse, soins, cani-rando...) avec des paliers concrets à cocher séance après séance. En option, selon le mode choisi au départ.',
  },
  {
    icon: '🐾',
    title: 'À plusieurs, sur le même carnet',
    text: 'Toi, ton binôme, ton éducatrice — un code à six caractères suffit pour rejoindre. Tout le monde voit et note la même chose, en direct.',
  },
];

export function LandingScreen({ onStart }) {
  return (
    <div className="app landing-screen">
      <div className="landing-hero">
        <div className="auth-paw">🐾</div>
        <h1>Le carnet de Kori</h1>
        <p className="auth-sub landing-tagline">
          Un suivi régulier de ton chien pensé pour zéro charge
          mentale.
        </p>
      </div>

      <div className="landing-features">
        {FEATURES.map((f) => (
          <div className="card landing-feature" key={f.title}>
            <div className="landing-feature-icon">{f.icon}</div>
            <div>
              <h2>{f.title}</h2>
              <p className="muted">{f.text}</p>
            </div>
          </div>
        ))}
      </div>

      {/* <p className="muted landing-principle">
        Un seul geste obligatoire à chaque fois. Le reste — lieu, durée, notes — reste toujours
        facultatif.
      </p> */}

      <button type="button" className="btn btn-primary btn-block landing-cta" onClick={onStart}>
        Démarrer
      </button>
      <p className="muted landing-footer">Gratuit, sans pub.</p>
    </div>
  );
}
