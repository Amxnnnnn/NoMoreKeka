import { useDataStore } from '@/stores/dataStore';
import { ServiceRegistry } from './base.service';

/**
 * DATA SYNCHRONIZATION SERVICE
 * 
 * Handles real-time data synchronization, conflict resolution,
 * and data consistency across the application
 */

export interface SyncEvent {
  type: string;
  entity: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: number;
  userId: string;
}

export interface ConflictResolution {
  strategy: 'client_wins' | 'server_wins' | 'merge' | 'manual';
  resolver?: (clientData: any, serverData: any) => any;
}

export interface SyncConfig {
  enableRealTime: boolean;
  conflictResolution: ConflictResolution;
  retryAttempts: number;
  syncInterval: number; // in milliseconds
  batchSize: number;
}

class SyncService {
  private websocket: WebSocket | null = null;
  private syncQueue: SyncEvent[] = [];
  private isOnline = navigator.onLine;
  private syncInterval: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  private config: SyncConfig = {
    enableRealTime: true,
    conflictResolution: { strategy: 'server_wins' },
    retryAttempts: 3,
    syncInterval: 30000, // 30 seconds
    batchSize: 10
  };

  constructor() {
    this.setupNetworkListeners();
    this.setupPeriodicSync();
    
    if (this.config.enableRealTime) {
      this.initializeWebSocket();
    }
  }

  /**
   * Initialize WebSocket connection for real-time updates
   */
  private initializeWebSocket(): void {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:3000/ws';
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.processSyncQueue();
      };

      this.websocket.onmessage = (event) => {
        try {
          const syncEvent: SyncEvent = JSON.parse(event.data);
          this.handleRealTimeUpdate(syncEvent);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.websocket.onclose = () => {
        console.log('WebSocket disconnected');
        this.handleWebSocketReconnect();
      };

      this.websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Failed to initialize WebSocket:', error);
    }
  }

