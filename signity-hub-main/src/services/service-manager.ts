import { useDataStore } from '@/stores/dataStore';
import { ServiceRegistry } from './base.service';
import { syncService } from './sync.service';
import { websocketService } from './websocket.service';
import { leaveService } from './leave.service';
import { projectService } from './project.service';
import { worklogService } from './worklog.service';
import { teamService } from './team.service';
import { profileService } from './profile.service';
import { taskService } from './task.service';
import { notificationService } from './notification.service';

/**
 * SERVICE MANAGER
 * 
 * Centralized service coordination and data management
 * Provides unified interface for all HRMS services with
 * caching, synchronization, and error handling
 */

export interface ServiceManagerConfig {
  enableCaching: boolean;
  enableRealTimeSync: boolean;
  enableOptimisticUpdates: boolean;
  cacheTimeout: number;
  retryAttempts: number;
  batchSize: number;
}

export interface DataRefreshOptions {
  force?: boolean;
  sections?: Array<'leaves' | 'projects' | 'tasks' | 'workLogs' | 'teams' | 'notifications' | 'profile'>;
  priority?: 'low' | 'normal' | 'high';
}

class ServiceManager {
  private config: ServiceManagerConfig = {
    enableCaching: true,
    enableRealTimeSync: true,
    enableOptimisticUpdates: true,
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    retryAttempts: 3,
    batchSize: 10
  };

  private refreshPromises = new Map<string, Promise<any>>();
  private lastRefresh = new Map<string, number>();

  constructor() {
    this.initializeServices();
    this.setupGlobalErrorHandling();
  }

  /**
   * Initialize all services
   */
  private initializeServices(): void {
    // Services are already initialized when imported
    // This method can be used for additional setup if needed
    console.log('Service Manager initialized with services:', {
      leave: !!leaveService,
      project: !!projectService,
      workLog: !!worklogService,
      team: !!teamService,
      profile: !!profileService,
      task: !!taskService,
      notification: !!notificationService,
      sync: !!syncService,
      websocket: !!websocketService
    });
  }

