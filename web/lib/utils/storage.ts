/**
 * LocalStorage availability flag - checked once at module init
 * Prevents try-catch on every access
 */
let isStorageAvailable: boolean;

try {
  const test = '__storage_test__';
  localStorage.setItem(test, test);
  localStorage.removeItem(test);
  isStorageAvailable = true;
} catch {
  isStorageAvailable = false;
}

/**
 * Safe localStorage wrapper with feature detection
 */
export const storage = {
  isAvailable: () => isStorageAvailable,

  getItem: (key: string): string | null => {
    if (!isStorageAvailable) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isStorageAvailable) return false;
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
};
