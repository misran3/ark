'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, ReactNode } from 'react';
import { NovaVariantProvider } from '@/contexts/NovaVariantContext';
import { NovaVariant } from '@/components/ui/NovaVariantDropdown';

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  );

  // TODO: Replace with server-side variant loading
  const novaVariants: NovaVariant[] = [
    { type: 'skeletal', label: 'A: Skeletal-less Hierarchical' },
    { type: 'community', label: 'CAUCASIAN MAN', path: '/3D/CAUCASIAN MAN.glb' },
    { type: 'community', label: 'Vinayagar', path: '/3D/Vinayagar.glb' },
    { type: 'community', label: 'https storage googleapis', path: '/3D/https___storage_googleapis_com_ai_services_quality_jobs_xr4enzsf_input_png.glb' },
  ];

  return (
    <QueryClientProvider client={queryClient}>
      <NovaVariantProvider variants={novaVariants}>
        {children}
      </NovaVariantProvider>
    </QueryClientProvider>
  );
}
