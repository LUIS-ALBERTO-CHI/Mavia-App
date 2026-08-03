import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { RefreshCw, X } from 'lucide-react';

/**
 * UpdatePrompt — detecta un deploy nuevo comparando /version.json (que cambia en
 * cada build) contra la versión con la que se cargó la app. Si difiere, muestra
 * un banner "Actualizar" para recargar. Independiente del service worker.
 */
async function fetchVersion() {
  try {
    const r = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!r.ok) return null;
    const d = await r.json();
    return d?.v || null;
  } catch { return null; }
}

export default function UpdatePrompt() {
  const [show, setShow] = useState(false);
  const initial = useRef(undefined);   // versión al cargar (undefined = aún no leída)

  useEffect(() => {
    let stopped = false;
    const check = async () => {
      const v = await fetchVersion();
      if (!v || stopped) return;
      if (initial.current === undefined) { initial.current = v; return; }  // primera lectura
      if (v !== initial.current) setShow(true);                            // hay build nuevo
    };
    check();
    const iv  = setInterval(() => { if (document.visibilityState === 'visible') check(); }, 60 * 1000);
    const vis = () => { if (document.visibilityState === 'visible') check(); };
    document.addEventListener('visibilitychange', vis);
    return () => { stopped = true; clearInterval(iv); document.removeEventListener('visibilitychange', vis); };
  }, []);

  if (!show) return null;

  return createPortal(
    <>
      <style>{`
        .upd-banner {
          position: fixed; left: 50%; top: calc(env(safe-area-inset-top, 0px) + 12px);
          transform: translateX(-50%); z-index: 10000;
          display: flex; align-items: center; gap: 12px;
          padding: 10px 12px 10px 16px; border-radius: 99px;
          background: var(--surface-container-lowest, #fff);
          border: var(--hairline);
          box-shadow: 0 10px 30px rgba(90,80,130,0.22), 0 2px 6px rgba(90,80,130,0.12);
          animation: updDown 0.34s cubic-bezier(0.22,1,0.36,1) both;
          max-width: calc(100vw - 24px);
        }
        @keyframes updDown { from { opacity: 0; transform: translate(-50%, -16px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .upd-text { font-family: var(--font-body); font-size: 13.5px; font-weight: 700; color: var(--on-surface, #333); white-space: nowrap; }
        .upd-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 16px; border-radius: 99px; border: none; cursor: pointer; background: var(--primary); color: var(--on-primary); font-family: var(--font-body); font-weight: 700; font-size: 13px; }
        .upd-btn:active { transform: scale(0.96); }
        .upd-x { width: 30px; height: 30px; border-radius: 50%; border: none; background: var(--surface-container, #eee); color: var(--on-surface-variant, #777); cursor: pointer; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
      `}</style>
      <div className="upd-banner" role="status">
        <span className="upd-text">Nueva versión disponible</span>
        <button className="upd-btn" onClick={() => window.location.reload()} id="upd-reload">
          <RefreshCw size={15} strokeWidth={2} /> Actualizar
        </button>
        <button className="upd-x" onClick={() => setShow(false)} aria-label="Ahora no"><X size={15} /></button>
      </div>
    </>,
    document.body
  );
}
