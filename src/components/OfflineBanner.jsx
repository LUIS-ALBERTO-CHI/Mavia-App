import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wifi, WifiOff } from 'lucide-react';

/* ─────────────────────────────────────────
   Online / Offline status banner
   Mounts via Portal so it floats above everything
   without being affected by layout stacking contexts.
   ───────────────────────────────────────── */
export default function OfflineBanner() {
  const [isOnline, setIsOnline]     = useState(navigator.onLine);
  const [showBack, setShowBack]     = useState(false);   // "volviste" flash
  const [visible,  setVisible]      = useState(false);   // animate-in

  useEffect(() => {
    const goOnline = () => {
      setIsOnline(true);
      setShowBack(true);
      setVisible(true);
      // After 3 seconds hide the "back online" banner
      setTimeout(() => {
        setVisible(false);
        setTimeout(() => setShowBack(false), 350);
      }, 3000);
    };
    const goOffline = () => {
      setIsOnline(false);
      setShowBack(false);
      setVisible(true);
    };

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Don't render anything when online and no flash pending
  if (isOnline && !showBack) return null;

  const isOffline = !isOnline;

  const banner = (
    <div
      role="status"
      aria-live="polite"
      aria-label={isOffline ? 'Sin conexión a internet' : 'Conexión restaurada'}
      style={{
        position: 'fixed',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 72px)',   // above mobile bottom nav
        left: '50%',
        transform: visible ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(20px)',
        opacity:   visible ? 1 : 0,
        transition: 'transform 0.3s cubic-bezier(0.34,1.4,0.64,1), opacity 0.25s ease',
        zIndex: 10001,
        pointerEvents: 'none',
      }}
    >
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 9,
        padding: '9px 18px',
        borderRadius: 99,
        fontFamily: 'var(--font-body)',
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: '0.01em',
        boxShadow: '0 4px 20px rgba(0,0,0,0.18)',
        background: isOffline
          ? 'rgba(30,25,28,0.92)'
          : 'rgba(84,99,71,0.95)',
        color: 'white',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: isOffline
          ? '1px solid rgba(255,255,255,0.08)'
          : '1px solid rgba(255,255,255,0.15)',
      }}>
        {isOffline
          ? <WifiOff  size={14} strokeWidth={2.5} />
          : <Wifi     size={14} strokeWidth={2.5} />
        }
        {isOffline
          ? 'Sin conexión — los cambios se guardarán al volver'
          : 'Conexión restaurada'
        }
      </div>
    </div>
  );

  return createPortal(banner, document.body);
}
