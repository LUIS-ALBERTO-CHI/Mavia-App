import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SEED_DATA } from '../context/AppContext';
import { registerWithEmail, loginWithGoogle, parseFirebaseError } from '../lib/authService';
import { seedInitialData } from '../lib/firestoreService';

/* ---- Inline Google SVG (official brand mark) ---- */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}


export default function RegisterScreen() {
  const { dispatch, navigate, showToast } = useApp();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focused, setFocused] = useState('');

  // Helper: dispatch Google login (goes to setup-profile first)
  const dispatchGoogleLogin = (firebaseUser) => {
    const displayName = firebaseUser.displayName || '';
    const firstName   = displayName.split(' ')[0] || firebaseUser.email.split('@')[0];
    dispatch({
      type: 'LOGIN_GOOGLE',
      user: {
        name:      displayName || firstName,
        firstName,
        email:     firebaseUser.email,
        photoURL:  firebaseUser.photoURL || null,
        uid:       firebaseUser.uid,
      },
    });
  };

  // Helper: dispatch email login (goes directly to dashboard)
  const dispatchLogin = (firebaseUser) => {
    const displayName = firebaseUser.displayName || '';
    const firstName   = displayName.split(' ')[0] || firebaseUser.email.split('@')[0];
    dispatch({
      type: 'LOGIN',
      user: {
        name:      displayName || firstName,
        firstName,
        email:     firebaseUser.email,
        photoURL:  firebaseUser.photoURL || null,
        uid:       firebaseUser.uid,
      },
    });
  };

  // Email + password registration
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      showToast('Completa todos los campos', 'error'); return;
    }
    if (form.password.length < 6) {
      showToast('La contraseña debe tener al menos 6 caracteres', 'error'); return;
    }
    setLoading(true);
    try {
      const user = await registerWithEmail({
        name:     form.name.trim(),
        email:    form.email.trim(),
        password: form.password,
      });

      // Seed Firestore with example data for the new user
      const firstName = form.name.split(' ')[0] || form.email.split('@')[0];
      await seedInitialData(user.uid, {
        name:      form.name.trim() || firstName,
        firstName,
        email:     user.email,
        photoURL:  null,
      }, SEED_DATA);

      // Dispatch LOGIN — onAuthStateChanged will also fire and load the data
      dispatchLogin(user);
      showToast(`Bienvenida, ${firstName}`, 'success');
    } catch (err) {
      showToast(parseFirebaseError(err.code), 'error');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In → new users go to setup-profile, returning go to dashboard
  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { user, isNewUser } = await loginWithGoogle();
      const displayName = user.displayName || '';
      const firstName   = displayName.split(' ')[0] || user.email.split('@')[0];
      const name = firstName.charAt(0).toUpperCase() + firstName.slice(1);
      const userData = {
        name: displayName || name,
        firstName: name,
        email: user.email,
        photoURL: user.photoURL || null,
        uid: user.uid,
      };
      if (isNewUser) {
        dispatch({ type: 'LOGIN_GOOGLE', user: userData });
      } else {
        dispatch({ type: 'LOGIN', user: userData });
        showToast('Bienvenida', 'success');
      }
    } catch (err) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        showToast(parseFirebaseError(err.code), 'error');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* ---- AUTH SCREEN ---- */
        .auth-root {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 2.5rem var(--space-md) 3rem;
          position: relative;
          overflow: visible;
          background-color: #fbf9f7;

          /* Organic radial gradient exactly from Stitch */
          background-image:
            radial-gradient(circle at 10% 20%, rgba(248, 215, 232, 0.40) 0%, rgba(255,255,255,0) 40%),
            radial-gradient(circle at 90% 80%, rgba(216, 232, 197, 0.30) 0%, rgba(255,255,255,0) 40%);
        }

        /* Decorative pulsing rings (top-right) */
        .auth-deco {
          position: fixed;
          top: 0;
          right: 0;
          padding: var(--space-xxl);
          pointer-events: none;
          opacity: 0.2;
        }

        .auth-deco-outer {
          width: 16rem;
          height: 16rem;
          border: 1px solid rgba(112, 87, 101, 0.2);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          animation: pulse 8s ease-in-out infinite;
        }

        .auth-deco-inner {
          width: 12rem;
          height: 12rem;
          border: 1px solid rgba(84, 99, 71, 0.2);
          border-radius: var(--radius-full);
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.04); opacity: 0.7; }
        }

        /* ---- Main wrapper ---- */
        .auth-main {
          width: 100%;
          max-width: 440px;
          display: flex;
          flex-direction: column;
          align-items: center;
          position: relative;
          z-index: 1;
        }

        /* ---- Brand ---- */
        .auth-brand {
          margin-bottom: var(--space-xl);
          text-align: center;
        }

        .auth-brand-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg-mobile);
          font-weight: 500;
          color: var(--primary);
          letter-spacing: -0.02em;
          line-height: 1.2;
          margin-bottom: var(--space-sm);
        }

        @media (min-width: 768px) {
          .auth-brand-title { font-size: var(--text-headline-lg); }
        }

        .auth-brand-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          max-width: 280px;
          margin: 0 auto;
          line-height: var(--leading-relaxed);
        }

        /* ---- Card ---- */
        .auth-card {
          width: 100%;
          background: var(--surface-container-lowest);
          border-radius: 32px;
          padding: var(--space-lg);
          box-shadow: 0 20px 40px -10px rgba(112, 87, 101, 0.05);
          border: 1px solid rgba(255,255,255,0.5);
        }

        @media (min-width: 768px) {
          .auth-card { padding: var(--space-xl); }
        }

        .auth-card-title {
          font-family: var(--font-body);
          font-size: var(--text-headline-md);
          font-weight: 600;
          color: var(--on-surface);
          letter-spacing: -0.01em;
          line-height: 1.4;
          margin-bottom: var(--space-lg);
        }

        /* ---- Social buttons ---- */
        .social-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-md);
          padding: 0.875rem var(--space-md);
          background: var(--surface-container-low);
          border: 1px solid rgba(208, 195, 200, 0.3);
          border-radius: var(--radius-xl);
          font-size: var(--text-label-md);
          font-weight: 500;
          letter-spacing: 0.02em;
          color: var(--on-surface);
          cursor: pointer;
          transition: all 300ms ease;
          font-family: var(--font-body);
          margin-bottom: var(--space-md);
        }

        .social-btn:hover { background: var(--surface-container-low); }
        .social-btn:active { transform: scale(0.98); }

        /* ---- Divider ---- */
        .auth-divider {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-sm) 0;
          margin-bottom: var(--space-md);
        }

        .auth-divider-line {
          height: 1px;
          flex: 1;
          background: rgba(208, 195, 200, 0.3);
        }

        .auth-divider-text {
          font-size: var(--text-label-sm);
          font-weight: 600;
          color: var(--outline);
          font-family: var(--font-body);
        }

        /* ---- Form fields ---- */
        .auth-field {
          margin-bottom: var(--space-md);
        }

        .auth-label {
          display: block;
          font-size: var(--text-label-md);
          font-weight: 500;
          letter-spacing: 0.02em;
          color: var(--on-surface-variant);
          margin-bottom: var(--space-xs);
          margin-left: var(--space-xs);
          transition: color 200ms ease, font-weight 200ms ease;
          font-family: var(--font-body);
        }

        .auth-label.focused {
          color: var(--primary);
          font-weight: 600;
        }

        .auth-input-wrap {
          position: relative;
        }

        .auth-input-icon {
          position: absolute;
          left: var(--space-md);
          top: 50%;
          transform: translateY(-50%);
          color: var(--outline);
          pointer-events: none;
          display: flex;
          transition: color 200ms ease;
        }

        .auth-input-icon.focused { color: var(--primary); }

        .auth-input {
          width: 100%;
          padding: 0.875rem var(--space-md) 0.875rem 2.75rem;
          background: var(--surface-container-low);
          border: 1.5px solid transparent;
          border-radius: var(--radius-xl);
          font-size: var(--text-body-md);
          color: var(--on-surface);
          font-family: var(--font-body);
          outline: none;
          transition: all 300ms ease;
        }

        .auth-input::placeholder { color: var(--outline); }

        /* Oculta el ojo nativo del navegador (Edge/Chrome/Safari) */
        .auth-input::-ms-reveal,
        .auth-input::-ms-clear,
        .auth-input::-webkit-credentials-auto-fill-button,
        .auth-input::-webkit-contacts-auto-fill-button { display: none !important; }

        .auth-input:focus {
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(248, 215, 232, 0.5);
        }

        .auth-input-toggle {
          position: absolute;
          right: var(--space-md);
          top: 50%;
          transform: translateY(-50%);
          color: var(--outline);
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 200ms;
        }

        .auth-input-toggle:hover { color: var(--primary); }

        /* ---- Primary CTA ---- */
        .auth-submit {
          width: 100%;
          background: var(--primary);
          color: var(--on-primary);
          font-size: var(--text-label-md);
          font-weight: 500;
          letter-spacing: 0.02em;
          font-family: var(--font-body);
          padding: 1rem;
          border-radius: var(--radius-full);
          border: none;
          cursor: pointer;
          box-shadow: 0 20px 40px -10px rgba(112, 87, 101, 0.05);
          transition: opacity 200ms ease, transform 200ms ease;
          margin-top: var(--space-md);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
        }

        .auth-submit:hover { opacity: 0.9; }
        .auth-submit:active { transform: scale(0.95); }

        .auth-submit.loading {
          opacity: 0.75;
          pointer-events: none;
        }

        /* ---- Footer link ---- */
        .auth-footer {
          margin-top: var(--space-lg);
          text-align: center;
        }

        .auth-footer p {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          font-family: var(--font-body);
          line-height: 1.6;
        }

        .auth-footer a {
          color: var(--primary);
          font-weight: 700;
          margin-left: var(--space-xs);
          cursor: pointer;
          transition: text-decoration 300ms;
        }

        .auth-footer a:hover { text-decoration: underline; }

        /* Spinner */
        .spin {
          animation: spin 0.9s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* Background decorative circles */}
      <div className="auth-deco" aria-hidden="true">
        <div className="auth-deco-outer">
          <div className="auth-deco-inner" />
        </div>
      </div>

      <div className="auth-root">
        <main className="auth-main">
          {/* Brand */}
          <div className="auth-brand">
            <h1 className="auth-brand-title">Mavia</h1>
            <p className="auth-brand-sub">
              Únete a tu espacio de productividad consciente
            </p>
          </div>

          {/* Card */}
          <div className="auth-card">
            <h2 className="auth-card-title">Crear cuenta</h2>

            {/* Social buttons */}
            <button
              className="social-btn"
              id="reg-google"
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              style={googleLoading ? { opacity: 0.7 } : {}}
            >
              <GoogleIcon />
              <span>{googleLoading ? 'Conectando...' : 'Continuar con Google'}</span>
            </button>


            {/* Divider */}
            <div className="auth-divider">
              <div className="auth-divider-line" />
              <span className="auth-divider-text">o</span>
              <div className="auth-divider-line" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              {/* Name */}
              <div className="auth-field">
                <label
                  className={`auth-label${focused === 'name' ? ' focused' : ''}`}
                  htmlFor="reg-name"
                >
                  Nombre completo
                </label>
                <div className="auth-input-wrap">
                  <span className={`auth-input-icon${focused === 'name' ? ' focused' : ''}`}>
                    <Mail size={18} />
                  </span>
                  <input
                    className="auth-input"
                    id="reg-name"
                    type="text"
                    placeholder="Tu nombre"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    onFocus={() => setFocused('name')}
                    onBlur={() => setFocused('')}
                    autoComplete="name"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="auth-field">
                <label
                  className={`auth-label${focused === 'email' ? ' focused' : ''}`}
                  htmlFor="reg-email"
                >
                  Correo electrónico
                </label>
                <div className="auth-input-wrap">
                  <span className={`auth-input-icon${focused === 'email' ? ' focused' : ''}`}>
                    <Mail size={18} />
                  </span>
                  <input
                    className="auth-input"
                    id="reg-email"
                    type="email"
                    placeholder="nombre@ejemplo.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused('')}
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="auth-field">
                <label
                  className={`auth-label${focused === 'password' ? ' focused' : ''}`}
                  htmlFor="reg-password"
                >
                  Contraseña
                </label>
                <div className="auth-input-wrap">
                  <span className={`auth-input-icon${focused === 'password' ? ' focused' : ''}`}>
                    <Lock size={18} />
                  </span>
                  <input
                    className="auth-input"
                    id="reg-password"
                    type={showPass ? 'text' : 'password'}
                    placeholder="Mínimo 8 caracteres"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused('')}
                    autoComplete="new-password"
                    style={{ paddingRight: '3rem' }}
                  />
                  <button
                    type="button"
                    className="auth-input-toggle"
                    onClick={() => setShowPass(s => !s)}
                    aria-label={showPass ? 'Ocultar contraseña' : 'Ver contraseña'}
                    id="reg-toggle-pass"
                  >
                    {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* CTA */}
              <button
                type="submit"
                className={`auth-submit${loading ? ' loading' : ''}`}
                id="reg-submit"
              >
                {loading ? (
                  <span className="spin">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
                    </svg>
                  </span>
                ) : 'Crear mi cuenta'}
              </button>
            </form>

            {/* Footer link */}
            <div className="auth-footer">
              <p>
                ¿Ya tienes una cuenta?
                <a onClick={() => navigate('login')} id="reg-to-login">Iniciar sesión</a>
              </p>
            </div>
          </div>

        </main>
      </div>
    </>
  );
}
