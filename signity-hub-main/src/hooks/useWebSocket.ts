import { useEffect, useCallback, useRef } from 'react';
import { websocketService, ConnectionStatus } from '@/services/websocket.service';

/**
 * React hook for WebSocket integration
 * Provides easy access to WebSocket functionality in React components
 */

export interface UseWebSocketOptions {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: any) => void;
  onMessage?: (type: string, data: any) => void;
  autoConnect?: boolean;
}

export interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  isOnline: boolean;
  connectionStatus: ConnectionStatus;
  send: (type: string, payload: any) => void;
  connect: () => void;
  disconnect: () => void;
  reconnect: () => void;
  subscribe: (event: string, callback: (data: any) => void) => () => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}): UseWebSocketReturn => {
  const {
    onConnect,
    onDisconnect,
    onError,
    onMessage,
    autoConnect = true,
  } = options;

  const callbacksRef = useRef({ onConnect, onDisconnect, onError, onMessage });
  
  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onConnect, onDisconnect, onError, onMessage };
  }, [onConnect, onDisconnect, onError, onMessage]);

  useEffect(() => {
    const handleConnection = (data: any) => {
      const { onConnect, onDisconnect, onError } = callbacksRef.current;
      
      switch (data.status) {
        case 'connected':
          onConnect?.();
          break;
        case 'disconnected':
          onDisconnect?.();
          break;
        case 'error':
        case 'failed':
          onError?.(data.error || data.reason);
          break;
      }
    };

    const handleMessage = (data: any) => {
      const { onMessage } = callbacksRef.current;
      onMessage?.('message', data);
    };

    // Set up event listeners
    websocketService.on('connection', handleConnection);
    
    // Listen for all message types if onMessage is provided
    if (onMessage) {
      const messageTypes = [
        'notification_update',
        'leave_update',
        'project_update',
        'task_update',
        'worklog_update',
        'team_update',
        'user_update',
      ];
      
      messageTypes.forEach(type => {
        websocketService.on(type, (data) => onMessage(type, data));
      });
    }

    return () => {
      websocketService.off('connection', handleConnection);
      
      if (onMessage) {
        const messageTypes = [
          'notification_update',
          'leave_update',
          'project_update',
          'task_update',
          'worklog_update',
          'team_update',
          'user_update',
        ];
        
        messageTypes.forEach(type => {
          websocketService.off(type, (data) => onMessage(type, data));
        });
      }
    };
  }, [onMessage]);

  const send = useCallback((type: string, payload: any) => {
    websocketService.send(type, payload);
  }, []);

  const connect = useCallback(() => {
    websocketService.reconnect();
  }, []);

  const disconnect = useCallback(() => {
    websocketService.disconnect();
  }, []);

  const reconnect = useCallback(() => {
    websocketService.reconnect();
  }, []);

  const subscribe = useCallback((event: string, callback: (data: any) => void) => {
    websocketService.on(event, callback);
    
    // Return unsubscribe function
    return () => {
      websocketService.off(event, callback);
    };
  }, []);

  const connectionStatus = websocketService.getConnectionStatus();

  return {
    isConnected: connectionStatus.isConnected,
    isConnecting: connectionStatus.isConnecting,
    isOnline: connectionStatus.isOnline,
    connectionStatus,
    send,
    connect,
    disconnect,
    reconnect,
    subscribe,
  };
};

/**
 * Hook for subscribing to specific WebSocket events
 */
export const useWebSocketEvent = (
  event: string,
  callback: (data: any) => void,
  deps: React.DependencyList = []
) => {
  const callbackRef = useRef(callback);
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const handler = (data: any) => {
      callbackRef.current(data);
    };

    websocketService.on(event, handler);
    
    return () => {
      websocketService.off(event, handler);
    };
  }, [event, ...deps]);
};

/**
 * Hook for real-time notifications
 */
export const useRealTimeNotifications = (
  onNotification?: (notification: any) => void
) => {
  useWebSocketEvent('notification_update', (data) => {
    if (data.action === 'create') {
      onNotification?.(data.data);
    }
  }, [onNotification]);
};

/**
 * Hook for real-time data updates
 */
export const useRealTimeUpdates = (
  entityType: string,
  onUpdate?: (action: string, data: any) => void
) => {
  useWebSocketEvent(`${entityType}_update`, (data) => {
    onUpdate?.(data.action, data.data);
  }, [entityType, onUpdate]);
};

export default useWebSocket;