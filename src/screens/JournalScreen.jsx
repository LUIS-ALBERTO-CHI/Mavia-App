import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useTranslation } from '../hooks/useTranslation';
import { Edit2, Plus, X, Bookmark, BookOpen, Hash, ChevronRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

const MOODS = [
  { emoji: '😊', label: 'Feliz',     color: '#F8D7E8' },
  { emoji: '😌', label: 'En paz',    color: '#D5E5C2' },
  { emoji: '😐', label: 'Neutral',   color: '#E4E2E0' },
  { emoji: '😔', label: 'Triste',    color: '#EDE7F6' },
  { emoji: '😤', label: 'Estresada', color: '#FFD6EC' },
  { emoji: '✨', label: 'Inspirada', color: '#F2E2B1' },
];

const today = new Date().toISOString().split('T')[0];

function formatEntryDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  const todayD = new Date(today + 'T00:00:00');
  const diff = Math.round((todayD - d) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })
    .replace(/^\w/, c => c.toUpperCase());
}

export default function JournalScreen() {
  const { state, dispatch, showToast } = useApp();
  const { journalEntries } = state;

  const [writing,  setWriting]  = useState(false);
  const [form,     setForm]     = useState({ date: today, content: '', mood: '😊', tags: [] });
  const [tagInput, setTagInput] = useState('');
  const [expanded, setExpanded] = useState(null);

  const todayEntry = journalEntries.find(e => e.date === today);

  const handleSave = () => {
    if (!form.content.trim()) return;
    dispatch({ type: 'ADD_JOURNAL', entry: { ...form, id: Date.now().toString(), images: [] } });
    showToast('Entrada guardada', 'success');
    setWriting(false);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
      setTagInput('');
    }
  };

  const selectedMood = MOODS.find(m => m.emoji === form.mood) || MOODS[0];

  return (
    <>
      <style>{`
        /* ======= JOURNAL SCREEN ======= */
        .jrn-screen {
          padding: var(--space-lg) var(--space-container) var(--space-xxl);
          animation: screenEnter 0.45s var(--ease-out) both;
          max-width: 860px;
          margin: 0 auto;
        }

        /* ── Hero ── */
        .jrn-hero {
          margin-bottom: var(--space-xl);
        }
        .jrn-hero-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg);
          font-weight: 500;
          color: var(--primary);
          line-height: 1.15;
          margin-bottom: 6px;
        }
        .jrn-hero-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          opacity: 0.85;
        }

        /* ── Today Banner ── */
        .jrn-banner {
          display: flex;
          align-items: center;
          gap: var(--space-lg);
          background: linear-gradient(135deg, #FDF0F7 0%, #EDE7F6 100%);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
          cursor: pointer;
          border: 1px solid rgba(208,195,200,0.2);
          box-shadow: 0 8px 32px rgba(112,87,101,0.06);
          transition: transform var(--transition-spring);
        }
        .dark .jrn-banner {
          background: linear-gradient(135deg, rgba(87,64,77,0.4) 0%, rgba(68,56,87,0.25) 100%);
          border-color: rgba(77,68,73,0.35);
          box-shadow: 0 8px 32px rgba(0,0,0,0.2);
        }
        .jrn-banner:hover { transform: scale(1.008); }
        .jrn-banner:active { transform: scale(0.98); }

        .jrn-banner-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-xl);
          background: var(--surface-container);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .jrn-banner-body { flex: 1; }
        .jrn-banner-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          font-weight: 500;
          color: var(--on-surface);
          margin-bottom: 3px;
        }
        .jrn-banner-sub {
          font-size: var(--text-label-md);
          color: var(--on-surface-variant);
        }

        /* ── Write panel ── */
        .jrn-write-panel {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          margin-bottom: var(--space-xl);
          border: 1px solid rgba(208,195,200,0.15);
          box-shadow: 0 8px 40px rgba(112,87,101,0.07);
          animation: scaleIn 0.3s var(--ease-spring);
        }

        .jrn-write-heading {
          font-family: var(--font-display);
          font-size: var(--text-headline-md);
          font-weight: 500;
          color: var(--primary);
          margin-bottom: var(--space-lg);
        }

        /* ── Mood selector ── */
        .jrn-mood-row {
          display: flex;
          gap: var(--space-sm);
          flex-wrap: wrap;
          margin-bottom: var(--space-lg);
        }

        .jrn-mood-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          padding: 10px 12px;
          border-radius: var(--radius-xl);
          border: 2px solid transparent;
          cursor: pointer;
          background: var(--surface-container-low);
          transition: all var(--transition-spring);
          min-width: 58px;
        }
        .jrn-mood-btn:hover { background: var(--surface-container); }
        .jrn-mood-btn.selected {
          border-color: var(--primary);
          transform: scale(1.07);
          box-shadow: 0 4px 12px rgba(112,87,101,0.15);
        }
        .jrn-mood-emoji { font-size: 1.6rem; }
        .jrn-mood-label {
          font-size: 10px;
          font-weight: 600;
          color: var(--on-surface-variant);
          line-height: 1;
        }
        .jrn-mood-btn.selected .jrn-mood-label { color: var(--primary); }

        /* ── Journal textarea ── */
        .jrn-textarea {
          width: 100%;
          min-height: 180px;
          padding: var(--space-lg);
          background: var(--surface-container-low);
          border: 1.5px solid var(--outline-variant);
          border-radius: var(--radius-xl);
          font-family: var(--font-display);
          font-size: var(--text-body-lg);
          font-style: italic;
          color: var(--on-surface);
          line-height: var(--leading-relaxed);
          outline: none;
          resize: none;
          margin-bottom: var(--space-md);
          transition: all var(--transition-fast);
        }
        .jrn-textarea:focus {
          border-color: var(--primary);
          background: var(--surface-container-lowest);
          box-shadow: 0 0 0 3px rgba(112,87,101,0.1);
        }
        .jrn-textarea::placeholder { color: var(--outline); font-style: italic; }

        /* ── Tags ── */
        .jrn-tags-row {
          display: flex;
          gap: var(--space-sm);
          flex-wrap: wrap;
          margin-bottom: var(--space-md);
        }

        .jrn-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: var(--radius-full);
          background: var(--primary-container);
          color: var(--on-primary-container);
          font-size: var(--text-label-sm);
          font-weight: 600;
        }
        .jrn-tag-remove {
          background: none;
          border: none;
          cursor: pointer;
          color: inherit;
          opacity: 0.7;
          padding: 0;
          line-height: 1;
          display: flex;
          align-items: center;
        }
        .jrn-tag-remove:hover { opacity: 1; }

        .jrn-tag-add-row {
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-lg);
          align-items: center;
        }

        /* ── Entry cards ── */
        .jrn-entry-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }

        .jrn-entry-card {
          background: var(--surface-container-lowest);
          border-radius: var(--radius-2xl);
          padding: var(--space-lg);
          border: 1px solid rgba(208,195,200,0.15);
          box-shadow: 0 4px 20px rgba(112,87,101,0.04);
          cursor: pointer;
          transition: all var(--transition-spring);
        }
        .jrn-entry-card:hover {
          box-shadow: 0 8px 32px rgba(112,87,101,0.10);
          transform: scale(1.005);
        }
        .jrn-entry-card:active { transform: scale(0.99); }

        .jrn-entry-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-md);
        }

        .jrn-entry-date-wrap { display: flex; flex-direction: column; gap: 2px; }

        .jrn-entry-date {
          font-size: var(--text-label-sm);
          font-weight: 700;
          color: var(--on-surface-variant);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .jrn-entry-right {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
        }

        .jrn-entry-mood-badge {
          width: 36px;
          height: 36px;
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .jrn-entry-preview {
          font-family: var(--font-display);
          font-size: var(--text-body-md);
          font-style: italic;
          color: var(--on-surface-variant);
          line-height: var(--leading-relaxed);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin-bottom: var(--space-md);
        }

        .jrn-entry-expanded {
          font-family: var(--font-display);
          font-size: var(--text-body-md);
          font-style: italic;
          color: var(--on-surface-variant);
          line-height: var(--leading-relaxed);
          margin-bottom: var(--space-md);
          white-space: pre-wrap;
        }

        .jrn-entry-tags {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-xs);
        }

        .jrn-entry-tag {
          display: inline-flex;
          align-items: center;
          gap: 3px;
          font-size: var(--text-label-sm);
          color: var(--on-surface-variant);
        }

        /* ── Divider label ── */
        .jrn-section-head {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }
        .jrn-section-label {
          font-size: var(--text-label-sm);
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--on-surface-variant);
          white-space: nowrap;
        }
        .jrn-section-line {
          flex: 1;
          height: 1px;
          background: rgba(208,195,200,0.3);
        }

        /* ── Empty state ── */
        .jrn-empty {
          text-align: center;
          padding: var(--space-xxl) var(--space-xl);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-md);
        }
        .jrn-empty-icon {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, #FDF0F7, #EDE7F6);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .jrn-empty-title {
          font-family: var(--font-display);
          font-size: var(--text-headline-lg-mobile);
          font-weight: 500;
          color: var(--on-surface);
        }
        .jrn-empty-sub {
          font-size: var(--text-body-md);
          color: var(--on-surface-variant);
          max-width: 280px;
          line-height: var(--leading-relaxed);
        }
      `}</style>

      <div className="jrn-screen">

        {/* ── Hero ── */}
        <div className="jrn-hero">
          <h1 className="jrn-hero-title">Mi Diario</h1>
          <p className="jrn-hero-sub">Un espacio seguro para tus pensamientos y reflexiones del día.</p>
        </div>

        {/* ── Today banner (write button) ── */}
        {!writing && (
          <div
            className="jrn-banner"
            onClick={() => {
              setForm({ date: today, content: todayEntry?.content || '', mood: todayEntry?.mood || '😊', tags: todayEntry?.tags || [] });
              setWriting(true);
            }}
            id="jrn-open"
          >
            <div className="jrn-banner-icon">
              <BookOpen size={28} color="var(--primary)" strokeWidth={1.5} />
            </div>
            <div className="jrn-banner-body">
              <div className="jrn-banner-title">
                {todayEntry ? 'Continuar escribiendo' : '¿Cómo fue tu día?'}
              </div>
              <div className="jrn-banner-sub">
                {todayEntry ? 'Toca para editar tu entrada de hoy' : 'Escribe tus pensamientos del día'}
              </div>
            </div>
            <Edit2 size={20} color="var(--primary)" strokeWidth={1.75} />
          </div>
        )}

        {/* ── Write panel ── */}
        {writing && (
          <div className="jrn-write-panel">
            <div className="jrn-write-heading">¿Cómo te sientes hoy?</div>

            {/* Mood selector */}
            <div className="jrn-mood-row">
              {MOODS.map(m => (
                <button
                  key={m.emoji}
                  className={`jrn-mood-btn${form.mood === m.emoji ? ' selected' : ''}`}
                  onClick={() => setForm(f => ({ ...f, mood: m.emoji }))}
                  id={`mood-${m.label}`}
                  style={form.mood === m.emoji ? { background: m.color } : {}}
                  type="button"
                >
                  <span className="jrn-mood-emoji">{m.emoji}</span>
                  <span className="jrn-mood-label">{m.label}</span>
                </button>
              ))}
            </div>

            {/* Textarea */}
            <textarea
              className="jrn-textarea"
              placeholder="Escribe libremente… ¿qué pasó hoy? ¿cómo te sentiste? ¿qué aprendiste?"
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              id="journal-text"
              autoFocus
            />

            {/* Tags */}
            {form.tags.length > 0 && (
              <div className="jrn-tags-row">
                {form.tags.map(tag => (
                  <span key={tag} className="jrn-tag">
                    <Hash size={11} strokeWidth={2.5} />
                    {tag}
                    <button
                      className="jrn-tag-remove"
                      onClick={() => setForm(f => ({ ...f, tags: f.tags.filter(t => t !== tag) }))}
                      type="button"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag input */}
            <div className="jrn-tag-add-row">
              <Input
                placeholder="Etiqueta (ej: gratitud)"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())}
                id="tag-input"
                className="flex-1"
              />
              <Button type="button" variant="soft" size="sm" onClick={addTag} id="tag-add">
                <Plus size={16} />
              </Button>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 'var(--space-md)' }}>
              <Button type="button" variant="outline" className="flex-1" onClick={() => setWriting(false)} id="journal-cancel">
                Cancelar
              </Button>
              <Button type="button" className="flex-1" onClick={handleSave} id="journal-save" disabled={!form.content.trim()}>
                <Bookmark size={16} />
                Guardar entrada
              </Button>
            </div>
          </div>
        )}

        {/* ── Past entries ── */}
        {journalEntries.length > 0 ? (
          <>
            <div className="jrn-section-head">
              <span className="jrn-section-label">Entradas anteriores</span>
              <div className="jrn-section-line" />
            </div>

            <div className="jrn-entry-list">
              {[...journalEntries].reverse().map(entry => {
                const moodData = MOODS.find(m => m.emoji === entry.mood) || MOODS[0];
                const isExpanded = expanded === entry.id;
                return (
                  <div
                    key={entry.id}
                    className="jrn-entry-card"
                    onClick={() => setExpanded(isExpanded ? null : entry.id)}
                    id={`jrn-entry-${entry.id}`}
                  >
                    {/* Header */}
                    <div className="jrn-entry-header">
                      <div className="jrn-entry-date-wrap">
                        <span className="jrn-entry-date">{formatEntryDate(entry.date)}</span>
                      </div>
                      <div className="jrn-entry-right">
                        <div
                          className="jrn-entry-mood-badge"
                          style={{ background: moodData.color }}
                          title={moodData.label}
                        >
                          {entry.mood}
                        </div>
                        <ChevronRight
                          size={18}
                          color="var(--outline)"
                          strokeWidth={2}
                          style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
                        />
                      </div>
                    </div>

                    {/* Content */}
                    <p className={isExpanded ? 'jrn-entry-expanded' : 'jrn-entry-preview'}>
                      "{entry.content}"
                    </p>

                    {/* Tags */}
                    {entry.tags?.length > 0 && (
                      <div className="jrn-entry-tags">
                        {entry.tags.map(tag => (
                          <span key={tag} className="jrn-entry-tag">
                            <Hash size={11} strokeWidth={2} />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : !writing && (
          <div className="jrn-empty">
            <div className="jrn-empty-icon">
              <BookOpen size={38} color="var(--primary)" strokeWidth={1.25} />
            </div>
            <div className="jrn-empty-title">Tu diario te espera</div>
            <p className="jrn-empty-sub">
              Empieza a escribir tus pensamientos. Cada entrada es un pequeño tesoro para tu yo futuro.
            </p>
          </div>
        )}

      </div>
    </>
  );
}
