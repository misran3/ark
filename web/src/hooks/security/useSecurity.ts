import { useState, useEffect, useCallback } from "react";
import api from "@/src/lib/api";
import type { Asteroid, VisaControlRule } from "@/src/types/api";

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
      const response = await api.get<{ asteroids: Asteroid[] }>(
        "/api/asteroids",
      );
      setAsteroids(response.data.asteroids);
    } catch (err) {
      console.error("useAsteroids error:", err);
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
    async (id: string, action: "deflect" | "absorb" | "redirect") => {
      try {
        await api.post(`/api/asteroids/${id}/action`, { action });
        // Optimistically remove from local state
        setAsteroids((prev) => prev.filter((a) => a.id !== id));
        return { success: true };
      } catch (err) {
        console.error("resolveAsteroid error:", err);
        return { success: false, error: err };
      }
    },
    [],
  );

  return {
    asteroids,
    loading,
    error,
    resolveAsteroid,
    refetch: fetchAsteroids,
  };
}

/**
 * Hook to fetch and manage VISA Transaction Controls.
 *
 * Endpoints:
 * - POST /api/visa/controls - Create a control
 * - GET /api/visa/controls/{document_id} - Get control details
 * - DELETE /api/visa/controls/{document_id} - Remove control
 *
 * Note: Currently using local mocks for listing controls since we don't have
 * a "list all" endpoint. Individual control operations use the real API.
 */
export function useVisaControls() {
  const [controls, setControls] = useState<VisaControlRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchControls = async () => {
      try {
        setLoading(true);
        // Using local mocks for listing - in production, implement GET /api/visa/controls
        const response = await fetch("/mocks/visa_controls.json");
        const data = await response.json();
        setControls(data);
      } catch (err) {
        console.error("useVisaControls error:", err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchControls();
  }, []);

  /**
   * Create a new VISA transaction control.
   *
   * POST /api/visa/controls
   */
  const createControl = useCallback(async (rule: VisaControlRule) => {
    try {
      const response = await api.post<{ status: string; rule_id: string }>(
        "/api/visa/controls",
        rule,
      );
      // Add to local state
      if (response.data.status === "success") {
        setControls((prev) => [...prev, { ...rule, rule_id: response.data.rule_id }]);
      }
      return response.data;
    } catch (err) {
      console.error("createControl error:", err);
      throw err;
    }
  }, []);

  /**
   * Delete a VISA transaction control.
   *
   * DELETE /api/visa/controls/{document_id}
   */
  const deleteControl = useCallback(async (documentId: string) => {
    try {
      const response = await api.delete(`/api/visa/controls/${documentId}`);
      // Optimistically remove from local state
      setControls((prev) => prev.filter((c) => c.rule_id !== documentId));
      return response.data;
    } catch (err) {
      console.error("deleteControl error:", err);
      throw err;
    }
  }, []);

  return { controls, loading, error, createControl, deleteControl };
}
