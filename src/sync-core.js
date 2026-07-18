// ============================================================
// Cœur de synchro (pur, sans dépendance à InstantDB ni React)
// ============================================================
// Sépare la logique testable (assemblage, diff, migration) de l'orchestration
// (transactions InstantDB + hooks) qui vit dans store.js.
//
// Modèle distant :
//   - `meta`   : un seul enregistrement — compteurs & config (niveau, portefeuille,
//                statuts de compétences, paliers, antisèche).
//   - `walks` / `sessions` / `care` / `reminders` / `firsts` : une ligne par
//     élément → Explorer lisible + fusion sûre à deux (pas d'écrasement global).

export const COLLECTIONS = ['walks', 'sessions', 'care', 'reminders', 'firsts'];
export const META_FIELDS = ['onboarded', 'wallet', 'lifetime', 'skillStatus', 'paliersDone', 'cues'];

// Forme canonique de chaque type d'élément (+ valeurs par défaut). Garantit que
// local et distant convergent vers exactement les mêmes clés, quelle que soit la
// façon dont InstantDB gère les champs absents/null → pas de faux diff en boucle.
export const COLLECTION_FIELDS = {
  walks: { date: '', ts: 0, level: '', location: null, triggers: [], note: '' },
  sessions: { date: '', skillId: '', palierId: '', rating: '', xp: 0, ts: 0 },
  care: { date: '', ts: 0, kind: '', label: '', grams: null, treatId: null },
  reminders: { type: '', label: '', dueDate: '', note: '' },
  firsts: { date: '', title: '', note: '' },
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (s) => typeof s === 'string' && UUID_RE.test(s);

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
// `data` = résultat de la requête InstantDB ; `normalize` fusionne les défauts.
export function assemble(data, normalize = (s) => s) {
  const metaRow = (data.meta || [])[0] || {};
  const base = {};
  for (const f of META_FIELDS) if (metaRow[f] !== undefined) base[f] = metaRow[f];
  for (const c of COLLECTIONS) base[c] = (data[c] || []).map((r) => projectItem(c, r));
  return normalize(base);
}

// Empreinte canonique d'un état (compteurs + collections triées par id).
export function canonical(state) {
  const obj = {};
  for (const f of META_FIELDS) obj[f] = state[f] === undefined ? null : state[f];
  for (const c of COLLECTIONS) {
    obj[c] = (state[c] || [])
      .map((i) => projectItem(c, i))
      .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  }
  return stable(obj);
}

export function hasData(state) {
  if (!state) return false;
  if (state.onboarded) return true;
  if ((state.lifetime || 0) > 0) return true;
  if (state.skillStatus && Object.keys(state.skillStatus).length) return true;
  return COLLECTIONS.some((c) => (state[c] || []).length > 0);
}

// Réattribue un UUID à tout élément dont l'id n'en est pas un (données héritées
// de l'ancien carnet mono-bloc).
export function migrateIds(state) {
  const out = { ...state };
  for (const c of COLLECTIONS) {
    out[c] = (state[c] || []).map((it) => (isUuid(it.id) ? it : { ...it, id: uuid() }));
  }
  return out;
}

function metaObjectOf(state) {
  const meta = {};
  for (const f of META_FIELDS) meta[f] = state[f];
  return meta;
}

// Plan d'amorçage : écrit tout (meta + chaque élément).
export function seedPlan(state) {
  const upserts = [];
  for (const c of COLLECTIONS) {
    for (const raw of state[c] || []) {
      const { id, ...attrs } = projectItem(c, raw);
      upserts.push({ coll: c, id, attrs });
    }
  }
  return { metaUpdate: metaObjectOf(state), upserts, deletes: [] };
}

// Plan de diff : ce qui a changé entre `prev` et `next`.
export function diffPlan(prev, next) {
  const upserts = [];
  const deletes = [];

  const metaChanged =
    !prev || META_FIELDS.some((f) => stable(prev[f]) !== stable(next[f]));
  const metaUpdate = metaChanged ? metaObjectOf(next) : null;

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

  return { metaUpdate, upserts, deletes };
}
