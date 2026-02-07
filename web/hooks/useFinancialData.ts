'use client';

import { useQuery } from '@tanstack/react-query';
import { fetchFinancialSnapshot, fetchBudgetReport } from '@/lib/api-client';

export function useFinancialSnapshot() {
  return useQuery({
    queryKey: ['financial-snapshot'],
    queryFn: fetchFinancialSnapshot,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

export function useBudgetReport() {
  return useQuery({
    queryKey: ['budget-report'],
    queryFn: fetchBudgetReport,
    refetchInterval: 60000, // Refetch every minute
  });
}
