// ============================================================
// Synchro d'un carnet entre appareils (InstantDB)
// ============================================================
// Chaque type d'élément a sa propre table (balades, séances, soins, rappels,
// premières fois, progression) et chaque ligne est rattachée à son carnet par un
// lien → Explorer lisible, fusion sûre à plusieurs, et surtout isolation entre
// carnets. La configuration et les compteurs vivent sur la ligne `carnets`.
//
// La logique pure (assemblage, diff) est dans sync-core.js ; ici on se contente
// d'orchestrer les transactions InstantDB et le cycle React.

import { useEffect, useRef, useState } from 'react';
import { db, syncEnabled } from './db.js';
import { COLLECTIONS, assemble, canonical, diffPlan } from './sync-core.js';

const PUSH_DEBOUNCE_MS = 800;

// Requête d'un carnet précis avec toutes ses collections imbriquées : une seule
// requête suffit, et les permissions garantissent qu'on ne voit que les siens.
export const carnetQuery = (carnetId) => ({
  carnets: {
    $: { where: { id: carnetId } },
    walks: {},
    sessions: {},
    care: {},
    reminders: {},
    firsts: {},
    skillProgress: {},
    palierDone: {},
  },
});

// Traduit un plan (carnet + upserts + deletes) en une transaction InstantDB.
// Chaque upsert (re)pose le lien vers le carnet : l'opération est idempotente,
// et c'est ce qui garantit qu'aucune ligne ne peut naître orpheline.
function applyPlan(plan, carnetId) {
  const txs = [];
  if (plan.carnetUpdate) {
    txs.push(db.tx.carnets[carnetId].update({ ...plan.carnetUpdate, updatedAt: Date.now() }));
  }
  for (const u of plan.upserts || []) {
    txs.push(db.tx[u.coll][u.id].update(u.attrs).link({ carnet: carnetId }));
  }
  for (const d of plan.deletes || []) txs.push(db.tx[d.coll][d.id].delete());
  if (txs.length) db.transact(txs);
}

/**
 * @param {string|null} carnetId  le carnet actif (null = pas encore choisi)
 * @param {object} state          l'état courant de l'app
 * @param {function} setState     le setter React de l'état
 * @param {function} normalize    (remoteState) => état complet (fusion des défauts)
 * @returns {boolean} ready — true une fois le carnet distant chargé (ou si la
 *   synchro est désactivée). Tant que c'est false, l'app ne doit pas encore
 *   décider quoi afficher (ex. le bilan de départ) pour éviter tout clignotement.
 */
export function useKoriSync(carnetId, state, setState, normalize = (s) => s) {
  const active = syncEnabled && Boolean(carnetId);
  const { data } = db.useQuery(active ? carnetQuery(carnetId) : null);
  const [ready, setReady] = useState(!active);

  const loaded = useRef(false);
  const lastCanon = useRef(null); // empreinte du dernier état « d'accord »
  const lastState = useRef(null); // dernier état poussé/reçu (base du prochain diff)

  // Changer de carnet remet la synchro à zéro : sans ça, le premier diff
  // comparerait l'état du carnet précédent au nouveau et écraserait des données.
  useEffect(() => {
    loaded.current = false;
    lastCanon.current = null;
    lastState.current = null;
    setReady(!active);
  }, [carnetId, active]);

  // ---- distant -> local ----
  useEffect(() => {
    if (!active || !data) return;
    const carnet = (data.carnets || [])[0];
    if (!carnet) return; // carnet inaccessible ou supprimé : on ne touche à rien

    const assembled = assemble(carnet, normalize);
    const canon = canonical(assembled);
    if (canon !== lastCanon.current) {
      lastCanon.current = canon;
      lastState.current = assembled;
      setState(assembled);
    }
    loaded.current = true;
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, active]);

  // ---- local -> distant (diff debouncé) ----
  // ⚠️ Ce hook doit rester APRÈS tout autre hook : un `return` placé avant lui
  // l'a déjà rendu mort une fois, ce qui avait fait perdre silencieusement
  // toutes les écritures.
  useEffect(() => {
    if (!active || !loaded.current) return;
    const canon = canonical(state);
    if (canon === lastCanon.current) return; // provient d'une synchro distante
    const t = setTimeout(() => {
      applyPlan(diffPlan(lastState.current, state), carnetId);
      lastState.current = state;
      lastCanon.current = canon;
    }, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [state, active, carnetId]);

  return ready;
}

// Champs d'identité du carnet (nom, mode, code d'invitation) : ils ne passent
// pas par le diff d'état, qui ne gère que la configuration et les collections.
export function updateCarnet(carnetId, patch) {
  if (!carnetId) return;
  db.transact(db.tx.carnets[carnetId].update({ ...patch, updatedAt: Date.now() }));
}

// Réexporté pour les écrans de création/rattachement de carnet.
export { COLLECTIONS };
