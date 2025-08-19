'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../lib/hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { authenticated, loading, user, checkSession } = useAuth();
  const router = useRouter();

  // Memoize the session check to prevent unnecessary calls
  const handleSessionCheck = useCallback(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    // Only check session if not already authenticated
    if (!authenticated && !loading) {
      handleSessionCheck();
    }
  }, [authenticated, loading, handleSessionCheck]);

  useEffect(() => {
    // If not loading and not authenticated, redirect to login
    if (!loading && !authenticated) {
      console.log('🔄 Not authenticated, redirecting to login');
      router.push('/login');
    }
  }, [authenticated, loading, router]);

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If not authenticated, don't render children (will redirect)
  if (!authenticated) {
    return null;
  }

  // If authenticated, render children
  return <>{children}</>;
} 