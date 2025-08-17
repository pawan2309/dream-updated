import React from 'react';
import SkeletonLoader from './SkeletonLoader';
import ErrorDisplay from './ErrorDisplay';

interface EnhancedLoadingWrapperProps {
  isLoading: boolean;
  error: string | null;
  type?: 'table' | 'form' | 'card' | 'content';
  rows?: number;
  columns?: number;
  onRetry?: () => void;
  children: React.ReactNode;
}

const EnhancedLoadingWrapper: React.FC<EnhancedLoadingWrapperProps> = ({ 
  isLoading, 
  error,
  type = 'content', 
  rows = 5, 
  columns = 6, 
  onRetry,
  children 
}) => {
  if (error) {
    return <ErrorDisplay message={error} onRetry={onRetry} />;
  }

  if (isLoading) {
    return <SkeletonLoader type={type} rows={rows} columns={columns} />;
  }

  return <>{children}</>;
};

export default EnhancedLoadingWrapper;
