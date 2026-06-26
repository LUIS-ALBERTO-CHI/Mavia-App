import { useState } from 'react';

export default function ContactSection() {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null); // 'sending' | 'success' | null

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => {
      setStatus('success');
      setForm({ name: '', email: '', message: '' });
    }, 1500);
  };

  return (
    <section id="contact" className="contact-section">
      <div className="section-container">
        <div className="contact-grid">
          {/* Info */}
          <div className="contact-info">
            <span className="section-tag">Contacto</span>
            <h2 className="section-title">
              Hablemos sobre
              <span className="gradient-text"> tu proyecto</span>
            </h2>
            <p className="contact-desc">
              ¿Tienes preguntas sobre Mavia o quieres colaborar? 
              Estamos aquí para ayudarte a construir algo increíble.
            </p>

            <div className="contact-channels">
              {[
                { icon: '✉️', label: 'Email', value: 'hello@mavia.app' },
                { icon: '💬', label: 'Discord', value: 'discord.gg/mavia' },
                { icon: '🐙', label: 'GitHub', value: 'github.com/mavia' },
              ].map(ch => (
                <a key={ch.label} href="#" className="channel-item">
                  <span className="channel-icon">{ch.icon}</span>
                  <div>
                    <p className="channel-label">{ch.label}</p>
                    <p className="channel-value">{ch.value}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="contact-form-wrap">
            {status === 'success' ? (
              <div className="success-message">
                <span className="success-icon">🎉</span>
                <h3>¡Mensaje enviado!</h3>
                <p>Te responderemos en menos de 24 horas.</p>
                <button onClick={() => setStatus(null)} className="btn-primary">
                  Enviar otro mensaje
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="name" className="form-label">Nombre</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="Tu nombre"
                      className="form-input"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">Email</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      placeholder="tu@email.com"
                      className="form-input"
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="message" className="form-label">Mensaje</label>
                  <textarea
                    id="message"
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    placeholder="Cuéntanos sobre tu proyecto..."
                    className="form-input form-textarea"
                    rows={5}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn-primary submit-btn"
                  disabled={status === 'sending'}
                >
                  {status === 'sending' ? (
                    <>
                      <span className="spinner" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      Enviar Mensaje
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 2L11 13M22 2L15 22 11 13M22 2L2 9l9 4"/>
                      </svg>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .contact-section {
          padding: 6rem 1.5rem 8rem;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .section-container { max-width: 1200px; margin: 0 auto; }
        .contact-grid {
          display: grid;
          grid-template-columns: 1fr 1.2fr;
          gap: 5rem;
          align-items: start;
        }
        .contact-info {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .section-tag {
          display: inline-block;
          padding: 0.3rem 1rem;
          background: rgba(139,92,246,0.1);
          border: 1px solid rgba(139,92,246,0.25);
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 600;
          color: #a78bfa;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          width: fit-content;
        }
        .section-title {
          font-size: clamp(1.8rem, 3vw, 2.6rem);
          font-weight: 900;
          letter-spacing: -0.03em;
          line-height: 1.15;
        }
        .gradient-text {
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .contact-desc {
          color: rgba(240,240,255,0.55);
          font-size: 0.95rem;
          line-height: 1.75;
        }
        .contact-channels {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          margin-top: 0.5rem;
        }
        .channel-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 0.9rem 1.1rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 12px;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .channel-item:hover {
          background: rgba(139,92,246,0.06);
          border-color: rgba(139,92,246,0.2);
          transform: translateX(4px);
        }
        .channel-icon { font-size: 1.25rem; }
        .channel-label {
          font-size: 0.72rem;
          color: rgba(240,240,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.08em;
          font-weight: 600;
          margin-bottom: 0.15rem;
        }
        .channel-value {
          font-size: 0.88rem;
          color: rgba(240,240,255,0.8);
          font-weight: 500;
        }
        /* Form */
        .contact-form-wrap {
          padding: 2rem;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          backdrop-filter: blur(10px);
        }
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-label {
          font-size: 0.8rem;
          font-weight: 600;
          color: rgba(240,240,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.06em;
        }
        .form-input {
          padding: 0.75rem 1rem;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          color: #f0f0ff;
          font-size: 0.9rem;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s ease;
          outline: none;
          resize: none;
        }
        .form-input::placeholder { color: rgba(240,240,255,0.25); }
        .form-input:focus {
          border-color: rgba(139,92,246,0.5);
          background: rgba(139,92,246,0.05);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.1);
        }
        .btn-primary {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          padding: 0.85rem 2rem;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          font-weight: 600;
          font-size: 0.95rem;
          border-radius: 999px;
          border: none;
          transition: all 0.25s ease;
          box-shadow: 0 8px 30px rgba(139,92,246,0.35);
          cursor: pointer;
          font-family: 'Inter', sans-serif;
        }
        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(139,92,246,0.5);
        }
        .btn-primary:disabled { opacity: 0.7; cursor: not-allowed; }
        .submit-btn { width: 100%; }
        .spinner {
          width: 16px; height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .success-message {
          text-align: center;
          padding: 2rem 1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .success-icon { font-size: 3rem; }
        .success-message h3 {
          font-size: 1.4rem;
          font-weight: 800;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .success-message p {
          color: rgba(240,240,255,0.5);
          font-size: 0.9rem;
        }
        @media (max-width: 900px) {
          .contact-grid { grid-template-columns: 1fr; gap: 3rem; }
          .form-row { grid-template-columns: 1fr; }
        }
      `}</style>
    </section>
  );
}
