import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { offlineService } from '@/services/offline.service';
import { useNetworkStatus } from '@/components/ui/network-status';

/**
 * OFFLINE INDICATOR COMPONENT
 * 
 * Shows offline status, pending sync actions, and conflict notifications
 */

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
  onConflictClick?: (conflictId: string) => void;
}

export const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  className = '',
  showDetails = false,
  onConflictClick
}) => {
  const { isOnline, connectionQuality } = useNetworkStatus();
  const [offlineStatus, setOfflineStatus] = useState(offlineService.getOfflineStatus());
  const [conflicts, setConflicts] = useState(offlineService.getConflicts());

  useEffect(() => {
    const updateStatus = () => {
      setOfflineStatus(offlineService.getOfflineStatus());
      setConflicts(offlineService.getConflicts());
    };

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for conflict events
    const handleConflict = (event: CustomEvent) => {
      updateStatus();
    };

    window.addEventListener('data-conflict', handleConflict as EventListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener('data-conflict', handleConflict as EventListener);
    };
  }, []);

  const handleForceSync = async () => {
    try {
      await offlineService.forceSync();
      setOfflineStatus(offlineService.getOfflineStatus());
    } catch (error) {
      console.error('Force sync failed:', error);
    }
  };

  const getStatusIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    if (offlineStatus.syncInProgress) return <Clock className="h-4 w-4 animate-spin" />;
    if (offlineStatus.queueSize > 0) return <CloudOff className="h-4 w-4" />;
    if (conflicts.length > 0) return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusColor = () => {
    if (!isOnline) return 'destructive';
    if (conflicts.length > 0) return 'destructive';
    if (offlineStatus.queueSize > 0) return 'secondary';
    return 'default';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (offlineStatus.syncInProgress) return 'Syncing...';
    if (conflicts.length > 0) return `${conflicts.length} Conflict${conflicts.length > 1 ? 's' : ''}`;
    if (offlineStatus.queueSize > 0) return `${offlineStatus.queueSize} Pending`;
    return 'Online';
  };

  if (!showDetails && isOnline && offlineStatus.queueSize === 0 && conflicts.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main Status Indicator */}
      <div className="flex items-center gap-2">
        <Badge variant={getStatusColor()} className="flex items-center gap-1">
          {getStatusIcon()}
          <span className="text-xs">{getStatusText()}</span>
        </Badge>

        {connectionQuality === 'poor' && isOnline && (
          <Badge variant="outline" className="text-xs">
            <Wifi className="h-3 w-3 mr-1" />
            Slow Connection
          </Badge>
        )}
      </div>

      {/* Detailed Status */}
      {showDetails && (
        <div className="space-y-2">
          {/* Offline Alert */}
          {!isOnline && (
            <Alert variant="destructive">
              <WifiOff className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>You're offline. Changes will sync when connection is restored.</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.reload()}
                  className="ml-2 h-8"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Sync Progress */}
          {offlineStatus.syncInProgress && (
            <Alert>
              <Clock className="h-4 w-4 animate-spin" />
              <AlertDescription>
                <div className="space-y-2">
                  <span>Syncing {offlineStatus.queueSize} pending changes...</span>
                  <Progress value={undefined} className="w-full" />
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Pending Actions */}
          {offlineStatus.queueSize > 0 && !offlineStatus.syncInProgress && (
            <Alert>
              <CloudOff className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{offlineStatus.queueSize} changes waiting to sync</span>
                {isOnline && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleForceSync}
                    className="ml-2 h-8"
                  >
                    Sync Now
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Conflicts */}
          {conflicts.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <span>{conflicts.length} data conflict{conflicts.length > 1 ? 's' : ''} need resolution</span>
                  <div className="space-y-1">
                    {conflicts.slice(0, 3).map((conflict) => (
                      <div key={conflict.id} className="flex items-center justify-between text-sm">
                        <span className="capitalize">{conflict.entity} conflict</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onConflictClick?.(conflict.id)}
                          className="h-6 text-xs"
                        >
                          Resolve
                        </Button>
                      </div>
                    ))}
                    {conflicts.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{conflicts.length - 3} more conflicts
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * CONFLICT RESOLUTION DIALOG
 * 
 * Modal for resolving data conflicts
 */

interface ConflictResolutionDialogProps {
  conflictId: string;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (resolution: 'client' | 'server' | 'merge') => void;
}

export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  conflictId,
  isOpen,
  onClose,
  onResolve
}) => {
  const [conflict, setConflict] = useState(
    offlineService.getConflicts().find(c => c.id === conflictId)
  );

  useEffect(() => {
    if (isOpen && conflictId) {
      const foundConflict = offlineService.getConflicts().find(c => c.id === conflictId);
      setConflict(foundConflict);
    }
  }, [conflictId, isOpen]);

  if (!isOpen || !conflict) return null;

  const handleResolve = (resolution: 'client' | 'server' | 'merge') => {
    offlineService.resolveConflict(conflictId, resolution);
    onResolve(resolution);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Resolve Data Conflict</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              A conflict was detected for {conflict.entity}. Please choose which version to keep:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Version */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Your Changes</h3>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(conflict.clientData, null, 2)}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve('client')}
                  className="mt-2 w-full"
                >
                  Keep My Changes
                </Button>
              </div>

              {/* Server Version */}
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Server Version</h3>
                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(conflict.serverData, null, 2)}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve('server')}
                  className="mt-2 w-full"
                >
                  Keep Server Version
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                variant="default"
                onClick={() => handleResolve('merge')}
                className="w-full md:w-auto"
              >
                Merge Both Versions
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;