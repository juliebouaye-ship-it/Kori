// ============================================================
// Cœur de synchro (pur, sans dépendance à InstantDB ni React)
// ============================================================
// Sépare la logique testable (assemblage, diff) de l'orchestration
// (transactions InstantDB + hooks) qui vit dans store.js.
//
// Modèle distant :
//   - `carnets` : une ligne par chien — porte la configuration et les compteurs,
//     et la liste de ses membres. Remplace l'ancien enregistrement `meta` unique
//     d'identifiant fixe, qui rendait le multi-utilisateur impossible.
//   - `walks` / `sessions` / `care` / `reminders` / `firsts` / `skillProgress` /
//     `palierDone` : une ligne par élément, rattachée à son carnet → Explorer
//     lisible et fusion sûre à plusieurs (deux ajouts simultanés coexistent).

export const COLLECTIONS = [
  'walks',
  'sessions',
  'care',
  'reminders',
  'firsts',
  'skillProgress',
  'palierDone',
  'cues',
];
// Champs portés par la ligne `carnets` elle-même : de la CONFIG (une poignée
// d'entrées, modifiée très rarement), pas un flux d'éléments — le dernier
// écrivain gagne, ce qui est acceptable à cette fréquence.
// `cues` en est sorti pour sa propre table : régler un signal se fait à deux, et
// un blob unique faisait s'écraser deux réglages simultanés.
export const CARNET_FIELDS = ['onboarded', 'wallet', 'lifetime', 'decompOff', 'places'];

// Forme canonique de chaque type d'élément (+ valeurs par défaut). Garantit que
// local et distant convergent vers exactement les mêmes clés, quelle que soit la
// façon dont InstantDB gère les champs absents/null → pas de faux diff en boucle.
export const COLLECTION_FIELDS = {
  walks: { date: '', ts: 0, level: '', location: null, duration: null, triggers: [], note: '' },
  sessions: { date: '', skillId: '', palierId: '', rating: '', xp: 0, ts: 0 },
  care: { date: '', ts: 0, kind: '', label: '', grams: null, treatId: null },
  reminders: { type: '', label: '', dueDate: '', note: '' },
  firsts: { date: '', title: '', note: '' },
  skillProgress: { skillId: '', status: '' }, // status: 'known' | 'learning' | 'mastered'
  palierDone: { palierId: '', skillId: '', doneAt: '' },
  cues: { skillId: '', word: '', gesture: '' },
};

export function uuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// Sérialisation stable (clés triées récursivement) : insensible à l'ordre des
// clés, pour comparer fiablement deux états.
function stable(v) {
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  if (v && typeof v === 'object') {
    return '{' + Object.keys(v).sort().map((k) => JSON.stringify(k) + ':' + stable(v[k])).join(',') + '}';
  }
  return JSON.stringify(v === undefined ? null : v);
}

// Projette un élément sur sa forme canonique (id + tous les champs attendus).
function projectItem(coll, item) {
  const spec = COLLECTION_FIELDS[coll];
  const out = { id: item.id };
  for (const k of Object.keys(spec)) out[k] = item[k] !== undefined ? item[k] : spec[k];
  return out;
}

const indexById = (items) => {
  const m = {};
  for (const it of items) m[it.id] = it;
  return m;
};

// ---- distant -> état applicatif -------------------------------------------
// `carnet` = la ligne `carnets` avec ses collections imbriquées (la requête les
// remonte via les liens) ; `normalize` fusionne les défauts.
export function assemble(carnet, normalize = (s) => s) {
  const row = carnet || {};
  const base = {};
  for (const f of CARNET_FIELDS) if (row[f] !== undefined) base[f] = row[f];
  for (const c of COLLECTIONS) base[c] = (row[c] || []).map((r) => projectItem(c, r));
  return normalize(base);
}

// Empreinte canonique d'un état (compteurs + collections triées par id).
export function canonical(state) {
  const obj = {};
  for (const f of CARNET_FIELDS) obj[f] = state[f] === undefined ? null : state[f];
  for (const c of COLLECTIONS) {
    obj[c] = (state[c] || [])
      .map((i) => projectItem(c, i))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }
  return stable(obj);
}

function carnetObjectOf(state) {
  const row = {};
  for (const f of CARNET_FIELDS) row[f] = state[f];
  return row;
}

// Plan de diff : ce qui a changé entre `prev` et `next`.
export function diffPlan(prev, next) {
  const upserts = [];
  const deletes = [];

  const carnetChanged =
    !prev || CARNET_FIELDS.some((f) => stable(prev[f]) !== stable(next[f]));
  const carnetUpdate = carnetChanged ? carnetObjectOf(next) : null;

  for (const c of COLLECTIONS) {
    const prevIdx = indexById((prev?.[c] || []).map((i) => projectItem(c, i)));
    const nextItems = (next[c] || []).map((i) => projectItem(c, i));
    const nextIds = new Set();
    for (const item of nextItems) {
      nextIds.add(item.id);
      const p = prevIdx[item.id];
      if (!p || stable(p) !== stable(item)) {
        const { id, ...attrs } = item;
        upserts.push({ coll: c, id, attrs });
      }
    }
    for (const id of Object.keys(prevIdx)) {
      if (!nextIds.has(id)) deletes.push({ coll: c, id });
    }
  }

  return { carnetUpdate, upserts, deletes };
}
