'use client';

import { useState, useEffect } from 'react';

// Module-scope cache — result never changes during a session
let cachedResult: boolean | null = null;

/**
 * Checks if WebGL is available in the current browser.
 * Result is cached at module scope (checked once, reused everywhere).
 */
export function useWebGLAvailable(): boolean {
  const [available, setAvailable] = useState(cachedResult ?? false);

  useEffect(() => {
    if (cachedResult !== null) {
      setAvailable(cachedResult);
      return;
    }
    try {
      const c = document.createElement('canvas');
      cachedResult = !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      cachedResult = false;
    }
    setAvailable(cachedResult);
  }, []);

  return available;
}
