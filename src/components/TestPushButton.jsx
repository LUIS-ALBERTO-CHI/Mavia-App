// ============================================
// TestPushButton.jsx — Mavia
// Botón de diagnóstico + envío inmediato de push
// ============================================
import { useState } from 'react';
import {
  requestNotificationPermission,
  showNotification,
  initFCM,
} from '../lib/notificationService';
import { createScheduledNotification } from '../lib/firestoreService';
import { useApp } from '../context/AppContext';

const STEPS = {
  idle:       { label: '🔔 Test Push',          color: '#a78bfa' },
  requesting: { label: '⏳ Permiso...',          color: '#888'    },
  local:      { label: '📲 Local OK ✓',          color: '#22c55e' },
  fcm:        { label: '⏳ Obteniendo token...',  color: '#888'    },
  fcm_ok:     { label: '🔥 FCM OK ✓',            color: '#22c55e' },
  scheduling: { label: '⏳ Programando...',      color: '#888'    },
  sched_ok:   { label: '✅ Todo OK',             color: '#22c55e' },
  denied:     { label: '🚫 Permiso denegado',    color: '#ef4444' },
  no_vapid:   { label: '⚠️ Sin VAPID key',       color: '#f59e0b' },
  error:      { label: '❌ Error',               color: '#ef4444' },
};

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

