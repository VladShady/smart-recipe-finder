import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.body.style.backgroundColor = isDark ? '#111827' : '#F9FAFB';
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const themeStyles = {
    '--bg-color': isDark ? '#111827' : '#F9FAFB',        
    '--card-bg': isDark ? '#1F2937' : '#FFFFFF',          
    '--text-main': isDark ? '#F9FAFB' : '#111827',        
    '--text-muted': isDark ? '#9CA3AF' : '#6B7280',       
    '--border-color': isDark ? '#374151' : '#E5E7EB',     
    '--input-bg': isDark ? '#111827' : '#FFFFFF',         
    '--input-border': isDark ? '#4B5563' : '#D1D5DB',     
    '--hover-bg': isDark ? '#374151' : '#F3F4F6',         
    '--tag-bg': isDark ? 'rgba(16, 185, 129, 0.2)' : '#D1FAE5', 
    '--tag-text': isDark ? '#34D399' : '#065F46',         
    '--error-bg': isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEF2F2',
    '--error-border': isDark ? '#7F1D1D' : '#FCA5A5',
    '--error-text': isDark ? '#FCA5A5' : '#B91C1C',
    '--error-sub': isDark ? '#F87171' : '#991B1B',
    '--staple-bg': isDark ? '#374151' : '#F3F4F6',
    '--staple-text': isDark ? '#9CA3AF' : '#6B7280',        
    '--shadow': isDark ? '0 10px 15px -3px rgba(0, 0, 0, 0.5)' : '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
    minHeight: '100vh',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-main)',
    fontFamily: '"Inter", "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    transition: 'background-color 0.3s ease, color 0.3s ease'
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, themeStyles }}>
      <div style={themeStyles}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);