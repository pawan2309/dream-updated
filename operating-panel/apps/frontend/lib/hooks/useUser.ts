import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  name?: string;
  role: 'OWNER' | 'SUB_OWNER' | 'SUPER_ADMIN' | 'ADMIN' | 'SUB' | 'MASTER' | 'SUPER_AGENT' | 'AGENT' | 'USER';
  code?: string;
  balance: number;
  creditLimit: number;
  exposure: number;
  isActive: boolean;
  casinoStatus?: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UseUserReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  logout: () => void;
  isAdmin: boolean;
  isOwner: boolean;
  isSuperAdmin: boolean;
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate role-based permissions
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const isOwner = user?.role === 'OWNER';
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session');
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      setError('Failed to check session');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    // Clear any stored session data
    document.cookie = 'sessionToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/login';
  };

  return { user, loading, error, logout, isAdmin, isOwner, isSuperAdmin };
} 