import { useState, useEffect } from 'react';
import api from '@/src/lib/api';
import type { FinancialSnapshot, Transaction, BudgetReport } from '@/src/types/api';

/**
 * Fetches the user's financial snapshot including accounts and recent transactions.
 *
 * @returns An object containing `data` set to the fetched FinancialSnapshot or `null`, `loading` indicating whether the fetch is in progress, and `error` set to an Error or `null`.
 */
export function useFinancialSnapshot() {
  const [data, setData] = useState<FinancialSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get<FinancialSnapshot>('/api/snapshot');
        setData(response.data);
      } catch (err) {
        console.error('useFinancialSnapshot error:', err);
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
 * Fetches transactions optionally filtered to the most recent N days.
 *
 * @param days - Number of days to include when fetching transactions (defaults to 30)
 * @returns An object containing `transactions` (array of Transaction), `loading` (boolean), and `error` (Error | null)
 */
export function useTransactions(days: number = 30) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const response = await api.get<{ transactions: Transaction[]; count: number }>(
          `/api/transactions?days=${days}`
        );
        setTransactions(response.data.transactions);
      } catch (err) {
        console.error('useTransactions error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [days]);

  return { transactions, loading, error };
}

/**
 * Fetches the 50/30/20 budget report.
 *
 * @returns An object with `data` set to the fetched BudgetReport or `null`, `loading` indicating whether the request is in progress, and `error` set to an `Error` if the request failed or `null` otherwise.
 */
export function useBudgetReport() {
  const [data, setData] = useState<BudgetReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get<BudgetReport>('/api/budget');
        setData(response.data);
      } catch (err) {
        console.error('useBudgetReport error:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}