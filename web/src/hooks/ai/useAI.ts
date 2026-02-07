import { useState } from 'react';
import type { CaptainResponse } from '@/src/types/api';
// import api from '@/src/lib/api';

/**
 * Hook to interact with the Captain Nova AI Agent.
 */
export function useCaptainNova() {
  const [response, setResponse] = useState<CaptainResponse | null>(null);
  const [loading, setLoading] = useState(false);

  /**
   * Send a query to Captain Nova.
   */
  const queryCaptain = async (type: string, message: string = "") => {
    setLoading(true);
    try {
      /* PRODUCTION CODE:
      const res = await api.post<CaptainResponse>('/captain/query', { type, message });
      setResponse(res.data);
      */
      
      // MOCK RESPONSE (Simulated delay):
      await new Promise(resolve => setTimeout(resolve, 1500));
      setResponse({
        message: "Commander, I've analyzed your current trajectory. Life Support systems are nominal, but I detect a spending spike in the Recreation sector.",
        tools_used: ["get_financial_snapshot", "get_budget_report"],
        confidence: 0.95
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { response, loading, queryCaptain };
}
