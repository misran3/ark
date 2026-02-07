import { useState, useEffect } from 'react';
import type { FinancialSnapshot, Transaction } from '@/src/types/api';
// import api from '@/src/lib/api';

/**
 * Hook to fetch the financial snapshot (accounts + recent transactions).
 * 
 * Currently configured to use shared mocks for development.
 * Includes commented-out Axios code for production API integration.
 */
export function useFinancialSnapshot() {
  const [data, setData] = useState<FinancialSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        /* PRODUCTION CODE:
        const response = await api.get<FinancialSnapshot>('/snapshot');
        setData(response.data);
        */

        // MOCK CODE (Using shared mocks):
        const response = await fetch('/mocks/snapshot.json');
        const result = await response.json();
        setData(result);
        
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}

/**
 * Hook to fetch transactions with optional filtering.
 */
export function useTransactions(days: number = 30) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        /* PRODUCTION CODE:
        const response = await api.get<Transaction[]>(`/transactions?days=${days}`);
        setTransactions(response.data);
        */

        // MOCK CODE:
        const response = await fetch('/mocks/snapshot.json');
        const result = await response.json();
        setTransactions(result.recent_transactions);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [days]);

  return { transactions, loading };
}
