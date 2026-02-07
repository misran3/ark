import { useState, useEffect } from 'react';
import type { Asteroid, VisaControlRule } from '@/src/types/api';
// import api from '@/src/lib/api';

/**
 * Hook to fetch active financial threats (Asteroids).
 */
export function useAsteroids() {
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAsteroids = async () => {
      try {
        /* PRODUCTION CODE:
        const response = await api.get<Asteroid[]>('/asteroids');
        setAsteroids(response.data);
        */

        // MOCK CODE:
        const response = await fetch('/mocks/asteroids.json');
        setAsteroids(await response.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAsteroids();
  }, []);

  /**
   * Resolve an asteroid threat (Deflect/Absorb/Redirect).
   */
  const resolveAsteroid = async (id: string, action: string) => {
    /* PRODUCTION CODE:
    await api.post(`/asteroids/${id}/action`, { action });
    */
    console.log(`Resolving asteroid ${id} with action ${action}`);
  };

  return { asteroids, loading, resolveAsteroid };
}

/**
 * Hook to fetch and manage VISA Transaction Controls.
 */
export function useVisaControls() {
  const [controls, setControls] = useState<VisaControlRule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchControls = async () => {
      try {
        /* PRODUCTION CODE:
        const response = await api.get<VisaControlRule[]>('/visa/controls');
        setControls(response.data);
        */

        // MOCK CODE:
        const response = await fetch('/mocks/visa_controls.json');
        setControls(await response.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchControls();
  }, []);

  return { controls, loading };
}
