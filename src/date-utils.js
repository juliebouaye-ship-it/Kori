// ============================================================
// Helpers de date partagés (purs, sans React)
// ============================================================
// Source unique pour les manipulations de date de l'appli, jusqu'ici
// copiées-collées dans App.jsx, carnet.jsx et insights.js.

// Date locale au format AAAA-MM-JJ (fuseau de l'appareil, pas UTC).
export const localDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Nb de jours calendaires entre deux dates AAAA-MM-JJ (a - b, positif si a après b).
export const daysBetween = (a, b) =>
  Math.round((new Date(a + 'T00:00') - new Date(b + 'T00:00')) / 86400000);

// Formatage FR lisible d'une date ISO (AAAA-MM-JJ).
export const frDate = (iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(iso + 'T00:00').toLocaleDateString('fr-FR', opts);
