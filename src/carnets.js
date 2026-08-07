// ============================================================
// Carnets — helpers purs (testables au Node)
// ============================================================

// Alphabet sans caractères ambigus : ni O/0, ni I/1/L. Un code d'invitation se
// lit à voix haute ou se recopie depuis un SMS, il ne doit pas prêter à confusion.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function makeInviteCode(random = Math.random) {
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  }
  return out;
}

// Saisie tolérante : minuscules, espaces et tirets acceptés. On ne garde que
// les caractères de l'alphabet — inutile de « rattraper » un O ou un 1, ils n'y
// figurent pas justement pour qu'on ne puisse pas les confondre.
export function normalizeInviteCode(raw) {
  return (raw || '')
    .toUpperCase()
    .split('')
    .filter((c) => CODE_ALPHABET.includes(c))
    .join('')
    .slice(0, 6);
}

export const MODES = [
  {
    id: 'journal',
    label: 'Journal seul',
    detail: 'Les balades et les progrès. Rien d’autre à l’écran.',
  },
  {
    id: 'complet',
    label: 'Journal + entraînement',
    detail: 'Avec l’arbre de compétences et les séances.',
  },
];

export const isJournalOnly = (carnet) => carnet?.mode === 'journal';

// Onglets visibles selon le mode : un carnet « journal seul » n'affiche ni
// l'arbre ni l'entraînement, mais garde l'aide (les diagnostics valent pour tout
// le monde).
export const tabsForMode = (mode, allTabs) =>
  mode === 'journal'
    ? allTabs.filter((t) => t.id === 'balade' || t.id === 'stats' || t.id === 'help')
    : allTabs;

export const defaultTabForMode = (mode) => (mode === 'journal' ? 'balade' : 'train');
