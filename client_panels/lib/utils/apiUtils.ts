// Utility function to handle API calls with automatic token expiration handling
export const apiCall = async (
  url: string, 
  options: RequestInit = {},
  onTokenExpired?: () => void
) => {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include', // Always include cookies
    });

    // Check if response indicates token expiration
    if (response.status === 401) {
      try {
        const errorData = await response.json();
        if (errorData.code === 'TOKEN_EXPIRED') {
          console.log('🔄 API call failed due to expired token');
          if (onTokenExpired) {
            onTokenExpired();
          } else {
            // Default behavior: redirect to login
            window.location.href = '/login';
          }
          return null;
        }
      } catch (e) {
        // Could not parse error response
      }
    }

    return response;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
};

// Utility function to check if user should be redirected to login
export const checkAuthAndRedirect = (response: Response) => {
  if (response.status === 401) {
    try {
      response.json().then(errorData => {
        if (errorData.code === 'TOKEN_EXPIRED') {
          console.log('🔄 Token expired, redirecting to login');
          window.location.href = '/login';
        }
      });
    } catch (e) {
      // If we can't parse the response, redirect anyway
      window.location.href = '/login';
    }
  }
};
