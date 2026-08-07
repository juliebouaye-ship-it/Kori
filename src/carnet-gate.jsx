// ============================================================
// Choix du carnet — création, sélection, rejoindre par code
// ============================================================
// Placé entre la connexion et l'application : une fois connecté, on travaille
// toujours DANS un carnet. Un compte peut en avoir plusieurs (un deuxième chien,
// ou une éducatrice qui suit le sien en plus de celui d'un client).

import { useState } from 'react';
import { db } from './db.js';
import { uuid } from './sync-core.js';
import { makeInviteCode, normalizeInviteCode, MODES } from './carnets.js';

function Screen({ children }) {
  return (
    <div className="app auth-screen">
      <div className="auth-card">
        <div className="auth-paw">🐾</div>
        {children}
      </div>
    </div>
  );
}

// ---- Créer un carnet -------------------------------------------------------
function CreateCarnet({ user, onDone, onJoinInstead, canCancel, onCancel }) {
  const [name, setName] = useState('');
  const [mode, setMode] = useState('complet');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const create = async (e) => {
    e.preventDefault();
    const dogName = name.trim();
    if (!dogName) return;
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
            cues: {},
            decompOff: [],
            places: [],
            createdAt: Date.now(),
            updatedAt: Date.now(),
          })
          // On se rattache comme membre dans la MÊME transaction : sans ça, le
          // carnet naîtrait sans propriétaire et deviendrait inaccessible dès
          // que les règles de permissions sont en place.
          .link({ members: user.id }),
      );
      onDone?.(id);
    } catch (err) {
      console.error(err);
      setError('La création a échoué. Réessaie dans un instant.');
      setBusy(false);
    }
  };

  return (
    <Screen>
      <h1>Un nouveau carnet</h1>
      <p className="auth-sub">Le nom de ton chien, pour commencer.</p>
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
      <button className="back-link" onClick={onJoinInstead}>
        Rejoindre un carnet existant
      </button>
      {canCancel && (
        <button className="back-link" onClick={onCancel}>
          Annuler
        </button>
      )}
    </Screen>
  );
}

// ---- Rejoindre un carnet avec un code --------------------------------------
function JoinCarnet({ user, onDone, onCreateInstead }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const join = async (e) => {
    e.preventDefault();
    if (code.length < 6) return;
    setBusy(true);
    setError(null);
    try {
      // Le code circule en paramètre de règle : c'est lui qui autorise à voir ce
      // carnet-là, et rien d'autre dans la base.
      const { data } = await db.queryOnce({
        carnets: { $: { where: { inviteCode: code }, ruleParams: { inviteCode: code } } },
      });
      const carnet = (data.carnets || [])[0];
      if (!carnet) {
        setError('Aucun carnet avec ce code. Vérifie les six caractères.');
        setBusy(false);
        return;
      }
      await db.transact(
        db.tx.carnets[carnet.id].ruleParams({ inviteCode: code }).link({ members: user.id }),
      );
      onDone?.(carnet.id);
    } catch (err) {
      console.error(err);
      setError('Impossible de rejoindre ce carnet. Réessaie dans un instant.');
      setBusy(false);
    }
  };

  return (
    <Screen>
      <h1>Rejoindre un carnet</h1>
      <p className="auth-sub">Le code à six caractères partagé par l’autre personne.</p>
      <form onSubmit={join}>
        <input
          className="auth-input auth-code"
          placeholder="ABC234"
          value={code}
          onChange={(e) => setCode(normalizeInviteCode(e.target.value))}
          autoFocus
        />
        {error && <p className="auth-error">{error}</p>}
        <button className="btn btn-primary btn-block" disabled={busy || code.length < 6}>
          {busy ? 'Vérification…' : 'Rejoindre'}
        </button>
      </form>
      <button className="back-link" onClick={onCreateInstead}>
        Créer plutôt un nouveau carnet
      </button>
    </Screen>
  );
}

// ---- Choisir entre plusieurs carnets ---------------------------------------
function PickCarnet({ carnets, onPick, onNew }) {
  return (
    <Screen>
      <h1>Quel carnet ?</h1>
      <div className="carnet-list">
        {carnets.map((c) => (
          <button key={c.id} className="carnet-item" onClick={() => onPick(c.id)}>
            <span className="carnet-name">{c.dogName}</span>
            <span className="carnet-mode">
              {c.mode === 'journal' ? 'journal seul' : 'journal + entraînement'}
            </span>
          </button>
        ))}
      </div>
      <button className="back-link" onClick={onNew}>
        Ajouter un carnet
      </button>
    </Screen>
  );
}

/**
 * Résout le carnet actif et le passe à l'application.
 * `children(carnet)` n'est appelé que lorsqu'un carnet est sélectionné.
 */
export function CarnetGate({ user, children }) {
  const [picked, setPicked] = useState(null);
  const [intent, setIntent] = useState(null); // 'create' | 'join' | null

  const { isLoading, error, data } = db.useQuery({
    carnets: { $: { where: { 'members.id': user.id } } },
  });

  if (isLoading) {
    return (
      <div className="app app-loading">
        <div className="loading-paw">🐾</div>
        <p className="muted">Chargement du carnet…</p>
      </div>
    );
  }

  if (error) {
    return (
      <Screen>
        <h1>Carnet inaccessible</h1>
        <p className="auth-sub">Vérifie ta connexion, puis recharge la page.</p>
      </Screen>
    );
  }

  const carnets = data?.carnets || [];
  const done = (id) => {
    setPicked(id);
    setIntent(null);
  };

  if (intent === 'join') {
    return <JoinCarnet user={user} onDone={done} onCreateInstead={() => setIntent('create')} />;
  }
  if (intent === 'create' || carnets.length === 0) {
    return (
      <CreateCarnet
        user={user}
        onDone={done}
        onJoinInstead={() => setIntent('join')}
        canCancel={carnets.length > 0}
        onCancel={() => setIntent(null)}
      />
    );
  }

  const active = carnets.find((c) => c.id === picked) || (carnets.length === 1 ? carnets[0] : null);
  if (!active) {
    return <PickCarnet carnets={carnets} onPick={setPicked} onNew={() => setIntent('create')} />;
  }

  return children(active);
}
