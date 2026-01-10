import { useAuthStore } from '@/stores/authStore';

/**
 * ROUTE GUARD SERVICE
 * 
 * Advanced route protection with permission checking, deep linking support,
 * and navigation history management
 */

export type UserRole = 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE';

export interface Permission {
  resource: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'MANAGE';
  scope?: 'OWN' | 'TEAM' | 'DEPARTMENT' | 'ALL';
}

export interface RouteConfig {
  path: string;
  requiredRole?: UserRole;
  requiredPermissions?: Permission[];
  allowedRoles?: UserRole[];
  redirectTo?: string;
  isPublic?: boolean;
  requiresAuth?: boolean;
}

export interface NavigationState {
  from?: string;
  returnUrl?: string;
  params?: Record<string, any>;
  timestamp?: number;
}

class RouteGuardService {
  private routeConfigs: Map<string, RouteConfig> = new Map();
  private navigationHistory: string[] = [];
  private maxHistorySize = 50;

  constructor() {
    this.initializeRouteConfigs();
  }

  /**
   * Initialize route configurations
   */
  private initializeRouteConfigs(): void {
    const configs: RouteConfig[] = [
      // Public routes
      { path: '/', isPublic: true },
      { path: '/auth/login', isPublic: true },
      { path: '/auth/register', isPublic: true },
      { path: '/auth/accept-invitation', isPublic: true },
      { path: '/auth/forgot-password', isPublic: true },
      { path: '/auth/reset-password', isPublic: true },

      // Dashboard routes
      { path: '/dashboard', requiresAuth: true },
      { path: '/admin/dashboard', requiredRole: 'ADMIN' },
      { path: '/hr/dashboard', requiredRole: 'HR' },
      { path: '/manager/dashboard', requiredRole: 'MANAGER' },
      { path: '/employee/dashboard', requiredRole: 'EMPLOYEE' },

      // Admin routes
      { 
        path: '/admin/members', 
        requiredRole: 'ADMIN',
        requiredPermissions: [{ resource: 'users', action: 'MANAGE' }]
      },
      { 
        path: '/admin/invite', 
        requiredRole: 'ADMIN',
        requiredPermissions: [{ resource: 'invitations', action: 'CREATE' }]
      },
      { 
        path: '/admin/teams', 
        requiredRole: 'ADMIN',
        requiredPermissions: [{ resource: 'teams', action: 'MANAGE' }]
      },
      { 
        path: '/admin/projects', 
        requiredRole: 'ADMIN',
        requiredPermissions: [{ resource: 'projects', action: 'MANAGE' }]
      },
      { 
        path: '/admin/reports', 
        requiredRole: 'ADMIN',
        requiredPermissions: [{ resource: 'reports', action: 'READ', scope: 'ALL' }]
      },
      { 
        path: '/admin/settings', 
        requiredRole: 'ADMIN',
        requiredPermissions: [{ resource: 'settings', action: 'MANAGE' }]
      },

      // HR routes
      { 
        path: '/hr/members', 
        requiredRole: 'HR',
        requiredPermissions: [{ resource: 'users', action: 'READ', scope: 'ALL' }]
      },
      { 
        path: '/hr/invite', 
        requiredRole: 'HR',
        requiredPermissions: [{ resource: 'invitations', action: 'CREATE' }]
      },
      { 
        path: '/hr/teams', 
        requiredRole: 'HR',
        requiredPermissions: [{ resource: 'teams', action: 'READ', scope: 'ALL' }]
      },
      { 
        path: '/hr/projects', 
        requiredRole: 'HR',
        requiredPermissions: [{ resource: 'projects', action: 'READ', scope: 'ALL' }]
      },
      { 
        path: '/hr/leave-types', 
        requiredRole: 'HR',
        requiredPermissions: [{ resource: 'leave_types', action: 'MANAGE' }]
      },
      { 
        path: '/hr/reports', 
        requiredRole: 'HR',
        requiredPermissions: [{ resource: 'reports', action: 'READ', scope: 'DEPARTMENT' }]
      },

      // Manager routes
      { 
        path: '/manager/teams', 
        requiredRole: 'MANAGER',
        requiredPermissions: [{ resource: 'teams', action: 'READ', scope: 'TEAM' }]
      },
      { 
        path: '/manager/projects', 
        requiredRole: 'MANAGER',
        requiredPermissions: [{ resource: 'projects', action: 'MANAGE', scope: 'TEAM' }]
      },
      { 
        path: '/manager/leave-approvals', 
        requiredRole: 'MANAGER',
        requiredPermissions: [{ resource: 'leaves', action: 'UPDATE', scope: 'TEAM' }]
      },
      { 
        path: '/manager/worklog-approvals', 
        requiredRole: 'MANAGER',
        requiredPermissions: [{ resource: 'worklogs', action: 'UPDATE', scope: 'TEAM' }]
      },

      // Employee routes
      { 
        path: '/employee/profile', 
        requiredRole: 'EMPLOYEE',
        requiredPermissions: [{ resource: 'profile', action: 'READ', scope: 'OWN' }]
      },
      { 
        path: '/employee/leave', 
        requiredRole: 'EMPLOYEE',
        requiredPermissions: [{ resource: 'leaves', action: 'CREATE', scope: 'OWN' }]
      },
      { 
        path: '/employee/worklog', 
        requiredRole: 'EMPLOYEE',
        requiredPermissions: [{ resource: 'worklogs', action: 'CREATE', scope: 'OWN' }]
      },
      { 
        path: '/employee/tasks', 
        requiredRole: 'EMPLOYEE',
        requiredPermissions: [{ resource: 'tasks', action: 'READ', scope: 'OWN' }]
      },

      // Shared routes (accessible by multiple roles)
      { 
        path: '/profile', 
        allowedRoles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
        requiredPermissions: [{ resource: 'profile', action: 'READ', scope: 'OWN' }]
      },
      { 
        path: '/notifications', 
        allowedRoles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
        requiredPermissions: [{ resource: 'notifications', action: 'READ', scope: 'OWN' }]
      },
      { 
        path: '/calendar', 
        allowedRoles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
        requiredPermissions: [{ resource: 'calendar', action: 'READ' }]
      },

      // Legacy routes (for backward compatibility)
      { path: '/members', requiredRole: 'HR', redirectTo: '/hr/members' },
      { path: '/invite', requiredRole: 'HR', redirectTo: '/hr/invite' },
      { path: '/teams', requiredRole: 'MANAGER', redirectTo: '/manager/teams' },
      { path: '/projects', requiredRole: 'MANAGER', redirectTo: '/manager/projects' },
    ];

    configs.forEach(config => {
      this.routeConfigs.set(config.path, config);
    });
  }

