import { useState } from 'react';
import { useKoriState } from './state/useKoriState.js';
import { tabsForMode, defaultTabForMode, MODES, makeInviteCode } from './carnets.js';
import { signOut } from './auth.jsx';
import { db } from './db.js';
import { uuid } from './sync-core.js';
import { Confetti, BottomSheet } from './ui.jsx';
import { personalize } from './domain.js';
import { TrainTab } from './tabs/TrainTab.jsx';
import { BaladeTab } from './tabs/BaladeTab.jsx';
import { TreeTab } from './tabs/TreeTab.jsx';
import { StatsTab } from './tabs/StatsTab.jsx';
import { HelpTab } from './tabs/HelpTab.jsx';
import { OnboardingSheet } from './tabs/OnboardingSheet.jsx';
import { SupportBanner } from './tabs/banners.jsx';

// ============================================================
// App — routeur : topbar + onglet actif + navigation + overlays.
// Tout l'état et les handlers vivent dans useKoriState.
// ============================================================
const TABS = [
  { id: 'train', label: 'Entraîner', icon: '🎾' },
  { id: 'balade', label: 'Journal', icon: '📓' },
  { id: 'tree', label: 'Arbre', icon: '🌱' },
  { id: 'stats', label: 'Progrès', icon: '📊' },
  { id: 'help', label: 'Réglages', icon: '⚙️' },
];

// Modale autonome : crée le carnet directement, sans passer par l'écran plein
// cadre de CarnetGate. Volontairement indépendante de onAddCarnet (qui bascule
// tout l'écran vers CreateCarnet) — plus fiable et plus rapide à utiliser.
function AddDogSheet({ user, onDone, onClose }) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState('complet');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    const dogName = name.trim();
    if (!dogName || !user?.id) return;
    setBusy(true);
    setError(null);
    const id = uuid();
    try {
      await db.transact(
        db.tx.carnets[id]
          .update({
            dogName,
            mode,
            inviteCode: makeInviteCode(),
            onboarded: false,
            wallet: 12,
            lifetime: 0,
            decompOff: [],
            places: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
          .link({ members: user.id }),
      );
      onDone(id);
    } catch (err) {
      console.error(err);
      setError(err?.message || 'La création a échoué. Réessaie dans un instant.');
      setBusy(false);
    }
  };

  return (
    <BottomSheet title="Un nouveau chien" onClose={onClose}>
      <form onSubmit={create}>
        <input
          className="auth-input"
          placeholder="Son nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          maxLength={30}
        />
        <div className="mode-choice">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              className={`mode-btn ${mode === m.id ? 'on' : ''}`}
              onClick={() => setMode(m.id)}
            >
              <span className="mode-label">{m.label}</span>
              <span className="mode-detail">{m.detail}</span>
            </button>
          ))}
        </div>
        <p className="auth-hint">Ça se change plus tard, dans l’aide.</p>
        {error && <p className="auth-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy || !name.trim()}>
          {busy ? 'Création…' : 'Créer le carnet'}
        </button>
      </form>
    </BottomSheet>
  );
}

export default function App({
  carnet,
  carnets = [],
  user,
  onSwitchCarnet,
  onJoinCarnet,
  onDeleteCarnet,
}) {
  const k = useKoriState(carnet);
  const [switching, setSwitching] = useState(false);
  const [addingDog, setAddingDog] = useState(false);
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
          <span className="topbar-tier" title={personalize(k.tier.name, carnet?.dogName)}>
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
        <button
          className="topbar-add-dog"
          onClick={() => setAddingDog(true)}
          aria-label="Ajouter un chien"
          title="Ajouter un chien"
        >
          ＋
        </button>
        {!k.journalOnly && (
          <span className="topbar-metrics">
            <span>{k.state.wallet} 🦴</span>
            <span title="Jours d’entraînement ce mois">🎾 {k.monthStats.days} j</span>
          </span>
        )}
      </header>

      <SupportBanner carnetCreatedAt={carnet?.createdAt} />

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
          onSetCoatType={k.setCoatType}
          onSignOut={signOut}
          onAddCarnet={() => setAddingDog(true)}
          onJoinCarnet={onJoinCarnet}
          onDeleteCarnet={onDeleteCarnet}
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
              setAddingDog(true);
            }}
          >
            ＋ Ajouter un chien
          </button>
        </BottomSheet>
      )}

      {addingDog && (
        <AddDogSheet
          user={user}
          onClose={() => setAddingDog(false)}
          onDone={(id) => {
            setAddingDog(false);
            onSwitchCarnet?.(id);
          }}
        />
      )}

      {k.showOnboarding && (
        <OnboardingSheet state={k.viewState} onValidate={k.validateOnboarding} />
      )}
      {k.toast && <div className="toast">{k.toast}</div>}
      <Confetti burst={k.burst} />
    </div>
  );
}
