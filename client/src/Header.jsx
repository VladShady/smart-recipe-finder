import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from './context/ThemeContext';

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 1000,
      backgroundColor: isDark ? 'rgba(31, 41, 55, 0.9)' : 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`,
      transition: 'background-color 0.3s ease, border-color 0.3s ease',
      fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 20px', height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        
        {/* Brand Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: isDark ? '#F9FAFB' : '#111827' }}>
          <div style={{ background: '#10B981', color: 'white', borderRadius: '8px', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', letterSpacing: '-0.5px' }}>Pantry<span style={{ color: '#10B981' }}>Chef</span></span>
        </Link>

        {/* Desktop Navigation */}
        <div className="desktop-nav" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: isDark ? '#D1D5DB' : '#4B5563', fontWeight: '500', fontSize: '15px', transition: 'color 0.2s ease' }} className="nav-link">Home</Link>
          <Link to="#" onClick={(e) => { e.preventDefault(); alert('Saved Recipes coming soon!'); }} style={{ textDecoration: 'none', color: isDark ? '#D1D5DB' : '#4B5563', fontWeight: '500', fontSize: '15px', transition: 'color 0.2s ease' }} className="nav-link">Favorites</Link>
          
          <div style={{ width: '1px', height: '24px', backgroundColor: isDark ? '#374151' : '#E5E7EB', margin: '0 8px' }}></div>
          
          {/* Theme Toggle Button */}
          <button onClick={toggleTheme} aria-label="Toggle Theme" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#F9FAFB' : '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px', borderRadius: '50%', transition: 'background-color 0.2s ease' }} className="icon-btn">
            {isDark ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {/* Authentication Placeholder */}
          <button onClick={() => alert('Authentication coming soon!')} style={{ background: '#10B981', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', transition: 'transform 0.2s ease' }} className="auth-btn">
            Sign In
          </button>
        </div>

        {/* Mobile Hamburger Menu Toggle */}
        <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} style={{ display: 'none', background: 'transparent', border: 'none', cursor: 'pointer', color: isDark ? '#F9FAFB' : '#111827' }}>
          <svg width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Navigation */}
      {isMenuOpen && (
        <div className="mobile-nav" style={{ padding: '20px', borderBottom: `1px solid ${isDark ? '#374151' : '#E5E7EB'}`, backgroundColor: isDark ? '#1F2937' : '#FFFFFF' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link to="/" onClick={() => setIsMenuOpen(false)} style={{ textDecoration: 'none', color: isDark ? '#F9FAFB' : '#111827', fontWeight: '500', fontSize: '16px' }}>Home</Link>
            <Link to="#" onClick={(e) => { e.preventDefault(); alert('Saved Recipes coming soon!'); setIsMenuOpen(false); }} style={{ textDecoration: 'none', color: isDark ? '#F9FAFB' : '#111827', fontWeight: '500', fontSize: '16px' }}>Favorites</Link>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px', paddingTop: '16px', borderTop: `1px solid ${isDark ? '#374151' : '#E5E7EB'}` }}>
              <span style={{ color: isDark ? '#D1D5DB' : '#4B5563', fontWeight: '500' }}>Theme</span>
              <button onClick={toggleTheme} style={{ background: isDark ? '#374151' : '#F3F4F6', border: 'none', padding: '8px 16px', borderRadius: '8px', color: isDark ? '#F9FAFB' : '#111827', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500' }}>
                {isDark ? 'Dark Mode' : 'Light Mode'}
              </button>
            </div>
            
            <button onClick={() => { alert('Authentication coming soon!'); setIsMenuOpen(false); }} style={{ background: '#10B981', color: 'white', border: 'none', padding: '12px', borderRadius: '8px', fontWeight: '600', fontSize: '16px', cursor: 'pointer', width: '100%', marginTop: '8px' }}>
              Sign In / Sign Up
            </button>
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;