import { useApp } from '../context/AppContext';
import { Home, AlertCircle } from 'lucide-react';

/* ─────────────────────────────────────────
   #8 NotFoundScreen — shown when currentScreen
   doesn't match any key in SCREEN_MAP
   ───────────────────────────────────────── */
export default function NotFoundScreen() {
  const { navigate } = useApp();

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '80vh',
      padding: '32px 24px',
      fontFamily: 'var(--font-body)',
      animation: 'screenEnter 0.4s var(--ease-out) both',
    }}>
      {/* Illustration */}
      <svg viewBox="0 0 160 160" fill="none" width="140" height="140" style={{ marginBottom: 28 }}>
        <circle cx="80" cy="80" r="70" fill="var(--primary-container)" opacity="0.5"/>
        <circle cx="80" cy="80" r="48" fill="var(--primary-container)" opacity="0.4"/>
        <text x="80" y="98" textAnchor="middle" fontSize="40" fontFamily="serif" fill="var(--primary)" opacity="0.7">?</text>
        <circle cx="125" cy="38" r="10" fill="var(--secondary-container)" opacity="0.7"/>
        <circle cx="35"  cy="125" r="8"  fill="var(--tertiary-container)" opacity="0.7"/>
      </svg>

      <h1 style={{
        fontFamily: 'var(--font-display)',
        fontSize: 'clamp(1.3rem, 4vw, 1.8rem)',
        fontWeight: 600,
        color: 'var(--on-surface)',
        textAlign: 'center',
        marginBottom: 10,
      }}>
        Pantalla no encontrada
      </h1>
      <p style={{
        fontSize: 14,
        color: 'var(--on-surface-variant)',
        textAlign: 'center',
        maxWidth: 280,
        lineHeight: 1.6,
        marginBottom: 32,
      }}>
        La pantalla que buscas no existe o fue movida. Regresa al inicio.
      </p>

      <button
        onClick={() => navigate('dashboard')}
        id="not-found-home"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '12px 28px',
          borderRadius: 99,
          background: 'var(--primary)',
          color: 'white',
          border: 'none',
          fontSize: 14, fontWeight: 700,
          fontFamily: 'var(--font-body)',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(112,87,101,0.28)',
          transition: 'opacity 0.15s ease',
        }}
        onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
        onMouseOut={e => e.currentTarget.style.opacity = '1'}
      >
        <Home size={16} strokeWidth={2.5} />
        Ir al inicio
      </button>
    </div>
  );
}
