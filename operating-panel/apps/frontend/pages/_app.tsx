import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { checkDomainRedirect, handleDomainAuthError } from '../lib/domainRedirect';

export default function App({ Component, pageProps }: AppProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  useEffect(() => {
    // Check authentication and domain access
    const checkAuth = async () => {
      console.log('🔍 App: Checking authentication for path:', router.pathname);
      try {
        // Skip auth check for login page to prevent loop
        if (router.pathname === '/login') {
          console.log('🔍 App: On login page, skipping auth check');
          setIsLoading(false);
          return;
        }

        console.log('🔍 App: Making session API call');
        // Get user session
        const response = await fetch('/api/auth/session');
        console.log('🔍 App: Session response status:', response.status);
        
        if (response.status === 200) {
          const data = await response.json();
          console.log('🔍 App: Session data:', data);
          
          if (data.user) {
            console.log('🔍 App: User found, checking domain access');
            // Check if user should be redirected based on role
            const currentDomain = window.location.hostname;
            const shouldRedirect = checkDomainRedirect(data.user.role, currentDomain);
            
            if (!shouldRedirect) {
              console.log('🔍 App: Setting user and allowing access');
              setUser(data.user);
            } else {
              console.log('🔍 App: Domain redirect needed');
            }
          } else {
            console.log('🔍 App: No user data, redirecting to login');
            // Redirect to login if no user data
            router.push('/login');
          }
        } else if (response.status === 403) {
          console.log('🔍 App: Access denied (403)');
          // Access denied - redirect to appropriate domain
          const data = await response.json();
          if (data.redirectTo) {
            const protocol = window.location.protocol;
            const targetUrl = `${protocol}//${data.redirectTo}${window.location.pathname}`;
            window.location.href = targetUrl;
            return;
          }
          // Fallback to login
          router.push('/login');
        } else {
          console.log('🔍 App: Not authenticated, redirecting to login');
          // Redirect to login if not authenticated
          router.push('/login');
        }
      } catch (error) {
        console.error('🔍 App: Auth check error:', error);
        // Handle domain auth errors
        if (handleDomainAuthError(error)) {
          return;
        }
        // Redirect to login on error
        router.push('/login');
      } finally {
        console.log('🔍 App: Setting loading to false');
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router.pathname]);

  console.log('🔍 App: Rendering with user:', user, 'loading:', isLoading, 'path:', router.pathname);

  if (isLoading) {
    console.log('🔍 App: Showing loading screen');
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#6b7280'
      }}>
        Loading...
      </div>
    );
  }

  // Don't render anything if we're on login page and not authenticated
  if (router.pathname === '/login' && !user) {
    console.log('🔍 App: On login page, rendering login component');
    return <Component {...pageProps} />;
  }

  // Don't render anything if not authenticated and not on login page
  if (!user && router.pathname !== '/login') {
    console.log('🔍 App: Not authenticated, not rendering anything');
    return null; // Will redirect to login
  }

  console.log('🔍 App: Rendering component with user:', user);
  return <Component {...pageProps} user={user} />;
} 