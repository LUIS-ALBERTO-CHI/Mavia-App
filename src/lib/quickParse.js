/* Quick-add: detecta fecha/hora en español dentro del título.
   "video nike viernes 3pm" → { date: '2026-08-07', time: '15:00', cleanTitle: 'video nike' } */

const DOW = { domingo: 0, lunes: 1, martes: 2, miercoles: 3, miércoles: 3, jueves: 4, viernes: 5, sabado: 6, sábado: 6 };

const pad = (n) => String(n).padStart(2, '0');
const dsOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/* Etiqueta humana de la fecha detectada (para el chip de sugerencia) */
export function labelFor(ds, time) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(ds + 'T00:00:00');
  const diff = Math.round((d - today) / 86400000);
  const names = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  let base;
  if (diff === 0) base = 'Hoy';
  else if (diff === 1) base = 'Mañana';
  else if (diff < 7) base = names[d.getDay()];
  else base = `${names[d.getDay()]} ${d.getDate()}`;
  return time ? `${base} · ${time}` : base;
}

export function parseQuickAdd(text) {
  if (!text || text.length < 3) return null;
  let rest = ` ${text} `;   // padding para bordes de palabra
  let date = null;
  let time = null;

  const eat = (re, fn) => {
    const m = rest.match(re);
    if (m) { fn(m); rest = rest.replace(re, ' '); }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);

  /* ── Fechas relativas ── */
  eat(/\spasado\s*mañana\s/i, () => { const d = new Date(today); d.setDate(d.getDate() + 2); date = dsOf(d); });
  if (!date) eat(/\smañana\s/i, () => { const d = new Date(today); d.setDate(d.getDate() + 1); date = dsOf(d); });
  if (!date) eat(/\shoy\s/i, () => { date = dsOf(today); });

  /* ── Día de la semana (próxima ocurrencia; "el viernes" / "viernes") ── */
  if (!date) {
    eat(/\s(?:el\s+)?(lunes|martes|mi[eé]rcoles|jueves|viernes|s[aá]bado|domingo)\s/i, (m) => {
      const target = DOW[m[1].toLowerCase()];
      const d = new Date(today);
      let delta = (target - d.getDay() + 7) % 7;
      if (delta === 0) delta = 7;   // "viernes" siendo viernes = el próximo
      d.setDate(d.getDate() + delta);
      date = dsOf(d);
    });
  }

  /* ── Hora: "3pm", "3:30pm", "15:30", "a las 5", "a las 5:30" ── */
  eat(/\s(?:a\s+las?\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\s/i, (m) => {
    let h = parseInt(m[1], 10) % 12;
    if (/^p/i.test(m[3])) h += 12;
    time = `${pad(h)}:${m[2] || '00'}`;
  });
  if (!time) eat(/\s(\d{1,2}):(\d{2})\s/, (m) => {
    const h = parseInt(m[1], 10);
    if (h <= 23) time = `${pad(h)}:${m[2]}`;
  });
  if (!time) eat(/\sa\s+las?\s+(\d{1,2})\s/i, (m) => {
    let h = parseInt(m[1], 10);
    if (h >= 1 && h <= 23) { if (h <= 7) h += 12; time = `${pad(h)}:00`; }   // "a las 5" ≈ tarde
  });

  if (!date && !time) return null;
  const cleanTitle = rest.replace(/\s+/g, ' ').trim();
  if (!cleanTitle) return null;   // no dejar el título vacío
  return { date, time, cleanTitle };
}
