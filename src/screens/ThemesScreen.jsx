import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Check, Sun, Moon, Monitor } from 'lucide-react';
import { THEMES, applyTheme, getSavedTheme } from '../lib/themes';

const MODES = [
  { id: 'light',  label: 'Claro',   icon: Sun },
  { id: 'dark',   label: 'Oscuro',  icon: Moon },
  { id: 'system', label: 'Sistema', icon: Monitor },
];

export default function ThemesScreen() {
  const { state, goBack, showToast, setColorMode } = useApp();
  const [current, setCurrent] = useState(getSavedTheme());
  const colorMode = state.colorMode || 'light';

  const pick = (id) => {
    applyTheme(id);
    setCurrent(id);
    const t = THEMES.find(x => x.id === id);
    showToast(`Tema "${t?.name}" aplicado`, 'success');
  };

  return (
    <>
      <style>{`
        .th-screen { max-width: 680px; margin: 0 auto; padding: var(--space-md) var(--space-container) var(--space-8); animation: screenEnter 0.4s var(--ease-out) both; }
        .th-back { display: inline-flex; align-items: center; gap: 6px; color: var(--primary); font-size: var(--text-label-md); font-weight: 700; background: none; border: none; cursor: pointer; padding: 0; margin-bottom: var(--space-md); }
        .th-title { font-family: var(--font-display); font-size: var(--text-headline-lg); font-weight: 700; color: var(--heading); margin-bottom: 14px; }

        .th-h { font-family: var(--font-display); font-size: 15px; font-weight: 700; color: var(--heading); margin: 6px 0 10px; }

        /* Modo de color */
        .th-modes { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: var(--space-xl); }
        .th-mode { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; padding: 16px 8px; border-radius: 16px; border: 1px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface-variant); cursor: pointer; font-family: var(--font-body); font-weight: 700; font-size: 13px; transition: all var(--transition-fast); }
        .th-mode.sel { border-color: var(--primary); color: var(--primary); background: var(--primary-container); box-shadow: var(--shadow-card); }
        .th-mode:active { transform: scale(0.97); }

        /* Temas */
        .th-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        @media (min-width: 560px) { .th-grid { grid-template-columns: repeat(3, 1fr); } }
        .th-card { position: relative; display: flex; align-items: center; gap: 12px; text-align: left; cursor: pointer; border-radius: 999px; padding: 10px 14px 10px 10px; border: 1px solid var(--outline-variant); background: var(--surface-container-lowest); transition: all var(--transition-fast); }
        .th-card:active { transform: scale(0.97); }
        .th-card.sel { border-color: var(--primary); box-shadow: var(--shadow-card); }
        .th-orb { width: 40px; height: 40px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.5), 0 2px 6px rgba(0,0,0,0.15); }
        .th-name { font-family: var(--font-display); font-weight: 700; font-size: 14.5px; color: var(--heading); line-height: 1.15; }
        .th-check { position: absolute; top: 50%; right: 12px; transform: translateY(-50%); width: 22px; height: 22px; border-radius: 50%; background: var(--primary); color: var(--on-primary); display: flex; align-items: center; justify-content: center; }
        .th-note { margin-top: 18px; font-size: 12.5px; color: var(--on-surface-variant); text-align: center; }
      `}</style>

      <div className="th-screen">
        <button className="th-back" onClick={goBack}><ArrowLeft size={18} /> Volver</button>
        <h1 className="th-title">Temas</h1>

        {/* Modo de color */}
        <div className="th-h">Modo de color</div>
        <div className="th-modes">
          {MODES.map(m => (
            <button key={m.id} className={`th-mode${colorMode === m.id ? ' sel' : ''}`} onClick={() => setColorMode(m.id)} id={`mode-${m.id}`}>
              <m.icon size={20} strokeWidth={2} />
              {m.label}
            </button>
          ))}
        </div>

        {/* Paletas */}
        <div className="th-h">Paletas</div>
        <div className="th-grid">
          {THEMES.map(t => (
            <button key={t.id} className={`th-card${current === t.id ? ' sel' : ''}`} onClick={() => pick(t.id)} id={`theme-${t.id}`}>
              <span className="th-orb" style={{ background: t.gradient }} />
              <span className="th-name">{t.name}</span>
              {current === t.id && <span className="th-check"><Check size={13} strokeWidth={3} /></span>}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
