import { useState, useCallback } from 'react';
import api from '@/src/lib/api';
import type { CaptainResponse } from '@/src/types/api';

/**
 * Provides state and an action for querying the Captain Nova AI agent.
 *
 * Exposes the latest agent response, loading and error states, and a `queryCaptain` action
 * that requests a specific report type from Captain Nova (currently returns a mocked response).
 *
 * @returns An object with:
 * - `response` — the most recent `CaptainResponse` returned by the agent or `null` if none.
 * - `loading` — `true` while a query is in progress, `false` otherwise.
 * - `error` — an `Error` instance if the last query failed, or `null`.
 * - `queryCaptain(type, message?)` — action to request a report from Captain Nova. `type` is a string specifying the report kind (commonly `"bridge_briefing"`, `"budget_scan"`, `"threat_report"`, `"savings_eta"`, or `"custom"`); `message` is an optional free-form prompt. Currently the action returns a mocked response with simulated latency and will be wired to POST `/api/captain/query` in the future.
 */
export function useCaptainNova() {
  const [response, setResponse] = useState<CaptainResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * Send a query to Captain Nova.
   * 
   * Query Types:
   * - "bridge_briefing": Initial dashboard load summary
   * - "budget_scan": Detailed 50/30/20 analysis
   * - "threat_report": Asteroid analysis with VISA recommendations
   * - "savings_eta": Savings projection
   * - "custom": Free-form user query
   */
  const queryCaptain = useCallback(
    async (type: string, message: string = '') => {
      setLoading(true);
      setError(null);

      try {
        // Captain Nova endpoint not yet deployed - using mock response
        // When ready, uncomment the API call below:
        // const res = await api.post<CaptainResponse>('/api/captain/query', { type, message });
        // setResponse(res.data);

        // Mock response with simulated delay
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setResponse({
          message:
            "Commander, I've analyzed your current trajectory. Life Support systems are nominal at 43.6% of budget. However, I detect a critical overrun in the Recreation Deck — dining sector is at 142% capacity. Recommend activating spending shields on food delivery apps.",
          tools_used: ['get_financial_snapshot', 'get_budget_report', 'get_active_threats'],
          confidence: 0.92,
          suggested_visa_controls: null,
        });
      } catch (err) {
        console.error('queryCaptain error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { response, loading, error, queryCaptain };
}

/**
 * Provide API health state and a function to refresh it.
 *
 * Performs a GET to /api/health and stores the resulting `{ status, data_source }` in `health`.
 * If the request fails, `health` becomes `{ status: 'error', data_source: 'unknown' }`.
 *
 * @returns An object containing:
 *  - `health` — the latest health info (`{ status: string; data_source: string }`) or `null` if unset
 *  - `loading` — `true` while a health check is in progress, `false` otherwise
 *  - `checkHealth` — a function that triggers a health check and updates `health` and `loading`
 */
export function useApiHealth() {
  const [health, setHealth] = useState<{ status: string; data_source: string } | null>(null);
  const [loading, setLoading] = useState(true);

  const checkHealth = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get<{ status: string; data_source: string }>('/api/health');
      setHealth(response.data);
    } catch (err) {
      console.error('useApiHealth error:', err);
      setHealth({ status: 'error', data_source: 'unknown' });
    } finally {
      setLoading(false);
    }
  }, []);

  return { health, loading, checkHealth };
}