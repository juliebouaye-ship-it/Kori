import { useState } from 'react';
import { SKILLS, CATEGORIES } from '../skills-data.js';
import { InfoTip, CollapsibleCategory } from '../ui.jsx';

// ============================================================
// Bilan de départ (bottom sheet)
// ============================================================
const BILAN_STATES = ['non', 'partiel', 'acquis'];
const BILAN_ICONS = { non: '⬜', partiel: '🌓', acquis: '✅' };

export function OnboardingSheet({ state, onValidate }) {
  // pré-remplissage depuis l'état actuel (utile quand on refait le bilan)
  const [choices, setChoices] = useState(() => {
    const init = {};
    for (const s of SKILLS) {
      const st = state.skillStatus[s.id];
      if (st === 'known' || st === 'mastered') init[s.id] = 'acquis';
      else if (st === 'learning') init[s.id] = 'partiel';
      else init[s.id] = 'non';
    }
    return init;
  });

  const cycle = (id) => {
    setChoices((prev) => {
      const next = BILAN_STATES[(BILAN_STATES.indexOf(prev[id]) + 1) % BILAN_STATES.length];
      return { ...prev, [id]: next };
    });
  };

  return (
    <div className="sheet-overlay">
      <div className="sheet">
        <h2>Bilan de départ 🐕</h2>
        <div className="sheet-sub">
          Appuie sur chaque ligne : ⬜ pas encore · 🌓 en partie · ✅ acquis.
          <InfoTip text="✅ Acquis = elle le fait sur demande au calme (compté acquis, ni coût ni bonus). 🌓 En partie = ça craque dehors ou en excitation : la compétence passe « en cours » gratuitement, tu valideras toi-même les paliers déjà solides." />
        </div>
        {CATEGORIES.map((cat) => {
          const catSkills = SKILLS.filter((s) => s.category === cat.id);
          const acquis = catSkills.filter((s) => choices[s.id] === 'acquis').length;
          const partiel = catSkills.filter((s) => choices[s.id] === 'partiel').length;
          const summary =
            acquis || partiel
              ? [acquis && `${acquis} ✅`, partiel && `${partiel} 🌓`].filter(Boolean).join(' · ')
              : null;
          return (
            <CollapsibleCategory
              key={cat.id}
              icon={cat.icon}
              name={cat.name}
              color={cat.color}
              summary={summary}
            >
              {catSkills.map((s) => (
                <button
                  key={s.id}
                  className={`check-row ${choices[s.id] === 'acquis' ? 'checked' : ''} ${choices[s.id] === 'partiel' ? 'partial' : ''}`}
                  onClick={() => cycle(s.id)}
                >
                  <span className="cr-box">{BILAN_ICONS[choices[s.id]]}</span>
                  <span>
                    {s.icon} {s.name}
                  </span>
                  {choices[s.id] === 'partiel' && <span className="cr-tag">en partie</span>}
                </button>
              ))}
            </CollapsibleCategory>
          );
        })}
        <button className="btn btn-primary btn-block" onClick={() => onValidate(choices)}>
          C’est parti ! 🎾
        </button>
      </div>
    </div>
  );
}
