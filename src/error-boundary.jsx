import { Component } from 'react';

// Garde-fou global : un crash React affichait un écran blanc, sans indication
// pour quelqu'un qui ne connaît pas Julie. Doit rester une CLASSE — c'est la
// seule forme de composant React qui peut intercepter une erreur de rendu.
export class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error(error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="app auth-screen">
        <div className="auth-card">
          <div className="auth-paw">🐾</div>
          <h1>Un souci est survenu</h1>
          <p className="auth-sub">Recharge la page, ça repart en général.</p>
          <button className="btn btn-primary btn-block" onClick={() => window.location.reload()}>
            Recharger
          </button>
        </div>
      </div>
    );
  }
}
