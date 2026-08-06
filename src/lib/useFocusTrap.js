import { useEffect } from 'react';

/* Atrapa el Tab dentro de un modal/sheet y devuelve el foco al cerrar.
   Uso: const ref = useRef(null); useFocusTrap(ref); <div ref={ref}>… */
export function useFocusTrap(ref, active = true) {
  useEffect(() => {
    if (!active || !ref.current) return;
    const node = ref.current;
    const prev = document.activeElement;
    const SEL = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const onKey = (e) => {
      if (e.key !== 'Tab') return;
      const items = Array.from(node.querySelectorAll(SEL)).filter(el => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0];
      const last  = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    node.addEventListener('keydown', onKey);
    return () => {
      node.removeEventListener('keydown', onKey);
      try { prev?.focus?.(); } catch {}
    };
  }, [active, ref]);
}
