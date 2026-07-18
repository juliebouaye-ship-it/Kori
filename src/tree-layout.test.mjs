// Test autonome : node src/tree-layout.test.mjs
import assert from 'node:assert';
import { computeTreeLayout } from './tree-layout.js';
import { SKILLS } from './skills-data.js';

let passed = 0;
const ok = (cond, msg) => {
  assert.ok(cond, msg);
  passed++;
};

const { rows, edges, depthById } = computeTreeLayout(SKILLS);

// 1. toutes les compétences sont placées, une seule fois
const placed = rows.flat();
ok(placed.length === SKILLS.length, 'chaque compétence est placée une fois');
ok(new Set(placed).size === SKILLS.length, 'pas de doublon de placement');

// 2. les racines (sans prérequis) sont au rang 0
for (const s of SKILLS) {
  if ((s.prereqs ?? []).length === 0) {
    ok(depthById[s.id] === 0, `${s.id} (racine) au rang 0`);
  }
}

// 3. un prérequis est TOUJOURS strictement au-dessus (rang inférieur)
for (const s of SKILLS) {
  for (const p of s.prereqs ?? []) {
    ok(depthById[p] < depthById[s.id], `${p} au-dessus de ${s.id}`);
  }
}

// 4. un lien par relation de prérequis
const edgeCount = SKILLS.reduce((n, s) => n + (s.prereqs ?? []).length, 0);
ok(edges.length === edgeCount, 'un lien par prérequis');

// 5. cas synthétique : chaîne A -> B -> C
const chain = [
  { id: 'A', name: 'A', category: 'fondations', prereqs: [] },
  { id: 'B', name: 'B', category: 'fondations', prereqs: ['A'] },
  { id: 'C', name: 'C', category: 'fondations', prereqs: ['B'] },
];
const cl = computeTreeLayout(chain);
ok(cl.depthById.A === 0 && cl.depthById.B === 1 && cl.depthById.C === 2, 'chaîne A/B/C → rangs 0/1/2');

// 6. multi-parents : prend la plus longue chaîne
const diamond = [
  { id: 'A', name: 'A', category: 'fondations', prereqs: [] },
  { id: 'B', name: 'B', category: 'fondations', prereqs: ['A'] },
  { id: 'D', name: 'D', category: 'fondations', prereqs: ['A', 'B'] }, // via B = plus long
];
const dl = computeTreeLayout(diamond);
ok(dl.depthById.D === 2, 'multi-parents → profondeur = plus longue chaîne');

console.log(`✓ tree-layout : ${passed} assertions OK (${SKILLS.length} compétences, ${rows.length} rangs)`);
