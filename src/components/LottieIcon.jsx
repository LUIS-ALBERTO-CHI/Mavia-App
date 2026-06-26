/**
 * LottieIcon — Carga y reproduce animaciones Lottie gratuitas.
 *
 * Las animaciones se cargan desde /animations/ (public folder).
 * Si falla la carga, muestra un ícono SVG de fallback.
 *
 * Uso:
 *   <LottieIcon name="flower" size={80} loop />
 *   <LottieIcon name="sparkle" size={40} autoplay={false} />
 */
import { useEffect, useState } from 'react';
import Lottie from 'lottie-react';
import { Sparkles } from 'lucide-react';

// Map de nombres → archivos en /public/animations/
const ANIMATION_FILES = {
  flower:     '/animations/flower.json',
  sparkle:    '/animations/sparkle.json',
  sparkles:   '/animations/sparkle.json',
  meditation: '/animations/meditation.json',
  success:    '/animations/success.json',
  wave:       '/animations/wave.json',
  calm:       '/animations/wave.json',
};

export default function LottieIcon({
  name = 'sparkle',
  size = 80,
  loop = true,
  autoplay = true,
  className = '',
  style = {},
}) {
  const [animationData, setAnimationData] = useState(null);
  const [error, setError] = useState(false);

  const src = ANIMATION_FILES[name];

  useEffect(() => {
    if (!src) { setError(true); return; }
    let cancelled = false;
    fetch(src)
      .then(r => r.json())
      .then(data => { if (!cancelled) setAnimationData(data); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [src]);

  // Fallback: ícono SVG mientras carga o si hay error
  if (error || !animationData) {
    return (
      <span
        className={className}
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: size, height: size, ...style }}
      >
        <Sparkles size={size * 0.5} color="var(--primary)" strokeWidth={1.5} />
      </span>
    );
  }

  return (
    <Lottie
      animationData={animationData}
      loop={loop}
      autoplay={autoplay}
      className={className}
      style={{ width: size, height: size, ...style }}
    />
  );
}
