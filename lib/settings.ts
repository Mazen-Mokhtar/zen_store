import { storage } from './storage';

export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications: boolean;
  analytics: boolean;
  autoRefresh: boolean;
  cacheEnabled: boolean;
  animations: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  language: 'en',
  notifications: true,
  analytics: true,
  autoRefresh: true,
  cacheEnabled: true,
  animations: true,
};

class SettingsManager {
  private settings: AppSettings;

  constructor() {
    this.settings = this.loadSettings();
  }

  private loadSettings(): AppSettings {
    const saved = storage.get<AppSettings>('app_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...saved } : DEFAULT_SETTINGS;
  }

  private saveSettings() {
    storage.set('app_settings', this.settings);
  }

  get<K extends keyof AppSettings>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    this.settings[key] = value;
    this.saveSettings();
    this.applySettings(key, value);
  }

  getAll(): AppSettings {
    return { ...this.settings };
  }

  update(updates: Partial<AppSettings>) {
    this.settings = { ...this.settings, ...updates };
    this.saveSettings();
    
    // Apply all updated settings
    Object.entries(updates).forEach(([key, value]) => {
      this.applySettings(key as keyof AppSettings, value);
    });
  }

  reset() {
    this.settings = { ...DEFAULT_SETTINGS };
    this.saveSettings();
    
    // Apply default settings
    Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => {
      this.applySettings(key as keyof AppSettings, value);
    });
  }

  private applySettings(key: keyof AppSettings, value: any) {
    switch (key) {
      case 'theme':
        this.applyTheme(value);
        break;
      case 'language':
        this.applyLanguage(value);
        break;
      case 'animations':
        this.applyAnimations(value);
        break;
      case 'analytics':
        this.applyAnalytics(value);
        break;
    }
  }

  private applyTheme(theme: AppSettings['theme']) {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    // Remove existing theme classes
    root.classList.remove('light', 'dark');
    
    if (theme === 'auto') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');
    } else {
      root.classList.add(theme);
    }
  }

  private applyLanguage(language: string) {
    if (typeof window === 'undefined') return;
    
    document.documentElement.lang = language;
    // You can add more language-specific logic here
  }

  private applyAnimations(enabled: boolean) {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    if (enabled) {
      root.classList.remove('no-animations');
    } else {
      root.classList.add('no-animations');
    }
  }

  private applyAnalytics(enabled: boolean) {
    // This will be handled by the analytics module
    // We just need to trigger a reload or update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('analytics-toggle', { detail: enabled }));
    }
  }

  // Theme-specific methods
  isDarkMode(): boolean {
    if (this.settings.theme === 'auto') {
      return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return this.settings.theme === 'dark';
  }

  toggleTheme() {
    const currentTheme = this.get('theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    this.set('theme', newTheme);
  }

  // Language-specific methods
  getSupportedLanguages() {
    return [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
      { code: 'pt', name: 'Português', flag: '🇧🇷' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
    ];
  }

  // Export/Import settings
  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  importSettings(jsonString: string): boolean {
    try {
      const imported = JSON.parse(jsonString);
      if (this.validateSettings(imported)) {
        this.update(imported);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to import settings:', error);
      return false;
    }
  }

  private validateSettings(settings: any): settings is AppSettings {
    const requiredKeys: (keyof AppSettings)[] = [
      'theme', 'language', 'notifications', 'analytics', 
      'autoRefresh', 'cacheEnabled', 'animations'
    ];
    
    return requiredKeys.every(key => key in settings);
  }
}

export const settingsManager = new SettingsManager();

// Initialize settings on app start
if (typeof window !== 'undefined') {
  // Apply current settings
  const currentSettings = settingsManager.getAll();
  Object.entries(currentSettings).forEach(([key, value]) => {
    settingsManager.applySettings(key as keyof AppSettings, value);
  });

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (settingsManager.get('theme') === 'auto') {
      settingsManager.applyTheme('auto');
    }
  });
} 