// ============================================================
// Disposition de l'arbre de compétences (pur, sans React)
// ============================================================
// Calcule où placer chaque compétence dans l'arbre visuel à partir des
// prérequis (le DAG). Aucune position n'est saisie à la main : tout se déduit,
// donc l'arbre reste correct quand on ajoute des compétences.
//
//   profondeur d'une compétence = plus longue chaîne de prérequis (racine = 0)
//   → une rangée par profondeur, empilées de haut en bas.
//
// Renvoie { rows, edges, depthById } :
//   rows      : rows[d] = [skillId…] triés (catégorie puis nom) pour la rangée d
//   edges     : [ [prereqId, skillId], … ] pour tracer les liens
//   depthById : { skillId: profondeur }

import { CATEGORIES } from './skills-data.js';

export function computeTreeLayout(skills) {
  const byId = Object.fromEntries(skills.map((s) => [s.id, s]));
  const catIndex = Object.fromEntries(CATEGORIES.map((c, i) => [c.id, i]));
  const depthCache = {};

  // Profondeur = 1 + max(profondeur des prérequis). `path` protège d'un éventuel
  // cycle (le DAG est validé par ailleurs, c'est une ceinture de sécurité).
  const depthOf = (id, path = new Set()) => {
    if (id in depthCache) return depthCache[id];
    if (path.has(id)) return 0;
    const prereqs = byId[id]?.prereqs ?? [];
    let d = 0;
    if (prereqs.length) {
      const next = new Set(path);
      next.add(id);
      d = 1 + Math.max(...prereqs.map((p) => depthOf(p, next)));
    }
    depthCache[id] = d;
    return d;
  };

  const depthById = {};
  for (const s of skills) depthById[s.id] = depthOf(s.id);

  const maxDepth = skills.length ? Math.max(...skills.map((s) => depthById[s.id])) : 0;
  const rows = Array.from({ length: maxDepth + 1 }, () => []);
  for (const s of skills) rows[depthById[s.id]].push(s.id);

  // ordre stable dans une rangée : par catégorie (ordre de CATEGORIES) puis nom
  for (const row of rows) {
    row.sort((a, b) => {
      const ca = catIndex[byId[a].category] ?? 99;
      const cb = catIndex[byId[b].category] ?? 99;
      if (ca !== cb) return ca - cb;
      return byId[a].name.localeCompare(byId[b].name, 'fr');
    });
  }

  // Un SEUL lien par compétence, vers son prérequis « principal » = le plus
  // profond (celui qui la place dans l'arbre). Les prérequis multiples restent
  // listés dans la fiche détail au tap.
  const parentById = {};
  const edges = [];
  for (const s of skills) {
    const prereqs = s.prereqs ?? [];
    if (!prereqs.length) continue;
    const primary = prereqs.reduce((best, p) =>
      (depthById[p] ?? 0) > (depthById[best] ?? 0) ? p : best
    );
    parentById[s.id] = primary;
    edges.push([primary, s.id]);
  }

  // Position horizontale (en colonnes) : chaque compétence vise la colonne de
  // son parent, puis on décale vers la droite pour éviter les chevauchements.
  // Résultat : les enfants sont groupés SOUS leur parent → traits courts et
  // presque verticaux, au lieu de longues diagonales qui se croisent.
  const xById = {};
  rows.forEach((row, r) => {
    if (r === 0) {
      row.forEach((id, i) => {
        xById[id] = i;
      });
      return;
    }
    const want = row
      .map((id) => ({ id, at: xById[parentById[id]] ?? 0 }))
      .sort((a, b) => a.at - b.at);
    let last = -Infinity;
    for (const { id, at } of want) {
      const x = Math.max(at, last + 1);
      xById[id] = x;
      last = x;
    }
  });

  return { rows, edges, depthById, xById };
}
