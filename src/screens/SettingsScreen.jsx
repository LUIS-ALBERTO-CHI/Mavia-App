import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Switch } from '../components/ui/switch';
import {
  Bell, Calendar, Brain, Repeat2, Moon, Globe, Clock,
  RefreshCw, Download, Lock, ShieldCheck, LogOut, ChevronRight,
  Settings
} from 'lucide-react';

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
          <SettingRow
            icon={Bell} iconBg="var(--primary-container)" iconColor="var(--primary)"
            label="Recordatorios de tareas"
            id="set-task-notif"
            right={<Switch checked={notifTasks} onCheckedChange={setNotifTasks} id="sw-tasks" />}
          />
          <SettingRow
            icon={Calendar} iconBg="var(--secondary-container)" iconColor="var(--secondary)"
            label="Eventos próximos"
            id="set-ev-notif"
            right={<Switch checked={notifEvents} onCheckedChange={setNotifEvents} id="sw-events" />}
          />
          <SettingRow
            icon={Brain} iconBg="var(--tertiary-container)" iconColor="var(--tertiary)"
            label="Meditación diaria"
            id="set-med-notif"
            right={<Switch checked={notifMedit} onCheckedChange={setNotifMedit} id="sw-med" />}
          />
          <SettingRow
            icon={Repeat2} iconBg="rgba(74,111,165,0.12)" iconColor="#4a6fa5"
            label="Recordatorio de hábitos"
            id="set-habit-notif"
            right={<Switch checked={notifHabits} onCheckedChange={setNotifHabits} id="sw-habits" />}
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
            icon={RefreshCw} iconBg="var(--secondary-container)" iconColor="var(--secondary)"
            label="Sincronizar datos"
            sub="Última sync: hace 2 minutos"
            onClick={() => showToast('Sincronizando...', 'success')}
            id="set-sync"
            right={<ChevronRight size={16} />}
          />
          <SettingRow
            icon={Download} iconBg="var(--tertiary-container)" iconColor="var(--tertiary)"
            label="Exportar datos"
            sub="Descarga tu información en JSON"
            onClick={() => showToast('Datos exportados', 'success')}
            id="set-export"
            right={<ChevronRight size={16} />}
          />
        </SettingGroup>

        {/* ── Privacidad ── */}
        <SettingGroup title="Privacidad y seguridad">
          <SettingRow
            icon={Lock} iconBg="var(--primary-container)" iconColor="var(--primary)"
            label="Política de privacidad"
            onClick={() => showToast('Abriendo política...')}
            id="set-privacy"
            right={<ChevronRight size={16} />}
          />
          <SettingRow
            icon={ShieldCheck} iconBg="var(--secondary-container)" iconColor="var(--secondary)"
            label="Seguridad de la cuenta"
            sub="Contraseña y autenticación"
            onClick={() => {}}
            id="set-security"
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

        <div className="stg-footer">Mavia v1.0.0 · Hecho con amor para ti 🌸</div>

      </div>
    </>
  );
}
