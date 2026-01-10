import { api } from '@/lib/api';
import { handleAPIError } from '@/lib/errorHandler';
import { useDataStore } from '@/stores/dataStore';

/**
 * BASE SERVICE CLASS
 * 
 * Provides common functionality for all services including:
 * - Data caching with TTL and invalidation
 * - Optimistic updates with rollback
 * - Real-time synchronization utilities
 * - Error handling and retry logic
 */

export interface CacheConfig {
  key: string;
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
  invalidateOn?: string[]; // Events that should invalidate this cache
}

export interface OptimisticUpdateConfig<T> {
  updateStore: (data: T) => void;
  rollbackStore: (originalData: T) => void;
  onSuccess?: (data: T) => void;
  onError?: (error: any, originalData: T) => void;
}

export interface RetryConfig {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export abstract class BaseService {
  protected cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  protected defaultTTL = 5 * 60 * 1000; // 5 minutes
  protected defaultRetryConfig: RetryConfig = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2,
  };

  /**
   * Get data with caching support
   */
  protected async getCachedData<T>(
    endpoint: string,
    cacheConfig?: CacheConfig,
    params?: Record<string, any>
  ): Promise<{ success: boolean; data: T; message: string; error?: any }> {
    const cacheKey = cacheConfig?.key || `${endpoint}_${JSON.stringify(params || {})}`;
    const ttl = cacheConfig?.ttl || this.defaultTTL;

    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      return {
        success: true,
        data: cached.data,
        message: 'Data retrieved from cache'
      };
    }

