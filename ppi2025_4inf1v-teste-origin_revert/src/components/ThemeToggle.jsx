import { useState, useEffect } from 'react';
import styles from './ThemeToggle.module.css';
import { MoonIcon, SunIcon } from 'lucide-react';

export function ThemeToggle() {
  const getInitial = () => {
    try {
      const stored = localStorage.getItem('theme');
      if (stored) return stored;
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
    } catch (e) {
      /* fallback */
    }
    return 'light';
  };

  const [theme, setTheme] = useState(getInitial);

  useEffect(() => {
    if (!theme) return;
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  return (
    <button
      onClick={toggleTheme}
      className={styles.toggleButton}
      aria-label="Toggle theme"
    > Tema
      {theme === 'light' ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}