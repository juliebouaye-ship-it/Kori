import { useKoriState } from './state/useKoriState.js';
import { Confetti } from './ui.jsx';
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

export default function App() {
  const k = useKoriState();

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
        <span className="topbar-tier" title={k.tier.name}>
          {k.tier.emoji}
        </span>
        <span className="topbar-name">Kori</span>
        <span className="topbar-metrics">
          <span>{k.state.wallet} 🦴</span>
          <span title="Jours d’entraînement ce mois">🎾 {k.monthStats.days} j</span>
        </span>
      </header>

      {k.tab === 'train' && (
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
      {k.tab === 'balade' && (
        <BaladeTab
          state={k.viewState}
          onLogWalk={k.logWalk}
          onUpdateWalk={k.updateWalk}
          onDeleteWalk={k.deleteWalk}
          decomp={k.decomp}
          onDismissDecomp={k.dismissDecomp}
          care={k.care}
        />
      )}
      {k.tab === 'tree' && (
        <TreeTab
          state={k.viewState}
          onUnlock={k.unlockSkill}
          reopenOnboarding={() => k.setManualOnboarding(true)}
        />
      )}
      {k.tab === 'stats' && <StatsTab state={k.viewState} onAddFirst={k.addFirst} />}
      {k.tab === 'help' && <HelpTab state={k.viewState} onSetCue={k.setCue} />}

      <nav className="bottom-nav">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`nav-btn ${k.tab === t.id ? 'active' : ''}`}
            onClick={() => k.setTab(t.id)}
          >
            <span className="n-icon">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {k.showOnboarding && (
        <OnboardingSheet state={k.viewState} onValidate={k.validateOnboarding} />
      )}
      {k.toast && <div className="toast">{k.toast}</div>}
      <Confetti burst={k.burst} />
    </div>
  );
}
