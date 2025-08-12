import { useState, useEffect } from 'react';

interface User {
  id: string;
  username: string;
  role: 'ADMIN' | 'USER' | 'OWNER' | 'admin' | 'user' | 'owner';
  email?: string;
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for user session
    const checkUser = async () => {
      try {
        console.log('🔍 Checking user session...');
        const response = await fetch('/api/auth/session');
        console.log('🔍 Session response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('🔍 Session data:', data);
          if (data.user) {
            console.log('✅ User found:', data.user);
            setUser(data.user);
          } else {
            console.log('❌ No user in session data');
          }
        } else {
          console.log('❌ Session response not ok:', response.status);
          const errorData = await response.json().catch(() => ({}));
          console.log('❌ Session error:', errorData);
        }
      } catch (error) {
        console.error('❌ Error checking user session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'OWNER' || user?.role === 'admin' || user?.role === 'owner';
  const isOwner = user?.role === 'OWNER' || user?.role === 'owner';

  return {
    user,
    loading,
    isAdmin,
    isOwner
  };
} 