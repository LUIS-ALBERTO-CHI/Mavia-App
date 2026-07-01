import { Component } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

/* ─────────────────────────────────────────
   #6 Global Error Boundary
   Catches React render errors in any child screen.
   Shows a friendly recovery UI instead of a white blank screen.
   ───────────────────────────────────────── */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log for debugging — replace with Sentry/Crashlytics in production
    console.error('[Mavia ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    // If a reset callback is provided (e.g., navigate to dashboard), call it
    this.props.onReset?.();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div style={{
        position: 'fixed', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: 'var(--background)',
        padding: '32px 24px',
        fontFamily: 'var(--font-body)',
        zIndex: 10000,
      }}>
        <div style={{
          width: 72, height: 72,
          borderRadius: '50%',
          background: 'var(--error-container)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 24,
        }}>
          <AlertTriangle size={34} color="var(--error)" strokeWidth={1.75} />
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(1.2rem, 4vw, 1.6rem)',
          fontWeight: 600,
          color: 'var(--on-surface)',
          textAlign: 'center',
          marginBottom: 10,
        }}>
          Algo salió mal
        </h2>

        <p style={{
          fontSize: 14,
          color: 'var(--on-surface-variant)',
          textAlign: 'center',
          maxWidth: 300,
          lineHeight: 1.6,
          marginBottom: 32,
        }}>
          Ocurrió un error inesperado. Tus datos están seguros. Puedes intentar recargar la pantalla.
        </p>

        {import.meta.env.DEV && this.state.error && (
          <details style={{
            fontSize: 11,
            color: 'var(--on-surface-variant)',
            background: 'var(--surface-container)',
            borderRadius: 12,
            padding: '10px 14px',
            maxWidth: 340,
            width: '100%',
            marginBottom: 24,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: 6 }}>Detalles del error</summary>
            {this.state.error.toString()}
          </details>
        )}

        <button
          onClick={this.handleReset}
          id="error-boundary-reset"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '13px 28px',
            borderRadius: 99,
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            fontSize: 14, fontWeight: 700,
            fontFamily: 'var(--font-body)',
            cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(112,87,101,0.3)',
            transition: 'opacity 0.15s ease',
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.88'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          <RefreshCw size={16} strokeWidth={2.5} />
          Intentar de nuevo
        </button>
      </div>
    );
  }
}
