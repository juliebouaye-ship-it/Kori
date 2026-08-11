// ============================================================
// Hook d'état unique du Carnet de Kori
// ============================================================
// Centralise tout l'état applicatif et les handlers, jusqu'ici dans le corps
// d'App.jsx. App.jsx n'est plus qu'un routeur qui consomme ce hook.

import { useEffect, useState } from 'react';
import { SKILLS, QUICK_XP, validateDag } from '../skills-data.js';
import { useKoriSync, updateCarnet } from '../store.js';
import { defaultTabForMode } from '../carnets.js';
import { localDate } from '../date-utils.js';
import {
  DEFAULT_MEAL,
  DEFAULT_MEALS_PER_DAY,
  REMINDER_TYPE_BY_ID,
} from '../health-data.js';
import {
  CUP_BY_ID,
  DEFAULT_STATE,
  newId,
  isBaladeSkill,
  dayHasRedWalk,
  decompressionInfo,
  trainingMonthStats,
  tierFor,
  upsertProgress,
  ensurePlaces,
  addPlace,
} from '../domain.js';

export function useKoriState(carnet) {
  const [state, setState] = useState(() => ({ ...DEFAULT_STATE }));
  const [tab, setTab] = useState(() => defaultTabForMode(carnet?.mode));
  const [toast, setToast] = useState(null);
  const [burst, setBurst] = useState(null);
  // Réouverture manuelle du bilan (depuis l'arbre). L'affichage AUTOMATIQUE au
  // tout premier lancement se décide, lui, à partir de `state.onboarded` — donc
  // du carnet InstantDB — une fois celui-ci chargé (voir `showOnboarding`).
  const [manualOnboarding, setManualOnboarding] = useState(false);

  // garde-fou dev : le graphe de prérequis doit être un DAG valide
  useEffect(() => {
    const errors = validateDag();
    if (errors.length) console.error('⚠️ skills-data invalide :', errors);
  }, []);

  // synchro temps réel du carnet partagé (InstantDB) — unique source de vérité
  // (plus de localStorage : InstantDB garde lui-même un cache local hors-ligne).
  // `ready` passe à true une fois le carnet distant chargé.
  // `ensurePlaces` reconstitue une fois pour toutes la liste de lieux d'un carnet
  // antérieur aux lieux dynamiques, à partir des balades déjà enregistrées.
  const ready = useKoriSync(carnet?.id ?? null, state, setState, (remote) =>
    ensurePlaces({ ...DEFAULT_STATE, ...remote }),
  );

  const showToast = (msg) => {
    setToast(msg);
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 2400);
  };

  const fireConfetti = () => {
    setBurst(Date.now());
    window.clearTimeout(fireConfetti._t);
    fireConfetti._t = window.setTimeout(() => setBurst(null), 1700);
  };

  const logSession = (skill, palier, rating) => {
    const gestion = isBaladeSkill(skill.id) && dayHasRedWalk(state.walks, localDate());
    setState((prev) => ({
      ...prev,
      wallet: prev.wallet + rating.xp,
      lifetime: prev.lifetime + rating.xp,
      sessions: [
        ...prev.sessions,
        {
          id: newId(),
          date: localDate(),
          skillId: skill.id,
          // En entretien (compétence maîtrisée) il n'y a plus de palier courant :
          // on enregistre la séance sans palier plutôt que de la rattacher au
          // dernier, ce qui fausserait ses statistiques.
          palierId: palier?.id ?? '',
          rating: rating.id,
          xp: rating.xp,
        },
      ],
    }));
    showToast(gestion ? `+${rating.xp} 🦴 · gestion 🛡️` : `+${rating.xp} 🦴 · séance notée`);
    if (rating.id === 'top') fireConfetti();
  };

  // Tour rapide : plusieurs compétences vérifiées en une fois, sans palier.
  // Une ligne de séance par compétence (donc ça compte comme un jour
  // d'entraînement dans le compteur mensuel), aucun palier validé.
  const logQuickRound = (skillIds) => {
    const ids = [...new Set(skillIds)].filter((id) => SKILLS.some((s) => s.id === id));
    if (ids.length === 0) return;
    const gain = ids.length * QUICK_XP;
    const date = localDate();
    setState((prev) => ({
      ...prev,
      wallet: prev.wallet + gain,
      lifetime: prev.lifetime + gain,
      sessions: [
        ...prev.sessions,
        ...ids.map((skillId) => ({
          id: newId(),
          date,
          skillId,
          palierId: '', // aucun palier visé : c'est une vérification, pas une étape
          rating: 'quick',
          xp: QUICK_XP,
        })),
      ],
    }));
    showToast(`+${gain} 🦴 · ${ids.length} compétence${ids.length > 1 ? 's' : ''} revue${ids.length > 1 ? 's' : ''}`);
  };

  // « Elle va bien » : coupe la suggestion de décompression pour aujourd'hui.
  // Ce que Julie observe prime sur la règle des 48-72 h.
  const dismissDecomp = () => {
    const today = localDate();
    setState((prev) => ({
      ...prev,
      decompOff: (prev.decompOff ?? []).includes(today)
        ? prev.decompOff
        : [...(prev.decompOff ?? []), today],
    }));
  };

  // Enregistre une balade à partir du brouillon composé dans l'onglet
  // (niveau obligatoire ; lieu, déclencheurs et note facultatifs).
  const logWalk = (draft) => {
    const level = draft.level;
    if (!level) return;
    setState((prev) => ({
      ...prev,
      walks: [
        ...prev.walks,
        {
          id: newId(),
          date: localDate(),
          ts: Date.now(),
          level,
          location: draft.location ?? null,
          duration: draft.duration ?? null,
          triggers: draft.triggers ?? [],
          note: (draft.note ?? '').trim(),
        },
      ],
    }));
    const cup = CUP_BY_ID[level];
    showToast(
      level === 'rouge'
        ? '🔴 Balade enregistrée · décompression activée'
        : `${cup.emoji} Balade enregistrée · ${cup.short}`
    );
    // petite fête uniquement pour une sortie sereine (jamais pour une 🔴)
    if (level === 'vert') fireConfetti();
  };

  const updateWalk = (id, patch) =>
    setState((prev) => ({
      ...prev,
      walks: prev.walks.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    }));

  const deleteWalk = (id) =>
    setState((prev) => ({ ...prev, walks: prev.walks.filter((w) => w.id !== id) }));

  // ---- Carnet (identité : nom, mode, code d'invitation) ----
  const setCarnetMode = (mode) => updateCarnet(carnet?.id, { mode });

  // ---- Lieux de balade ----
  // Crée le lieu s'il est nouveau, sinon retrouve celui qui porte déjà ce nom,
  // et renvoie son slug pour que l'appelant puisse le sélectionner aussitôt.
  const createPlace = (label) => {
    const { slug } = addPlace(state.places, label);
    if (!slug) return null;
    setState((prev) => ({ ...prev, places: addPlace(prev.places, label).places }));
    return slug;
  };

  // Retire un lieu du catalogue. Les balades déjà enregistrées gardent leur
  // slug : `placeLabel` retombe alors sur le slug brut plutôt que de perdre
  // l'information. On ne réécrit jamais l'historique.
  const removePlace = (slug) =>
    setState((prev) => ({ ...prev, places: prev.places.filter((p) => p.slug !== slug) }));

  // ---- Antisèche (mot + geste éditables) ----
  // Une ligne par compétence renseignée. À la première saisie, on part des
  // suggestions du catalogue : sans ça, modifier le mot effacerait le geste
  // proposé (la ligne du carnet l'emporte sur la suggestion, champ par champ).
  const setCue = (skillId, patch) =>
    setState((prev) => {
      const rows = prev.cues || [];
      if (rows.some((c) => c.skillId === skillId)) {
        return {
          ...prev,
          cues: rows.map((c) => (c.skillId === skillId ? { ...c, ...patch } : c)),
        };
      }
      const skill = SKILLS.find((s) => s.id === skillId);
      return {
        ...prev,
        cues: [
          ...rows,
          {
            id: newId(),
            skillId,
            word: skill?.cue ?? '',
            gesture: skill?.signal ?? '',
            ...patch,
          },
        ],
      };
    });

  // ---- Carnet : repas & friandises ----
  const addCare = (entry) =>
    setState((prev) => ({
      ...prev,
      care: [...prev.care, { id: newId(), date: localDate(), ts: Date.now(), ...entry }],
    }));

  const logDefaultMeals = () => {
    const date = localDate();
    setState((prev) => {
      const already = prev.care.filter((c) => c.date === date && c.kind === 'repas').length;
      const toAdd = Math.max(0, DEFAULT_MEALS_PER_DAY - already);
      if (toAdd === 0) return prev;
      const meals = Array.from({ length: toAdd }, (_, i) => ({
        id: newId(),
        date,
        ts: Date.now() + i,
        kind: 'repas',
        label: DEFAULT_MEAL.label,
        grams: DEFAULT_MEAL.grams,
      }));
      return { ...prev, care: [...prev.care, ...meals] };
    });
    showToast('🍽️ Repas du jour notés');
  };

  const removeCare = (id) =>
    setState((prev) => ({ ...prev, care: prev.care.filter((c) => c.id !== id) }));

  // ---- Carnet : rappels santé ----
  const addReminder = (r) =>
    setState((prev) => ({ ...prev, reminders: [...prev.reminders, { id: newId(), ...r }] }));

  const removeReminder = (id) =>
    setState((prev) => ({ ...prev, reminders: prev.reminders.filter((r) => r.id !== id) }));

  const completeReminder = (r) => {
    const every = REMINDER_TYPE_BY_ID[r.type]?.everyDays;
    setState((prev) => {
      if (every) {
        // récurrent → on reprogramme à la prochaine échéance
        const next = new Date(r.dueDate + 'T00:00');
        next.setDate(next.getDate() + every);
        return {
          ...prev,
          reminders: prev.reminders.map((x) =>
            x.id === r.id ? { ...x, dueDate: localDate(next) } : x
          ),
        };
      }
      // ponctuel → on le retire
      return { ...prev, reminders: prev.reminders.filter((x) => x.id !== r.id) };
    });
    showToast(every ? '✓ Fait · reprogrammé' : '✓ Fait');
  };

  // ---- Carnet : premières fois ----
  const addFirst = (f) => {
    setState((prev) => ({ ...prev, firsts: [...prev.firsts, { id: newId(), ...f }] }));
    showToast('⭐ Première fois célébrée');
    fireConfetti();
  };

  const markPalierDone = (skill, palier) => {
    setState((prev) => {
      if (prev.palierDone.some((r) => r.palierId === palier.id)) return prev; // déjà validé
      const palierDone = [
        ...prev.palierDone,
        { id: newId(), palierId: palier.id, skillId: skill.id, doneAt: localDate() },
      ];
      const doneIds = new Set(palierDone.map((r) => r.palierId));
      const allDone = skill.paliers.every((p) => doneIds.has(p.id));
      const next = { ...prev, palierDone };
      const current = prev.skillProgress.find((r) => r.skillId === skill.id);
      if (allDone && current?.status !== 'mastered') {
        next.skillProgress = upsertProgress(prev.skillProgress, skill.id, 'mastered');
        next.wallet = prev.wallet + skill.bonus;
        next.lifetime = prev.lifetime + skill.bonus;
      }
      return next;
    });
    const willMaster = skill.paliers.every(
      (p) => p.id === palier.id || state.palierDone.some((r) => r.palierId === p.id)
    );
    if (willMaster) {
      showToast(`🏆 ${skill.name} maîtrisée · +${skill.bonus} 🦴`);
      fireConfetti();
    } else {
      showToast('✓ Palier validé');
    }
  };

  const unlockSkill = (skill) => {
    if (state.wallet < skill.cost) return;
    setState((prev) => ({
      ...prev,
      wallet: prev.wallet - skill.cost,
      skillProgress: upsertProgress(prev.skillProgress, skill.id, 'learning'),
    }));
    showToast(`🌱 ${skill.name} débloquée`);
  };

  const validateOnboarding = (choices) => {
    setState((prev) => {
      let skillProgress = prev.skillProgress;
      for (const s of SKILLS) {
        const cur = skillProgress.find((r) => r.skillId === s.id);
        if (cur?.status === 'mastered') continue; // une maîtrise gagnée reste gagnée
        const c = choices[s.id] ?? 'non';
        if (c === 'acquis') skillProgress = upsertProgress(skillProgress, s.id, 'known');
        else if (c === 'partiel') skillProgress = upsertProgress(skillProgress, s.id, 'learning');
        else skillProgress = skillProgress.filter((r) => r.skillId !== s.id);
      }
      return { ...prev, skillProgress, onboarded: true };
    });
    setManualOnboarding(false);
    const hasPartial = Object.values(choices).includes('partiel');
    showToast(
      hasPartial
        ? 'Bilan enregistré · valide tes paliers dans Entraîner'
        : 'Bilan enregistré 🐾'
    );
  };

  const { current: tier } = tierFor(state.lifetime);
  const decomp = decompressionInfo(state.walks, localDate(), state.decompOff ?? []);
  const monthStats = trainingMonthStats(state.sessions, state.walks);
  const care = {
    add: addCare,
    logDefaultMeals,
    remove: removeCare,
    addReminder,
    completeReminder,
    removeReminder,
  };

  // Progression rangée en tables : on reconstruit à la volée les annuaires
  // (skillStatus/paliersDone) attendus par les composants, pour ne pas les
  // réécrire. `viewState` est un sur-ensemble de `state` passé aux onglets.
  const statusById = Object.fromEntries(
    (state.skillProgress || []).map((r) => [r.skillId, r.status])
  );
  const paliersDoneById = Object.fromEntries(
    (state.palierDone || []).map((r) => [r.palierId, r.doneAt])
  );
  const viewState = { ...state, skillStatus: statusById, paliersDone: paliersDoneById };

  // Le bilan de départ s'affiche soit sur réouverture manuelle, soit
  // automatiquement au tout premier lancement — mais seulement une fois le
  // carnet distant chargé, pour ne pas le faire clignoter pendant le chargement.
  // Un carnet « journal seul » ne le voit jamais : il porte sur les compétences.
  const journalOnly = carnet?.mode === 'journal';
  const showOnboarding = !journalOnly && (manualOnboarding || (ready && !state.onboarded));

  return {
    carnet,
    journalOnly,
    ready,
    state,
    viewState,
    tab,
    setTab,
    tier,
    decomp,
    monthStats,
    toast,
    burst,
    showOnboarding,
    setManualOnboarding,
    care,
    logSession,
    logQuickRound,
    dismissDecomp,
    markPalierDone,
    logWalk,
    updateWalk,
    createPlace,
    removePlace,
    setCarnetMode,
    deleteWalk,
    setCue,
    addFirst,
    unlockSkill,
    validateOnboarding,
  };
}
