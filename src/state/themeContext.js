import React, { createContext, useContext, useEffect, useState } from 'react';
import { THEMES, STORAGE_KEYS } from '../utils/constants';
import { getStorageValue, setStorageValue } from '../utils/helpers';

// Create Theme Context
const ThemeContext = createContext();

// Theme Provider Component
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    // Initialize theme from localStorage or default to light
    return getStorageValue(STORAGE_KEYS.THEME, THEMES.LIGHT);
  });

  // Apply theme to document root
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    setStorageValue(STORAGE_KEYS.THEME, theme);
  }, [theme]);

  // Toggle between light and dark themes
  const toggleTheme = () => {
    setTheme(prevTheme => 
      prevTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT
    );
  };

  // Set specific theme
  const setSpecificTheme = (newTheme) => {
    if (Object.values(THEMES).includes(newTheme)) {
      setTheme(newTheme);
    }
  };

  const contextValue = {
    theme,
    toggleTheme,
    setTheme: setSpecificTheme,
    isLight: theme === THEMES.LIGHT,
    isDark: theme === THEMES.DARK
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Export context for advanced usage
export { ThemeContext };