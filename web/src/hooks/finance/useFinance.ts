import { useState, useEffect } from 'react';
import api from '@/src/lib/api';
import type { FinancialSnapshot, Transaction, BudgetReport } from '@/src/types/api';

/**
 * Hook to fetch the financial snapshot (accounts + recent transactions).
 * 
 * Endpoint: GET /api/snapshot
 * Returns: FinancialSnapshot object directly (no wrapper)
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
 * Hook to fetch transactions with optional filtering by days.
 * 
 * Endpoint: GET /api/transactions?days={days}
 * Returns: { transactions: Transaction[], count: number }
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
 * Hook to fetch the 50/30/20 budget report.
 * 
 * Endpoint: GET /api/budget
 * Returns: BudgetReport object directly (no wrapper)
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