  /**
   * Handle WebSocket reconnection with exponential backoff
   */
  private handleWebSocketReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.isOnline) {
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
      
      setTimeout(() => {
        console.log(`Attempting WebSocket reconnection (${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
        this.reconnectAttempts++;
        this.initializeWebSocket();
      }, delay);
    }
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      this.isOnline = true;
      this.processSyncQueue();
      
      if (this.config.enableRealTime && !this.websocket) {
        this.initializeWebSocket();
      }
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      this.isOnline = false;
    });
  }

  /**
   * Setup periodic synchronization for offline changes
   */
  private setupPeriodicSync(): void {
    this.syncInterval = setInterval(() => {
      if (this.isOnline && this.syncQueue.length > 0) {
        this.processSyncQueue();
      }
    }, this.config.syncInterval);
  }

  /**
   * Handle real-time updates from WebSocket
   */
  private handleRealTimeUpdate(event: SyncEvent): void {
    const store = useDataStore.getState();

    switch (event.entity) {
      case 'leave':
        this.handleLeaveUpdate(event, store);
        break;
      case 'project':
        this.handleProjectUpdate(event, store);
        break;
      case 'task':
        this.handleTaskUpdate(event, store);
        break;
      case 'worklog':
        this.handleWorkLogUpdate(event, store);
        break;
      case 'team':
        this.handleTeamUpdate(event, store);
        break;
      case 'notification':
        this.handleNotificationUpdate(event, store);
        break;
      default:
        console.warn('Unknown entity type for real-time update:', event.entity);
    }

    // Invalidate related service caches
    this.invalidateRelatedCaches(event.entity);
  }

  /**
   * Handle leave-related updates
   */
  private handleLeaveUpdate(event: SyncEvent, store: any): void {
    switch (event.action) {
      case 'CREATE':
        store.addLeave(event.data);
        break;
      case 'UPDATE':
        store.updateLeave(event.entityId, event.data);
        break;
      case 'DELETE':
        store.removeLeave(event.entityId);
        break;
    }
  }

  /**
   * Handle project-related updates
   */
  private handleProjectUpdate(event: SyncEvent, store: any): void {
    switch (event.action) {
      case 'CREATE':
        store.addProject(event.data);
        break;
      case 'UPDATE':
        store.updateProject(event.entityId, event.data);
        break;
      case 'DELETE':
        store.removeProject(event.entityId);
        break;
    }
  }

  /**
   * Handle task-related updates
   */
  private handleTaskUpdate(event: SyncEvent, store: any): void {
    switch (event.action) {
      case 'CREATE':
        store.addTask(event.data);
        break;
      case 'UPDATE':
        store.updateTask(event.entityId, event.data);
        break;
      case 'DELETE':
        store.removeTask(event.entityId);
        break;
    }
  }

  /**
   * Handle work log updates
   */
  private handleWorkLogUpdate(event: SyncEvent, store: any): void {
    switch (event.action) {
      case 'CREATE':
        store.addWorkLog(event.data);
        break;
      case 'UPDATE':
        store.updateWorkLog(event.entityId, event.data);
        break;
      case 'DELETE':
        store.removeWorkLog(event.entityId);
        break;
    }
  }

  /**
   * Handle team updates
   */
  private handleTeamUpdate(event: SyncEvent, store: any): void {
    switch (event.action) {
      case 'CREATE':
        store.addTeam(event.data);
        break;
      case 'UPDATE':
        store.updateTeam(event.entityId, event.data);
        break;
      case 'DELETE':
        store.removeTeam(event.entityId);
        break;
    }
  }

  /**
   * Handle notification updates
   */
  private handleNotificationUpdate(event: SyncEvent, store: any): void {
    switch (event.action) {
      case 'CREATE':
        store.addNotification(event.data);
        break;
      case 'UPDATE':
        if (event.data.isRead) {
          store.markNotificationAsRead(event.entityId);
        }
        break;
      case 'DELETE':
        store.removeNotification(event.entityId);
        break;
    }
  }

  /**
   * Queue sync event for offline processing
   */
  queueSyncEvent(event: Omit<SyncEvent, 'timestamp'>): void {
    const syncEvent: SyncEvent = {
      ...event,
      timestamp: Date.now()
    };

    this.syncQueue.push(syncEvent);

    // Process immediately if online
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  /**
   * Process queued sync events
   */
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return;
    }

    const batch = this.syncQueue.splice(0, this.config.batchSize);
    
    try {
      // Send batch to server for processing
      await this.sendSyncBatch(batch);
    } catch (error) {
      console.error('Failed to process sync batch:', error);
      // Re-queue failed events
      this.syncQueue.unshift(...batch);
    }
  }

  /**
   * Send sync batch to server
   */
  private async sendSyncBatch(events: SyncEvent[]): Promise<void> {
    // This would send the events to the server for processing
    // For now, we'll just log them
    console.log('Processing sync batch:', events);
    
    // In a real implementation, this would make an API call
    // await api.post('/sync/batch', { events });
  }

  /**
   * Resolve data conflicts
   */
  resolveConflict(clientData: any, serverData: any, entity: string): any {
    const { strategy, resolver } = this.config.conflictResolution;

    switch (strategy) {
      case 'client_wins':
        return clientData;
      case 'server_wins':
        return serverData;
      case 'merge':
        return this.mergeData(clientData, serverData);
      case 'manual':
        if (resolver) {
          return resolver(clientData, serverData);
        }
        // Fallback to server wins if no resolver provided
        return serverData;
      default:
        return serverData;
    }
  }

  /**
   * Merge client and server data
   */
  private mergeData(clientData: any, serverData: any): any {
    // Simple merge strategy - server data takes precedence for conflicts
    return {
      ...clientData,
      ...serverData,
      // Keep client timestamp if it's newer
      updatedAt: new Date(Math.max(
        new Date(clientData.updatedAt || 0).getTime(),
        new Date(serverData.updatedAt || 0).getTime()
      )).toISOString()
    };
  }

  /**
   * Invalidate related service caches
   */
  private invalidateRelatedCaches(entity: string): void {
    const cachePatterns: Record<string, string[]> = {
      leave: ['leave', 'team_leave'],
      project: ['project', 'my_project'],
      task: ['task', 'project_task'],
      worklog: ['worklog', 'team_worklog'],
      team: ['team', 'my_team'],
      notification: ['notification']
    };

    const patterns = cachePatterns[entity] || [];
    patterns.forEach(pattern => {
      // Invalidate caches in all registered services
      ServiceRegistry.invalidateAllCaches();
    });
  }

  /**
   * Force full data refresh
   */
  async forceRefresh(): Promise<void> {
    const store = useDataStore.getState();
    
    // Clear all cached data
    ServiceRegistry.invalidateAllCaches();
    
    // Reset store sections
    store.resetSection('leaves');
    store.resetSection('projects');
    store.resetSection('tasks');
    store.resetSection('workLogs');
    store.resetSection('teams');
    store.resetSection('notifications');
    
    console.log('Forced data refresh completed');
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isOnline: boolean;
    isConnected: boolean;
    queueSize: number;
    lastSync: number | null;
  } {
    return {
      isOnline: this.isOnline,
      isConnected: this.websocket?.readyState === WebSocket.OPEN,
      queueSize: this.syncQueue.length,
      lastSync: this.syncQueue.length > 0 ? Math.max(...this.syncQueue.map(e => e.timestamp)) : null
    };
  }

  /**
   * Update sync configuration
   */
  updateConfig(newConfig: Partial<SyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart WebSocket if real-time setting changed
    if ('enableRealTime' in newConfig) {
      if (newConfig.enableRealTime && !this.websocket) {
        this.initializeWebSocket();
      } else if (!newConfig.enableRealTime && this.websocket) {
        this.websocket.close();
        this.websocket = null;
      }
    }
    
    // Update sync interval if changed
    if ('syncInterval' in newConfig && this.syncInterval) {
      clearInterval(this.syncInterval);
      this.setupPeriodicSync();
    }
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.websocket) {
      this.websocket.close();
      this.websocket = null;
    }
    
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    window.removeEventListener('online', this.setupNetworkListeners);
    window.removeEventListener('offline', this.setupNetworkListeners);
  }
}

export const syncService = new SyncService();