'use client';

import React from 'react';
import { ErrorPanel } from './ErrorPanel';

export interface SpaceErrorBoundaryProps {
  children: React.ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

export interface SpaceErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class SpaceErrorBoundary extends React.Component<
  SpaceErrorBoundaryProps,
  SpaceErrorBoundaryState
> {
  constructor(props: SpaceErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): SpaceErrorBoundaryState {
    return { hasError: true, error };
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <ErrorPanel
          severity="major"
          title={this.props.fallbackTitle}
          message={this.state.error.message || 'An unexpected error occurred'}
          technicalDetail={this.state.error.stack}
          onRetry={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

export default SpaceErrorBoundary;
