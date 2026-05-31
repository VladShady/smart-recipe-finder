import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';

function Header() {
  const { isDark, toggleTheme } = useTheme();
  const { user, logout, isAuthenticated } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  return (
    <>
      <header className="header-container" style={{ 
        padding: '16px 20px', 
        backgroundColor: 'var(--card-bg)', 
        borderBottom: '1px solid var(--border-color)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        transition: 'background-color 0.3s ease'
      }}>
        
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', backgroundColor: '#10B981', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '18px' }}>
            R
          </div>
          <span style={{ fontSize: '20px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Recipe<span style={{ color: '#10B981' }}>Finder</span>
          </span>
        </Link>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          
          <button 
            onClick={toggleTheme} 
            className="icon-btn"
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '6px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease' }}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            ) : (
              <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
            )}
          </button>

          {isAuthenticated ? (
            <>
              <Link to="/favorites" style={{ textDecoration: 'none', color: 'var(--text-main)', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px', transition: 'color 0.2s ease' }}>
                <svg width="20" height="20" fill="#EF4444" viewBox="0 0 24 24">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                <span className="hide-on-mobile">Favorites</span>
              </Link>

              <div className="hide-on-mobile" style={{ width: '1px', height: '20px', backgroundColor: 'var(--border-color)' }}></div>

              <span className="hide-on-mobile" style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: '500' }}>
                {user?.email}
              </span>
              
              <button 
                onClick={logout}
                className="btn-secondary"
                style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-main)', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}
              >
                Logout
              </button>
            </>
          ) : (
            <button 
              className="auth-btn"
              onClick={() => setIsAuthModalOpen(true)}
              style={{ padding: '8px 16px', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              Sign In
            </button>
          )}

        </div>
      </header>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
      />
    </>
  );
}

export default Header;