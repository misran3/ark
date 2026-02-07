'use client';

import { lazy, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

const DevDashboard = lazy(() =>
  import('./DevDashboard').then((m) => ({ default: m.DevDashboard }))
);
const DevIndicator = lazy(() =>
  import('./DevIndicator').then((m) => ({ default: m.DevIndicator }))
);

export function DevDashboardLoader() {
  const searchParams = useSearchParams();
  const forceDevMode = searchParams.get('dev') === 'true';

  // Only show in development mode or when ?dev=true
  if (process.env.NODE_ENV !== 'development' && !forceDevMode) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <DevDashboard />
      <DevIndicator />
    </Suspense>
  );
}
