import { useNavigate, useLocation } from 'react-router-dom';
import { useCallback, useEffect } from 'react';
import { routeGuardService } from '@/services/route-guard.service';
import { useAuthStore } from '@/stores/authStore';

/**
 * NAVIGATION HOOK
 * 
 * Provides enhanced navigation functionality with route protection,
 * deep linking, and navigation history management
 */

export const useNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();

  useEffect(() => {
    // Add current route to history
    routeGuardService.addToHistory(location.pathname);
  }, [location.pathname]);

  /**
   * Navigate to a route with access checking
   */
  const navigateTo = useCallback((
    path: string, 
    options?: {
      replace?: boolean;
      state?: any;
      checkAccess?: boolean;
    }
  ) => {
    const { replace = false, state, checkAccess = true } = options || {};

    if (checkAccess && user) {
      const accessResult = routeGuardService.canAccessRoute(path, user);
      
      if (!accessResult.allowed) {
        console.warn(`Access denied to ${path}: ${accessResult.reason}`);
        
        if (accessResult.redirectTo) {
          navigate(accessResult.redirectTo, { replace });
          return;
        }
        
        if (accessResult.requiresAuth) {
          navigate('/auth/login', { 
            state: { returnUrl: path },
            replace 
          });
          return;
        }
        
        // Navigate to user's default dashboard if access is denied
        const defaultRoute = routeGuardService.getDefaultRouteForRole(user.role);
        navigate(defaultRoute, { replace });
        return;
      }
    }

    navigate(path, { replace, state });
  }, [navigate, user]);

  /**
   * Navigate back to previous route
   */
  const goBack = useCallback(() => {
    const previousRoute = routeGuardService.getPreviousRoute();
    if (previousRoute) {
      navigate(previousRoute);
    } else {
      // Fallback to user's default dashboard
      const defaultRoute = user 
        ? routeGuardService.getDefaultRouteForRole(user.role) 
        : '/dashboard';
      navigate(defaultRoute);
    }
  }, [navigate, user]);

  /**
   * Navigate to user's default dashboard
   */
  const goToDashboard = useCallback(() => {
    const defaultRoute = user 
      ? routeGuardService.getDefaultRouteForRole(user.role) 
      : '/dashboard';
    navigate(defaultRoute);
  }, [navigate, user]);

  /**
   * Generate deep link with current state
   */
  const generateDeepLink = useCallback((path: string, params?: Record<string, any>) => {
    return routeGuardService.generateDeepLink(path, { params });
  }, []);

  /**
   * Check if user can access a route
   */
  const canAccess = useCallback((path: string) => {
    if (!user) return false;
    return routeGuardService.canAccessRoute(path, user).allowed;
  }, [user]);

  /**
   * Get navigation breadcrumbs
   */
  const getBreadcrumbs = useCallback(() => {
    return routeGuardService.generateBreadcrumbs(location.pathname);
  }, [location.pathname]);

  /**
   * Get navigation history
   */
  const getHistory = useCallback(() => {
    return routeGuardService.getHistory();
  }, []);

  /**
   * Clear navigation history
   */
  const clearHistory = useCallback(() => {
    routeGuardService.clearHistory();
  }, []);

  /**
   * Navigate with return URL support
   */
  const navigateWithReturn = useCallback((
    path: string, 
    returnUrl?: string,
    options?: { replace?: boolean; state?: any }
  ) => {
    const { replace = false, state } = options || {};
    const finalReturnUrl = returnUrl || location.pathname + location.search;
    
    const deepLink = routeGuardService.generateDeepLink(path, {
      returnUrl: finalReturnUrl
    });
    
    navigate(deepLink, { replace, state });
  }, [navigate, location]);

  /**
   * Return to the URL specified in query params
   */
  const returnToUrl = useCallback(() => {
    const state = routeGuardService.parseDeepLinkState(location.search);
    
    if (state.returnUrl) {
      navigate(state.returnUrl);
    } else {
      goToDashboard();
    }
  }, [location.search, navigate, goToDashboard]);

  /**
   * Navigate to role-specific route
   */
  const navigateToRoleRoute = useCallback((
    basePath: string,
    fallbackPath?: string
  ) => {
    if (!user) {
      navigate('/auth/login');
      return;
    }

    const roleRoutes: Record<string, string> = {
      'ADMIN': `/admin${basePath}`,
      'HR': `/hr${basePath}`,
      'MANAGER': `/manager${basePath}`,
      'EMPLOYEE': `/employee${basePath}`
    };

    const targetRoute = roleRoutes[user.role];
    
    if (targetRoute && canAccess(targetRoute)) {
      navigate(targetRoute);
    } else if (fallbackPath && canAccess(fallbackPath)) {
      navigate(fallbackPath);
    } else {
      goToDashboard();
    }
  }, [user, navigate, canAccess, goToDashboard]);

  return {
    // Navigation functions
    navigateTo,
    goBack,
    goToDashboard,
    navigateWithReturn,
    returnToUrl,
    navigateToRoleRoute,
    
    // Utility functions
    generateDeepLink,
    canAccess,
    getBreadcrumbs,
    getHistory,
    clearHistory,
    
    // Current location info
    currentPath: location.pathname,
    currentSearch: location.search,
    currentState: location.state,
    
    // Route info
    isPublicRoute: !routeGuardService.canAccessRoute(location.pathname, user).requiresAuth,
    supportsDeepLinking: routeGuardService.supportsDeepLinking(location.pathname)
  };
};

/**
 * ROUTE PARAMS HOOK
 * 
 * Hook for managing URL parameters and query strings
 */

export const useRouteParams = () => {
  const location = useLocation();

  /**
   * Get query parameter value
   */
  const getQueryParam = useCallback((key: string): string | null => {
    const params = new URLSearchParams(location.search);
    return params.get(key);
  }, [location.search]);

  /**
   * Get all query parameters
   */
  const getAllQueryParams = useCallback((): Record<string, string> => {
    const params = new URLSearchParams(location.search);
    const result: Record<string, string> = {};
    
    params.forEach((value, key) => {
      result[key] = value;
    });
    
    return result;
  }, [location.search]);

  /**
   * Update query parameters
   */
  const updateQueryParams = useCallback((
    updates: Record<string, string | null>,
    options?: { replace?: boolean }
  ) => {
    const navigate = useNavigate();
    const params = new URLSearchParams(location.search);
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });
    
    const newSearch = params.toString();
    const newUrl = location.pathname + (newSearch ? `?${newSearch}` : '');
    
    navigate(newUrl, { replace: options?.replace });
  }, [location]);

  return {
    getQueryParam,
    getAllQueryParams,
    updateQueryParams,
    hasQueryParams: location.search.length > 0
  };
};

export default useNavigation;