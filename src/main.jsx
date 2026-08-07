import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { AuthGate } from './auth.jsx';
import { CarnetGate } from './carnet-gate.jsx';
import { syncEnabled } from './db.js';
import './styles.css';

// Sans App ID (bac à sable : `.env` écarté), on court-circuite connexion et
// choix de carnet — il n'y a ni réseau ni persistance, donc rien à protéger.
// C'est ce qui permet de tester l'appli sans toucher à un carnet réel.
// `?mode=journal` sert à inspecter l'autre mode sans créer de compte ; sans App
// ID cette branche n'existe pas en production.
const SANDBOX_CARNET = {
  id: null,
  dogName: 'Kori',
  mode: new URLSearchParams(location.search).get('mode') === 'journal' ? 'journal' : 'complet',
  inviteCode: 'ABC234',
};

const Root = () =>
  syncEnabled ? (
    <AuthGate>{(user) => <CarnetGate user={user}>{(carnet) => <App carnet={carnet} />}</CarnetGate>}</AuthGate>
  ) : (
    <App carnet={SANDBOX_CARNET} />
  );

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
