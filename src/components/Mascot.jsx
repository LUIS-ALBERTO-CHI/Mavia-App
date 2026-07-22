import { useState } from 'react';
import Sticker from './Sticker';

/**
 * Mascot — gatita de Mavia (estados vacíos, bienvenida, etc.).
 * Usa /public/mascota.png. Si aún no existe, cae al gatito SVG.
 * Recomendado: PNG 512×512 px, fondo transparente.
 */
export default function Mascot({ size = 120, className = '', style = {} }) {
  const [failed, setFailed] = useState(false);

  if (failed) return <Sticker id="cat" size={size} className={className} style={style} />;

  return (
    <img
      src="/mascota.png"
      width={size}
      height={size}
      alt="Mavia"
      onError={() => setFailed(true)}
      className={className}
      style={{ display: 'block', objectFit: 'contain', ...style }}
    />
  );
}
