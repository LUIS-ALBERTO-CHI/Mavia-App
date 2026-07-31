/* ============================================
   STICKER — set propio de stickers ilustrados (SVG kawaii)
   Sin dependencias, sin copyright. Estilo "agenda con stickers".
   Uso: <Sticker id="cat" size={28} />
   ============================================ */

/* Cada sticker es una función que devuelve el contenido SVG (viewBox 0 0 48 48). */
const ART = {
  cat: (
    <>
      <path d="M12 14 L9 6 L17 11 Z M36 14 L39 6 L31 11 Z" fill="#FFB84D" />
      <circle cx="24" cy="26" r="15" fill="#FFC46B" />
      <circle cx="19" cy="25" r="2.2" fill="#3d2b1f" />
      <circle cx="29" cy="25" r="2.2" fill="#3d2b1f" />
      <path d="M22 30 Q24 32 26 30" stroke="#3d2b1f" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="15" cy="30" r="2" fill="#FF9BB3" opacity="0.7" />
      <circle cx="33" cy="30" r="2" fill="#FF9BB3" opacity="0.7" />
    </>
  ),
  dog: (
    <>
      <ellipse cx="12" cy="20" rx="5" ry="9" fill="#B07A4F" />
      <ellipse cx="36" cy="20" rx="5" ry="9" fill="#B07A4F" />
      <circle cx="24" cy="26" r="15" fill="#D9A066" />
      <circle cx="19" cy="24" r="2.2" fill="#3d2b1f" />
      <circle cx="29" cy="24" r="2.2" fill="#3d2b1f" />
      <ellipse cx="24" cy="30" rx="3.5" ry="2.6" fill="#3d2b1f" />
      <path d="M24 32 L24 35" stroke="#3d2b1f" strokeWidth="1.4" strokeLinecap="round" />
    </>
  ),
  paw: (
    <>
      <circle cx="24" cy="30" r="10" fill="#FF9BB3" />
      <circle cx="13" cy="18" r="4" fill="#FF9BB3" />
      <circle cx="21" cy="13" r="4" fill="#FF9BB3" />
      <circle cx="30" cy="13" r="4" fill="#FF9BB3" />
      <circle cx="38" cy="18" r="4" fill="#FF9BB3" />
    </>
  ),
  heart: (
    <path d="M24 40 C6 28 8 12 20 12 C24 12 24 16 24 16 C24 16 24 12 28 12 C40 12 42 28 24 40 Z" fill="#FF5C8A" />
  ),
  star: (
    <path d="M24 5 L30 19 L45 20 L33 30 L37 44 L24 36 L11 44 L15 30 L3 20 L18 19 Z" fill="#FFD84C" stroke="#F2B807" strokeWidth="1.5" strokeLinejoin="round" />
  ),
  sparkle: (
    <>
      <path d="M24 6 C25 18 30 23 42 24 C30 25 25 30 24 42 C23 30 18 25 6 24 C18 23 23 18 24 6 Z" fill="#B98CE6" />
      <circle cx="39" cy="10" r="3" fill="#FFD84C" />
    </>
  ),
  cake: (
    <>
      <rect x="10" y="24" width="28" height="16" rx="3" fill="#FF9BB3" />
      <rect x="10" y="24" width="28" height="6" fill="#fff" opacity="0.7" />
      <rect x="22.5" y="12" width="3" height="10" fill="#7ED957" />
      <circle cx="24" cy="11" r="2.5" fill="#FFD84C" />
      <path d="M10 30 Q17 36 24 30 T38 30" stroke="#E85D9A" strokeWidth="1.5" fill="none" />
    </>
  ),
  gift: (
    <>
      <rect x="10" y="20" width="28" height="20" rx="2" fill="#56C2E6" />
      <rect x="21" y="20" width="6" height="20" fill="#FFD84C" />
      <rect x="8" y="15" width="32" height="7" rx="2" fill="#7CC7E6" />
      <path d="M24 15 C18 6 10 12 24 15 C38 12 30 6 24 15 Z" fill="#FFD84C" />
    </>
  ),
  money: (
    <>
      <circle cx="24" cy="24" r="16" fill="#7ED957" />
      <circle cx="24" cy="24" r="12" fill="none" stroke="#fff" strokeWidth="1.5" opacity="0.7" />
      <text x="24" y="31" textAnchor="middle" fontSize="18" fontWeight="800" fill="#fff" fontFamily="system-ui">$</text>
    </>
  ),
  plane: (
    <path d="M6 26 L42 12 L34 40 L27 30 L20 34 L21 26 Z" fill="#56C2E6" stroke="#2E9BC4" strokeWidth="1.2" strokeLinejoin="round" />
  ),
  coffee: (
    <>
      <path d="M12 18 H34 V30 A10 10 0 0 1 12 30 Z" fill="#B07A4F" />
      <path d="M34 20 H38 A4 4 0 0 1 38 28 H34" fill="none" stroke="#B07A4F" strokeWidth="2.5" />
      <path d="M18 10 Q16 13 18 15 M24 9 Q22 12 24 14 M30 10 Q28 13 30 15" stroke="#D9A066" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  ),
  camera: (
    <>
      <rect x="7" y="16" width="34" height="22" rx="4" fill="#705765" />
      <rect x="17" y="12" width="10" height="6" rx="2" fill="#705765" />
      <circle cx="24" cy="27" r="7" fill="#FFD84C" />
      <circle cx="24" cy="27" r="3.5" fill="#3d2b1f" />
      <circle cx="35" cy="20" r="1.6" fill="#FF9BB3" />
    </>
  ),
  video: (
    <>
      <rect x="6" y="16" width="26" height="18" rx="3" fill="#705765" />
      <path d="M32 22 L42 17 V33 L32 28 Z" fill="#705765" />
      <circle cx="14" cy="21" r="1.6" fill="#FFD84C" />
    </>
  ),
  flower: (
    <>
      <circle cx="24" cy="14" r="6" fill="#FF9BB3" />
      <circle cx="24" cy="34" r="6" fill="#FF9BB3" />
      <circle cx="14" cy="24" r="6" fill="#FF9BB3" />
      <circle cx="34" cy="24" r="6" fill="#FF9BB3" />
      <circle cx="24" cy="24" r="6" fill="#FFD84C" />
    </>
  ),
  check: (
    <>
      <circle cx="24" cy="24" r="16" fill="#7ED957" />
      <path d="M16 24 L22 30 L33 18" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </>
  ),
  fire: (
    <path d="M24 6 C28 14 34 16 32 26 C31 32 27 36 24 42 C21 36 16 33 16 26 C16 20 22 18 20 12 C23 14 22 18 24 6 Z" fill="#FF7A3C" stroke="#FF5C8A" strokeWidth="1" />
  ),
  moon: (
    <>
      <path d="M32 8 A16 16 0 1 0 40 30 A12 12 0 0 1 32 8 Z" fill="#FFD84C" />
      <circle cx="14" cy="12" r="1.6" fill="#B98CE6" />
      <circle cx="10" cy="20" r="1.2" fill="#56C2E6" />
    </>
  ),
  sun: (
    <>
      <circle cx="24" cy="24" r="9" fill="#FFD84C" />
      {[0,45,90,135,180,225,270,315].map(a => {
        const r = (a * Math.PI) / 180;
        const x1 = 24 + Math.cos(r) * 13, y1 = 24 + Math.sin(r) * 13;
        const x2 = 24 + Math.cos(r) * 19, y2 = 24 + Math.sin(r) * 19;
        return <line key={a} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FFB000" strokeWidth="2.5" strokeLinecap="round" />;
      })}
    </>
  ),
  music: (
    <>
      <path d="M18 12 L34 9 V30" fill="none" stroke="#B98CE6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="15" cy="32" r="5" fill="#B98CE6" />
      <circle cx="31" cy="30" r="5" fill="#B98CE6" />
    </>
  ),
  shopping: (
    <>
      <path d="M12 16 H36 L34 40 H14 Z" fill="#FF9BB3" />
      <path d="M18 18 V13 A6 6 0 0 1 30 13 V18" fill="none" stroke="#E85D9A" strokeWidth="2.5" />
    </>
  ),
  balloon: (
    <>
      <ellipse cx="24" cy="20" rx="11" ry="13" fill="#FF6B6B" />
      <path d="M24 33 L24 42" stroke="#705765" strokeWidth="1.4" />
      <path d="M22 33 L26 33 L24 36 Z" fill="#FF6B6B" />
      <ellipse cx="20" cy="16" rx="3" ry="4" fill="#fff" opacity="0.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="8" y="12" width="32" height="28" rx="4" fill="#56C2E6" />
      <rect x="8" y="12" width="32" height="8" fill="#2E9BC4" />
      <rect x="14" y="8" width="3" height="8" rx="1.5" fill="#705765" />
      <rect x="31" y="8" width="3" height="8" rx="1.5" fill="#705765" />
      <rect x="14" y="25" width="6" height="5" rx="1" fill="#fff" />
      <rect x="28" y="25" width="6" height="5" rx="1" fill="#FFD84C" />
    </>
  ),
  alarm: (
    <>
      <circle cx="24" cy="26" r="13" fill="#FFD84C" />
      <circle cx="24" cy="26" r="9" fill="#fff" opacity="0.5" />
      <path d="M24 20 V26 L28 29" stroke="#705765" strokeWidth="2.2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12 L18 16 M36 12 L30 16" stroke="#FF7A3C" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  poop: (
    <>
      <path d="M24 12 C30 12 28 18 30 18 C36 18 36 26 33 27 C38 28 38 38 24 38 C10 38 10 28 15 27 C12 26 12 18 18 18 C20 18 18 12 24 12 Z" fill="#A5734B" />
      <circle cx="20" cy="28" r="1.8" fill="#3d2b1f" />
      <circle cx="28" cy="28" r="1.8" fill="#3d2b1f" />
      <path d="M21 32 Q24 34 27 32" stroke="#3d2b1f" strokeWidth="1.4" fill="none" strokeLinecap="round" />
    </>
  ),
};

/* Set base propio (SVG, sin copyright) */
const SVG_STICKERS = [
  { id: 'heart',    label: 'Corazón' },
  { id: 'star',     label: 'Estrella' },
  { id: 'sparkle',  label: 'Brillo' },
  { id: 'check',    label: 'Hecho' },
  { id: 'money',    label: 'Dinero' },
  { id: 'shopping', label: 'Compras' },
  { id: 'gift',     label: 'Regalo' },
  { id: 'cake',     label: 'Pastel' },
  { id: 'balloon',  label: 'Globo' },
  { id: 'cat',      label: 'Gato' },
  { id: 'dog',      label: 'Perro' },
  { id: 'paw',      label: 'Patita' },
  { id: 'flower',   label: 'Flor' },
  { id: 'plane',    label: 'Viaje' },
  { id: 'camera',   label: 'Foto' },
  { id: 'video',    label: 'Video' },
  { id: 'coffee',   label: 'Café' },
  { id: 'music',    label: 'Música' },
  { id: 'calendar', label: 'Fecha' },
  { id: 'alarm',    label: 'Alarma' },
  { id: 'fire',     label: 'Fuego' },
  { id: 'sun',      label: 'Sol' },
  { id: 'moon',     label: 'Luna' },
  { id: 'poop',     label: 'Popó' },
];

/* ── Stickers personalizados (PNG) ──────────────────────────────────
   Suelta tus PNG en  src/assets/stickers/  (256×256, fondo transparente).
   Se detectan SOLOS: el nombre del archivo es el id y la etiqueta.
   Ej.  gato-feliz.png  →  id "gato-feliz", etiqueta "Gato Feliz".
   Aparecen PRIMERO en el selector, antes del set base. */
const CUSTOM_URLS = import.meta.glob('../assets/stickers/*.png', { eager: true, query: '?url', import: 'default' });
const prettify = (id) => id.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const CUSTOM = Object.keys(CUSTOM_URLS)
  .map(p => { const id = p.split('/').pop().replace(/\.png$/i, ''); return { id, label: prettify(id), url: CUSTOM_URLS[p] }; })
  .sort((a, b) => a.id.localeCompare(b.id));
const CUSTOM_MAP = Object.fromEntries(CUSTOM.map(s => [s.id, s.url]));

/** Lista para el picker: primero tus PNG personalizados, luego el set base SVG */
export const STICKERS = [
  ...CUSTOM.map(({ id, label }) => ({ id, label, custom: true })),
  ...SVG_STICKERS,
];

/**
 * Renderiza un sticker por id. Usa el PNG personalizado si existe; si no, el SVG base.
 * Fallback a estrella si no existe.
 * @param {string} id    — id del sticker
 * @param {number} size  — tamaño en px (default 28)
 */
export default function Sticker({ id, size = 28, className = '', style = {} }) {
  const customUrl = CUSTOM_MAP[id];
  if (customUrl) {
    return (
      <img
        src={customUrl}
        width={size}
        height={size}
        alt=""
        className={className}
        style={{ display: 'block', flexShrink: 0, objectFit: 'contain', ...style }}
        aria-hidden="true"
      />
    );
  }
  const art = ART[id] || ART.star;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      style={{ display: 'block', flexShrink: 0, ...style }}
      role="img"
      aria-hidden="true"
    >
      {art}
    </svg>
  );
}
