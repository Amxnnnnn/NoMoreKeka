import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, Upload, Clock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

/**
 * NOTIFICATION QUEUE MANAGER
 * 
 * Manages notification queuing for offline scenarios:
 * - Queues notifications when offline
 * - Syncs when connection is restored
 * - Shows delivery status
 * - Handles retry logic
 * - Provides offline indicators
 */

export interface QueuedNotification {
  id: string;
  type: 'notification' | 'acknowledgment' | 'preference_update' | 'mark_read';
  payload: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error?: string;
}

interface NotificationQueueProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ConnectionStatus {
  isOnline: boolean;
  lastOnline?: Date;
  syncInProgress: boolean;
  queueSize: number;
}

export const NotificationQueue: React.FC<NotificationQueueProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [queue, setQueue] = useState<QueuedNotification[]>([]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    isOnline: navigator.onLine,
    syncInProgress: false,
    queueSize: 0,
  });
  const [syncProgress, setSyncProgress] = useState(0);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isOnline: true,
      }));
      
      // Auto-sync when coming back online
      if (queue.length > 0) {
        handleSyncQueue();
      }
      
      toast({
        title: 'Connection Restored',
        description: 'You are back online. Syncing queued notifications...',
      });
    };

    const handleOffline = () => {
      setConnectionStatus(prev => ({
        ...prev,
        isOnline: false,
        lastOnline: new Date(),
      }));
      
      toast({
        title: 'Connection Lost',
        description: 'You are offline. Notifications will be queued for later sync.',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [queue.length, toast]);

  // Update queue size in connection status
  useEffect(() => {
    setConnectionStatus(prev => ({
      ...prev,
      queueSize: queue.filter(item => item.status === 'pending').length,
    }));
  }, [queue]);

  // Load queued notifications from localStorage on mount
  useEffect(() => {
    const savedQueue = localStorage.getItem('notification-queue');
    if (savedQueue) {
      try {
        const parsedQueue = JSON.parse(savedQueue);
        setQueue(parsedQueue);
      } catch (error) {
        console.error('Failed to parse saved notification queue:', error);
      }
    }
  }, []);

  // Save queue to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('notification-queue', JSON.stringify(queue));
  }, [queue]);

  const addToQueue = (type: QueuedNotification['type'], payload: any) => {
    const queuedItem: QueuedNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    };

    setQueue(prev => [...prev, queuedItem]);
    
    // If online, try to sync immediately
    if (connectionStatus.isOnline) {
      syncSingleItem(queuedItem);
    }
  };

  const syncSingleItem = async (item: QueuedNotification) => {
    try {
      // Update status to syncing
      setQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, status: 'syncing' } : q
      ));

      // Simulate API call based on type
      await simulateAPICall(item);

      // Mark as synced
      setQueue(prev => prev.map(q => 
        q.id === item.id ? { ...q, status: 'synced' } : q
      ));

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      setQueue(prev => prev.map(q => 
        q.id === item.id ? { 
          ...q, 
          status: 'failed',
          error: errorMessage,
          retryCount: q.retryCount + 1
        } : q
      ));
    }
  };

  const simulateAPICall = async (item: QueuedNotification): Promise<void> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Network error');
    }
    
    // Process different types of queued items
    switch (item.type) {
      case 'notification':
        console.log('Syncing notification:', item.payload);
        break;
      case 'acknowledgment':
        console.log('Syncing acknowledgment:', item.payload);
        break;
      case 'preference_update':
        console.log('Syncing preference update:', item.payload);
        break;
      case 'mark_read':
        console.log('Syncing mark as read:', item.payload);
        break;
    }
  };

  const handleSyncQueue = async () => {
    if (!connectionStatus.isOnline || connectionStatus.syncInProgress) {
      return;
    }

    const pendingItems = queue.filter(item => 
      item.status === 'pending' || (item.status === 'failed' && item.retryCount < item.maxRetries)
    );

    if (pendingItems.length === 0) {
      toast({
        title: 'Queue Empty',
        description: 'No items to sync',
      });
      return;
    }

    setConnectionStatus(prev => ({ ...prev, syncInProgress: true }));
    setSyncProgress(0);

    try {
      for (let i = 0; i < pendingItems.length; i++) {
        const item = pendingItems[i];
        await syncSingleItem(item);
        setSyncProgress(((i + 1) / pendingItems.length) * 100);
      }

      toast({
        title: 'Sync Complete',
        description: `Successfully synced ${pendingItems.length} items`,
      });
    } catch (error) {
      toast({
        title: 'Sync Error',
        description: 'Some items failed to sync. They will be retried later.',
        variant: 'destructive',
      });
    } finally {
      setConnectionStatus(prev => ({ ...prev, syncInProgress: false }));
      setSyncProgress(0);
    }
  };

  const handleRetryItem = async (itemId: string) => {
    const item = queue.find(q => q.id === itemId);
    if (!item || !connectionStatus.isOnline) return;

    await syncSingleItem(item);
  };

  const handleRemoveItem = (itemId: string) => {
    setQueue(prev => prev.filter(q => q.id !== itemId));
    
    toast({
      title: 'Item Removed',
      description: 'Queued item has been removed',
    });
  };

  const handleClearCompleted = () => {
    setQueue(prev => prev.filter(q => q.status !== 'synced'));
    
    toast({
      title: 'Completed Items Cleared',
      description: 'All synced items have been removed from the queue',
    });
  };

  const getStatusIcon = (status: QueuedNotification['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="text-yellow-500" size={16} />;
      case 'syncing':
        return <Upload className="text-blue-500 animate-pulse" size={16} />;
      case 'synced':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'failed':
        return <AlertCircle className="text-red-500" size={16} />;
      default:
        return <Clock className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status: QueuedNotification['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'synced':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: QueuedNotification['type']) => {
    switch (type) {
      case 'notification':
        return 'Notification';
      case 'acknowledgment':
        return 'Acknowledgment';
      case 'preference_update':
        return 'Preferences';
      case 'mark_read':
        return 'Mark Read';
      default:
        return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            {connectionStatus.isOnline ? (
              <Wifi className="text-green-600" size={24} />
            ) : (
              <WifiOff className="text-red-600" size={24} />
            )}
            <div>
              <h2 className="text-xl font-semibold">Notification Queue</h2>
              <p className="text-sm text-gray-600">
                {connectionStatus.isOnline ? 'Online' : 'Offline'} • {connectionStatus.queueSize} pending items
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {connectionStatus.queueSize > 0 && connectionStatus.isOnline && (
              <Button
                variant="default"
                size="sm"
                onClick={handleSyncQueue}
                disabled={connectionStatus.syncInProgress}
              >
                {connectionStatus.syncInProgress ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Upload size={16} />
                )}
                <span className="ml-2">
                  {connectionStatus.syncInProgress ? 'Syncing...' : 'Sync Now'}
                </span>
              </Button>
            )}
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Connection Status */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${
                connectionStatus.isOnline ? 'text-green-600' : 'text-red-600'
              }`}>
                {connectionStatus.isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
                <span className="text-sm font-medium">
                  {connectionStatus.isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              
              {!connectionStatus.isOnline && connectionStatus.lastOnline && (
                <span className="text-sm text-gray-600">
                  Last online {formatDistanceToNow(connectionStatus.lastOnline, { addSuffix: true })}
                </span>
              )}
            </div>
            
            {queue.filter(q => q.status === 'synced').length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCompleted}
              >
                Clear Completed
              </Button>
            )}
          </div>
          
          {connectionStatus.syncInProgress && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                <span>Syncing queue...</span>
                <span>{Math.round(syncProgress)}%</span>
              </div>
              <Progress value={syncProgress} className="h-2" />
            </div>
          )}
        </div>

        {/* Queue Items */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {queue.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">Queue is empty</h3>
                <p className="mt-1 text-sm text-gray-500">
                  All notifications are synced and up to date.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {queue.map(item => (
                  <Card key={item.id} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="mt-1">
                            {getStatusIcon(item.status)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm font-medium">
                                {getTypeLabel(item.type)}
                              </h4>
                              <Badge className={`text-xs ${getStatusColor(item.status)}`}>
                                {item.status.toUpperCase()}
                              </Badge>
                              {item.retryCount > 0 && (
                                <Badge variant="outline" className="text-xs">
                                  Retry {item.retryCount}/{item.maxRetries}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-2">
                              {formatDistanceToNow(item.timestamp, { addSuffix: true })}
                            </p>
                            
                            {item.error && (
                              <p className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                Error: {item.error}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4">
                          {item.status === 'failed' && item.retryCount < item.maxRetries && connectionStatus.isOnline && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRetryItem(item.id)}
                              className="text-xs"
                            >
                              Retry
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              {queue.length} total items • {queue.filter(q => q.status === 'pending').length} pending • {queue.filter(q => q.status === 'synced').length} synced
            </span>
            
            {!connectionStatus.isOnline && (
              <span className="text-orange-600">
                Items will sync automatically when connection is restored
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Export utility functions for adding items to queue
export const useNotificationQueue = () => {
  const [queue, setQueue] = useState<QueuedNotification[]>([]);

  const addToQueue = (type: QueuedNotification['type'], payload: any) => {
    const queuedItem: QueuedNotification = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      type,
      payload,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending',
    };

    setQueue(prev => [...prev, queuedItem]);
    
    // Save to localStorage
    const savedQueue = localStorage.getItem('notification-queue');
    const currentQueue = savedQueue ? JSON.parse(savedQueue) : [];
    localStorage.setItem('notification-queue', JSON.stringify([...currentQueue, queuedItem]));
  };

  return { queue, addToQueue };
};