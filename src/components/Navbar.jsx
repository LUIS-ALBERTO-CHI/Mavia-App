import { useState, useEffect } from 'react';

const navLinks = [
  { href: '#home', label: 'Inicio' },
  { href: '#features', label: 'Características' },
  { href: '#about', label: 'Acerca de' },
  { href: '#contact', label: 'Contacto' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <a href="/" className="navbar-logo">
          <span className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#8b5cf6"/>
                  <stop offset="100%" stopColor="#ec4899"/>
                </linearGradient>
              </defs>
              <polygon points="14,2 26,9 26,19 14,26 2,19 2,9" fill="url(#logoGrad)" opacity="0.9"/>
              <polygon points="14,7 21,11 21,17 14,21 7,17 7,11" fill="none" stroke="white" strokeWidth="1.5" opacity="0.6"/>
              <circle cx="14" cy="14" r="3" fill="white"/>
            </svg>
          </span>
          <span className="logo-text">Mavia</span>
        </a>

        <ul className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {navLinks.map(link => (
            <li key={link.href}>
              <a href={link.href} className="nav-link" onClick={() => setMenuOpen(false)}>
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="navbar-actions">
          <a href="#contact" className="btn-primary-sm">
            Comenzar
          </a>
          <button
            className={`hamburger ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 1rem 0;
          transition: all 0.3s ease;
        }
        .navbar.scrolled {
          background: rgba(15, 15, 26, 0.85);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          padding: 0.7rem 0;
        }
        .navbar-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          text-decoration: none;
        }
        .logo-icon {
          display: flex;
          align-items: center;
          filter: drop-shadow(0 0 8px rgba(139,92,246,0.6));
        }
        .logo-text {
          font-family: 'Outfit', sans-serif;
          font-size: 1.4rem;
          font-weight: 800;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.02em;
        }
        .navbar-links {
          display: flex;
          list-style: none;
          gap: 0.25rem;
          margin: 0;
          padding: 0;
        }
        .nav-link {
          display: block;
          padding: 0.5rem 1rem;
          color: rgba(240,240,255,0.7);
          font-size: 0.9rem;
          font-weight: 500;
          border-radius: 8px;
          transition: all 0.2s ease;
          text-decoration: none;
        }
        .nav-link:hover {
          color: #f0f0ff;
          background: rgba(255,255,255,0.06);
        }
        .navbar-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .btn-primary-sm {
          display: inline-flex;
          align-items: center;
          padding: 0.5rem 1.25rem;
          background: linear-gradient(135deg, #8b5cf6, #ec4899);
          color: white;
          font-size: 0.875rem;
          font-weight: 600;
          border-radius: 999px;
          transition: all 0.2s ease;
          box-shadow: 0 0 20px rgba(139,92,246,0.3);
          text-decoration: none;
        }
        .btn-primary-sm:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 30px rgba(139,92,246,0.5);
        }
        .hamburger {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 24px;
          height: 18px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
        }
        .hamburger span {
          display: block;
          height: 2px;
          background: #f0f0ff;
          border-radius: 2px;
          transition: all 0.3s ease;
        }
        .hamburger.active span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }
        .hamburger.active span:nth-child(2) {
          opacity: 0;
        }
        .hamburger.active span:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }
        @media (max-width: 768px) {
          .hamburger { display: flex; }
          .navbar-links {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            flex-direction: column;
            background: rgba(15,15,26,0.95);
            backdrop-filter: blur(20px);
            padding: 1rem;
            gap: 0.25rem;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            transform: translateY(-10px);
            opacity: 0;
            pointer-events: none;
            transition: all 0.3s ease;
          }
          .navbar-links.open {
            transform: translateY(0);
            opacity: 1;
            pointer-events: all;
          }
          .btn-primary-sm { display: none; }
        }
      `}</style>
    </nav>
  );
}
