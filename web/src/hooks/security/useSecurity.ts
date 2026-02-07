import { useState, useEffect, useCallback } from 'react';
import api from '@/src/lib/api';
import type { Asteroid, VisaControlRule } from '@/src/types/api';

/**
 * Hook to fetch active financial threats (Asteroids).
 * 
 * Endpoint: GET /api/asteroids
 * Returns: { asteroids: Asteroid[] }
 */
export function useAsteroids() {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAsteroids = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ asteroids: Asteroid[] }>('/api/asteroids');
      setAsteroids(response.data.asteroids);
    } catch (err) {
      console.error('useAsteroids error:', err);
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAsteroids();
  }, [fetchAsteroids]);

  /**
   * Resolve an asteroid threat (Deflect/Absorb/Redirect).
   * 
   * Endpoint: POST /api/asteroids/{asteroid_id}/action
   * Body: { action: "deflect" | "absorb" | "redirect" }
   */
  const resolveAsteroid = useCallback(
    async (id: string, action: 'deflect' | 'absorb' | 'redirect') => {
      try {
        await api.post(`/api/asteroids/${id}/action`, { action });
        // Optimistically remove from local state
        setAsteroids((prev) => prev.filter((a) => a.id !== id));
        return { success: true };
      } catch (err) {
        console.error('resolveAsteroid error:', err);
        return { success: false, error: err };
      }
    },
    []
  );

  return { asteroids, loading, error, resolveAsteroid, refetch: fetchAsteroids };
}

/**
 * Hook to fetch and manage VISA Transaction Controls.
 * 
 * Note: VISA endpoints are not yet deployed. This hook is prepared for future integration.
 * Currently falls back to local mocks.
 */
export function useVisaControls() {
  const [controls, setControls] = useState<VisaControlRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchControls = async () => {
      try {
        setLoading(true);
        // VISA endpoints not yet deployed - using local mocks for now
        const response = await fetch('/mocks/visa_controls.json');
        const data = await response.json();
        setControls(data);
      } catch (err) {
        console.error('useVisaControls error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchControls();
  }, []);

  return { controls, loading, error };
}
