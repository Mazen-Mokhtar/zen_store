import { settingsManager } from './settings';

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    accent: string;
  };
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface Theme {
  name: string;
  colors: ColorPalette;
  isDark: boolean;
}

export const THEMES: Record<string, Theme> = {
  dark: {
    name: 'Dark',
    isDark: true,
    colors: {
      primary: '#0D0E12',
      secondary: '#1A1B20',
      accent: '#10B981',
      background: '#0D0E12',
      surface: '#232329',
      text: {
        primary: '#FFFFFF',
        secondary: '#9CA3AF',
        accent: '#10B981',
      },
      border: '#374151',
      error: '#EF4444',
      warning: '#F59E0B',
      success: '#10B981',
      info: '#3B82F6',
    },
  },
  light: {
    name: 'Light',
    isDark: false,
    colors: {
      primary: '#FFFFFF',
      secondary: '#F9FAFB',
      accent: '#059669',
      background: '#FFFFFF',
      surface: '#F3F4F6',
      text: {
        primary: '#111827',
        secondary: '#6B7280',
        accent: '#059669',
      },
      border: '#D1D5DB',
      error: '#DC2626',
      warning: '#D97706',
      success: '#059669',
      info: '#2563EB',
    },
  },
  blue: {
    name: 'Blue',
    isDark: true,
    colors: {
      primary: '#0F172A',
      secondary: '#1E293B',
      accent: '#3B82F6',
      background: '#0F172A',
      surface: '#334155',
      text: {
        primary: '#F8FAFC',
        secondary: '#CBD5E1',
        accent: '#3B82F6',
      },
      border: '#475569',
      error: '#EF4444',
      warning: '#F59E0B',
      success: '#10B981',
      info: '#3B82F6',
    },
  },
  purple: {
    name: 'Purple',
    isDark: true,
    colors: {
      primary: '#1E1B4B',
      secondary: '#312E81',
      accent: '#8B5CF6',
      background: '#1E1B4B',
      surface: '#4338CA',
      text: {
        primary: '#F8FAFC',
        secondary: '#CBD5E1',
        accent: '#8B5CF6',
      },
      border: '#6366F1',
      error: '#EF4444',
      warning: '#F59E0B',
      success: '#10B981',
      info: '#3B82F6',
    },
  },
};

class ThemeManager {
  private currentTheme: string;

  constructor() {
    this.currentTheme = settingsManager.get('theme') === 'dark' ? 'dark' : 'light';
    this.applyTheme();
  }

  getCurrentTheme(): Theme {
    return THEMES[this.currentTheme] || THEMES.dark;
  }

  setTheme(themeName: string): void {
    if (THEMES[themeName]) {
      this.currentTheme = themeName;
      this.applyTheme();
      
      // Update settings
      const themeMode = themeName === 'dark' ? 'dark' : 'light';
      settingsManager.set('theme', themeMode);
    }
  }

  applyTheme(): void {
    if (typeof window === 'undefined') return;

    const theme = this.getCurrentTheme();
    const root = document.documentElement;

    // Apply CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          root.style.setProperty(`--color-${key}-${subKey}`, String(subValue));
        });
      } else {
        root.style.setProperty(`--color-${key}`, String(value));
      }
    });

    // Apply theme class
    root.classList.remove('theme-dark', 'theme-light', 'theme-blue', 'theme-purple');
    root.classList.add(`theme-${this.currentTheme}`);

    // Update meta theme-color
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', theme.colors.primary);
    }
  }

  getAvailableThemes(): Theme[] {
    return Object.values(THEMES);
  }

  isDarkMode(): boolean {
    return this.getCurrentTheme().isDark;
  }

  toggleTheme(): void {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
  }

  // Get color value
  getColor(colorKey: string): string {
    const theme = this.getCurrentTheme();
    const keys = colorKey.split('.');
    let value: any = theme.colors;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return '#000000'; // Fallback color
      }
    }

    return typeof value === 'string' ? value : '#000000';
  }

  // Generate CSS variables for a theme
  generateCSSVariables(theme: Theme): string {
    let css = ':root {\n';
    
    Object.entries(theme.colors).forEach(([key, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          css += `  --color-${key}-${subKey}: ${subValue};\n`;
        });
      } else {
        css += `  --color-${key}: ${value};\n`;
      }
    });
    
    css += '}';
    return css;
  }

  // Create a custom theme
  createCustomTheme(name: string, colors: Partial<ColorPalette>): Theme {
    const baseTheme = this.getCurrentTheme();
    const customTheme: Theme = {
      name,
      isDark: baseTheme.isDark,
      colors: {
        ...baseTheme.colors,
        ...colors,
      },
    };

    return customTheme;
  }
}

export const themeManager = new ThemeManager();

// CSS utility classes for theme colors
export const themeClasses = {
  // Background colors
  'bg-primary': 'bg-[var(--color-primary)]',
  'bg-secondary': 'bg-[var(--color-secondary)]',
  'bg-accent': 'bg-[var(--color-accent)]',
  'bg-surface': 'bg-[var(--color-surface)]',
  
  // Text colors
  'text-primary': 'text-[var(--color-text-primary)]',
  'text-secondary': 'text-[var(--color-text-secondary)]',
  'text-accent': 'text-[var(--color-text-accent)]',
  
  // Border colors
  'border-primary': 'border-[var(--color-border)]',
  'border-accent': 'border-[var(--color-accent)]',
  
  // Status colors
  'text-error': 'text-[var(--color-error)]',
  'text-warning': 'text-[var(--color-warning)]',
  'text-success': 'text-[var(--color-success)]',
  'text-info': 'text-[var(--color-info)]',
  
  'bg-error': 'bg-[var(--color-error)]',
  'bg-warning': 'bg-[var(--color-warning)]',
  'bg-success': 'bg-[var(--color-success)]',
  'bg-info': 'bg-[var(--color-info)]',
};

// Initialize theme on app start
if (typeof window !== 'undefined') {
  // Apply current theme
  themeManager.applyTheme();
  
  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (settingsManager.get('theme') === 'auto') {
      const newTheme = e.matches ? 'dark' : 'light';
      themeManager.setTheme(newTheme);
    }
  });
}