  /**
   * Check if user can access a route
   */
  canAccessRoute(path: string, user?: any): {
    allowed: boolean;
    reason?: string;
    redirectTo?: string;
    requiresAuth?: boolean;
  } {
    const config = this.getRouteConfig(path);
    
    // Public routes are always accessible
    if (config.isPublic) {
      return { allowed: true };
    }

    // Check authentication requirement
    if (config.requiresAuth || config.requiredRole || config.allowedRoles || config.requiredPermissions) {
      if (!user) {
        return { 
          allowed: false, 
          reason: 'Authentication required',
          requiresAuth: true 
        };
      }
    }

    // Check for redirect
    if (config.redirectTo) {
      return { 
        allowed: false, 
        redirectTo: config.redirectTo,
        reason: 'Route redirected'
      };
    }

    // Check role-based access
    if (config.requiredRole) {
      if (!this.hasRequiredRole(user.role, config.requiredRole)) {
        return { 
          allowed: false, 
          reason: `Required role: ${config.requiredRole}, User role: ${user.role}` 
        };
      }
    }

    // Check allowed roles
    if (config.allowedRoles && config.allowedRoles.length > 0) {
      if (!config.allowedRoles.includes(user.role)) {
        return { 
          allowed: false, 
          reason: `User role ${user.role} not in allowed roles: ${config.allowedRoles.join(', ')}` 
        };
      }
    }

    // Check permissions
    if (config.requiredPermissions && config.requiredPermissions.length > 0) {
      const missingPermissions = config.requiredPermissions.filter(
        permission => !this.hasPermission(user, permission)
      );

      if (missingPermissions.length > 0) {
        return { 
          allowed: false, 
          reason: `Missing permissions: ${missingPermissions.map(p => `${p.resource}:${p.action}`).join(', ')}` 
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check if user has required role
   */
  private hasRequiredRole(userRole: UserRole, requiredRole: UserRole): boolean {
    const roleHierarchy: Record<UserRole, number> = {
      'EMPLOYEE': 1,
      'MANAGER': 2,
      'HR': 3,
      'ADMIN': 4
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  }

  /**
   * Check if user has specific permission
   */
  private hasPermission(user: any, permission: Permission): boolean {
    // This would typically check against user permissions from the backend
    // For now, we'll use role-based permission checking
    
    const rolePermissions: Record<UserRole, Permission[]> = {
      'ADMIN': [
        { resource: '*', action: 'MANAGE', scope: 'ALL' }
      ],
      'HR': [
        { resource: 'users', action: 'READ', scope: 'ALL' },
        { resource: 'users', action: 'UPDATE', scope: 'ALL' },
        { resource: 'invitations', action: 'CREATE' },
        { resource: 'teams', action: 'READ', scope: 'ALL' },
        { resource: 'projects', action: 'READ', scope: 'ALL' },
        { resource: 'leaves', action: 'READ', scope: 'ALL' },
        { resource: 'leaves', action: 'UPDATE', scope: 'ALL' },
        { resource: 'leave_types', action: 'MANAGE' },
        { resource: 'reports', action: 'READ', scope: 'DEPARTMENT' },
        { resource: 'profile', action: 'READ', scope: 'OWN' },
        { resource: 'notifications', action: 'READ', scope: 'OWN' },
        { resource: 'calendar', action: 'READ' }
      ],
      'MANAGER': [
        { resource: 'teams', action: 'READ', scope: 'TEAM' },
        { resource: 'teams', action: 'UPDATE', scope: 'TEAM' },
        { resource: 'projects', action: 'MANAGE', scope: 'TEAM' },
        { resource: 'tasks', action: 'MANAGE', scope: 'TEAM' },
        { resource: 'leaves', action: 'UPDATE', scope: 'TEAM' },
        { resource: 'worklogs', action: 'UPDATE', scope: 'TEAM' },
        { resource: 'profile', action: 'READ', scope: 'OWN' },
        { resource: 'notifications', action: 'READ', scope: 'OWN' },
        { resource: 'calendar', action: 'READ' }
      ],
      'EMPLOYEE': [
        { resource: 'profile', action: 'READ', scope: 'OWN' },
        { resource: 'profile', action: 'UPDATE', scope: 'OWN' },
        { resource: 'leaves', action: 'CREATE', scope: 'OWN' },
        { resource: 'leaves', action: 'READ', scope: 'OWN' },
        { resource: 'worklogs', action: 'CREATE', scope: 'OWN' },
        { resource: 'worklogs', action: 'READ', scope: 'OWN' },
        { resource: 'tasks', action: 'READ', scope: 'OWN' },
        { resource: 'tasks', action: 'UPDATE', scope: 'OWN' },
        { resource: 'notifications', action: 'READ', scope: 'OWN' },
        { resource: 'calendar', action: 'READ' }
      ]
    };

    const userPermissions = rolePermissions[user.role] || [];
    
    return userPermissions.some(userPerm => {
      // Check wildcard permissions (ADMIN)
      if (userPerm.resource === '*' && userPerm.action === 'MANAGE') {
        return true;
      }

      // Check exact resource match
      if (userPerm.resource !== permission.resource) {
        return false;
      }

      // Check action hierarchy
      const actionHierarchy: Record<string, number> = {
        'READ': 1,
        'CREATE': 2,
        'UPDATE': 3,
        'DELETE': 4,
        'MANAGE': 5
      };

      const hasActionPermission = actionHierarchy[userPerm.action] >= actionHierarchy[permission.action];
      
      if (!hasActionPermission) {
        return false;
      }

      // Check scope if specified
      if (permission.scope && userPerm.scope) {
        const scopeHierarchy: Record<string, number> = {
          'OWN': 1,
          'TEAM': 2,
          'DEPARTMENT': 3,
          'ALL': 4
        };

        return scopeHierarchy[userPerm.scope] >= scopeHierarchy[permission.scope];
      }

      return true;
    });
  }

  /**
   * Get route configuration
   */
  private getRouteConfig(path: string): RouteConfig {
    // Try exact match first
    let config = this.routeConfigs.get(path);
    if (config) return config;

    // Try pattern matching for dynamic routes
    for (const [configPath, configValue] of this.routeConfigs.entries()) {
      if (this.matchesPattern(path, configPath)) {
        return configValue;
      }
    }

    // Default configuration for unknown routes
    return { path, requiresAuth: true };
  }

  /**
   * Match path against pattern
   */
  private matchesPattern(path: string, pattern: string): boolean {
    // Convert pattern to regex (simple implementation)
    const regexPattern = pattern
      .replace(/:\w+/g, '[^/]+') // Replace :param with regex
      .replace(/\*/g, '.*'); // Replace * with regex

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(path);
  }

  /**
   * Add to navigation history
   */
  addToHistory(path: string): void {
    // Remove duplicate if exists
    const index = this.navigationHistory.indexOf(path);
    if (index > -1) {
      this.navigationHistory.splice(index, 1);
    }

    // Add to beginning
    this.navigationHistory.unshift(path);

    // Limit history size
    if (this.navigationHistory.length > this.maxHistorySize) {
      this.navigationHistory = this.navigationHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get navigation history
   */
  getHistory(): string[] {
    return [...this.navigationHistory];
  }

  /**
   * Get previous route
   */
  getPreviousRoute(): string | null {
    return this.navigationHistory.length > 1 ? this.navigationHistory[1] : null;
  }

  /**
   * Clear navigation history
   */
  clearHistory(): void {
    this.navigationHistory = [];
  }

  /**
   * Generate breadcrumbs for current path
   */
  generateBreadcrumbs(path: string): Array<{ label: string; path: string; isActive: boolean }> {
    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: Array<{ label: string; path: string; isActive: boolean }> = [];

    let currentPath = '';
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isActive = index === segments.length - 1;
      
      breadcrumbs.push({
        label: this.formatSegmentLabel(segment),
        path: currentPath,
        isActive
      });
    });

    return breadcrumbs;
  }

  /**
   * Format segment label for breadcrumbs
   */
  private formatSegmentLabel(segment: string): string {
    // Handle special cases
    const labelMap: Record<string, string> = {
      'admin': 'Admin',
      'hr': 'HR',
      'manager': 'Manager',
      'employee': 'Employee',
      'dashboard': 'Dashboard',
      'members': 'Members',
      'invite': 'Invite Members',
      'teams': 'Teams',
      'projects': 'Projects',
      'leave': 'Leave Management',
      'worklog': 'Work Logs',
      'reports': 'Reports',
      'settings': 'Settings',
      'profile': 'Profile',
      'notifications': 'Notifications',
      'calendar': 'Calendar'
    };

    return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  /**
   * Get default route for user role
   */
  getDefaultRouteForRole(role: UserRole): string {
    const defaultRoutes: Record<UserRole, string> = {
      'ADMIN': '/admin/dashboard',
      'HR': '/hr/dashboard',
      'MANAGER': '/manager/dashboard',
      'EMPLOYEE': '/employee/dashboard'
    };

    return defaultRoutes[role] || '/dashboard';
  }

  /**
   * Check if route supports deep linking
   */
  supportsDeepLinking(path: string): boolean {
    const config = this.getRouteConfig(path);
    return !config.isPublic; // All protected routes support deep linking
  }

  /**
   * Generate deep link with state
   */
  generateDeepLink(path: string, state?: NavigationState): string {
    if (!this.supportsDeepLinking(path)) {
      return path;
    }

    const url = new URL(path, window.location.origin);
    
    if (state) {
      if (state.returnUrl) {
        url.searchParams.set('returnUrl', state.returnUrl);
      }
      if (state.params) {
        Object.entries(state.params).forEach(([key, value]) => {
          url.searchParams.set(key, String(value));
        });
      }
    }

    return url.pathname + url.search;
  }

  /**
   * Parse deep link state
   */
  parseDeepLinkState(search: string): NavigationState {
    const params = new URLSearchParams(search);
    const state: NavigationState = {};

    const returnUrl = params.get('returnUrl');
    if (returnUrl) {
      state.returnUrl = returnUrl;
    }

    // Parse other parameters
    const otherParams: Record<string, any> = {};
    params.forEach((value, key) => {
      if (key !== 'returnUrl') {
        otherParams[key] = value;
      }
    });

    if (Object.keys(otherParams).length > 0) {
      state.params = otherParams;
    }

    return state;
  }
}

export const routeGuardService = new RouteGuardService();