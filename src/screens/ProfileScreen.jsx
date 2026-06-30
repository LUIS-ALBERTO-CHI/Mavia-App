import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Edit2, Moon, Globe, Bell, Shield, HelpCircle,
  LogOut, ChevronRight, Check, X, TrendingUp, Flame, Camera
} from 'lucide-react';
import { Switch } from '../components/ui/switch';
import { Button } from '../components/ui/button';
import { logout } from '../lib/authService';

const AVATAR_COLORS      = ['#F8D7E8', '#D5E5C2', '#F0DFAE', '#EDE7F6'];
const AVATAR_COLORS_DARK = ['#57404d', '#3d4b31', '#504622', '#4a4060'];

export default function ProfileScreen() {
  const { state, dispatch, navigate, showToast } = useApp();
  const { user, habits, tasks, goals, darkMode } = state;

  const [editing,    setEditing]    = useState(false);
  const [uploading,  setUploading]  = useState(false);
  const [form,       setForm]       = useState({ name: user.name || '', email: user.email || '' });
  const fileInputRef = useRef(null);

  /* Stats */
  const completedTasks = tasks.filter(t => t.completed).length;
  const habitsDone     = habits.filter(h => h.completedToday).length;
  const avgGoals       = goals.length
    ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length)
    : 0;
  const streakMax      = habits.length
    ? Math.max(...habits.map(h => h.streak))
    : 0;
  const appStreak      = user.appStreak || 0;

  const wellbeingScore = Math.min(100, Math.round(
    (habitsDone / Math.max(habits.length, 1)) * 50 + avgGoals * 0.5
  ));

  const handleSave = () => {
    dispatch({ type: 'UPDATE_USER', updates: { name: form.name, email: form.email, firstName: form.name.split(' ')[0] } });
    showToast('Perfil actualizado', 'success');
    setEditing(false);
  };

  /* Photo upload — reads file as base64 dataURL, stores in user profile */
  const handlePhotoClick = () => fileInputRef.current?.click();

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen debe ser menor a 2 MB', 'error');
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataURL = ev.target.result;
        dispatch({ type: 'UPDATE_USER', updates: { photoURL: dataURL } });
        showToast('Foto actualizada', 'success');
        setUploading(false);
      };
      reader.onerror = () => { showToast('Error al leer la imagen', 'error'); setUploading(false); };
      reader.readAsDataURL(file);
    } catch {
      showToast('Error al subir la foto', 'error');
      setUploading(false);
    }
    e.target.value = '';
  };

  const handleLogout = async () => {
    try {
      await logout(); // Firebase Auth sign out
    } catch (e) { /* ignore */ }
    dispatch({ type: 'LOGOUT' });
    showToast('Hasta pronto 👋');
  };

  /* Avatar: initials or photo */
  const initials = (user.firstName?.[0] || user.name?.[0] || 'A').toUpperCase();
  const colorPalette = darkMode ? AVATAR_COLORS_DARK : AVATAR_COLORS;
  const avatarBg = colorPalette[initials.charCodeAt(0) % colorPalette.length];
  const avatarTextColor = darkMode ? 'var(--primary)' : 'var(--primary)';

  return (
    <>
      <style>{`
        /* ========= PROFILE SCREEN ========= */
        .prof-screen {
          max-width: 520px;
          margin: 0 auto;
          padding: var(--space-xl) var(--space-container) var(--space-8);
          animation: screenEnter 0.55s var(--ease-out) both;
        }

        /* ---- Avatar hero ---- */
        .prof-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: var(--space-xl);
        }

        .prof-avatar-wrap {
          position: relative;
          margin-bottom: var(--space-lg);
        }

        .prof-avatar-ring {
          width: 128px;
          height: 128px;
          border-radius: 50%;
          overflow: hidden;
          border: 4px solid white;
          box-shadow: 0 0 40px rgba(112,87,101,0.12), 0 4px 24px rgba(0,0,0,0.08);
          transition: transform 0.35s ease;
          cursor: pointer;
        }
        .dark .prof-avatar-ring {
          border-color: var(--primary-container);
          box-shadow: 0 0 24px rgba(112,87,101,0.08), 0 4px 16px rgba(0,0,0,0.3);
        }

        .prof-avatar-ring:hover { transform: scale(1.04); }

        .prof-avatar-initials {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: var(--font-display);
          font-size: 2.75rem;
          font-weight: 500;
          color: var(--primary);
        }

        .prof-edit-btn {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: var(--primary);
          color: white;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(112,87,101,0.3);
          transition: transform var(--transition-spring);
        }
        .dark .prof-edit-btn { border-color: var(--background); }

        .prof-edit-btn:hover { transform: scale(1.12); }
        .prof-edit-btn:active { transform: scale(0.95); }

        .prof-name {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--on-background);
          margin-bottom: 4px;
          line-height: 1.2;
        }

        .prof-role {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
        }

        /* ---- Bento stats ---- */
        .prof-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }

        .prof-stat-card {
          background: var(--surface-container);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 20px;
          padding: var(--space-md);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 12px rgba(112,87,101,0.06);
          gap: 4px;
          min-height: 80px;
        }

        .prof-stat-num {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          font-weight: 600;
          line-height: 1;
        }

        .prof-stat-label {
          font-size: var(--text-label-md);
          color: var(--on-surface-variant);
          font-weight: 500;
        }

        /* ---- Section list ---- */
        .prof-section-label {
          font-size: var(--text-label-md);
          font-weight: 600;
          color: var(--primary);
          margin-bottom: var(--space-xs);
          padding: 0 var(--space-sm);
          letter-spacing: 0.01em;
        }

        .prof-group {
          background: var(--surface-container-lowest);
          border-radius: 28px;
          overflow: hidden;
          border: 1px solid rgba(208,195,200,0.2);
          box-shadow: 0 2px 12px rgba(112,87,101,0.05);
          margin-bottom: var(--space-xl);
        }

        .prof-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-md) var(--space-lg);
          cursor: pointer;
          transition: background var(--transition-fast);
          gap: var(--space-md);
        }

        .prof-row:hover { background: var(--surface-container-low); }
        .prof-row + .prof-row { border-top: 1px solid rgba(208,195,200,0.1); }

        .prof-row-left {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }

        .prof-row-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .prof-row-label {
          font-size: var(--text-body-md);
          font-weight: 400;
          color: var(--on-surface);
        }

        .prof-row-right {
          display: flex;
          align-items: center;
          gap: var(--space-xs);
          color: var(--on-surface-variant);
          font-size: var(--text-label-md);
          flex-shrink: 0;
        }

        /* Toggle */
        .prof-toggle {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
          cursor: pointer;
        }
        .prof-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }

        .prof-toggle-track {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          transition: background var(--transition-fast);
        }

        .prof-toggle input:checked ~ .prof-toggle-track { background: var(--secondary); }
        .prof-toggle input:not(:checked) ~ .prof-toggle-track { background: var(--surface-variant); }

        .prof-toggle-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: var(--surface-container-low);
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
          transition: transform var(--transition-spring);
          pointer-events: none;
          z-index: 1;
        }

        .prof-toggle input:checked ~ .prof-toggle-thumb { transform: translateX(20px); }


        /* Edit panel */
        .prof-edit-panel {
          background: var(--surface-container);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.3);
          border-radius: 28px;
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
          box-shadow: 0 4px 20px rgba(112,87,101,0.08);
          animation: scaleIn 0.3s var(--ease-spring);
        }

        .prof-edit-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          color: var(--on-surface);
          margin-bottom: var(--space-md);
        }

        .prof-edit-input {
          width: 100%;
          padding: 0.75rem 1rem;
          background: var(--surface-container-low);
          border: none;
          border-radius: 14px;
          font-size: var(--text-body-md);
          font-family: var(--font-body);
          color: var(--on-surface);
          outline: none;
          margin-bottom: var(--space-sm);
          transition: box-shadow var(--transition-fast);
        }

        .prof-edit-input:focus { box-shadow: 0 0 0 3px rgba(248,215,232,0.5); }

        .prof-edit-actions {
          display: flex;
          gap: var(--space-sm);
          margin-top: var(--space-md);
        }

        .prof-edit-save {
          flex: 1;
          padding: 0.75rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: var(--text-label-md);
          font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          transition: opacity var(--transition-fast);
        }

        .prof-edit-save:hover { opacity: 0.9; }

        .prof-edit-cancel {
          flex: 1;
          padding: 0.75rem;
          background: var(--surface-container);
          color: var(--on-surface);
          border: none;
          border-radius: 12px;
          font-size: var(--text-label-md);
          font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
          transition: opacity var(--transition-fast);
        }

        /* Logout */
        .prof-logout-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-sm);
          margin: 0 auto var(--space-8);
          padding: var(--space-md) var(--space-xl);
          background: none;
          border: none;
          color: var(--primary);
          font-size: var(--text-label-md);
          font-weight: 600;
          font-family: var(--font-body);
          letter-spacing: 0.06em;
          cursor: pointer;
          transition: all 0.2s ease;
          border-radius: 9999px;
        }

        .prof-logout-btn:hover {
          color: var(--error);
          transform: scale(0.97);
        }

        .prof-edit-name-btn {
          margin-top: 6px;
          background: none;
          border: none;
          color: var(--on-surface-variant);
          font-size: var(--text-label-sm);
          font-family: var(--font-body);
          cursor: pointer;
          padding: 4px 10px;
          border-radius: 99px;
          transition: background var(--transition-fast), color var(--transition-fast);
          display: inline-flex;
          align-items: center;
        }
        .prof-edit-name-btn:hover {
          background: var(--surface-container);
          color: var(--primary);
        }

        /* Profile grid 2x2 */
        .prof-stats {
          grid-template-columns: 1fr 1fr;
        }

        @keyframes screenEnter {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @keyframes scaleIn {
          from { transform: scale(0.96); opacity: 0; }
          to   { transform: scale(1); opacity: 1; }
        }

        /* ── Profile dark mode ── */
        .dark .prof-stat-card {
          background: var(--surface-container) !important;
          border: 1px solid rgba(255,255,255,0.08) !important;
        }
        .dark .prof-group {
          background: var(--surface-container-low) !important;
          border: 1px solid rgba(255,255,255,0.07) !important;
          box-shadow: none !important;
        }
        .dark .prof-row { background: transparent; }
        .dark .prof-row:hover { background: var(--surface-container-high) !important; }
        .dark .prof-row + .prof-row { border-top: 1px solid rgba(255,255,255,0.05) !important; }
      `}</style>

      <div className="prof-screen">

        {/* ── Profile hero ── */}
        <section className="prof-hero">
          <div className="prof-avatar-wrap">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
              id="prof-photo-input"
            />
            <div
              className="prof-avatar-ring"
              onClick={handlePhotoClick}
              title="Cambiar foto de perfil"
            >
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt="Foto de perfil"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div className="prof-avatar-initials" style={{ background: avatarBg }}>
                  {initials}
                </div>
              )}
            </div>
            <button
              className="prof-edit-btn"
              onClick={handlePhotoClick}
              id="prof-edit-avatar"
              aria-label="Cambiar foto de perfil"
              disabled={uploading}
              style={uploading ? { opacity: 0.6 } : {}}
            >
              {uploading
                ? <span style={{ fontSize: 10, fontWeight: 700 }}>...</span>
                : <Camera size={16} strokeWidth={2.5} />}
            </button>
          </div>
          <h2 className="prof-name">{user.name || user.firstName || 'Usuario'}</h2>
          <p className="prof-role">{user.email || 'Mavia · Bienestar & Productividad'}</p>
          <button
            className="prof-edit-name-btn"
            onClick={() => setEditing(e => !e)}
            id="prof-edit-name"
            aria-label="Editar nombre"
          >
            <Edit2 size={13} strokeWidth={2} style={{ display: 'inline', marginRight: 4 }} />
            Editar nombre
          </button>
        </section>

        {/* ── Stats bento ── */}
        <div className="prof-stats">
          <div className="prof-stat-card">
            <span className="prof-stat-num" style={{ color: 'var(--primary)' }}>
              {completedTasks}
            </span>
            <span className="prof-stat-label">Logros diarios</span>
          </div>
          <div className="prof-stat-card">
            <span className="prof-stat-num" style={{ color: 'var(--secondary)' }}>
              {wellbeingScore}%
            </span>
            <span className="prof-stat-label">Bienestar</span>
          </div>
          <div className="prof-stat-card">
            <span className="prof-stat-num" style={{ color: '#E56B4E', display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
              <Flame size={18} color="#E56B4E" />{appStreak}
            </span>
            <span className="prof-stat-label">Racha de app</span>
          </div>
          <div className="prof-stat-card">
            <span className="prof-stat-num" style={{ color: 'var(--tertiary)' }}>
              {streakMax}
            </span>
            <span className="prof-stat-label">Racha hábito</span>
          </div>
        </div>

        {/* ── Edit panel (visible when editing) ── */}
        {editing && (
          <div className="prof-edit-panel">
            <div className="prof-edit-title">Editar perfil</div>
            <input
              className="prof-edit-input"
              placeholder="Nombre completo"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              id="prof-name"
            />
            <input
              className="prof-edit-input"
              type="email"
              placeholder="Correo electrónico"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              id="prof-email"
            />
            <div className="prof-edit-actions">
              <button className="prof-edit-cancel" onClick={() => setEditing(false)} id="prof-cancel">
                <X size={14} style={{ display: 'inline', marginRight: 4 }} />
                Cancelar
              </button>
              <button className="prof-edit-save" onClick={handleSave} id="prof-save">
                <Check size={14} />
                Guardar
              </button>
            </div>
          </div>
        )}

        {/* ── Sección Preferencias ── */}
        <p className="prof-section-label">Preferencias</p>
        <div className="prof-group">
          {/* Dark mode */}
          <div className="prof-row">
            <div className="prof-row-left">
              <div className="prof-row-icon" style={{ background: 'rgba(84,99,71,0.12)' }}>
                <Moon size={18} color="var(--secondary)" strokeWidth={1.75} />
              </div>
              <span className="prof-row-label">Modo oscuro</span>
            </div>
            <Switch
              id="prof-dark"
              checked={!!state.darkMode}
              onCheckedChange={() => dispatch({ type: 'TOGGLE_DARK_MODE' })}
              aria-label="Modo oscuro"
            />
          </div>

          {/* Language */}
          <div className="prof-row" onClick={() => navigate('settings')} id="prof-lang">
            <div className="prof-row-left">
              <div className="prof-row-icon" style={{ background: 'rgba(112,87,101,0.1)' }}>
                <Globe size={18} color="var(--primary)" strokeWidth={1.75} />
              </div>
              <span className="prof-row-label">Idioma</span>
            </div>
            <div className="prof-row-right">
              <span>Español</span>
              <ChevronRight size={16} />
            </div>
          </div>

          {/* Notifications */}
          <div className="prof-row" onClick={() => navigate('notifications')} id="prof-notifs">
            <div className="prof-row-left">
              <div className="prof-row-icon" style={{ background: 'rgba(105,94,55,0.1)' }}>
                <Bell size={18} color="var(--tertiary)" strokeWidth={1.75} />
              </div>
              <span className="prof-row-label">Notificaciones</span>
            </div>
            <div className="prof-row-right">
              <span>Activadas</span>
              <ChevronRight size={16} />
            </div>
          </div>
        </div>

        {/* ── Sección Cuenta ── */}
        <p className="prof-section-label">Cuenta</p>
        <div className="prof-group">
          {/* Privacy */}
          <div className="prof-row" onClick={() => navigate('settings')} id="prof-privacy">
            <div className="prof-row-left">
              <div className="prof-row-icon" style={{ background: 'rgba(208,195,200,0.2)' }}>
                <Shield size={18} color="var(--on-surface-variant)" strokeWidth={1.75} />
              </div>
              <span className="prof-row-label">Privacidad y Seguridad</span>
            </div>
            <ChevronRight size={16} color="var(--on-surface-variant)" />
          </div>

          {/* Statistics */}
          <div className="prof-row" onClick={() => navigate('statistics')} id="prof-stats-row">
            <div className="prof-row-left">
              <div className="prof-row-icon" style={{ background: 'rgba(208,195,200,0.2)' }}>
                <TrendingUp size={18} color="var(--on-surface-variant)" strokeWidth={1.75} />
              </div>
              <span className="prof-row-label">Mis estadísticas</span>
            </div>
            <ChevronRight size={16} color="var(--on-surface-variant)" />
          </div>

          {/* Help */}
          <div className="prof-row" id="prof-help">
            <div className="prof-row-left">
              <div className="prof-row-icon" style={{ background: 'rgba(208,195,200,0.2)' }}>
                <HelpCircle size={18} color="var(--on-surface-variant)" strokeWidth={1.75} />
              </div>
              <span className="prof-row-label">Centro de Ayuda</span>
            </div>
            <ChevronRight size={16} color="var(--on-surface-variant)" />
          </div>
        </div>

        {/* ── Logout ── */}
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--space-xl)' }}>
          <Button
            variant="outline"
            size="lg"
            onClick={handleLogout}
            id="prof-logout"
            className="gap-2 text-error border-error/30 hover:bg-error-container hover:text-on-error-container"
          >
            <LogOut size={18} strokeWidth={2} />
            Cerrar sesión
          </Button>
        </div>

      </div>
    </>
  );
}
