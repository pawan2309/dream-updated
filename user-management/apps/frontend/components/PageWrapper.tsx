import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import SkeletonLoader from './SkeletonLoader';
import ErrorDisplay from './ErrorDisplay';

interface PageWrapperProps {
  children: React.ReactNode;
  type?: 'table' | 'form' | 'card' | 'content';
  rows?: number;
  columns?: number;
  showSkeletonOnNavigation?: boolean;
}

const PageWrapper: React.FC<PageWrapperProps> = ({ 
  children, 
  type = 'content',
  rows = 5,
  columns = 6,
  showSkeletonOnNavigation = false
}) => {
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!showSkeletonOnNavigation) return;

    const handleStart = () => {
      setIsPageLoading(true);
      setError(null);
    };

    const handleComplete = () => {
      // Brief skeleton display for better UX
      setTimeout(() => {
        setIsPageLoading(false);
      }, 200);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
    };
  }, [router, showSkeletonOnNavigation]);

  // Manual loading control
  const setLoading = (loading: boolean) => {
    setIsPageLoading(loading);
    if (loading) {
      setError(null);
    }
  };

  // Error handling
  const setErrorState = (errorMessage: string) => {
    setError(errorMessage);
    setIsPageLoading(false);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  if (error) {
    return <ErrorDisplay message={error} onRetry={clearError} />;
  }

  if (isPageLoading) {
    return <SkeletonLoader type={type} rows={rows} columns={columns} />;
  }

  return <>{children}</>;
};

export default PageWrapper;
