import { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export type Theme = 'light' | 'dark' | 'system';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('chat-cleaner-pro/theme') as Theme) || 'system';
  });

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = (t: Theme) => {
      let activeTheme = t;
      if (t === 'system') {
        activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      root.setAttribute('data-theme', activeTheme);
    };

    applyTheme(theme);
    localStorage.setItem('chat-cleaner-pro/theme', theme);

    // Watch for system preference changes if 'system' is selected
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => applyTheme('system');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const selectTheme = (t: Theme) => {
    setTheme(t);
    setIsOpen(false);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className="btn btn-ghost btn-sm" 
        onClick={toggleDropdown}
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {theme === 'light' && <Sun size={18} />}
        {theme === 'dark' && <Moon size={18} />}
        {theme === 'system' && <Laptop size={18} />}
      </button>

      {isOpen && (
        <>
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 998,
            }}
            onClick={() => setIsOpen(false)}
          />
          <div 
            className="card"
            style={{
              position: 'absolute',
              right: 0,
              top: '44px',
              zIndex: 999,
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              minWidth: '120px',
              backgroundColor: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <button 
              className={`btn btn-ghost btn-sm`}
              style={{ 
                justifyContent: 'flex-start',
                width: '100%', 
                color: theme === 'light' ? 'var(--primary)' : 'var(--foreground)',
                fontWeight: theme === 'light' ? '600' : '400',
                background: theme === 'light' ? 'color-mix(in oklab, var(--primary) 8%, transparent)' : 'transparent'
              }}
              onClick={() => selectTheme('light')}
            >
              <Sun size={14} /> Light
            </button>
            <button 
              className={`btn btn-ghost btn-sm`}
              style={{ 
                justifyContent: 'flex-start',
                width: '100%', 
                color: theme === 'dark' ? 'var(--primary)' : 'var(--foreground)',
                fontWeight: theme === 'dark' ? '600' : '400',
                background: theme === 'dark' ? 'color-mix(in oklab, var(--primary) 8%, transparent)' : 'transparent'
              }}
              onClick={() => selectTheme('dark')}
            >
              <Moon size={14} /> Dark
            </button>
            <button 
              className={`btn btn-ghost btn-sm`}
              style={{ 
                justifyContent: 'flex-start',
                width: '100%', 
                color: theme === 'system' ? 'var(--primary)' : 'var(--foreground)',
                fontWeight: theme === 'system' ? '600' : '400',
                background: theme === 'system' ? 'color-mix(in oklab, var(--primary) 8%, transparent)' : 'transparent'
              }}
              onClick={() => selectTheme('system')}
            >
              <Laptop size={14} /> System
            </button>
          </div>
        </>
      )}
    </div>
  );
}
