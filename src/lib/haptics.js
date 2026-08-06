/* Vibración háptica sutil (móvil). En desktop/iOS-Safari sin soporte, no-op. */
export function haptic(pattern = 10) {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern);
  } catch {}
}
