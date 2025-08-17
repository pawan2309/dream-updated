import React from 'react';
import SkeletonLoader from './SkeletonLoader';

interface LoadingWrapperProps {
  isLoading: boolean;
  type?: 'table' | 'form' | 'card' | 'content';
  rows?: number;
  columns?: number;
  children: React.ReactNode;
}

const LoadingWrapper: React.FC<LoadingWrapperProps> = ({ 
  isLoading, 
  type = 'content', 
  rows = 5, 
  columns = 6, 
  children 
}) => {
  if (isLoading) {
    return <SkeletonLoader type={type} rows={rows} columns={columns} />;
  }

  return <>{children}</>;
};

export default LoadingWrapper;
