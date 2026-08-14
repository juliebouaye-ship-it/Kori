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
const params = new URLSearchParams(location.search);
const SANDBOX_CARNET = {
  id: null,
  dogName: 'Kori',
  mode: params.get('mode') === 'journal' ? 'journal' : 'complet',
  inviteCode: 'ABC234',
};
// `?chiens=2` simule un foyer à deux chiens pour vérifier le sélecteur.
const SANDBOX_CARNETS =
  params.get('chiens') === '2'
    ? [SANDBOX_CARNET, { id: 'x', dogName: 'Nala', mode: 'journal', inviteCode: 'DEF567' }]
    : [SANDBOX_CARNET];

const Root = () =>
  syncEnabled ? (
    <AuthGate>
      {(user) => (
        <CarnetGate user={user}>
          {(carnet, { carnets, user: gateUser, switchTo, addCarnet, joinCarnet, deleteCarnet }) => (
            <App
              carnet={carnet}
              carnets={carnets}
              user={gateUser}
              onSwitchCarnet={switchTo}
              onAddCarnet={addCarnet}
              onJoinCarnet={joinCarnet}
              onDeleteCarnet={deleteCarnet}
            />
          )}
        </CarnetGate>
      )}
    </AuthGate>
  ) : (
    <App carnet={SANDBOX_CARNET} carnets={SANDBOX_CARNETS} user={{ id: 'sandbox' }} />
  );

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
