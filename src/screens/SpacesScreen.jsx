import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ArrowLeft, Plus, Mail, Users, LogOut, X, Check, Tag, Palette } from 'lucide-react';

// Paleta de colores de identidad de espacio (igual que el calendario)
const SPACE_COLORS = ['#8478c8', '#e888b6', '#6bbd8e', '#7cb8e0', '#e0a72e', '#c9a9e0'];

export default function SpacesScreen() {
  const { state, goBack, showToast, createSharedSpace, inviteEmail, acceptInvite, leaveSharedSpace, addClient, removeClient, setSpaceColor } = useApp();
  const { spaces = [], pendingInvites = [], user } = state;

  const [creating, setCreating]   = useState(false);
  const [newName, setNewName]     = useState('');
  const [inviteFor, setInviteFor] = useState(null);   // spaceId con el input de invitar abierto
  const [inviteVal, setInviteVal] = useState('');
  const [clientFor, setClientFor] = useState(null);
  const [clientVal, setClientVal] = useState('');
  const [busy, setBusy]           = useState(false);

  const create = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    try { await createSharedSpace(newName.trim()); showToast('¡Espacio creado!', 'success'); setNewName(''); setCreating(false); }
    catch (e) { showToast('No se pudo crear', 'error'); }
    finally { setBusy(false); }
  };

  const invite = async (spaceId) => {
    const email = inviteVal.trim().toLowerCase();
    if (!email || !email.includes('@')) { showToast('Correo inválido', 'error'); return; }
    setBusy(true);
    try { await inviteEmail(spaceId, email); showToast(`Invitación enviada a ${email}`, 'success'); setInviteVal(''); setInviteFor(null); }
    catch (e) { showToast('No se pudo invitar', 'error'); }
    finally { setBusy(false); }
  };

  const accept = async (space) => {
    setBusy(true);
    try { await acceptInvite(space); showToast(`Te uniste a "${space.name}"`, 'success'); }
    catch (e) { showToast('No se pudo aceptar', 'error'); }
    finally { setBusy(false); }
  };

  const leave = async (space) => {
    setBusy(true);
    try { await leaveSharedSpace(space.id); showToast(`Saliste de "${space.name}"`); }
    catch (e) { showToast('No se pudo salir', 'error'); }
    finally { setBusy(false); }
  };

  const doAddClient = async (spaceId) => {
    if (!clientVal.trim()) return;
    setBusy(true);
    try { await addClient(spaceId, clientVal.trim()); setClientVal(''); setClientFor(null); }
    catch (e) { showToast('No se pudo agregar', 'error'); }
    finally { setBusy(false); }
  };

  return (
    <>
      <style>{`
        .sp-screen { max-width: 560px; margin: 0 auto; padding: var(--space-md) var(--space-container) var(--space-xxl); animation: screenEnter 0.4s var(--ease-out) both; }
        .sp-back { display: inline-flex; align-items: center; gap: 6px; color: var(--primary); font-size: var(--text-label-md); font-weight: 700; background: none; border: none; cursor: pointer; padding: 0; margin-bottom: var(--space-md); }
        .sp-title { font-family: var(--font-display); font-size: var(--text-headline-lg); font-weight: 800; color: var(--heading); margin-bottom: 2px; }
        .sp-sub { font-size: var(--text-body-md); color: var(--on-surface-variant); margin-bottom: var(--space-lg); }
        .sp-section-label { font-size: var(--text-label-sm); font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--on-surface-variant); margin: var(--space-lg) 0 8px; }
        .sp-card { background: var(--surface-container-lowest); border: 0.5px solid var(--outline-variant); border-radius: 18px; padding: var(--space-lg); margin-bottom: 12px; box-shadow: var(--shadow-card); }
        .sp-card-head { display: flex; align-items: center; gap: 10px; margin-bottom: 6px; }
        .sp-card-name { font-family: var(--font-display); font-size: var(--text-headline-md); font-weight: 800; color: var(--heading); flex: 1; }
        .sp-meta { font-size: var(--text-label-sm); color: var(--on-surface-variant); }
        .sp-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .sp-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: 99px; border: 1.5px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface); font-family: var(--font-body); font-size: 13px; font-weight: 700; cursor: pointer; }
        .sp-btn.primary { background: var(--gradient-primary); color: #fff; border: none; }
        .sp-btn.danger { color: var(--error); border-color: var(--error-container); }
        .sp-swatches { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 8px; }
        .sp-swatch { width: 30px; height: 30px; border-radius: 50%; border: 2px solid transparent; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform var(--transition-fast); box-shadow: var(--shadow-sm); }
        .sp-swatch:active { transform: scale(0.9); }
        .sp-swatch.sel { border-color: var(--on-surface); }
        .sp-chips { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 10px; }
        .sp-chip { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 99px; background: var(--secondary-container); color: var(--on-secondary-container); font-size: 12px; font-weight: 700; }
        .sp-chip button { background: none; border: none; cursor: pointer; color: inherit; display: flex; padding: 0; opacity: 0.7; }
        .sp-input { width: 100%; padding: 12px 14px; border-radius: 14px; border: 1.5px solid var(--outline-variant); background: var(--surface-container-lowest); color: var(--on-surface); font-size: var(--text-body-md); font-family: var(--font-body); outline: none; margin-top: 10px; }
        .sp-input:focus { border-color: var(--primary); }
        .sp-inline { display: flex; gap: 8px; margin-top: 10px; }
        .sp-inline .sp-input { margin-top: 0; }
        .sp-empty { text-align: center; color: var(--on-surface-variant); padding: var(--space-lg); }
        .sp-invite-card { background: var(--primary-container); border: 0.5px solid var(--primary); border-radius: 18px; padding: var(--space-lg); margin-bottom: 12px; box-shadow: var(--shadow-card); }
      `}</style>

      <div className="sp-screen">
        <button className="sp-back" onClick={goBack}><ArrowLeft size={18} /> Volver</button>
        <h1 className="sp-title">Espacios</h1>
        <p className="sp-sub">Tu agenda es privada. Crea un espacio compartido para trabajar con alguien (clientes de la agencia).</p>

        {/* Invitaciones pendientes */}
        {pendingInvites.length > 0 && (
          <>
            <div className="sp-section-label">Invitaciones</div>
            {pendingInvites.map(sp => (
              <div key={sp.id} className="sp-invite-card">
                <div className="sp-card-head">
                  <Mail size={20} color="var(--on-primary-container)" />
                  <div className="sp-card-name" style={{ fontSize: 'var(--text-body-lg)' }}>{sp.name}</div>
                </div>
                <div className="sp-meta">{sp.ownerName ? `${sp.ownerName} te invitó` : 'Te invitaron a este espacio'}</div>
                <div className="sp-row">
                  <button className="sp-btn primary" disabled={busy} onClick={() => accept(sp)}><Check size={15} /> Aceptar</button>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Mis espacios */}
        <div className="sp-section-label">Mis espacios compartidos</div>
        {spaces.length === 0 && <div className="sp-empty">Aún no tienes espacios compartidos.</div>}
        {spaces.map(sp => {
          const isOwner = sp.ownerUid === user?.uid;
          const clients = sp.clients || [];
          return (
            <div key={sp.id} className="sp-card">
              <div className="sp-card-head">
                <Users size={20} color="var(--primary)" />
                <div className="sp-card-name">{sp.name}</div>
              </div>
              <div className="sp-meta">{(sp.memberUids || []).length} miembro(s){isOwner ? ' · eres dueño' : ''}</div>

              {/* Color del espacio */}
              <div className="sp-meta" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Palette size={13} /> Color</div>
              <div className="sp-swatches">
                {SPACE_COLORS.map(col => {
                  const active = (sp.color || SPACE_COLORS[spaces.indexOf(sp) % SPACE_COLORS.length]) === col;
                  return (
                    <button key={col} type="button" className={`sp-swatch${active ? ' sel' : ''}`}
                      style={{ background: col }} onClick={() => setSpaceColor(sp.id, col)} aria-label={`Color ${col}`}>
                      {active && <Check size={13} color="#fff" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>

              {/* Clientes */}
              <div className="sp-meta" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Tag size={13} /> Clientes</div>
              <div className="sp-chips">
                {clients.length === 0 && <span className="sp-meta">Sin clientes aún</span>}
                {clients.map(c => (
                  <span key={c} className="sp-chip">{c}
                    <button onClick={() => removeClient(sp.id, c)} aria-label={`Quitar ${c}`}><X size={12} /></button>
                  </span>
                ))}
              </div>
              {clientFor === sp.id ? (
                <div className="sp-inline">
                  <input className="sp-input" autoFocus placeholder="Nombre del cliente" value={clientVal}
                    onChange={e => setClientVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doAddClient(sp.id)} />
                  <button className="sp-btn primary" disabled={busy} onClick={() => doAddClient(sp.id)}><Check size={15} /></button>
                </div>
              ) : (
                <div className="sp-row">
                  <button className="sp-btn" onClick={() => { setClientFor(sp.id); setClientVal(''); }}><Plus size={15} /> Cliente</button>
                  <button className="sp-btn" onClick={() => { setInviteFor(inviteFor === sp.id ? null : sp.id); setInviteVal(''); }}><Mail size={15} /> Invitar</button>
                  <button className="sp-btn danger" disabled={busy} onClick={() => leave(sp)}><LogOut size={15} /> Salir</button>
                </div>
              )}

              {/* Invitar por correo */}
              {inviteFor === sp.id && (
                <div className="sp-inline">
                  <input className="sp-input" autoFocus type="email" placeholder="correo@ejemplo.com" value={inviteVal}
                    onChange={e => setInviteVal(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && invite(sp.id)} />
                  <button className="sp-btn primary" disabled={busy} onClick={() => invite(sp.id)}><Check size={15} /></button>
                </div>
              )}
              {sp.invitedEmails?.length > 0 && (
                <div className="sp-meta" style={{ marginTop: 8 }}>Invitados: {sp.invitedEmails.join(', ')}</div>
              )}
            </div>
          );
        })}

        {/* Crear espacio */}
        {creating ? (
          <div className="sp-card">
            <div className="sp-card-name" style={{ fontSize: 'var(--text-body-lg)', marginBottom: 4 }}>Nuevo espacio</div>
            <input className="sp-input" autoFocus placeholder="Ej. Agencia, Clientes marketing…" value={newName}
              onChange={e => setNewName(e.target.value)} onKeyDown={e => e.key === 'Enter' && create()} />
            <div className="sp-row">
              <button className="sp-btn primary" disabled={busy} onClick={create}><Check size={15} /> Crear</button>
              <button className="sp-btn" onClick={() => { setCreating(false); setNewName(''); }}>Cancelar</button>
            </div>
          </div>
        ) : (
          <button className="sp-btn primary" style={{ marginTop: 8 }} onClick={() => setCreating(true)}>
            <Plus size={16} /> Crear espacio compartido
          </button>
        )}
      </div>
    </>
  );
}
