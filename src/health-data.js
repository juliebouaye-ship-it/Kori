// ============================================================
// Carnet de vie & santé — contenu statique
// (repas & friandises du jour, rappels santé, premières fois)
// Pensé « zéro charge mentale » : un tap suffit, rien n'est obligatoire.
// ============================================================

// Friandises listées, à ajouter en un tap. `treat` = utile pour repérer les
// grosses friandises caloriques (mastication) vs récompenses d'entraînement.
export const TREATS = [
  { id: 'oreille', label: 'Oreille de porc', icon: '🐷' },
  { id: 'os-peau', label: 'Os en peau', icon: '🦴' },
  { id: 'entrainement', label: 'Friandise d’entraînement', icon: '🎾' },
  { id: 'fromage', label: 'Fromage', icon: '🧀' },
  { id: 'carotte', label: 'Carotte', icon: '🥕' },
  { id: 'autre', label: 'Autre', icon: '➕' },
];

// Gabarit de repas pré-rempli (bouton « repas habituels ✓ »).
// 2 repas de 140 g de croquettes → modifiable dans l'appli.
export const DEFAULT_MEAL = { label: 'Croquettes', grams: 140 };
export const DEFAULT_MEALS_PER_DAY = 2;

// Types de rappels santé. `everyDays` = suggestion de récurrence pour
// reprogrammer d'un tap quand on marque « fait » (null = ponctuel).
export const REMINDER_TYPES = [
  { id: 'vaccin', label: 'Vaccin', icon: '💉', everyDays: 365 },
  { id: 'vermifuge', label: 'Vermifuge', icon: '🪱', everyDays: 90 },
  { id: 'anti-puces', label: 'Anti-puces / tiques', icon: '🐛', everyDays: 30 },
  { id: 'veto', label: 'Visite véto', icon: '🩺', everyDays: null },
  { id: 'autre', label: 'Autre', icon: '📌', everyDays: null },
];

export const REMINDER_TYPE_BY_ID = Object.fromEntries(
  REMINDER_TYPES.map((r) => [r.id, r])
);
export const TREAT_BY_ID = Object.fromEntries(TREATS.map((t) => [t.id, t]));

// Statut d'une échéance par rapport à aujourd'hui.
// Ne renvoie JAMAIS de statut alarmant pour une absence de données —
// seulement pour des rappels réellement saisis par l'utilisatrice.
export function reminderStatus(dueDate, today) {
  if (!dueDate) return 'none';
  const diff = Math.round(
    (new Date(dueDate + 'T00:00') - new Date(today + 'T00:00')) / 86400000
  );
  if (diff < 0) return 'overdue'; // en retard
  if (diff === 0) return 'today'; // aujourd'hui
  if (diff <= 7) return 'soon'; // dans la semaine
  return 'later';
}
