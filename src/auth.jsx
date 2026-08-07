// ============================================================
// Connexion — code à usage unique envoyé par e-mail
// ============================================================
// Pas de mot de passe : on saisit son adresse, InstantDB envoie un code à six
// chiffres, on le tape. Rien à retenir, rien à stocker de sensible côté appli,
// et la session reste ouverte sur le téléphone — en pratique on ne le refait
// quasiment jamais.
//
// Un bouton « Continuer avec Google » viendra s'ajouter ici : il demande un
// projet Google Cloud et des URLs de redirection déclarées côté Netlify et
// InstantDB, donc il arrive dans un second temps.

import { useState } from 'react';
import { db } from './db.js';

// Message d'erreur : notre phrase, plus le détail brut du serveur. Masquer ce
// détail rend un échec de connexion impossible à diagnostiquer à distance.
function ErrorLine({ error }) {
  if (!error) return null;
  return (
    <p className="auth-error">
      {error.text}
      {error.detail && <span className="auth-error-detail">{error.detail}</span>}
    </p>
  );
}

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

function SignIn() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sentTo, setSentTo] = useState(null); // adresse à laquelle le code est parti
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // InstantDB renvoie ses messages en anglais : on affiche une phrase à nous,
  // mais on garde la sienne en dessous — sans elle, un échec est indébogable.
  const fail = (err, fallback) => {
    console.error(err);
    const detail = err?.body?.message || err?.message || null;
    setError({ text: fallback, detail });
    setBusy(false);
  };

  const send = async (e) => {
    e.preventDefault();
    const addr = email.trim().toLowerCase();
    if (!addr) return;
    setBusy(true);
    setError(null);
    try {
      await db.auth.sendMagicCode({ email: addr });
      setSentTo(addr);
      setBusy(false);
    } catch (err) {
      fail(err, "Impossible d'envoyer le code. Vérifie l'adresse et réessaie.");
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    // On se contente d'enlever les espaces autour. Toute autre « correction »
    // (filtrer les non-chiffres, tronquer) risque d'altérer un code parfaitement
    // valide : c'est au serveur de juger, pas à ce champ.
    const c = code.trim();
    if (!c) return;
    setBusy(true);
    setError(null);
    try {
      await db.auth.signInWithMagicCode({ email: sentTo, code: c });
      // succès : db.useAuth() bascule, le composant est démonté.
    } catch (err) {
      fail(err, 'Ce code n’a pas été accepté.');
    }
  };

  const resend = async () => {
    setBusy(true);
    setError(null);
    setCode('');
    try {
      await db.auth.sendMagicCode({ email: sentTo });
      setBusy(false);
    } catch (err) {
      fail(err, "L'envoi a échoué.");
    }
  };

  if (!sentTo) {
    return (
      <Screen>
        <h1>Le carnet</h1>
        <p className="auth-sub">Entre ton adresse, on t’envoie un code.</p>
        <form onSubmit={send}>
          <input
            className="auth-input"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="ton@adresse.fr"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <ErrorLine error={error} />
          <button className="btn btn-primary btn-block" disabled={busy || !email.trim()}>
            {busy ? 'Envoi…' : 'Recevoir un code'}
          </button>
        </form>
      </Screen>
    );
  }

  return (
    <Screen>
      <h1>Le code</h1>
      <p className="auth-sub">
        Envoyé à <strong>{sentTo}</strong>. Il peut mettre une minute.
      </p>
      <form onSubmit={verify}>
        <input
          className="auth-input auth-code"
          type="text"
          autoComplete="one-time-code"
          placeholder="Le code reçu"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          autoFocus
        />
        <ErrorLine error={error} />
        <button className="btn btn-primary btn-block" disabled={busy || !code.trim()}>
          {busy ? 'Vérification…' : 'Entrer'}
        </button>
      </form>
      <button className="back-link" onClick={resend} disabled={busy}>
        Renvoyer un code
      </button>
      <button
        className="back-link"
        onClick={() => {
          setSentTo(null);
          setCode('');
          setError(null);
        }}
      >
        Changer d’adresse
      </button>
    </Screen>
  );
}

/**
 * Portier : tant que personne n'est connecté, l'application n'est pas montée
 * du tout — donc aucune requête sur les données ne part.
 */
export function AuthGate({ children }) {
  const { isLoading, user, error } = db.useAuth();

  if (isLoading) {
    return (
      <div className="app app-loading">
        <div className="loading-paw">🐾</div>
        <p className="muted">Un instant…</p>
      </div>
    );
  }

  if (error) {
    return (
      <Screen>
        <h1>Connexion impossible</h1>
        <p className="auth-sub">Vérifie ta connexion internet, puis recharge la page.</p>
      </Screen>
    );
  }

  if (!user) return <SignIn />;
  return children(user);
}

export const signOut = () => db.auth.signOut();
