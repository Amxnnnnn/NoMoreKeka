import { useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useDataStore } from '@/stores/dataStore';
import { serviceManager, DataRefreshOptions } from '@/services/service-manager';

/**
 * SERVICES HOOK
 * 
 * React hook for interacting with the service layer
 * Provides easy access to data operations, caching, and synchronization
 */

export interface UseServicesOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  prefetchOnMount?: boolean;
}

export interface ServiceOperationState {
  loading: boolean;
  error: string | null;
  lastRefresh: number | null;
}

export const useServices = (options: UseServicesOptions = {}) => {
  const {
    autoRefresh = true,
    refreshInterval = 5 * 60 * 1000, // 5 minutes
    prefetchOnMount = true
  } = options;

  const { user } = useAuthStore();
  const dataStore = useDataStore();
  
  const [operationState, setOperationState] = useState<ServiceOperationState>({
    loading: false,
    error: null,
    lastRefresh: null
  });

  const [serviceHealth, setServiceHealth] = useState(serviceManager.getServiceHealth());

  /**
   * Refresh data with loading state management
   */
  const refreshData = useCallback(async (options: DataRefreshOptions = {}) => {
    setOperationState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await serviceManager.refreshAllData(options);
      setOperationState(prev => ({
        ...prev,
        loading: false,
        lastRefresh: Date.now()
      }));
    } catch (error: any) {
      setOperationState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Failed to refresh data'
      }));
    }
  }, []);

  /**
   * Force refresh all data
   */
  const forceRefresh = useCallback(() => {
    return refreshData({ force: true, priority: 'high' });
  }, [refreshData]);

  /**
   * Refresh specific sections
   */
  const refreshSections = useCallback((sections: DataRefreshOptions['sections']) => {
    return refreshData({ sections, priority: 'normal' });
  }, [refreshData]);

  /**
   * Clear all caches
   */
  const clearCaches = useCallback(() => {
    serviceManager.clearAllCaches();
    // Reset store data
    dataStore.reset();
  }, [dataStore]);

  /**
   * Get data statistics
   */
  const getDataStats = useCallback(() => {
    return serviceManager.getDataStatistics();
  }, []);

  /**
   * Export user data
   */
  const exportData = useCallback(async (format: 'json' | 'csv' = 'json') => {
    try {
      const blob = await serviceManager.exportUserData(format);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hrms-data-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      setOperationState(prev => ({
        ...prev,
        error: error.message || 'Failed to export data'
      }));
    }
  }, []);

  /**
   * Check if data needs refresh
   */
  const needsRefresh = useCallback((section?: keyof typeof dataStore.lastFetch) => {
    if (section) {
      const lastFetch = dataStore.lastFetch[section];
      if (!lastFetch) return true;
      return (Date.now() - lastFetch) > (5 * 60 * 1000); // 5 minutes
    }
    
    // Check if any section needs refresh
    const sections: Array<keyof typeof dataStore.lastFetch> = [
      'leaveBalance', 'leaves', 'workLogs', 'teams', 'projects', 'tasks', 'notifications'
    ];
    
    return sections.some(s => {
      const lastFetch = dataStore.lastFetch[s];
      if (!lastFetch) return true;
      return (Date.now() - lastFetch) > (5 * 60 * 1000);
    });
  }, [dataStore]);

  /**
   * Get loading state for specific sections
   */
  const isLoading = useCallback((section?: keyof typeof dataStore.loading) => {
    if (section) {
      return dataStore.loading[section];
    }
    
    // Check if any section is loading
    return Object.values(dataStore.loading).some(loading => loading);
  }, [dataStore.loading]);

  /**
   * Get error state for specific sections
   */
  const getError = useCallback((section?: keyof typeof dataStore.errors) => {
    if (section) {
      return dataStore.errors[section];
    }
    
    // Return first error found
    const errors = Object.values(dataStore.errors).filter(Boolean);
    return errors[0] || null;
  }, [dataStore.errors]);

  /**
   * Clear error for specific section
   */
  const clearError = useCallback((section?: keyof typeof dataStore.errors) => {
    if (section) {
      dataStore.clearError(section);
    } else {
      dataStore.clearAllErrors();
    }
  }, [dataStore]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh || !user) return;

    const interval = setInterval(() => {
      // Check if any section needs refresh
      const sections: Array<keyof typeof dataStore.lastFetch> = [
        'leaveBalance', 'leaves', 'workLogs', 'teams', 'projects', 'tasks', 'notifications'
      ];
      
      const needsRefreshCheck = sections.some(s => {
        const lastFetch = dataStore.lastFetch[s];
        if (!lastFetch) return true;
        return (Date.now() - lastFetch) > (5 * 60 * 1000);
      });
      
      if (needsRefreshCheck) {
        refreshData({ priority: 'low' });
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, user, needsRefresh, refreshData]);

  // Prefetch data on mount
  useEffect(() => {
    if (prefetchOnMount && user) {
      serviceManager.prefetchData(user.role);
    }
  }, [prefetchOnMount, user]);

  // Update service health periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setServiceHealth(serviceManager.getServiceHealth());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup is handled by service manager
    };
  }, []);

  return {
    // Data operations
    refreshData,
    forceRefresh,
    refreshSections,
    clearCaches,
    exportData,
    
    // State queries
    needsRefresh,
    isLoading,
    getError,
    clearError,
    getDataStats,
    
    // Operation state
    operationState,
    serviceHealth,
    
    // Direct store access (for convenience)
    store: dataStore,
    
    // Service manager access (for advanced usage)
    serviceManager
  };
};

/**
 * Hook for specific service operations
 */
export const useServiceOperation = <T>(
  operation: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [state, setState] = useState<{
    data: T | null;
    loading: boolean;
    error: string | null;
  }>({
    data: null,
    loading: false,
    error: null
  });

  const execute = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await operation();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error: any) {
      const errorMessage = error.message || 'Operation failed';
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      throw error;
    }
  }, dependencies);

  return {
    ...state,
    execute,
    reset: () => setState({ data: null, loading: false, error: null })
  };
};

/**
 * Hook for real-time data subscriptions
 */
export const useRealTimeData = <T>(
  dataSelector: () => T,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T>(dataSelector);
  
  useEffect(() => {
    setData(dataSelector());
  }, dependencies);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = useDataStore.subscribe((state) => {
      const newData = dataSelector();
      setData(newData);
    });

    return unsubscribe;
  }, []);

  return data;
};