export default function TestPushButton() {
  const { state } = useApp();
  const uid      = state?.user?.uid    || null;
  const fcmToken = state?.user?.fcmToken || null;

  const [step,      setStep]      = useState('idle');
  const [log,       setLog]       = useState([]);
  const [open,      setOpen]      = useState(false);
  const [liveToken, setLiveToken] = useState(null);
  const [copied,    setCopied]    = useState(false);

  const addLog = (msg) => setLog(prev => [...prev, `${new Date().toLocaleTimeString()} ${msg}`]);

  // ── Paso 1-3: diagnóstico completo ──────────────────────────────────────
  async function runTest() {
    setLog([]);
    setLiveToken(null);
    setOpen(true);

    // 1. Permiso
    setStep('requesting');
    addLog('Solicitando permiso...');
    const perm = await requestNotificationPermission();
    addLog(`Permiso: ${perm}`);
    if (perm === 'denied') { setStep('denied'); return; }
    if (perm !== 'granted') { setStep('error'); return; }

    // 2. Notificación local
    addLog('Enviando notificación local...');
    try {
      showNotification('🧪 Test Mavia — Local', 'Notificaciones locales funcionan ✓', { tag: 'test-local' });
      setStep('local');
      addLog('✅ Notificación local enviada');
    } catch (err) {
      addLog(`❌ Local falló: ${err.message}`);
      setStep('error'); return;
    }

    await delay(800);

    // 3. FCM Token
    setStep('fcm');
    addLog('Inicializando FCM...');
    let token = fcmToken;

    if (!token && uid) {
      try {
        token = await initFCM(uid);
        addLog(token
          ? `✅ Token obtenido: ${token.slice(0, 22)}...`
          : '⚠️ No se obtuvo token — revisa VAPID key'
        );
      } catch (err) {
        addLog(`❌ FCM error: ${err.message}`);
      }
    } else if (!uid) {
      addLog('⚠️ Sin usuario logueado — saltando FCM');
    } else {
      addLog(`✅ Token existente: ${token.slice(0, 22)}...`);
    }

    if (!token) { setStep('no_vapid'); return; }

    setLiveToken(token);
    setStep('fcm_ok');
    await delay(600);

    // 4. Firestore schedule
    if (uid && token) {
      setStep('scheduling');
      addLog('Programando push en Firestore (+1 min)...');
      try {
        const soon    = new Date(Date.now() + 60_000);
        const dateStr = soon.toLocaleDateString('en-CA',  { timeZone: 'America/Mexico_City' });
        const timeStr = soon.toLocaleTimeString('es-MX',  { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false });

        const docId = await createScheduledNotification({
          uid, fcmToken: token,
          title: '🧪 Test Mavia — FCM Push',
          body:  'El push via FCM + Firestore + GitHub Actions funciona ✓',
          scheduledDate: dateStr,
          scheduledTime: timeStr,
          data: { type: 'test-push' },
        });

        setStep('sched_ok');
        addLog(`✅ Firestore doc: ${docId.slice(0, 16)}...`);
        addLog(`📅 Programado: ${dateStr} ${timeStr} (MX)`);
        addLog('ℹ️  El cron lo enviará en el próximo ciclo de 10 min');
      } catch (err) {
        addLog(`❌ Firestore falló: ${err.message}`);
        setStep('error');
      }
    }
  }

  // ── Enviar push inmediato via script local ──────────────────────────────
  async function sendNow() {
    const token = liveToken || fcmToken;
    if (!token) { addLog('❌ No hay token FCM todavía — corre el diagnóstico primero'); return; }

    // Copiar el comando al clipboard
    const cmd = `node scripts/send-test-push.mjs "${token}"`;
    try {
      await navigator.clipboard.writeText(cmd);
      addLog('📋 Comando copiado al portapapeles');
      addLog('▶  Pégalo en tu terminal y presiona Enter');
      addLog('📲 Recibirás la push en segundos');
    } catch {
      addLog('⚠️  Copia manualmente:');
      addLog(cmd);
    }
  }

  async function copyToken() {
    const token = liveToken || fcmToken;
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() { setStep('idle'); setLog([]); setOpen(false); setLiveToken(null); }

  const s          = STEPS[step] || STEPS.idle;
  const isRunning  = ['requesting', 'fcm', 'scheduling'].includes(step);
  const hasToken   = !!(liveToken || fcmToken);
  const isDone     = ['sched_ok', 'fcm_ok', 'local', 'no_vapid', 'error', 'denied'].includes(step);

  return (
    <>
      {/* ── Floating button ── */}
      <button
        id="test-push-btn"
        onClick={isRunning ? undefined : runTest}
        disabled={isRunning}
        style={{
          position: 'fixed',
          bottom: '5.5rem',
          right: '1rem',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '9px 15px',
          borderRadius: '999px',
          border: `2px solid ${s.color}`,
          background: 'var(--color-surface, #1a1a2e)',
          color: s.color,
          fontSize: '12px',
          fontWeight: 700,
          fontFamily: 'var(--font-body, Inter)',
          cursor: isRunning ? 'wait' : 'pointer',
          boxShadow: `0 4px 20px ${s.color}44`,
          transition: 'all 0.25s ease',
          whiteSpace: 'nowrap',
        }}
      >
        {isRunning && (
          <span style={{
            width: 11, height: 11,
            border: `2px solid ${s.color}`,
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'tpb-spin 0.7s linear infinite',
            display: 'inline-block', flexShrink: 0,
          }} />
        )}
        {s.label}
      </button>

      {/* ── Panel ── */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: '9rem',
          right: '1rem',
          zIndex: 9998,
          width: 'min(360px, calc(100vw - 2rem))',
          background: 'var(--color-surface, #12121f)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 24px 70px rgba(0,0,0,0.5)',
          animation: 'tpb-up 0.2s ease',
        }}>
          {/* Header */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '0.85rem 1rem',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)',
          }}>
            <span style={{ fontWeight: 700, fontSize: '13px', color: '#f0f0ff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '15px' }}>🧪</span> Diagnóstico Push
            </span>
            <button onClick={reset} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: '15px', lineHeight: 1 }}>✕</button>
          </div>

          {/* Log */}
          <div style={{ padding: '0.75rem 1rem', maxHeight: '180px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {log.length === 0 && <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: '12px' }}>Iniciando...</span>}
            {log.map((line, i) => (
              <span key={i} style={{
                fontSize: '11px',
                color: line.includes('❌') ? '#f87171'
                  : line.includes('✅') ? '#4ade80'
                  : line.includes('⚠️') ? '#fbbf24'
                  : line.includes('📅') || line.includes('ℹ️') ? '#60a5fa'
                  : 'rgba(255,255,255,0.55)',
                fontFamily: 'monospace',
                lineHeight: 1.6,
                wordBreak: 'break-all',
              }}>
                {line}
              </span>
            ))}
          </div>

          {/* Token box */}
          {hasToken && isDone && (
            <div style={{ margin: '0 1rem', padding: '0.6rem 0.75rem', background: 'rgba(255,255,255,0.04)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>FCM Token</span>
                <button
                  onClick={copyToken}
                  style={{ background: 'none', border: 'none', color: copied ? '#4ade80' : '#a78bfa', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}
                >
                  {copied ? '✅ Copiado' : '📋 Copiar'}
                </button>
              </div>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                {(liveToken || fcmToken).slice(0, 40)}...
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ padding: '0.75rem 1rem', display: 'flex', gap: '8px', flexDirection: 'column' }}>

            {/* Enviar push inmediato */}
            {hasToken && isDone && (
              <button
                id="test-push-send-now"
                onClick={sendNow}
                style={{
                  width: '100%', padding: '10px',
                  borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #db2777)',
                  color: 'white', fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
                }}
              >
                <span>📲</span> Enviar Push Ahora
                <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 400 }}>(copia cmd)</span>
              </button>
            )}

            {/* Repetir */}
            {isDone && (
              <button
                onClick={runTest}
                style={{
                  width: '100%', padding: '8px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.6)', fontSize: '12px', fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                🔄 Repetir diagnóstico
              </button>
            )}
          </div>

          {/* Hint */}
          {hasToken && isDone && (
            <div style={{ padding: '0 1rem 0.85rem', fontSize: '10px', color: 'rgba(255,255,255,0.25)', lineHeight: 1.6 }}>
              Al presionar "Enviar Push Ahora" se copia el comando al portapapeles.<br/>
              Pégalo en tu terminal: <code style={{ color: 'rgba(255,255,255,0.4)' }}>node scripts/send-test-push.mjs</code>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes tpb-spin { to { transform: rotate(360deg); } }
        @keyframes tpb-up {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
