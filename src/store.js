// ============================================================
// Synchro du carnet de Kori entre appareils (InstantDB)
// ============================================================
// Chaque type d'élément a sa propre table (balades, séances, repas/soins,
// rappels, premières fois) → Explorer InstantDB lisible + fusion sûre à deux
// (deux ajouts simultanés coexistent au lieu de s'écraser). Les compteurs et la
// config restent dans un enregistrement `meta` unique.
//
// La logique pure (assemblage, diff, migration) est dans sync-core.js ; ici on
// se contente d'orchestrer les transactions InstantDB et de gérer le cycle React.

import { useEffect, useRef, useState } from 'react';
import { db, META_ID, KORI_ID, syncEnabled } from './db.js';
import {
  COLLECTIONS,
  assemble,
  canonical,
  diffPlan,
  seedPlan,
  migrateIds,
  hasData,
} from './sync-core.js';

const PUSH_DEBOUNCE_MS = 800;

// On interroge toutes les tables + l'ancien `carnet` (mono-bloc) pour pouvoir
// migrer les données héritées lors du tout premier lancement du nouveau modèle.
const QUERY = {
  meta: {},
  walks: {},
  sessions: {},
  care: {},
  reminders: {},
  firsts: {},
  carnet: {},
};

// Traduit un plan (meta + upserts + deletes) en une transaction InstantDB.
function applyPlan(plan) {
  const txs = [];
  if (plan.metaUpdate) {
    txs.push(db.tx.meta[META_ID].update({ ...plan.metaUpdate, updatedAt: Date.now() }));
  }
  for (const u of plan.upserts || []) txs.push(db.tx[u.coll][u.id].update(u.attrs));
  for (const d of plan.deletes || []) txs.push(db.tx[d.coll][d.id].delete());
  if (txs.length) db.transact(txs);
}

/**
 * @param {object} state       l'état courant de l'app
 * @param {function} setState  le setter React de l'état
 * @param {function} normalize (remoteState) => état complet (fusion des défauts)
 * @returns {boolean} ready — true une fois le carnet distant chargé (ou si la
 *   synchro est désactivée). Tant que c'est false, l'app ne doit pas encore
 *   décider quoi afficher (ex. le bilan de départ) pour éviter tout clignotement.
 */
export function useKoriSync(state, setState, normalize = (s) => s) {
  const { data } = db.useQuery(syncEnabled ? QUERY : null);
  const [ready, setReady] = useState(!syncEnabled);

  const seeded = useRef(false);
  const lastCanon = useRef(null); // empreinte du dernier état « d'accord »
  const lastState = useRef(null); // dernier état poussé/reçu (base du prochain diff)
  const currentState = useRef(state);
  currentState.current = state; // toujours la dernière valeur pour l'amorçage

  // ---- distant -> local (+ migration/amorçage) ----
  useEffect(() => {
    if (!syncEnabled || !data) return;

    const isEmpty =
      (data.meta || []).length === 0 && COLLECTIONS.every((c) => (data[c] || []).length === 0);

    if (isEmpty) {
      if (seeded.current) return; // on n'amorce qu'une fois
      seeded.current = true;

      // Source des données : l'état local s'il contient déjà quelque chose
      // (cas normal : ce téléphone a du localStorage), sinon l'ancien carnet
      // mono-bloc distant s'il existe (cas d'un appareil neuf).
      const oldBlob = (data.carnet || [])[0]?.state;
      const source = hasData(currentState.current)
        ? currentState.current
        : oldBlob
          ? normalize(oldBlob)
          : currentState.current;

      const migrated = normalize(migrateIds(source));
      lastState.current = migrated;
      lastCanon.current = canonical(migrated);
      setState(migrated);
      applyPlan(seedPlan(migrated));
      // ménage : on retire l'ancienne ligne unique désormais migrée.
      if (oldBlob) db.transact(db.tx.carnet[KORI_ID].delete());
      setReady(true);
      return;
    }

    seeded.current = true;
    const assembled = assemble(data, normalize);
    const canon = canonical(assembled);
    if (canon !== lastCanon.current) {
      lastCanon.current = canon;
      lastState.current = assembled;
      setState(assembled);
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return ready;

  // ---- local -> distant (diff debouncé) ----
  useEffect(() => {
    if (!syncEnabled || !seeded.current) return;
    const canon = canonical(state);
    if (canon === lastCanon.current) return; // provient d'une synchro distante
    const t = setTimeout(() => {
      applyPlan(diffPlan(lastState.current, state));
      lastState.current = state;
      lastCanon.current = canon;
    }, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [state]);
}
