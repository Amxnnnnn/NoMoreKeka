import { api, getErrorMessage } from '@/lib/api';

/**
 * SECURE DASHBOARD SERVICE
 * 
 * This service handles role-based dashboard API calls with proper error handling
 * and security considerations.
 */

export interface DashboardStats {
  totalUsers: number;
  adminCount: number;
  hrCount: number;
  employeeCount: number;
  recentUsers: number;
  growthPercentage: number;
  isGrowthPositive: boolean;
}

export interface RecentActivity {
  id: string;
  name: string;
  email: string;
  role: string;
  joinedAt: string;
  timeAgo: string;
}

export interface CompanyOverview {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CurrentUserInfo {
  id: string;
  name: string;
  email: string;
  role: string;
  isEmailVerified: boolean;
  joinedAt: string;
}

export interface ManagerStats {
  teamMembers: number;
  activeProjects: number;
  completedTasks: number;
  pendingTasks: number;
  totalTasks: number;
}

export interface EmployeeStats {
  assignedTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  pendingTasks: number;
  projectsInvolved: number;
  estimatedHours: number;
  actualHours: number;
}

// Get dashboard statistics (HR+ Access Required)
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return {
      success: true,
      stats: response.data.stats as DashboardStats,
      recentActivity: response.data.recentActivity as RecentActivity[],
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to fetch dashboard stats';
    
    // Handle specific authorization errors
    if (error.response?.status === 403) {
      throw new Error('Access denied: Insufficient permissions to view dashboard statistics');
    }
    
    throw new Error(message);
  }
};

// Get company overview (Admin Access Required)
export const getCompanyOverview = async () => {
  try {
    const response = await api.get('/dashboard/overview');
    return {
      success: true,
      company: response.data.company as CompanyOverview,
      currentUser: response.data.currentUser as CurrentUserInfo,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to fetch company overview';
    
    // Handle specific authorization errors
    if (error.response?.status === 403) {
      throw new Error('Access denied: Admin access required to view company overview');
    }
    
    throw new Error(message);
  }
};

// Manager-specific dashboard data (Manager+ Access Required)
export const getManagerDashboard = async () => {
  try {
    const response = await api.get('/dashboard/manager');
    return {
      success: true,
      stats: response.data.stats as ManagerStats,
      teams: response.data.teams,
      projects: response.data.projects,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to fetch manager dashboard';
    
    // Handle specific authorization errors
    if (error.response?.status === 403) {
      throw new Error('Access denied: Manager access required to view manager dashboard');
    }
    
    throw new Error(message);
  }
};

// Employee-specific dashboard data (All authenticated users)
export const getEmployeeDashboard = async () => {
  try {
    const response = await api.get('/dashboard/employee');
    return {
      success: true,
      stats: response.data.stats as EmployeeStats,
      recentTasks: response.data.recentTasks,
      projects: response.data.projects,
      message: response.data.message
    };
  } catch (error: any) {
    const errorCode = error.response?.data?.errorCode;
    const message = errorCode ? getErrorMessage(errorCode) : error.response?.data?.message || 'Failed to fetch employee dashboard';
    throw new Error(message);
  }
};