    try {
      // Build query string if params provided
      let url = endpoint;
      if (params) {
        const queryParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, String(value));
          }
        });
        const queryString = queryParams.toString();
        if (queryString) {
          url += `?${queryString}`;
        }
      }

      const response = await api.get(url);
      
      // Handle different backend response formats
      let responseData;
      if (response.data.data) {
        responseData = response.data.data;
      } else if (response.data.projects) {
        responseData = response.data.projects;
      } else if (response.data.project) {
        responseData = response.data.project;
      } else if (response.data.teams) {
        responseData = response.data.teams;
      } else if (response.data.team) {
        responseData = response.data.team;
      } else if (response.data.users) {
        responseData = response.data.users;
      } else if (response.data.user) {
        responseData = response.data.user;
      } else if (response.data.leaveRequests) {
        responseData = response.data.leaveRequests;
      } else if (response.data.leaves) {
        responseData = response.data.leaves;
      } else if (response.data.dashboard) {
        responseData = response.data.dashboard;
      } else if (response.data.tasks) {
        responseData = response.data.tasks;
      } else if (response.data.task) {
        responseData = response.data.task;
      } else if (response.data.metrics) {
        responseData = response.data.metrics;
      } else {
        // Fallback to the entire response data if no specific property found
        responseData = response.data;
      }
      
      const result = {
        success: true,
        data: responseData,
        message: response.data.message
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: result.data,
        timestamp: Date.now(),
        ttl
      });

      return result;
    } catch (error: any) {
      handleAPIError(error, {
        component: this.constructor.name,
        action: 'getCachedData',
        additionalData: { endpoint, params }
      });
      
      // Return error result instead of throwing
      return {
        success: false,
        data: null as any,
        message: error.response?.data?.message || 'Failed to fetch data',
        error: error
      };
    }
  }

  /**
   * Post data with optimistic updates
   */
  protected async postWithOptimisticUpdate<T, R>(
    endpoint: string,
    data: T,
    optimisticConfig?: OptimisticUpdateConfig<R>,
    retryConfig?: RetryConfig
  ): Promise<{ success: boolean; data: R; message: string; error?: any }> {
    let originalData: R | null = null;

    try {
      // Store original data for potential rollback
      if (optimisticConfig) {
        // This would need to be implemented based on the specific store structure
        // For now, we'll skip the optimistic update and just do the API call
      }

      const response = await this.retryOperation(
        () => api.post(endpoint, data),
        retryConfig || this.defaultRetryConfig
      );

      // Handle different backend response formats
      let responseData;
      if (response.data.data) {
        responseData = response.data.data;
      } else if (response.data.project) {
        responseData = response.data.project;
      } else if (response.data.team) {
        responseData = response.data.team;
      } else if (response.data.user) {
        responseData = response.data.user;
      } else if (response.data.task) {
        responseData = response.data.task;
      } else {
        responseData = response.data;
      }

      const result = {
        success: true,
        data: responseData,
        message: response.data.message
      };

      // Update store on success
      if (optimisticConfig?.updateStore) {
        optimisticConfig.updateStore(result.data);
      }

      if (optimisticConfig?.onSuccess) {
        optimisticConfig.onSuccess(result.data);
      }

      // Invalidate related cache entries
      this.invalidateCache(endpoint);

      return result;
    } catch (error: any) {
      // Rollback optimistic update on error
      if (optimisticConfig?.rollbackStore && originalData) {
        optimisticConfig.rollbackStore(originalData);
      }

      if (optimisticConfig?.onError && originalData) {
        optimisticConfig.onError(error, originalData);
      }

      handleAPIError(error, {
        component: this.constructor.name,
        action: 'postWithOptimisticUpdate',
        additionalData: { endpoint }
      });
      throw error;
    }
  }

  /**
   * Put data with optimistic updates
   */
  protected async putWithOptimisticUpdate<T, R>(
    endpoint: string,
    data: T,
    optimisticConfig?: OptimisticUpdateConfig<R>,
    retryConfig?: RetryConfig
  ): Promise<{ success: boolean; data: R; message: string; error?: any }> {
    let originalData: R | null = null;

    try {
      const response = await this.retryOperation(
        () => api.put(endpoint, data),
        retryConfig || this.defaultRetryConfig
      );

      // Handle different backend response formats
      let responseData;
      if (response.data.data) {
        responseData = response.data.data;
      } else if (response.data.project) {
        responseData = response.data.project;
      } else if (response.data.team) {
        responseData = response.data.team;
      } else if (response.data.user) {
        responseData = response.data.user;
      } else if (response.data.task) {
        responseData = response.data.task;
      } else {
        responseData = response.data;
      }

      const result = {
        success: true,
        data: responseData,
        message: response.data.message
      };

      // Update store on success
      if (optimisticConfig?.updateStore) {
        optimisticConfig.updateStore(result.data);
      }

      if (optimisticConfig?.onSuccess) {
        optimisticConfig.onSuccess(result.data);
      }

      // Invalidate related cache entries
      this.invalidateCache(endpoint);

      return result;
    } catch (error: any) {
      // Rollback optimistic update on error
      if (optimisticConfig?.rollbackStore && originalData) {
        optimisticConfig.rollbackStore(originalData);
      }

      if (optimisticConfig?.onError && originalData) {
        optimisticConfig.onError(error, originalData);
      }

      handleAPIError(error, {
        component: this.constructor.name,
        action: 'putWithOptimisticUpdate',
        additionalData: { endpoint }
      });
      throw error;
    }
  }

  /**
   * Delete with optimistic updates
   */
  protected async deleteWithOptimisticUpdate<R>(
    endpoint: string,
    optimisticConfig?: OptimisticUpdateConfig<R>,
    retryConfig?: RetryConfig
  ): Promise<{ success: boolean; message: string }> {
    let originalData: R | null = null;

    try {
      const response = await this.retryOperation(
        () => api.delete(endpoint),
        retryConfig || this.defaultRetryConfig
      );

      const result = {
        success: true,
        message: response.data.message
      };

      if (optimisticConfig?.onSuccess) {
        optimisticConfig.onSuccess(originalData as R);
      }

      // Invalidate related cache entries
      this.invalidateCache(endpoint);

      return result;
    } catch (error: any) {
      // Rollback optimistic update on error
      if (optimisticConfig?.rollbackStore && originalData) {
        optimisticConfig.rollbackStore(originalData);
      }

      if (optimisticConfig?.onError && originalData) {
        optimisticConfig.onError(error, originalData);
      }

      handleAPIError(error, {
        component: this.constructor.name,
        action: 'deleteWithOptimisticUpdate',
        additionalData: { endpoint }
      });
      throw error;
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  protected async retryOperation<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    const { maxRetries = 3, baseDelay = 1000, maxDelay = 10000, backoffFactor = 2 } = config;
    
    let lastError: any;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        lastError = error;
        
        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error.response?.status >= 400 && error.response?.status < 500 && error.response?.status !== 429) {
          throw error;
        }
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }
        
        // Calculate delay with exponential backoff
        const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt), maxDelay);
        await this.sleep(delay);
      }
    }
    
    throw lastError;
  }

  /**
   * Invalidate cache entries
   */
  protected invalidateCache(pattern?: string): void {
    if (!pattern) {
      // Clear all cache
      this.cache.clear();
      return;
    }

    // Remove entries that match the pattern
    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  protected getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Clean expired cache entries
   */
  protected cleanExpiredCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache) {
      if (now - value.timestamp > value.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Batch operations utility
   */
  protected async batchOperations<T>(
    operations: Array<() => Promise<T>>,
    batchSize: number = 5
  ): Promise<T[]> {
    const results: T[] = [];
    
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(op => op()));
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * Real-time synchronization setup (to be implemented with WebSocket)
   */
  protected setupRealTimeSync(events: string[], callback: (event: string, data: any) => void): void {
    // This would be implemented when WebSocket integration is added
    // For now, it's a placeholder for future real-time functionality
    console.log(`Setting up real-time sync for events: ${events.join(', ')}`);
  }

  /**
   * Data transformation utilities
   */
  protected transformDates(data: any): any {
    if (!data) return data;
    
    if (Array.isArray(data)) {
      return data.map(item => this.transformDates(item));
    }
    
    if (typeof data === 'object') {
      const transformed = { ...data };
      for (const [key, value] of Object.entries(transformed)) {
        if (typeof value === 'string' && this.isDateString(value)) {
          transformed[key] = new Date(value);
        } else if (typeof value === 'object') {
          transformed[key] = this.transformDates(value);
        }
      }
      return transformed;
    }
    
    return data;
  }

  private isDateString(value: string): boolean {
    // Check if string looks like a date (ISO format)
    return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value);
  }
}

/**
 * Service Registry for managing service instances
 */
export class ServiceRegistry {
  private static services = new Map<string, BaseService>();

  static register(name: string, service: BaseService): void {
    this.services.set(name, service);
  }

  static get<T extends BaseService>(name: string): T | undefined {
    return this.services.get(name) as T;
  }

  static invalidateAllCaches(): void {
    for (const service of this.services.values()) {
      (service as any).invalidateCache();
    }
  }

  static cleanAllExpiredCaches(): void {
    for (const service of this.services.values()) {
      (service as any).cleanExpiredCache();
    }
  }

  static getCacheStats(): Record<string, { size: number; keys: string[] }> {
    const stats: Record<string, { size: number; keys: string[] }> = {};
    for (const [name, service] of this.services) {
      stats[name] = (service as any).getCacheStats();
    }
    return stats;
  }
}

// Auto-cleanup expired cache entries every 10 minutes
setInterval(() => {
  ServiceRegistry.cleanAllExpiredCaches();
}, 10 * 60 * 1000);