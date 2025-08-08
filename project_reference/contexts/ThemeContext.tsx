import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeStyle = 'tactical' | 'dark-glass' | 'light-glass' | 'simple' | 'stealth';

interface ThemeContextType {
  theme: ThemeStyle;
  setTheme: (theme: ThemeStyle) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeStyle>('simple');

  useEffect(() => {
    const savedTheme = localStorage.getItem('app-theme') as ThemeStyle;
    if (savedTheme && ['tactical', 'dark-glass', 'light-glass', 'simple', 'stealth'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    
    // Remove all theme classes
    document.documentElement.classList.remove('theme-tactical', 'theme-dark-glass', 'theme-light-glass', 'theme-simple', 'theme-stealth');
    
    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`);
    
    // Add dark class for dark themes
    if (theme === 'dark-glass' || theme === 'tactical' || theme === 'stealth') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const isDark = theme === 'dark-glass' || theme === 'tactical' || theme === 'stealth';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}