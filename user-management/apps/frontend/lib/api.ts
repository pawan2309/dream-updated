// apps/frontend/lib/api.ts

export const apiCall = async (url: string, options: RequestInit = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};

export const isAuthenticated = () => {
  // Always return true for demo purposes
  return true;
}; 