import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Switch } from '../components/ui/switch';
import {
  Bell, Calendar, Brain, Repeat2, Moon, Globe, Clock,
  RefreshCw, Download, Upload, Lock, ShieldCheck, LogOut,
  ChevronRight, Settings, Eye, EyeOff, X, Check
} from 'lucide-react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';

function SettingRow({ icon: Icon, iconBg, iconColor = 'var(--on-surface-variant)', label, sub, right, onClick, id, danger }) {
  return (
    <div
      className={`stg-row${onClick ? ' clickable' : ''}${danger ? ' danger' : ''}`}
      onClick={onClick}
      id={id}
    >
      <div className="stg-icon" style={{ background: iconBg }}>
        <Icon size={18} color={iconColor} strokeWidth={1.75} />
      </div>
      <div className="stg-text">
        <span className="stg-label">{label}</span>
        {sub && <span className="stg-sub">{sub}</span>}
      </div>
      <div className="stg-right">{right}</div>
    </div>
  );
}

function SettingGroup({ title, children }) {
  return (
    <section className="stg-section">
      <div className="stg-section-head">
        <span className="stg-section-label">{title}</span>
        <div className="stg-section-line" />
      </div>
      <div className="stg-group">{children}</div>
    </section>
  );
}

export default function SettingsScreen() {
  const { state, dispatch, showToast } = useApp();
  const [permStatus, setPermStatus] = useState(() =>
    'Notification' in window ? Notification.permission : 'unsupported'
  );

  // #1 Change password modal
  const [showPwModal, setShowPwModal]   = useState(false);
  const [currentPw,   setCurrentPw]     = useState('');
  const [newPw,       setNewPw]         = useState('');
  const [confirmPw,   setConfirmPw]     = useState('');
  const [showPw,      setShowPw]        = useState(false);
  const [pwLoading,   setPwLoading]     = useState(false);
  const [pwError,     setPwError]       = useState('');

  const handleChangePassword = async () => {
    if (!newPw || newPw.length < 6) { setPwError('La nueva contraseña debe tener al menos 6 caracteres.'); return; }
    if (newPw !== confirmPw)         { setPwError('Las contraseñas no coinciden.'); return; }
    setPwLoading(true); setPwError('');
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('No hay sesión activa');
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      showToast('Contraseña actualizada', 'success');
      setShowPwModal(false);
      setCurrentPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setPwError('Contraseña actual incorrecta.');
      } else if (err.code === 'auth/weak-password') {
        setPwError('La contraseña es demasiado débil.');
      } else {
        setPwError(err.message || 'Error al actualizar la contraseña.');
      }
    } finally {
      setPwLoading(false);
    }
  };

  // #7 JSON import
  const fileInputRef = useRef(null);
  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.version) throw new Error('Formato inválido');
        // Restore each collection if present
        if (data.tasks)            dispatch({ type: 'IMPORT_TASKS',   tasks:   data.tasks });
        if (data.events)           dispatch({ type: 'IMPORT_EVENTS',  events:  data.events });
        if (data.goals)            dispatch({ type: 'IMPORT_GOALS',   goals:   data.goals });
        if (data.habits)           dispatch({ type: 'IMPORT_HABITS',  habits:  data.habits });
        if (data.journalEntries)   dispatch({ type: 'IMPORT_JOURNAL', entries: data.journalEntries });
        if (data.gratitudeEntries) dispatch({ type: 'IMPORT_GRATITUDE', entries: data.gratitudeEntries });
        showToast('Datos importados correctamente', 'success');
      } catch {
        showToast('Archivo inválido o corrupto', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRequestPermission = async () => {
    if (!('Notification' in window)) return;
    const result = await Notification.requestPermission();
    setPermStatus(result);
    if (result === 'granted') showToast('✅ Notificaciones activadas', 'success');
    else showToast('Notificaciones bloqueadas en el navegador', 'error');
  };

  const handleExport = () => {
    try {
      const { tasks, events, goals, habits, journalEntries, gratitudeEntries } = state;
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        tasks, events, goals, habits, journalEntries, gratitudeEntries,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `mavia-datos-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Datos exportados correctamente', 'success');
    } catch {
      showToast('Error al exportar datos');
    }
  };

  const [notifTasks,   setNotifTasks]   = useState(true);
  const [notifEvents,  setNotifEvents]  = useState(true);
  const [notifMedit,   setNotifMedit]   = useState(true);
  const [notifHabits,  setNotifHabits]  = useState(true);

  return (
    <>
      <style>{`
        /* ======= SETTINGS SCREEN ======= */
        .stg-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 720px;
          margin: 0 auto;
        }

        /* ── Hero ── */
        .stg-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .stg-hero-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          opacity: 0.85;
          margin-bottom: var(--space-xl);
        }

        /* ── Section ── */
        .stg-section { margin-bottom: var(--space-xl); }

        .stg-section-head {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-md);
        }
        .stg-section-label {
          font-size: var(--text-label-sm);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--on-surface-variant);
          white-space: nowrap;
        }
        .stg-section-line {
          flex: 1;
          height: 1px;
          background: rgba(208,195,200,0.25);
        }

        /* ── Group card ── */
        .stg-group {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          border: 1px solid rgba(208,195,200,0.12);
          box-shadow: 0 4px 20px rgba(112,87,101,0.04);
          overflow: hidden;
        }

        /* ── Row ── */
        .stg-row {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          padding: var(--space-md) var(--space-lg);
          border-bottom: 1px solid rgba(208,195,200,0.1);
          transition: background var(--transition-fast);
        }
        .stg-row:last-child { border-bottom: none; }
        .stg-row.clickable { cursor: pointer; }
        .stg-row.clickable:hover { background: rgba(248,215,232,0.08); }
        .stg-row.clickable:active { background: rgba(248,215,232,0.15); }
        .stg-row.danger:hover { background: rgba(186,26,26,0.05); }

        .stg-icon {
          width: 38px;
          height: 38px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .stg-text {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .stg-label {
          font-size: var(--text-label-md);
          font-weight: 500;
          color: var(--on-surface);
        }
        .stg-row.danger .stg-label { color: var(--error); }
        .stg-sub {
          font-size: var(--text-label-sm);
          color: var(--on-surface-variant);
        }

        .stg-right {
          color: var(--on-surface-variant);
          font-size: var(--text-label-md);
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          flex-shrink: 0;
        }

        /* ── Footer ── */
        .stg-footer {
          text-align: center;
          padding: var(--space-xl) 0 var(--space-md);
          font-size: var(--text-label-sm);
          color: var(--outline);
        }
      `}</style>

      <div className="stg-screen">

        {/* Hero */}
        <h1 className="stg-hero-title">Configuración</h1>
        <p className="stg-hero-sub">Personaliza Mavia a tu gusto.</p>

        {/* ── Notificaciones ── */}
        <SettingGroup title="Notificaciones">
          {/* Permission status row */}
          <SettingRow
            icon={Bell} iconBg="var(--primary-container)" iconColor="var(--primary)"
            label="Notificaciones del sistema"
            id="set-notif-perm"
            sub={
              permStatus === 'granted'  ? 'Activadas ✅' :
              permStatus === 'denied'   ? 'Bloqueadas en el navegador ❌' :
              permStatus === 'unsupported' ? 'No soportado en este navegador' :
              'Permiso no solicitado'
            }
            right={
              permStatus !== 'granted' && permStatus !== 'unsupported' ? (
                <button
                  onClick={handleRequestPermission}
                  style={{
                    fontSize: '12px', padding: '5px 12px',
                    borderRadius: '20px', cursor: 'pointer',
                    background: 'var(--primary)', color: 'var(--on-primary)',
                    border: 'none', fontWeight: 600,
                  }}
                  id="btn-enable-notif"
                >
                  Activar
                </button>
              ) : null
            }
          />
          <SettingRow
            icon={Calendar} iconBg="var(--secondary-container)" iconColor="var(--secondary)"
            label="Recordatorios de tareas"
            sub="15 min antes y al momento"
            id="set-task-notif"
            right={<Switch checked={notifTasks && permStatus === 'granted'} onCheckedChange={setNotifTasks} id="sw-tasks" disabled={permStatus !== 'granted'} />}
          />
          <SettingRow
            icon={Repeat2} iconBg="rgba(74,111,165,0.12)" iconColor="#4a6fa5"
            label="Recordatorio de hábitos"
            sub="Todos los días a las 8:00 PM"
            id="set-habit-notif"
            right={<Switch checked={notifHabits && permStatus === 'granted'} onCheckedChange={setNotifHabits} id="sw-habits" disabled={permStatus !== 'granted'} />}
          />
          <SettingRow
            icon={Bell} iconBg="var(--tertiary-container)" iconColor="var(--tertiary)"
            label="Eventos del día"
            sub="30 minutos antes de cada evento"
            id="set-ev-notif"
            right={<Switch checked={notifEvents && permStatus === 'granted'} onCheckedChange={setNotifEvents} id="sw-events" disabled={permStatus !== 'granted'} />}
          />
        </SettingGroup>

        {/* ── Apariencia ── */}
        <SettingGroup title="Apariencia">
          <SettingRow
            icon={Moon} iconBg="var(--secondary-container)" iconColor="var(--secondary)"
            label="Modo oscuro"
            sub={state.darkMode ? 'Activado' : 'Desactivado'}
            id="set-dark"
            right={<Switch checked={state.darkMode} onCheckedChange={() => dispatch({ type: 'TOGGLE_DARK_MODE' })} id="sw-dark" />}
          />
          <SettingRow
            icon={Globe} iconBg="var(--surface-container)"
            label="Idioma"
            id="set-lang"
            right={<><span>Español</span><ChevronRight size={16} /></>}
          />
          <SettingRow
            icon={Clock} iconBg="var(--surface-container)"
            label="Zona horaria"
            id="set-tz"
            right={<><span>Ciudad de México</span><ChevronRight size={16} /></>}
          />
        </SettingGroup>

        {/* ── Datos ── */}
        <SettingGroup title="Datos y sincronización">
          <SettingRow
            icon={Download} iconBg="var(--secondary-container)" iconColor="var(--secondary)"
            label="Exportar datos"
            sub="Descarga tu información en JSON"
            onClick={handleExport}
            id="set-export"
            right={<ChevronRight size={16} />}
          />
          <SettingRow
            icon={Upload} iconBg="var(--tertiary-container)" iconColor="var(--tertiary)"
            label="Importar datos"
            sub="Restaura desde un backup JSON"
            onClick={() => fileInputRef.current?.click()}
            id="set-import"
            right={<ChevronRight size={16} />}
          />
          {/* Hidden file input for import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: 'none' }}
            onChange={handleImport}
            id="set-import-file"
            aria-label="Seleccionar archivo de backup"
          />
        </SettingGroup>

        {/* ── Privacidad ── */}
        <SettingGroup title="Privacidad y seguridad">
          <SettingRow
            icon={Lock} iconBg="var(--primary-container)" iconColor="var(--primary)"
            label="Cambiar contraseña"
            sub="Actualiza tu contraseña de acceso"
            onClick={() => setShowPwModal(true)}
            id="set-change-pw"
            right={<ChevronRight size={16} />}
          />
          <SettingRow
            icon={ShieldCheck} iconBg="var(--secondary-container)" iconColor="var(--secondary)"
            label="Política de privacidad"
            onClick={() => showToast('Abriendo política...')}
            id="set-privacy"
            right={<ChevronRight size={16} />}
          />
          <SettingRow
            icon={LogOut} iconBg="var(--error-container)" iconColor="var(--error)"
            label="Cerrar sesión"
            id="set-logout"
            danger
            onClick={() => dispatch({ type: 'SET_AUTHENTICATED', value: false })}
            right={<ChevronRight size={16} color="var(--error)" />}
          />
        </SettingGroup>

        {/* #1 Change password modal */}
        {showPwModal && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="pw-modal-title"
            style={{
              position: 'fixed', inset: 0, zIndex: 9999,
              background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
            }}
            onClick={(e) => { if (e.target === e.currentTarget) setShowPwModal(false); }}
          >
            <div style={{
              background: 'var(--surface)', borderRadius: 24, padding: '28px 24px',
              width: '100%', maxWidth: 380,
              boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
              animation: 'slideUp 0.28s cubic-bezier(0.34,1.4,0.64,1) both',
              fontFamily: 'var(--font-body)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h2 id="pw-modal-title" style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 600, color: 'var(--on-surface)' }}>
                  Cambiar contraseña
                </h2>
                <button onClick={() => setShowPwModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: 4, borderRadius: 8 }} aria-label="Cerrar">
                  <X size={20} />
                </button>
              </div>

              {[{ label: 'Contraseña actual', val: currentPw, setter: setCurrentPw, id: 'pw-current' },
                { label: 'Nueva contraseña', val: newPw,     setter: setNewPw,     id: 'pw-new' },
                { label: 'Confirmar nueva',  val: confirmPw,  setter: setConfirmPw,  id: 'pw-confirm' },
              ].map(({ label, val, setter, id }) => (
                <div key={id} style={{ marginBottom: 14 }}>
                  <label htmlFor={id} style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)', display: 'block', marginBottom: 6 }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id={id}
                      type={showPw ? 'text' : 'password'}
                      value={val}
                      onChange={e => setter(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 40px 10px 14px',
                        borderRadius: 12, border: '1.5px solid var(--outline-variant)',
                        background: 'var(--surface-container)', color: 'var(--on-surface)',
                        fontSize: 14, fontFamily: 'var(--font-body)',
                        boxSizing: 'border-box', outline: 'none',
                      }}
                      onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                      onBlur={e => e.target.style.borderColor = 'var(--outline-variant)'}
                    />
                    {id === 'pw-current' && (
                      <button type="button" onClick={() => setShowPw(s => !s)}
                        style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)', padding: 4 }}
                        aria-label={showPw ? 'Ocultar' : 'Mostrar'}>
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {pwError && <p style={{ fontSize: 12, color: 'var(--error)', marginBottom: 14, lineHeight: 1.4 }}>{pwError}</p>}

              <button
                onClick={handleChangePassword}
                disabled={pwLoading}
                id="pw-submit"
                style={{
                  width: '100%', padding: '13px',
                  background: pwLoading ? 'var(--outline-variant)' : 'var(--primary)',
                  color: 'white', border: 'none', borderRadius: 99,
                  fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-body)',
                  cursor: pwLoading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'opacity 0.15s ease',
                }}
              >
                {pwLoading ? 'Actualizando...' : <><Check size={15} strokeWidth={3}/> Guardar contraseña</>}
              </button>
            </div>
          </div>
        )}

        <div className="stg-footer">Mavia v1.0.0 · Hecho con amor para ti 🌸</div>

      </div>
    </>
  );
}
