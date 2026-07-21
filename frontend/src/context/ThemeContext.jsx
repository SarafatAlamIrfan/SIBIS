import React, { createContext, useContext, useState, useEffect } from 'react';

export const THEME_PRESETS = [
  {
    id: 'indigo',
    name: 'Indigo Velvet',
    tagline: 'Modern & Vibrant',
    description: 'Classic tech aesthetic with deep indigo, purple, and neon pink accents.',
    primaryColor: '#6366f1',
    primaryHover: '#4f46e5',
    accentColor: '#a855f7',
    glowColor: 'rgba(99, 102, 241, 0.4)',
    gradient: 'from-indigo-600 via-purple-600 to-pink-600',
    darkGradient: 'from-indigo-400 via-purple-300 to-pink-400',
    dotBg: 'bg-indigo-500',
    ringColor: 'ring-indigo-500',
    swatch: ['#6366f1', '#a855f7', '#ec4899']
  },
  {
    id: 'emerald',
    name: 'Emerald Forest',
    tagline: 'Organic & Refreshing',
    description: 'Lush green tones with rich emerald, deep teal, and mint highlights.',
    primaryColor: '#10b981',
    primaryHover: '#059669',
    accentColor: '#14b8a6',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    gradient: 'from-emerald-600 via-teal-600 to-cyan-600',
    darkGradient: 'from-emerald-400 via-teal-300 to-cyan-400',
    dotBg: 'bg-emerald-500',
    ringColor: 'ring-emerald-500',
    swatch: ['#10b981', '#14b8a6', '#34d399']
  },
  {
    id: 'ocean',
    name: 'Ocean Deep',
    tagline: 'Crisp & Serene',
    description: 'Refreshing sea breeze vibes with cyan, azure blue, and sky highlights.',
    primaryColor: '#06b6d4',
    primaryHover: '#0891b2',
    accentColor: '#2563eb',
    glowColor: 'rgba(6, 182, 212, 0.4)',
    gradient: 'from-cyan-600 via-blue-600 to-indigo-600',
    darkGradient: 'from-cyan-400 via-blue-300 to-indigo-400',
    dotBg: 'bg-cyan-500',
    ringColor: 'ring-cyan-500',
    swatch: ['#06b6d4', '#2563eb', '#38bdf8']
  },
  {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk',
    tagline: 'High Octane & Electric',
    description: 'Futuristic synthwave energy with electric fuchsia, neon purple, and cyber cyan.',
    primaryColor: '#f43f5e',
    primaryHover: '#e11d48',
    accentColor: '#c084fc',
    glowColor: 'rgba(244, 63, 94, 0.45)',
    gradient: 'from-rose-500 via-purple-600 to-cyan-500',
    darkGradient: 'from-rose-400 via-purple-300 to-cyan-400',
    dotBg: 'bg-rose-500',
    ringColor: 'ring-rose-500',
    swatch: ['#f43f5e', '#c084fc', '#06b6d4']
  },
  {
    id: 'sunset',
    name: 'Sunset Amber',
    tagline: 'Warm & Energizing',
    description: 'Cozy solar warmth featuring rich amber gold, coral orange, and crimson twilight.',
    primaryColor: '#f59e0b',
    primaryHover: '#d97706',
    accentColor: '#f97316',
    glowColor: 'rgba(245, 158, 11, 0.4)',
    gradient: 'from-amber-500 via-orange-600 to-rose-600',
    darkGradient: 'from-amber-400 via-orange-300 to-rose-400',
    dotBg: 'bg-amber-500',
    ringColor: 'ring-amber-500',
    swatch: ['#f59e0b', '#f97316', '#fb7185']
  },
  {
    id: 'royal',
    name: 'Royal Amethyst',
    tagline: 'Luxurious & Elegant',
    description: 'Sophisticated dark violet and royal purple with glittering gold accents.',
    primaryColor: '#8b5cf6',
    primaryHover: '#7c3aed',
    accentColor: '#d97706',
    glowColor: 'rgba(139, 92, 246, 0.4)',
    gradient: 'from-violet-600 via-purple-700 to-amber-500',
    darkGradient: 'from-violet-400 via-purple-300 to-amber-400',
    dotBg: 'bg-violet-500',
    ringColor: 'ring-violet-500',
    swatch: ['#8b5cf6', '#a78bfa', '#f59e0b']
  }
];

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setThemeState] = useState(() => {
    const savedTheme = localStorage.getItem('sibis_theme_color');
    if (savedTheme && THEME_PRESETS.some(t => t.id === savedTheme)) {
      return savedTheme;
    }
    return 'indigo';
  });

  const [mode, setModeState] = useState(() => {
    const savedMode = localStorage.getItem('sibis_theme_mode') || localStorage.getItem('sibis_theme');
    if (savedMode) return savedMode;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    // Apply data-theme attribute on root element
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('sibis_theme_color', theme);
  }, [theme]);

  useEffect(() => {
    // Apply dark class on root element
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('sibis_theme_mode', 'dark');
      localStorage.setItem('sibis_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('sibis_theme_mode', 'light');
      localStorage.setItem('sibis_theme', 'light');
    }
  }, [mode]);

  const setTheme = (newThemeId) => {
    if (THEME_PRESETS.some(t => t.id === newThemeId)) {
      setThemeState(newThemeId);
    }
  };

  const setMode = (newMode) => {
    if (newMode === 'dark' || newMode === 'light') {
      setModeState(newMode);
    }
  };

  const toggleMode = () => {
    setModeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const currentThemeObj = THEME_PRESETS.find(t => t.id === theme) || THEME_PRESETS[0];

  return (
    <ThemeContext.Provider
      value={{
        theme,
        mode,
        darkMode: mode === 'dark',
        setTheme,
        setMode,
        toggleMode,
        themes: THEME_PRESETS,
        currentThemeObj
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
