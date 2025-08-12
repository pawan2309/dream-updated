import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { canAccessFeature, canAccessRole, getAccessibleRoles } from '../hierarchyUtils';

interface RoleAccessData {
  user: {
    id: string;
    username: string;
    name: string;
    role: string;
  } | null;
  access: {
    accessibleRoles: string[];
    navigation: Record<string, any[]>;
    featureAccess: Record<string, boolean>;
    accessibleUsersByRole: Record<string, any[]>;
  } | null;
  loading: boolean;
  error: string | null;
}

export function useRoleAccess() {
  const [data, setData] = useState<RoleAccessData>({
    user: null,
    access: null,
    loading: true,
    error: null
  });
  const router = useRouter();

  useEffect(() => {
    const fetchRoleAccess = async () => {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }));
        
        const response = await fetch('/api/auth/role-access');
        const result = await response.json();
        
        if (result.success) {
          setData({
            user: result.user,
            access: result.access,
            loading: false,
            error: null
          });
        } else {
          setData({
            user: null,
            access: null,
            loading: false,
            error: result.message || 'Failed to fetch role access data'
          });
          
          // Redirect to login if session is invalid
          if (response.status === 401) {
            router.push('/login');
          }
        }
      } catch (error) {
        console.error('Error fetching role access:', error);
        setData({
          user: null,
          access: null,
          loading: false,
          error: 'Failed to fetch role access data'
        });
      }
    };

    fetchRoleAccess();
  }, [router]);

  // Helper functions
  const canAccess = (feature: string): boolean => {
    if (!data.user) return false;
    return canAccessFeature(data.user.role, feature);
  };

  const canManageRole = (targetRole: string): boolean => {
    if (!data.user) return false;
    return canAccessRole(data.user.role, targetRole);
  };

  const getAccessibleRolesForUser = (): string[] => {
    if (!data.user) return [];
    return getAccessibleRoles(data.user.role);
  };

  const hasRoleAccess = (requiredRole: string): boolean => {
    if (!data.user) return false;
    return data.user.role === requiredRole || canManageRole(requiredRole);
  };

  const canAccessRoute = (route: string): boolean => {
    if (!data.user) return false;
    
    // Check if the route is in the user's navigation
    if (data.access?.navigation) {
      for (const section of Object.values(data.access.navigation)) {
        const hasRoute = (section as any[]).some((link: any) => link.href === route);
        if (hasRoute) return true;
      }
    }
    
    return false;
  };

  const refreshAccess = async () => {
    setData(prev => ({ ...prev, loading: true }));
    try {
      const response = await fetch('/api/auth/role-access');
      const result = await response.json();
      
      if (result.success) {
        setData({
          user: result.user,
          access: result.access,
          loading: false,
          error: null
        });
      } else {
        setData(prev => ({
          ...prev,
          loading: false,
          error: result.message || 'Failed to refresh role access data'
        }));
      }
    } catch (error) {
      setData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to refresh role access data'
      }));
    }
  };

  return {
    ...data,
    canAccess,
    canManageRole,
    getAccessibleRolesForUser,
    hasRoleAccess,
    canAccessRoute,
    refreshAccess
  };
}

// Hook for checking if user can access a specific feature
export function useFeatureAccess(feature: string) {
  const { user, canAccess } = useRoleAccess();
  return {
    hasAccess: canAccess(feature),
    user,
    loading: !user
  };
}

// Hook for checking if user can manage a specific role
export function useRoleManagement(targetRole: string) {
  const { user, canManageRole } = useRoleAccess();
  return {
    canManage: canManageRole(targetRole),
    user,
    loading: !user
  };
}

// Hook for route protection
export function useRouteProtection(requiredFeature?: string, requiredRole?: string) {
  const { user, canAccess, hasRoleAccess, loading } = useRoleAccess();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      // Check feature access
      if (requiredFeature && !canAccess(requiredFeature)) {
        router.push('/unauthorized');
        return;
      }

      // Check role access
      if (requiredRole && !hasRoleAccess(requiredRole)) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [user, loading, requiredFeature, requiredRole, canAccess, hasRoleAccess, router]);

  return {
    user,
    loading,
    hasAccess: !loading && user && 
      (!requiredFeature || canAccess(requiredFeature)) && 
      (!requiredRole || hasRoleAccess(requiredRole))
  };
} 