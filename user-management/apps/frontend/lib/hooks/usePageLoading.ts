import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

interface UsePageLoadingProps {
  type?: 'table' | 'form' | 'card' | 'content';
  rows?: number;
  columns?: number;
  minLoadingTime?: number;
}

export const usePageLoading = ({ 
  type = 'content', 
  rows = 5, 
  columns = 6, 
  minLoadingTime = 300 
}: UsePageLoadingProps = {}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Set loading state when route changes
  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      setError(null);
    };

    const handleComplete = () => {
      // Ensure minimum loading time for better UX
      setTimeout(() => {
        setIsLoading(false);
      }, minLoadingTime);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
    };
  }, [router, minLoadingTime]);

  // Manual loading control
  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
    if (loading) {
      setError(null);
    }
  };

  // Error handling
  const setErrorState = (errorMessage: string) => {
    setError(errorMessage);
    setIsLoading(false);
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  return {
    isLoading,
    error,
    setLoading,
    setError: setErrorState,
    clearError,
    loadingProps: {
      type,
      rows,
      columns
    }
  };
};
