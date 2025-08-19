import { useState, useEffect, useRef } from 'react'

interface User {
  id: string
  username: string
  name: string
  role: string
  balance: number
  isActive: boolean
  code: string
  contactno: string
  creditLimit: number
  exposure: number
}

interface AuthState {
  user: User | null
  loading: boolean
  authenticated: boolean
  error: string | null
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    authenticated: false,
    error: null
  })

  // Add ref to prevent multiple simultaneous calls
  const isCheckingSession = useRef(false);

  const checkSession = async () => {
    // Prevent multiple simultaneous calls
    if (isCheckingSession.current) {
      console.log('🔄 Session check already in progress, skipping...');
      return;
    }

    try {
      isCheckingSession.current = true;
      setAuthState(prev => ({ ...prev, loading: true, error: null }));

      // First, try to get user data from localStorage as fallback
      const storedUserData = localStorage.getItem('userData');
      let fallbackUser = null;
      if (storedUserData) {
        try {
          fallbackUser = JSON.parse(storedUserData);
        } catch (e) {
          console.error('Failed to parse stored user data');
          localStorage.removeItem('userData');
        }
      }

      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include', // Include cookies
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.authenticated && data.user) {
          // Store user data in localStorage
          localStorage.setItem('userData', JSON.stringify(data.user));
          
          // Store token if available
          if (data.token) {
            localStorage.setItem('authToken', data.token);
          }
          
          setAuthState({
            user: data.user,
            loading: false,
            authenticated: true,
            error: null
          });
          
          console.log('✅ Session check successful, user data updated:', data.user);
        } else {
          // Check if it's a token expiration error
          if (data.code === 'TOKEN_EXPIRED') {
            console.log('🔄 Token expired, redirecting to login');
            // Clear all stored data
            localStorage.removeItem('userData');
            localStorage.removeItem('authToken');
            setAuthState({
              user: null,
              loading: false,
              authenticated: false,
              error: 'Token expired'
            });
            
            // Redirect to login page
            window.location.href = '/login';
            return;
          }
          
          // Other authentication errors
          setAuthState({
            user: null,
            loading: false,
            authenticated: false,
            error: data.error || 'Authentication failed'
          });
          
          // If we have fallback user data, use it temporarily
          if (fallbackUser) {
            console.log('🔄 Using fallback user data from localStorage');
            setAuthState({
              user: fallbackUser,
              loading: false,
              authenticated: true,
              error: null
            });
          }
        }
      } else {
        // HTTP error - check if it's token expiration
        try {
          const errorData = await response.json();
          if (errorData.code === 'TOKEN_EXPIRED') {
            console.log('🔄 Token expired, redirecting to login');
            // Clear all stored data
            localStorage.removeItem('userData');
            localStorage.removeItem('authToken');
            setAuthState({
              user: null,
              loading: false,
              authenticated: false,
              error: 'Token expired'
            });
            
            // Redirect to login page
            window.location.href = '/login';
            return;
          }
        } catch (e) {
          // Could not parse error response
        }
        
        // Handle other HTTP errors
        setAuthState({
          user: null,
          loading: false,
          authenticated: false,
          error: 'Session check failed'
        });
        
        // If we have fallback user data, use it temporarily
        if (fallbackUser) {
          console.log('🔄 Using fallback user data from localStorage');
          setAuthState({
            user: fallbackUser,
            loading: false,
            authenticated: true,
            error: null
          });
        }
      }
    } catch (error) {
      console.error('Session check error:', error);
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
        error: 'Network error during session check'
      });
      
      // If we have fallback user data, use it temporarily
      const storedUserData = localStorage.getItem('userData');
      if (storedUserData) {
        try {
          const fallbackUser = JSON.parse(storedUserData);
          console.log('🔄 Using fallback user data from localStorage');
          setAuthState({
            user: fallbackUser,
            loading: false,
            authenticated: true,
            error: null
          });
        } catch (e) {
          console.error('Failed to parse stored user data');
          localStorage.removeItem('userData');
        }
      }
    } finally {
      isCheckingSession.current = false;
    }
  };

  const login = async (username: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      const data = await response.json();

      if (data.success) {
        // Store token in localStorage for WebSocket authentication
        if (data.token) {
          localStorage.setItem('authToken', data.token);
        }
        
        // Store user data
        localStorage.setItem('userData', JSON.stringify(data.user));
        
        setAuthState({
          user: data.user,
          loading: false,
          authenticated: true,
          error: null
        });
        
        console.log('✅ Login successful, user data stored:', data.user);
        
        // Return success response for the login form
        return { success: true, user: data.user };
      } else {
        const errorMessage = data.message || data.error || 'Login failed';
        setAuthState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
        
        // Return error response for the login form
        return { success: false, error: errorMessage };
      }
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Network error occurred';
      
      setAuthState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      // Return error response for the login form
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear localStorage
      localStorage.removeItem('userData');
      localStorage.removeItem('authToken');
      
      // Reset auth state
      setAuthState({
        user: null,
        loading: false,
        authenticated: false,
        error: null
      });
      
      console.log('✅ Logout successful, localStorage cleared');
    }
  };

  // Check session on mount only once
  useEffect(() => {
    checkSession();
  }, []);

  // Add automatic token refresh with longer interval
  useEffect(() => {
    if (authState.authenticated && authState.user) {
      // Check token expiration every 5 minutes instead of every minute
      const tokenCheckInterval = setInterval(() => {
        checkSession();
      }, 300000); // 5 minutes

      return () => clearInterval(tokenCheckInterval);
    }
  }, [authState.authenticated, authState.user, checkSession]);

  return {
    ...authState,
    login,
    logout,
    checkSession
  }
} 