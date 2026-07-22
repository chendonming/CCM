import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useConfigStore } from '@/stores/useConfigStore';

type Theme = 'light' | 'dark';
type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: Theme;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getEffectiveTheme(mode: ThemeMode): Theme {
  return mode === 'system' ? getSystemTheme() : mode;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { config, fetchConfig, updateConfig } = useConfigStore();
  const [mode, setLocalMode] = useState<ThemeMode>('system');
  const [theme, setTheme] = useState<Theme>('light');

  // Fetch config on mount
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Sync mode from config when it loads
  useEffect(() => {
    if (config?.ui_preferences?.theme) {
      const configMode = config.ui_preferences.theme as ThemeMode;
      if (['light', 'dark', 'system'].includes(configMode)) {
        setLocalMode(configMode);
      }
    }
  }, [config?.ui_preferences?.theme]);

  // Apply theme class to <html> and listen for system changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const resolved = getEffectiveTheme(mode);
      setTheme(resolved);
      document.documentElement.classList.toggle('dark', resolved === 'dark');
    };

    applyTheme();

    if (mode === 'system') {
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [mode]);

  const setMode = useCallback(async (newMode: ThemeMode) => {
    setLocalMode(newMode);
    if (config) {
      await updateConfig({
        ...config,
        ui_preferences: { ...config.ui_preferences, theme: newMode },
      });
    }
  }, [config, updateConfig]);

  return (
    <ThemeContext.Provider value={{ theme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
