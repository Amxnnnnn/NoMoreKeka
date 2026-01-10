// import { useDataStore } from '@/stores/dataStore';
// import { useAuthStore } from '@/stores/authStore';
// import { handleNetworkError } from '@/lib/errorHandler';

/**
 * ENHANCED WEBSOCKET SERVICE
 * 
 * Provides comprehensive WebSocket functionality with:
 * - Auto-reconnection with exponential backoff
 * - Message queuing for offline scenarios
 * - Connection status indicators
 * - Event handlers for real-time notifications and data updates
 * - Fallback mechanisms for offline scenarios
 */

export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  id?: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isConnecting: boolean;
  isOnline: boolean;
  lastConnected?: Date;
  reconnectAttempts: number;
  queuedMessages: number;
}

export interface WebSocketConfig {
  url: string;
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
  messageQueueLimit: number;
  enableHeartbeat: boolean;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private messageQueue: WebSocketMessage[] = [];
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;
  private isOnline = navigator.onLine;
  private eventListeners: Map<string, Set<(data: any) => void>> = new Map();
  
  private config: WebSocketConfig = {
    url: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
    reconnectInterval: 1000,
    maxReconnectAttempts: 10,
    heartbeatInterval: 30000,
    messageQueueLimit: 100,
    enableHeartbeat: true,
  };

  constructor() {
    this.setupNetworkListeners();
    // Don't auto-connect in test environment
    if (typeof process === 'undefined' || process.env.NODE_ENV !== 'test') {
      this.connect();
    }
  }

