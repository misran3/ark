'use client';

import { Skeleton } from './Skeleton';
import { ErrorPanel } from './ErrorPanel';
import { EmptyState } from './EmptyState';
import { RefreshIndicator } from './RefreshIndicator';
import { StaleDataIndicator } from './StaleDataIndicator';

interface DataContainerProps<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error?: Error | null;
  isRefetching?: boolean;
  refetch?: () => void;

  // Custom renderers
  children: (data: T) => React.ReactNode;
  loadingSkeleton?: React.ReactNode;
  errorTitle?: string;
  emptyIcon?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyAction?: { label: string; onClick: () => void };

  // Behavior options
  isEmpty?: (data: T) => boolean;
  showStaleOnError?: boolean;
}

/**
 * Default empty check for data.
 * Returns true if data is considered empty.
 */
function defaultIsEmpty<T>(data: T): boolean {
  if (data === null || data === undefined) {
    return true;
  }
  if (Array.isArray(data) && data.length === 0) {
    return true;
  }
  if (typeof data === 'object' && data !== null && Object.keys(data).length === 0) {
    return true;
  }
  return false;
}

export function DataContainer<T>({
  data,
  isLoading,
  isError,
  error,
  isRefetching = false,
  refetch,
  children,
  loadingSkeleton,
  errorTitle,
  emptyIcon = '🌌',
  emptyTitle = 'SECTOR CLEAR',
  emptyMessage = 'No data detected in this sector.',
  emptyAction,
  isEmpty = defaultIsEmpty,
  showStaleOnError = true,
}: DataContainerProps<T>) {
  // 1. Loading (first load, no data yet)
  if (isLoading && !data) {
    return loadingSkeleton || <Skeleton variant="card" />;
  }

  // 2. Error (no data available)
  if (isError && !data) {
    return (
      <ErrorPanel
        severity="major"
        title={errorTitle}
        message={error?.message || 'An error occurred while fetching data.'}
        onRetry={refetch}
      />
    );
  }

  // 3. Error with stale data
  if (isError && showStaleOnError && data) {
    return (
      <div className="relative">
        <StaleDataIndicator />
        {children(data)}
      </div>
    );
  }

  // 4. Data exists but empty
  if (data && isEmpty(data)) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        message={emptyMessage}
        action={emptyAction}
      />
    );
  }

  // 5. Success
  if (data) {
    return (
      <div className="relative">
        {isRefetching && <RefreshIndicator isRefetching={true} />}
        {children(data)}
      </div>
    );
  }

  // Fallback: no data and no error (edge case)
  return (
    <EmptyState
      icon={emptyIcon}
      title={emptyTitle}
      message={emptyMessage}
      action={emptyAction}
    />
  );
}

export default DataContainer;
