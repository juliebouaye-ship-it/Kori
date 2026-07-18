// ============================================================
// Synchro du carnet de Kori entre appareils (InstantDB)
// ============================================================
// Stratégie : on garde l'architecture existante (un seul objet `state` dans
// App). Ce hook fait le pont avec InstantDB dans les deux sens :
//   - distant -> local : le temps réel pousse toute modif de l'autre téléphone,
//     on l'applique via setState.
//   - local -> distant : à chaque changement de `state`, on pousse (debouncé)
//     l'état complet dans l'unique enregistrement `carnet`.
// Un garde-fou (`lastSynced`) mémorise le dernier état « d'accord » sérialisé
// pour éviter la boucle (une modif reçue ne repart pas, et notre propre écho ne
// se ré-applique pas).
// Conflit : last-write-wins sur le blob entier ; le temps réel garde les deux
// téléphones alignés, donc les écrasements sont rares.

import { useEffect, useRef } from 'react';
import { db, KORI_ID, syncEnabled } from './db.js';

const serialize = (s) => JSON.stringify(s);
const PUSH_DEBOUNCE_MS = 800;

/**
 * @param {object} state       l'état courant de l'app
 * @param {function} setState  le setter React de l'état
 * @param {function} normalize (remoteState) => state complet (fusion des défauts)
 */
export function useKoriSync(state, setState, normalize = (s) => s) {
  // useQuery(null) => le hook est bien appelé mais aucune requête n'est faite
  // tant que la synchro n'est pas activée (pas d'App ID configuré).
  const { data } = db.useQuery(syncEnabled ? { carnet: {} } : null);

  const lastSynced = useRef(null);
  const seeded = useRef(false);

  // ---- distant -> local (+ amorçage du carnet s'il est vide) ----
  useEffect(() => {
    if (!syncEnabled || !data) return;
    const rows = data.carnet || [];

    if (rows.length === 0) {
      // Aucun carnet distant encore : on l'amorce (une seule fois) avec
      // l'état local actuel — ne perd rien des données déjà saisies.
      if (seeded.current) return;
      seeded.current = true;
      lastSynced.current = serialize(state);
      db.transact(db.tx.carnet[KORI_ID].update({ state, updatedAt: Date.now() }));
      return;
    }

    seeded.current = true;
    const remoteRaw = rows[0].state;
    if (!remoteRaw) return;
    const remote = normalize(remoteRaw);
    const rstr = serialize(remote);
    if (rstr !== lastSynced.current) {
      lastSynced.current = rstr;
      setState(remote);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  // ---- local -> distant (debouncé) ----
  useEffect(() => {
    if (!syncEnabled) return;
    const str = serialize(state);
    if (str === lastSynced.current) return; // provient d'une synchro distante
    const t = setTimeout(() => {
      lastSynced.current = str;
      db.transact(db.tx.carnet[KORI_ID].update({ state, updatedAt: Date.now() }));
    }, PUSH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [state]);
}