  /**
   * Initialize WebSocket connection
   */
  private connect(): void {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    if (!this.isOnline) {
      console.log('WebSocket: Cannot connect - offline');
      return;
    }

    this.isConnecting = true;
    
    try {
      // Use socket.io-client instead of native WebSocket
      const { io } = require('socket.io-client');
      const { useAuthStore } = require('@/stores/authStore');
      const authStore = useAuthStore.getState();
      const token = authStore.token;
      
      if (!token) {
        console.log('WebSocket: No authentication token available');
        this.isConnecting = false;
        return;
      }

      console.log('WebSocket: Connecting to', this.config.url);
      
      // Create socket.io connection
      const socket = io(this.config.url, {
        auth: { token },
        path: '/ws',
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true
      });

      // Wrap socket.io in WebSocket-like interface
      this.ws = {
        readyState: WebSocket.CONNECTING,
        send: (data: string) => socket.emit('message', JSON.parse(data)),
        close: (code?: number, reason?: string) => socket.disconnect(),
        onopen: null,
        onmessage: null,
        onclose: null,
        onerror: null,
        _readyState: WebSocket.CONNECTING
      } as any;

      socket.on('connect', () => {
        if (this.ws) (this.ws as any)._readyState = WebSocket.OPEN;
        this.handleOpen();
      });

      socket.on('disconnect', (reason) => {
        if (this.ws) (this.ws as any)._readyState = WebSocket.CLOSED;
        this.handleClose({ code: 1000, reason } as CloseEvent);
      });

      socket.on('connect_error', (error) => {
        this.handleError(error as any);
      });

      // Handle all socket.io events as WebSocket messages
      socket.onAny((eventName, ...args) => {
        if (eventName !== 'connect' && eventName !== 'disconnect' && eventName !== 'connect_error') {
          const message = {
            data: JSON.stringify({
              type: eventName,
              payload: args[0] || {},
              timestamp: Date.now()
            })
          };
          this.handleMessage(message as MessageEvent);
        }
      });

      // Store socket reference for cleanup
      (this.ws as any)._socket = socket;

    } catch (error) {
      console.error('WebSocket: Connection failed', error);
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket connection open
   */
  private handleOpen(): void {
    console.log('WebSocket: Connected successfully');
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    // Start heartbeat
    if (this.config.enableHeartbeat) {
      this.startHeartbeat();
    }
    
    // Process queued messages
    this.processMessageQueue();
    
    // Notify listeners
    this.emit('connection', { status: 'connected' });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      // Handle heartbeat response
      if (message.type === 'pong') {
        return;
      }
      
      // Handle authentication response
      if (message.type === 'auth_response') {
        if (message.payload.success) {
          console.log('WebSocket: Authentication successful');
        } else {
          console.error('WebSocket: Authentication failed', message.payload.error);
          this.disconnect();
        }
        return;
      }
      
      // Route message to appropriate handler
      this.routeMessage(message);
      
    } catch (error) {
      console.error('WebSocket: Failed to parse message', error);
    }
  }

  /**
   * Handle WebSocket connection close
   */
  private handleClose(event: CloseEvent): void {
    console.log('WebSocket: Connection closed', event.code, event.reason);
    this.isConnecting = false;
    this.stopHeartbeat();
    
    // Notify listeners
    this.emit('connection', { status: 'disconnected', code: event.code, reason: event.reason });
    
    // Schedule reconnection if not a clean close
    if (event.code !== 1000 && this.isOnline) {
      this.scheduleReconnect();
    }
  }

  /**
   * Handle WebSocket errors
   */
  private handleError(error: Event): void {
    console.error('WebSocket: Error occurred', error);
    this.isConnecting = false;
    
    // Notify error handler
    // handleNetworkError(new Error('WebSocket connection error'));
    
    // Notify listeners
    this.emit('connection', { status: 'error', error });
  }

  /**
   * Route incoming messages to appropriate handlers
   */
  private routeMessage(message: WebSocketMessage): void {
    const { type, payload } = message;
    
    switch (type) {
      case 'notification':
        this.handleNotificationUpdate(payload);
        break;
      case 'leave_update':
        this.handleLeaveUpdate(payload);
        break;
      case 'project_update':
        this.handleProjectUpdate(payload);
        break;
      case 'task_update':
        this.handleTaskUpdate(payload);
        break;
      case 'worklog_update':
        this.handleWorkLogUpdate(payload);
        break;
      case 'team_update':
        this.handleTeamUpdate(payload);
        break;
      case 'user_update':
        this.handleUserUpdate(payload);
        break;
      default:
        // Emit to custom listeners
        this.emit(type, payload);
    }
  }

  /**
   * Handle notification updates
   */
  private handleNotificationUpdate(payload: any): void {
    try {
      const { useDataStore } = require('@/stores/dataStore');
      const dataStore = useDataStore.getState();
      
      switch (payload.action) {
        case 'create':
          dataStore.addNotification(payload.data);
          break;
        case 'update':
          if (payload.data.isRead) {
            dataStore.markNotificationAsRead(payload.data.id);
          }
          break;
        case 'delete':
          dataStore.removeNotification(payload.data.id);
          break;
      }
    } catch (error) {
      console.warn('WebSocket: Failed to update dataStore for notification', error);
    }
    
    this.emit('notification_update', payload);
  }

  /**
   * Handle leave updates
   */
  private handleLeaveUpdate(payload: any): void {
    try {
      const { useDataStore } = require('@/stores/dataStore');
      const dataStore = useDataStore.getState();
      
      switch (payload.action) {
        case 'create':
          dataStore.addLeave(payload.data);
          break;
        case 'update':
          dataStore.updateLeave(payload.data.id, payload.data);
          break;
        case 'delete':
          dataStore.removeLeave(payload.data.id);
          break;
      }
    } catch (error) {
      console.warn('WebSocket: Failed to update dataStore for leave', error);
    }
    
    this.emit('leave_update', payload);
  }

  /**
   * Handle project updates
   */
  private handleProjectUpdate(payload: any): void {
    try {
      const { useDataStore } = require('@/stores/dataStore');
      const dataStore = useDataStore.getState();
      
      switch (payload.action) {
        case 'create':
          dataStore.addProject(payload.data);
          break;
        case 'update':
          dataStore.updateProject(payload.data.id, payload.data);
          break;
        case 'delete':
          dataStore.removeProject(payload.data.id);
          break;
      }
    } catch (error) {
      console.warn('WebSocket: Failed to update dataStore for project', error);
    }
    
    this.emit('project_update', payload);
  }

  /**
   * Handle task updates
   */
  private handleTaskUpdate(payload: any): void {
    try {
      const { useDataStore } = require('@/stores/dataStore');
      const dataStore = useDataStore.getState();
      
      switch (payload.action) {
        case 'create':
          dataStore.addTask(payload.data);
          break;
        case 'update':
          dataStore.updateTask(payload.data.id, payload.data);
          break;
        case 'delete':
          dataStore.removeTask(payload.data.id);
          break;
      }
    } catch (error) {
      console.warn('WebSocket: Failed to update dataStore for task', error);
    }
    
    this.emit('task_update', payload);
  }

  /**
   * Handle work log updates
   */
  private handleWorkLogUpdate(payload: any): void {
    try {
      const { useDataStore } = require('@/stores/dataStore');
      const dataStore = useDataStore.getState();
      
      switch (payload.action) {
        case 'create':
          dataStore.addWorkLog(payload.data);
          break;
        case 'update':
          dataStore.updateWorkLog(payload.data.id, payload.data);
          break;
        case 'delete':
          dataStore.removeWorkLog(payload.data.id);
          break;
      }
    } catch (error) {
      console.warn('WebSocket: Failed to update dataStore for worklog', error);
    }
    
    this.emit('worklog_update', payload);
  }

  /**
   * Handle team updates
   */
  private handleTeamUpdate(payload: any): void {
    try {
      const { useDataStore } = require('@/stores/dataStore');
      const dataStore = useDataStore.getState();
      
      switch (payload.action) {
        case 'create':
          dataStore.addTeam(payload.data);
          break;
        case 'update':
          dataStore.updateTeam(payload.data.id, payload.data);
          break;
        case 'delete':
          dataStore.removeTeam(payload.data.id);
          break;
      }
    } catch (error) {
      console.warn('WebSocket: Failed to update dataStore for team', error);
    }
    
    this.emit('team_update', payload);
  }

  /**
   * Handle user updates
   */
  private handleUserUpdate(payload: any): void {
    // const authStore = useAuthStore.getState();
    // 
    // // Update current user if it's the same user
    // if (authStore.user && authStore.user.id === payload.data.id) {
    //   authStore.setUser(payload.data);
    // }
    
    this.emit('user_update', payload);
  }

  /**
   * Send message through WebSocket
   */
  send(type: string, payload: any): void {
    const message: WebSocketMessage = {
      type,
      payload,
      timestamp: Date.now(),
      id: this.generateMessageId(),
    };

    if (this.isConnected()) {
      try {
        this.ws!.send(JSON.stringify(message));
      } catch (error) {
        console.error('WebSocket: Failed to send message', error);
        this.queueMessage(message);
      }
    } else {
      this.queueMessage(message);
    }
  }

  /**
   * Queue message for later sending
   */
  private queueMessage(message: WebSocketMessage): void {
    if (this.messageQueue.length >= this.config.messageQueueLimit) {
      // Remove oldest message to make room
      this.messageQueue.shift();
    }
    
    this.messageQueue.push(message);
    console.log(`WebSocket: Message queued (${this.messageQueue.length}/${this.config.messageQueueLimit})`);
  }

  /**
   * Process queued messages
   */
  private processMessageQueue(): void {
    if (!this.isConnected() || this.messageQueue.length === 0) {
      return;
    }

    console.log(`WebSocket: Processing ${this.messageQueue.length} queued messages`);
    
    const messages = [...this.messageQueue];
    this.messageQueue = []; // Clear queue immediately
    
    messages.forEach(message => {
      try {
        this.ws!.send(JSON.stringify(message));
      } catch (error) {
        console.error('WebSocket: Failed to send queued message', error);
        // Re-queue failed message
        this.queueMessage(message);
      }
    });
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log('WebSocket: Max reconnection attempts reached');
      this.emit('connection', { status: 'failed', reason: 'max_attempts_reached' });
      return;
    }

    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.reconnectAttempts),
      30000 // Max 30 seconds
    );

    console.log(`WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.config.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        this.send('ping', { timestamp: Date.now() });
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Setup network status listeners
   */
  private setupNetworkListeners(): void {
    window.addEventListener('online', () => {
      console.log('WebSocket: Network connection restored');
      this.isOnline = true;
      this.emit('network', { status: 'online' });
      
      // Reconnect if not connected
      if (!this.isConnected()) {
        this.reconnectAttempts = 0; // Reset attempts on network restore
        this.connect();
      }
    });

    window.addEventListener('offline', () => {
      console.log('WebSocket: Network connection lost');
      this.isOnline = false;
      this.emit('network', { status: 'offline' });
    });
  }

  /**
   * Add event listener
   */
  on(event: string, callback: (data: any) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: (data: any) => void): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.eventListeners.delete(event);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  private emit(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`WebSocket: Error in event listener for ${event}`, error);
        }
      });
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws !== null && ((this.ws as any)._readyState || this.ws.readyState) === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return {
      isConnected: this.isConnected(),
      isConnecting: this.isConnecting,
      isOnline: this.isOnline,
      lastConnected: this.ws ? new Date() : undefined,
      reconnectAttempts: this.reconnectAttempts,
      queuedMessages: this.messageQueue.length,
    };
  }

  /**
   * Update WebSocket configuration
   */
  updateConfig(newConfig: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart heartbeat if interval changed
    if (newConfig.heartbeatInterval && this.heartbeatTimer) {
      this.stopHeartbeat();
      this.startHeartbeat();
    }
  }

  /**
   * Force reconnection
   */
  reconnect(): void {
    this.disconnect();
    this.reconnectAttempts = 0;
    setTimeout(() => this.connect(), 100);
  }

  /**
   * Disconnect WebSocket
   */
  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.stopHeartbeat();
    
    if (this.ws) {
      // Handle socket.io disconnect
      if ((this.ws as any)._socket) {
        (this.ws as any)._socket.disconnect();
      } else {
        this.ws.close(1000, 'Client disconnect');
      }
      this.ws = null;
    }
    
    this.isConnecting = false;
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * Clear message queue
   */
  clearMessageQueue(): void {
    this.messageQueue = [];
  }

  /**
   * Get queued messages count
   */
  getQueuedMessagesCount(): number {
    return this.messageQueue.length;
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    this.disconnect();
    this.eventListeners.clear();
    
    window.removeEventListener('online', this.setupNetworkListeners);
    window.removeEventListener('offline', this.setupNetworkListeners);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();