  /**
   * Setup global error handling
   */
  private setupGlobalErrorHandling(): void {
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection in service:', event.reason);
      // Could send to error tracking service
    });
  }

  /**
   * Refresh all user data
   */
  async refreshAllData(options: DataRefreshOptions = {}): Promise<void> {
    const { force = false, sections, priority = 'normal' } = options;
    const store = useDataStore.getState();

    // Determine which sections to refresh
    const sectionsToRefresh = sections || [
      'leaves', 'projects', 'tasks', 'workLogs', 'teams', 'notifications', 'profile'
    ];

    // Check if we need to refresh based on cache validity
    const refreshNeeded = sectionsToRefresh.filter(section => {
      if (force) return true;
      const lastFetch = store.lastFetch[section as keyof typeof store.lastFetch];
      if (!lastFetch) return true;
      return (Date.now() - lastFetch) > this.config.cacheTimeout;
    });

    if (refreshNeeded.length === 0) {
      console.log('All data is fresh, skipping refresh');
      return;
    }

    console.log(`Refreshing data sections: ${refreshNeeded.join(', ')}`);

    // Create refresh operations
    const refreshOperations = refreshNeeded.map(section => ({
      section,
      operation: this.createRefreshOperation(section)
    }));

    // Execute based on priority
    if (priority === 'high') {
      // Execute all in parallel for high priority
      await Promise.allSettled(refreshOperations.map(op => op.operation()));
    } else {
      // Execute in batches for normal/low priority
      const batchSize = priority === 'low' ? 2 : this.config.batchSize;
      for (let i = 0; i < refreshOperations.length; i += batchSize) {
        const batch = refreshOperations.slice(i, i + batchSize);
        await Promise.allSettled(batch.map(op => op.operation()));
      }
    }

    console.log('Data refresh completed');
  }

  /**
   * Create refresh operation for a specific section
   */
  private createRefreshOperation(section: string): () => Promise<any> {
    const operations: Record<string, () => Promise<any>> = {
      leaves: () => Promise.all([
        leaveService.getLeaveBalance(),
        leaveService.getLeaveHistory({ limit: 20 }),
        leaveService.getLeaveStatus()
      ]),
      projects: () => Promise.all([
        projectService.getMyProjects(),
        projectService.getProjectDashboard()
      ]),
      tasks: () => taskService.getMyTasks(),
      workLogs: () => worklogService.getWorkLogs({ limit: 20 }),
      teams: () => teamService.getMyTeams(),
      notifications: () => notificationService.getNotifications({ limit: 50 }),
      profile: () => profileService.getProfile()
    };

    return operations[section] || (() => Promise.resolve());
  }

  /**
   * Prefetch data for better user experience
   */
  async prefetchData(userRole: string): Promise<void> {
    console.log(`Prefetching data for role: ${userRole}`);

    const commonData = [
      leaveService.prefetchLeaveData(),
      projectService.prefetchProjectData(),
      profileService.getProfile()
    ];

    // Role-specific prefetching
    const roleSpecificData: Promise<any>[] = [];
    
    if (['MANAGER', 'HR', 'ADMIN'].includes(userRole)) {
      roleSpecificData.push(
        leaveService.getTeamLeaveRequests(),
        teamService.getTeams({ limit: 10 })
      );
    }

    if (['HR', 'ADMIN'].includes(userRole)) {
      roleSpecificData.push(
        // Add HR-specific prefetch operations
      );
    }

    try {
      await Promise.allSettled([...commonData, ...roleSpecificData]);
      console.log('Data prefetching completed');
    } catch (error) {
      console.warn('Some data prefetching failed:', error);
    }
  }

  /**
   * Get service health status
   */
  getServiceHealth(): {
    overall: 'healthy' | 'degraded' | 'unhealthy';
    services: Record<string, {
      status: 'healthy' | 'error';
      lastActivity: number | null;
      cacheSize: number;
    }>;
    sync: {
      isOnline: boolean;
      isConnected: boolean;
      queueSize: number;
    };
    websocket: {
      isConnected: boolean;
      isConnecting: boolean;
      isOnline: boolean;
      queuedMessages: number;
      reconnectAttempts: number;
    };
  } {
    const cacheStats = ServiceRegistry.getCacheStats();
    const syncStatus = syncService.getSyncStatus();
    const wsStatus = websocketService.getConnectionStatus();

    const services = Object.keys(cacheStats).reduce((acc, serviceName) => {
      acc[serviceName] = {
        status: 'healthy' as const, // Would check for actual errors in real implementation
        lastActivity: Date.now(), // Would track actual last activity
        cacheSize: cacheStats[serviceName].size
      };
      return acc;
    }, {} as Record<string, any>);

    const healthyServices = Object.values(services).filter(s => s.status === 'healthy').length;
    const totalServices = Object.keys(services).length;
    
    let overall: 'healthy' | 'degraded' | 'unhealthy';
    if (healthyServices === totalServices && wsStatus.isConnected) {
      overall = 'healthy';
    } else if (healthyServices > totalServices / 2) {
      overall = 'degraded';
    } else {
      overall = 'unhealthy';
    }

    return {
      overall,
      services,
      sync: {
        isOnline: syncStatus.isOnline,
        isConnected: syncStatus.isConnected,
        queueSize: syncStatus.queueSize
      },
      websocket: {
        isConnected: wsStatus.isConnected,
        isConnecting: wsStatus.isConnecting,
        isOnline: wsStatus.isOnline,
        queuedMessages: wsStatus.queuedMessages,
        reconnectAttempts: wsStatus.reconnectAttempts
      }
    };
  }

  /**
   * Clear all caches
   */
  clearAllCaches(): void {
    ServiceRegistry.invalidateAllCaches();
    console.log('All service caches cleared');
  }

  /**
   * Export user data
   */
  async exportUserData(format: 'json' | 'csv' = 'json'): Promise<Blob> {
    const store = useDataStore.getState();
    
    const userData = {
      leaves: store.leaves,
      leaveBalance: store.leaveBalance,
      workLogs: store.workLogs,
      projects: store.myProjects,
      tasks: store.myTasks,
      teams: store.myTeams,
      notifications: store.notifications,
      exportedAt: new Date().toISOString()
    };

    if (format === 'json') {
      return new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    } else {
      // Convert to CSV format (simplified)
      const csv = this.convertToCSV(userData);
      return new Blob([csv], { type: 'text/csv' });
    }
  }

  /**
   * Convert data to CSV format
   */
  private convertToCSV(data: any): string {
    // Simplified CSV conversion - would need more sophisticated logic for real use
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).map(value => 
      Array.isArray(value) ? value.length : typeof value === 'object' ? JSON.stringify(value) : value
    ).join(',');
    
    return `${headers}\n${values}`;
  }

  /**
   * Get data statistics
   */
  getDataStatistics(): {
    totalRecords: number;
    recordsByType: Record<string, number>;
    cacheHitRate: number;
    lastRefresh: Record<string, number>;
    dataFreshness: Record<string, 'fresh' | 'stale' | 'expired'>;
  } {
    const store = useDataStore.getState();
    
    const recordsByType = {
      leaves: store.leaves.length,
      projects: store.myProjects.length,
      tasks: store.myTasks.length,
      workLogs: store.workLogs.length,
      teams: store.myTeams.length,
      notifications: store.notifications.length
    };

    const totalRecords = Object.values(recordsByType).reduce((sum, count) => sum + count, 0);

    // Calculate data freshness
    const now = Date.now();
    const dataFreshness = Object.keys(recordsByType).reduce((acc, key) => {
      const lastFetch = store.lastFetch[key as keyof typeof store.lastFetch];
      if (!lastFetch) {
        acc[key] = 'expired';
      } else {
        const age = now - lastFetch;
        if (age < 2 * 60 * 1000) { // 2 minutes
          acc[key] = 'fresh';
        } else if (age < this.config.cacheTimeout) {
          acc[key] = 'stale';
        } else {
          acc[key] = 'expired';
        }
      }
      return acc;
    }, {} as Record<string, 'fresh' | 'stale' | 'expired'>);

    return {
      totalRecords,
      recordsByType,
      cacheHitRate: 0.85, // Would calculate actual hit rate
      lastRefresh: store.lastFetch,
      dataFreshness
    };
  }

  /**
   * Update service configuration
   */
  updateConfig(newConfig: Partial<ServiceManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Update sync service configuration
    if ('enableRealTimeSync' in newConfig) {
      syncService.updateConfig({ enableRealTime: newConfig.enableRealTimeSync });
    }
    
    console.log('Service Manager configuration updated:', this.config);
  }

  /**
   * Get current configuration
   */
  getConfig(): ServiceManagerConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    syncService.destroy();
    websocketService.destroy();
    this.refreshPromises.clear();
    this.lastRefresh.clear();
    console.log('Service Manager destroyed');
  }
}

// Create singleton instance
export const serviceManager = new ServiceManager();

// Export individual services for direct access if needed
export {
  leaveService,
  projectService,
  worklogService,
  teamService,
  profileService,
  taskService,
  notificationService,
  syncService,
  websocketService
};