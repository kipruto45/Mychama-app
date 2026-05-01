import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { colors as staticColors } from '@/theme/colors';
import { storage } from '@/utils/storage';
import { THEME_PREFERENCE_STORAGE_KEY } from '@/constants/storageKeys';
import { setGlobalTheme } from '@/theme';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: typeof staticColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreference] = useState<Theme | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadPreference = async () => {
      const storedTheme = await storage.getItem(THEME_PREFERENCE_STORAGE_KEY);
      if (!mounted) {
        return;
      }
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setThemePreference(storedTheme);
      } else {
        setThemePreference(null);
      }
    };

    void loadPreference();

    return () => {
      mounted = false;
    };
  }, []);

  const resolvedTheme: Theme = themePreference === 'dark' ? 'dark' : 'light';

  const isDarkMode = resolvedTheme === 'dark';

  useEffect(() => {
    if (themePreference !== null) {
      setGlobalTheme(isDarkMode);
    } else {
      setGlobalTheme(false);
    }
  }, [themePreference, isDarkMode]);

  const toggleTheme = () => {
    const nextTheme: Theme = resolvedTheme === 'light' ? 'dark' : 'light';
    setThemePreference(nextTheme);
    void storage.setItem(THEME_PREFERENCE_STORAGE_KEY, nextTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemePreference(newTheme);
    void storage.setItem(THEME_PREFERENCE_STORAGE_KEY, newTheme);
  };

  const schemeColors = isDarkMode ? staticColors.dark : staticColors.light;
  const themeColors = {
    ...staticColors,
    ...schemeColors,
  };

  return (
    <ThemeContext.Provider
      value={{
        theme: resolvedTheme,
        isDark: isDarkMode,
        colors: themeColors,
        toggleTheme,
        setTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
