import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * NETWORK STATUS INDICATOR COMPONENT
 * 
 * Monitors network connectivity and provides user feedback
 * Shows connection status and retry options when offline
 */

interface NetworkStatusProps {
  onRetry?: () => void;
  className?: string;
  showWhenOnline?: boolean;
}

export const NetworkStatus: React.FC<NetworkStatusProps> = ({
  onRetry,
  className = '',
  showWhenOnline = false
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (wasOffline) {
        setShowReconnected(true);
        setWasOffline(false);
        
        // Hide reconnected message after 3 seconds
        setTimeout(() => {
          setShowReconnected(false);
        }, 3000);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [wasOffline]);

  // Don't show anything if online and showWhenOnline is false
  if (isOnline && !showWhenOnline && !showReconnected) {
    return null;
  }

  if (!isOnline) {
    return (
      <Alert variant="destructive" className={className}>
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>You're offline. Some features may not work.</span>
          {onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRetry}
              className="ml-2 h-8"
            >
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (showReconnected) {
    return (
      <Alert variant="default" className={`border-green-200 bg-green-50 ${className}`}>
        <Wifi className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          Connection restored. You're back online!
        </AlertDescription>
      </Alert>
    );
  }

  if (showWhenOnline) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <Wifi className="h-4 w-4 text-green-500" />
        <span>Connected</span>
      </div>
    );
  }

  return null;
};

/**
 * Hook for monitoring network status
 */
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setConnectionQuality('good');
    };

    const handleOffline = () => {
      setIsOnline(false);
      setConnectionQuality('offline');
    };

    // Test connection quality periodically when online
    const testConnection = async () => {
      if (!navigator.onLine) return;

      try {
        const start = Date.now();
        const response = await fetch('/api/health', { 
          method: 'HEAD',
          cache: 'no-cache'
        });
        const duration = Date.now() - start;

        if (response.ok) {
          setConnectionQuality(duration > 2000 ? 'poor' : 'good');
        } else {
          setConnectionQuality('poor');
        }
      } catch (error) {
        setConnectionQuality('poor');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Test connection every 30 seconds when online
    const interval = setInterval(testConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,
    connectionQuality,
    isConnected: isOnline && connectionQuality !== 'offline'
  };
};

export default NetworkStatus;