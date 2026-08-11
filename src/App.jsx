import { useState } from 'react';
import { useKoriState } from './state/useKoriState.js';
import { tabsForMode, defaultTabForMode } from './carnets.js';
import { signOut } from './auth.jsx';
import { Confetti, BottomSheet } from './ui.jsx';
import { TrainTab } from './tabs/TrainTab.jsx';
import { BaladeTab } from './tabs/BaladeTab.jsx';
import { TreeTab } from './tabs/TreeTab.jsx';
import { StatsTab } from './tabs/StatsTab.jsx';
import { HelpTab } from './tabs/HelpTab.jsx';
import { OnboardingSheet } from './tabs/OnboardingSheet.jsx';

// ============================================================
// App — routeur : topbar + onglet actif + navigation + overlays.
// Tout l'état et les handlers vivent dans useKoriState.
// ============================================================
const TABS = [
  { id: 'train', label: 'Entraîner', icon: '🎾' },
  { id: 'balade', label: 'Journal', icon: '📓' },
  { id: 'tree', label: 'Arbre', icon: '🌱' },
  { id: 'stats', label: 'Progrès', icon: '📊' },
  { id: 'help', label: 'Aide', icon: '💡' },
];

export default function App({ carnet, carnets = [], onSwitchCarnet, onAddCarnet, onJoinCarnet }) {
  const k = useKoriState(carnet);
  const [switching, setSwitching] = useState(false);
  const tabs = tabsForMode(carnet?.mode, TABS);
  const multi = carnets.length > 1;

  // Changer de chien peut faire disparaître l'onglet courant (un carnet
  // « journal seul » n'a ni Entraîner ni Arbre) : on retombe alors sur l'onglet
  // d'accueil du mode plutôt que sur un écran vide.
  const activeTab = tabs.some((t) => t.id === k.tab) ? k.tab : defaultTabForMode(carnet?.mode);

  // Tant que le carnet en ligne n'est pas chargé, on n'affiche encore rien de
  // décisif (évite un flash du bilan de départ à chaque ouverture).
  if (!k.ready) {
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
        {/* Niveau et 🦴 relèvent de l'entraînement : un carnet « journal seul »
            n'affiche que le nom. */}
        {!k.journalOnly && (
          <span className="topbar-tier" title={k.tier.name}>
            {k.tier.emoji}
          </span>
        )}
        {/* Avec plusieurs chiens, le nom devient le sélecteur — c'est là qu'on
            le cherche. Avec un seul, il reste du texte, sans décor inutile. */}
        {multi ? (
          <button
            className="topbar-name topbar-switch"
            onClick={() => setSwitching(true)}
            aria-haspopup="dialog"
          >
            {carnet?.dogName ?? 'Le carnet'} <span className="topbar-caret">▾</span>
          </button>
        ) : (
          <span className="topbar-name">{carnet?.dogName ?? 'Le carnet'}</span>
        )}
        {!k.journalOnly && (
          <span className="topbar-metrics">
            <span>{k.state.wallet} 🦴</span>
            <span title="Jours d’entraînement ce mois">🎾 {k.monthStats.days} j</span>
          </span>
        )}
      </header>

      {activeTab === 'train' && (
        <TrainTab
          state={k.viewState}
          onLogSession={k.logSession}
          onLogQuickRound={k.logQuickRound}
          onPalierDone={k.markPalierDone}
          goToTree={() => k.setTab('tree')}
          goToHelp={() => k.setTab('help')}
          goToWalk={() => k.setTab('balade')}
          decomp={k.decomp}
          onDismissDecomp={k.dismissDecomp}
        />
      )}
      {activeTab === 'balade' && (
        <BaladeTab
          state={k.viewState}
          onLogWalk={k.logWalk}
          onUpdateWalk={k.updateWalk}
          onDeleteWalk={k.deleteWalk}
          onCreatePlace={k.createPlace}
          decomp={k.decomp}
          onDismissDecomp={k.dismissDecomp}
          care={k.care}
        />
      )}
      {activeTab === 'tree' && (
        <TreeTab
          state={k.viewState}
          onUnlock={k.unlockSkill}
          reopenOnboarding={() => k.setManualOnboarding(true)}
        />
      )}
      {activeTab === 'stats' && <StatsTab state={k.viewState} onAddFirst={k.addFirst} />}
      {activeTab === 'help' && (
        <HelpTab
          state={k.viewState}
          onSetCue={k.setCue}
          carnet={carnet}
          journalOnly={k.journalOnly}
          onSetMode={k.setCarnetMode}
          onSignOut={signOut}
          onAddCarnet={onAddCarnet}
          onJoinCarnet={onJoinCarnet}
        />
      )}

      <nav className="bottom-nav">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`nav-btn ${activeTab === t.id ? 'active' : ''}`}
            onClick={() => k.setTab(t.id)}
          >
            <span className="n-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {switching && (
        <BottomSheet title="Quel chien ?" onClose={() => setSwitching(false)}>
          <div className="carnet-list">
            {carnets.map((c) => (
              <button
                key={c.id}
                className={`carnet-item ${c.id === carnet?.id ? 'on' : ''}`}
                onClick={() => {
                  onSwitchCarnet?.(c.id);
                  setSwitching(false);
                }}
              >
                <span className="carnet-name">{c.dogName}</span>
                <span className="carnet-mode">
                  {c.mode === 'journal' ? 'journal seul' : 'journal + entraînement'}
                </span>
              </button>
            ))}
          </div>
          <button
            className="btn btn-ghost btn-block"
            onClick={() => {
              setSwitching(false);
              onAddCarnet?.();
            }}
          >
            ＋ Ajouter un chien
          </button>
        </BottomSheet>
      )}

      {k.showOnboarding && (
        <OnboardingSheet state={k.viewState} onValidate={k.validateOnboarding} />
      )}
      {k.toast && <div className="toast">{k.toast}</div>}
      <Confetti burst={k.burst} />
    </div>
  );
}
