import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { getCurrentUser } from '@/services/auth.service';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user, token, setUser, logout, isLoading, setLoading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      // If we have a token but no user, try to fetch user data
      if (token && !user && !isLoading) {
        setLoading(true);
        try {
          const result = await getCurrentUser();
          setUser(result.user);
        } catch (error) {
          console.error('Failed to verify authentication:', error);
          logout();
        } finally {
          setLoading(false);
        }
      }
    };

    verifyAuth();
  }, [token, user, isLoading, setUser, logout, setLoading]);

  // Show loading spinner while verifying authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRole) {
    const hasRequiredRole = () => {
      switch (requiredRole) {
        case 'ADMIN':
          return user.role === 'ADMIN';
        case 'HR':
          return user.role === 'ADMIN' || user.role === 'HR';
        case 'MANAGER':
          return user.role === 'ADMIN' || user.role === 'HR' || user.role === 'MANAGER';
        case 'EMPLOYEE':
          return true; // All authenticated users can access employee-level routes
        default:
          return false;
      }
    };

    if (!hasRequiredRole()) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-4">
              You don't have permission to access this page.
            </p>
            <p className="text-sm text-muted-foreground">
              Required role: {requiredRole} | Your role: {user.role}
            </p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};