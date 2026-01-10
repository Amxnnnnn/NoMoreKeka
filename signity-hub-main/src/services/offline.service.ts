import { useDataStore } from '@/stores/dataStore';

/**
 * OFFLINE MANAGER SERVICE
 * 
 * Handles offline functionality, data queuing, and synchronization
 * when the application comes back online
 */

export interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'leave' | 'worklog' | 'task' | 'notification' | 'project' | 'team';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface ConflictData {
  id: string;
  entity: string;
  clientData: any;
  serverData: any;
  timestamp: number;
}

class OfflineService {
  private serviceWorker: ServiceWorker | null = null;
  private offlineQueue: OfflineAction[] = [];
  private conflicts: ConflictData[] = [];
  private isOnline = navigator.onLine;
  private syncInProgress = false;

  constructor() {
    this.initializeServiceWorker();
    this.setupNetworkListeners();
    this.loadOfflineQueue();
  }

  /**
   * Initialize service worker
   */
  private async initializeServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);

        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));

        // Get active service worker
        this.serviceWorker = registration.active || registration.waiting || registration.installing;

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;
        console.log('Service Worker ready');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      this.isOnline = true;
      this.processPendingActions();
    });

    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      this.isOnline = false;
    });
  }

  /**
   * Load offline queue from localStorage
   */
  private loadOfflineQueue(): void {
    try {
      const stored = localStorage.getItem('hrms-offline-queue');
      if (stored) {
        this.offlineQueue = JSON.parse(stored);
        console.log(`Loaded ${this.offlineQueue.length} offline actions from storage`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.offlineQueue = [];
    }
  }

  /**
   * Save offline queue to localStorage
   */
  private saveOfflineQueue(): void {
    try {
      localStorage.setItem('hrms-offline-queue', JSON.stringify(this.offlineQueue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  /**
   * Handle messages from service worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, entity, action, data } = event.data;

    switch (type) {
      case 'SYNC_SUCCESS':
        this.handleSyncSuccess(entity, action, data);
        break;
      case 'SYNC_CONFLICT':
        this.handleSyncConflict(entity, data);
        break;
      case 'SYNC_ERROR':
        this.handleSyncError(entity, action, data);
        break;
    }
  }

  /**
   * Handle successful sync
   */
  private handleSyncSuccess(entity: string, action: string, data: any): void {
    console.log(`Sync success: ${entity} ${action}`, data);
    
    // Remove from offline queue
    this.offlineQueue = this.offlineQueue.filter(item => 
      !(item.entity === entity && JSON.stringify(item.data) === JSON.stringify(data))
    );
    this.saveOfflineQueue();

    // Update store with synced data
    const store = useDataStore.getState();
    this.updateStoreAfterSync(entity, action, data, store);
  }

  /**
   * Handle sync conflict
   */
  private handleSyncConflict(entity: string, conflictData: any): void {
    console.log(`Sync conflict detected: ${entity}`, conflictData);
    
    const conflict: ConflictData = {
      id: this.generateId(),
      entity,
      clientData: conflictData.clientData,
      serverData: conflictData.serverData,
      timestamp: Date.now()
    };

    this.conflicts.push(conflict);
    
    // Notify user about conflict
    this.notifyConflict(conflict);
  }

  /**
   * Handle sync error
   */
  private handleSyncError(entity: string, action: string, error: any): void {
    console.error(`Sync error: ${entity} ${action}`, error);
    
    // Find and update retry count for failed action
    const actionIndex = this.offlineQueue.findIndex(item => 
      item.entity === entity && item.type === action.toUpperCase()
    );

    if (actionIndex !== -1) {
      const action = this.offlineQueue[actionIndex];
      action.retryCount++;

      if (action.retryCount >= action.maxRetries) {
        // Remove from queue if max retries reached
        this.offlineQueue.splice(actionIndex, 1);
        console.warn(`Max retries reached for ${entity} ${action.type}, removing from queue`);
      }

      this.saveOfflineQueue();
    }
  }

  /**
   * Queue action for offline processing
   */
  queueAction(
    type: OfflineAction['type'],
    entity: OfflineAction['entity'],
    data: any,
    maxRetries = 3
  ): string {
    const action: OfflineAction = {
      id: this.generateId(),
      type,
      entity,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries
    };

    this.offlineQueue.push(action);
    this.saveOfflineQueue();

    console.log(`Queued offline action: ${entity} ${type}`, data);

    // Send to service worker for background sync
    if (this.serviceWorker) {
      this.serviceWorker.postMessage({
        type: 'QUEUE_OFFLINE_ACTION',
        data: { type, entity, data }
      });
    }

    // Process immediately if online
    if (this.isOnline) {
      this.processPendingActions();
    }

    return action.id;
  }

  /**
   * Process pending offline actions
   */
  private async processPendingActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline || this.offlineQueue.length === 0) {
      return;
    }

    this.syncInProgress = true;
    console.log(`Processing ${this.offlineQueue.length} pending offline actions`);

    const actionsToProcess = [...this.offlineQueue];
    
    for (const action of actionsToProcess) {
      try {
        await this.processAction(action);
        
        // Remove successful action from queue
        this.offlineQueue = this.offlineQueue.filter(item => item.id !== action.id);
      } catch (error) {
        console.error(`Failed to process offline action:`, error);
        
        // Increment retry count
        const actionIndex = this.offlineQueue.findIndex(item => item.id === action.id);
        if (actionIndex !== -1) {
          this.offlineQueue[actionIndex].retryCount++;
          
          if (this.offlineQueue[actionIndex].retryCount >= action.maxRetries) {
            // Remove if max retries reached
            this.offlineQueue.splice(actionIndex, 1);
            console.warn(`Max retries reached for action ${action.id}, removing from queue`);
          }
        }
      }
    }

    this.saveOfflineQueue();
    this.syncInProgress = false;
    
    console.log(`Offline sync completed. ${this.offlineQueue.length} actions remaining`);
  }

  /**
   * Process individual action
   */
  private async processAction(action: OfflineAction): Promise<void> {
    const { type, entity, data } = action;

    switch (entity) {
      case 'leave':
        await this.processLeaveAction(type, data);
        break;
      case 'worklog':
        await this.processWorkLogAction(type, data);
        break;
      case 'task':
        await this.processTaskAction(type, data);
        break;
      case 'notification':
        await this.processNotificationAction(type, data);
        break;
      case 'project':
        await this.processProjectAction(type, data);
        break;
      case 'team':
        await this.processTeamAction(type, data);
        break;
      default:
        throw new Error(`Unknown entity type: ${entity}`);
    }
  }

  /**
   * Process leave actions
   */
  private async processLeaveAction(type: OfflineAction['type'], data: any): Promise<void> {
    const { api } = await import('@/lib/api');
    
    switch (type) {
      case 'CREATE':
        await api.post('/leave', data);
        break;
      case 'UPDATE':
        await api.put(`/leave/${data.id}`, data);
        break;
      case 'DELETE':
        await api.delete(`/leave/${data.id}`);
        break;
    }
  }

  /**
   * Process work log actions
   */
  private async processWorkLogAction(type: OfflineAction['type'], data: any): Promise<void> {
    const { api } = await import('@/lib/api');
    
    switch (type) {
      case 'CREATE':
        await api.post('/worklog', data);
        break;
      case 'UPDATE':
        await api.put(`/worklog/${data.id}`, data);
        break;
      case 'DELETE':
        await api.delete(`/worklog/${data.id}`);
        break;
    }
  }

  /**
   * Process task actions
   */
  private async processTaskAction(type: OfflineAction['type'], data: any): Promise<void> {
    const { api } = await import('@/lib/api');
    
    switch (type) {
      case 'CREATE':
        await api.post('/tasks', data);
        break;
      case 'UPDATE':
        await api.put(`/tasks/${data.id}`, data);
        break;
      case 'DELETE':
        await api.delete(`/tasks/${data.id}`);
        break;
    }
  }

  /**
   * Process notification actions
   */
  private async processNotificationAction(type: OfflineAction['type'], data: any): Promise<void> {
    const { api } = await import('@/lib/api');
    
    switch (type) {
      case 'UPDATE':
        if (data.isRead) {
          await api.put(`/notifications/${data.id}/read`);
        }
        break;
      case 'DELETE':
        await api.delete(`/notifications/${data.id}`);
        break;
    }
  }

  /**
   * Process project actions
   */
  private async processProjectAction(type: OfflineAction['type'], data: any): Promise<void> {
    const { api } = await import('@/lib/api');
    
    switch (type) {
      case 'CREATE':
        await api.post('/projects', data);
        break;
      case 'UPDATE':
        await api.put(`/projects/${data.id}`, data);
        break;
      case 'DELETE':
        await api.delete(`/projects/${data.id}`);
        break;
    }
  }

  /**
   * Process team actions
   */
  private async processTeamAction(type: OfflineAction['type'], data: any): Promise<void> {
    const { api } = await import('@/lib/api');
    
    switch (type) {
      case 'CREATE':
        await api.post('/teams', data);
        break;
      case 'UPDATE':
        await api.put(`/teams/${data.id}`, data);
        break;
      case 'DELETE':
        await api.delete(`/teams/${data.id}`);
        break;
    }
  }

  /**
   * Update store after successful sync
   */
  private updateStoreAfterSync(entity: string, action: string, data: any, store: any): void {
    switch (entity) {
      case 'leave':
        if (action === 'create') store.addLeave(data);
        else if (action === 'update') store.updateLeave(data.id, data);
        else if (action === 'delete') store.removeLeave(data.id);
        break;
      case 'worklog':
        if (action === 'create') store.addWorkLog(data);
        else if (action === 'update') store.updateWorkLog(data.id, data);
        else if (action === 'delete') store.removeWorkLog(data.id);
        break;
      case 'task':
        if (action === 'create') store.addTask(data);
        else if (action === 'update') store.updateTask(data.id, data);
        else if (action === 'delete') store.removeTask(data.id);
        break;
      case 'project':
        if (action === 'create') store.addProject(data);
        else if (action === 'update') store.updateProject(data.id, data);
        else if (action === 'delete') store.removeProject(data.id);
        break;
      case 'team':
        if (action === 'create') store.addTeam(data);
        else if (action === 'update') store.updateTeam(data.id, data);
        else if (action === 'delete') store.removeTeam(data.id);
        break;
    }
  }

  /**
   * Notify user about conflict
   */
  private notifyConflict(conflict: ConflictData): void {
    // This would typically show a toast or modal to the user
    console.warn('Data conflict detected:', conflict);
    
    // For now, we'll just emit a custom event
    window.dispatchEvent(new CustomEvent('data-conflict', {
      detail: conflict
    }));
  }

  /**
   * Resolve conflict
   */
  resolveConflict(conflictId: string, resolution: 'client' | 'server' | 'merge'): void {
    const conflictIndex = this.conflicts.findIndex(c => c.id === conflictId);
    if (conflictIndex === -1) return;

    const conflict = this.conflicts[conflictIndex];
    let resolvedData: any;

    switch (resolution) {
      case 'client':
        resolvedData = conflict.clientData;
        break;
      case 'server':
        resolvedData = conflict.serverData;
        break;
      case 'merge':
        resolvedData = this.mergeConflictData(conflict.clientData, conflict.serverData);
        break;
    }

    // Queue update with resolved data
    this.queueAction('UPDATE', conflict.entity as OfflineAction['entity'], resolvedData);

    // Remove conflict from list
    this.conflicts.splice(conflictIndex, 1);
    
    console.log(`Conflict resolved: ${conflict.entity}`, resolvedData);
  }

  /**
   * Merge conflict data
   */
  private mergeConflictData(clientData: any, serverData: any): any {
    // Simple merge strategy - server data takes precedence for most fields
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
   * Get offline status
   */
  getOfflineStatus(): {
    isOnline: boolean;
    queueSize: number;
    conflictCount: number;
    syncInProgress: boolean;
  } {
    return {
      isOnline: this.isOnline,
      queueSize: this.offlineQueue.length,
      conflictCount: this.conflicts.length,
      syncInProgress: this.syncInProgress
    };
  }

  /**
   * Get pending conflicts
   */
  getConflicts(): ConflictData[] {
    return [...this.conflicts];
  }

  /**
   * Clear offline queue
   */
  clearQueue(): void {
    this.offlineQueue = [];
    this.saveOfflineQueue();
    console.log('Offline queue cleared');
  }

  /**
   * Force sync
   */
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.processPendingActions();
    } else {
      console.warn('Cannot force sync while offline');
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    window.removeEventListener('online', this.setupNetworkListeners);
    window.removeEventListener('offline', this.setupNetworkListeners);
    
    if (navigator.serviceWorker) {
      navigator.serviceWorker.removeEventListener('message', this.handleServiceWorkerMessage);
    }
  }
}

export const offlineService = new OfflineService();