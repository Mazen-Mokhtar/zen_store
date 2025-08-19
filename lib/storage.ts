import { logger } from './utils';

export class LocalStorage {
  private static instance: LocalStorage;
  private storage: Storage;

  private constructor() {
    this.storage = typeof window !== 'undefined' ? window.localStorage : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      length: 0,
      key: () => null
    };
  }

  static getInstance(): LocalStorage {
    if (!LocalStorage.instance) {
      LocalStorage.instance = new LocalStorage();
    }
    return LocalStorage.instance;
  }

  get<T>(key: string, defaultValue?: T): T | null {
    try {
      const item = this.storage.getItem(key);
      return item ? JSON.parse(item) : defaultValue || null;
    } catch (error) {
      logger.error(`Error reading from localStorage key "${key}":`, error);
      return defaultValue || null;
    }
  }

  set<T>(key: string, value: T): void {
    try {
      this.storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      logger.error(`Error writing to localStorage key "${key}":`, error);
    }
  }

  remove(key: string): void {
    try {
      this.storage.removeItem(key);
    } catch (error) {
      logger.error(`Error removing from localStorage key "${key}":`, error);
    }
  }

  clear(): void {
    try {
      this.storage.clear();
    } catch (error) {
      logger.error('Error clearing localStorage:', error);
    }
  }
}

export const storage = LocalStorage.getInstance();

// Storage keys
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  RECENT_VIEWED: 'recent_viewed',
  FAVORITES: 'favorites',
  THEME: 'theme',
} as const;

// User preferences interface
export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: boolean;
}

// Default preferences
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  language: 'en',
  notifications: true,
};

// Helper functions
export const getUserPreferences = (): UserPreferences => {
  const prefs = storage.get(STORAGE_KEYS.USER_PREFERENCES);
  return prefs ? { ...DEFAULT_PREFERENCES, ...prefs } : DEFAULT_PREFERENCES;
};

export const setUserPreferences = (preferences: Partial<UserPreferences>): void => {
  const current = getUserPreferences();
  storage.set(STORAGE_KEYS.USER_PREFERENCES, { ...current, ...preferences });
};

export const getRecentViewed = (): string[] => {
  const recent = storage.get<string[]>(STORAGE_KEYS.RECENT_VIEWED);
  return recent || [];
};

export const addRecentViewed = (itemId: string): void => {
  const recent = getRecentViewed();
  const filtered = recent.filter(id => id !== itemId);
  const updated = [itemId, ...filtered].slice(0, 10); // Keep only last 10
  storage.set(STORAGE_KEYS.RECENT_VIEWED, updated);
};

export const getFavorites = (): string[] => {
  const favorites = storage.get<string[]>(STORAGE_KEYS.FAVORITES);
  return favorites || [];
};

export const addFavorite = (itemId: string): void => {
  const favorites = getFavorites();
  if (!favorites.includes(itemId)) {
    storage.set(STORAGE_KEYS.FAVORITES, [...favorites, itemId]);
  }
};

export const removeFavorite = (itemId: string): void => {
  const favorites = getFavorites();
  storage.set(STORAGE_KEYS.FAVORITES, favorites.filter(id => id !== itemId));
};

export const isFavorite = (itemId: string): boolean => {
  const favorites = getFavorites();
  return favorites.includes(itemId);
};