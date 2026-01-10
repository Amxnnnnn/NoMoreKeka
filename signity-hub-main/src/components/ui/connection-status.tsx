import React, { useState, useEffect } from 'react';
import { websocketService, ConnectionStatus } from '@/services/websocket.service';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
  showReconnectButton?: boolean;
}

export const ConnectionStatusIndicator: React.FC<ConnectionStatusIndicatorProps> = ({
  className,
  showDetails = false,
  showReconnectButton = false,
}) => {
  const [status, setStatus] = useState<ConnectionStatus>(websocketService.getConnectionStatus());
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(websocketService.getConnectionStatus());
    };

    const handleConnection = (data: any) => {
      updateStatus();
      if (data.status === 'connected') {
        setIsReconnecting(false);
      }
    };

    const handleNetwork = (data: any) => {
      updateStatus();
    };

    // Initial status update
    updateStatus();

    // Listen for connection changes
    websocketService.on('connection', handleConnection);
    websocketService.on('network', handleNetwork);

    // Update status periodically
    const interval = setInterval(updateStatus, 5000);

    return () => {
      websocketService.off('connection', handleConnection);
      websocketService.off('network', handleNetwork);
      clearInterval(interval);
    };
  }, []);

  const handleReconnect = async () => {
    setIsReconnecting(true);
    websocketService.reconnect();
    
    // Reset reconnecting state after a delay
    setTimeout(() => setIsReconnecting(false), 3000);
  };

  const getStatusColor = () => {
    if (!status.isOnline) return 'destructive';
    if (status.isConnected) return 'default';
    if (status.isConnecting || isReconnecting) return 'secondary';
    return 'destructive';
  };

  const getStatusText = () => {
    if (!status.isOnline) return 'Offline';
    if (status.isConnected) return 'Connected';
    if (status.isConnecting || isReconnecting) return 'Connecting...';
    return 'Disconnected';
  };

  const getStatusIcon = () => {
    if (!status.isOnline) return <WifiOff className="h-3 w-3" />;
    if (status.isConnected) return <Wifi className="h-3 w-3" />;
    if (status.isConnecting || isReconnecting) return <RefreshCw className="h-3 w-3 animate-spin" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  const getTooltipContent = () => {
    const lines = [
      `Status: ${getStatusText()}`,
      `Network: ${status.isOnline ? 'Online' : 'Offline'}`,
    ];

    if (status.queuedMessages > 0) {
      lines.push(`Queued messages: ${status.queuedMessages}`);
    }

    if (status.reconnectAttempts > 0) {
      lines.push(`Reconnect attempts: ${status.reconnectAttempts}`);
    }

    if (status.lastConnected) {
      lines.push(`Last connected: ${status.lastConnected.toLocaleTimeString()}`);
    }

    return lines.join('\n');
  };

  if (!showDetails) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge 
              variant={getStatusColor()} 
              className={cn("flex items-center gap-1", className)}
            >
              {getStatusIcon()}
              <span className="text-xs">{getStatusText()}</span>
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <pre className="text-xs whitespace-pre-line">{getTooltipContent()}</pre>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge variant={getStatusColor()} className="flex items-center gap-1">
        {getStatusIcon()}
        <span className="text-xs">{getStatusText()}</span>
      </Badge>
      
      {showDetails && (
        <div className="text-xs text-muted-foreground">
          {status.queuedMessages > 0 && (
            <span className="mr-2">Queue: {status.queuedMessages}</span>
          )}
          {status.reconnectAttempts > 0 && (
            <span className="mr-2">Attempts: {status.reconnectAttempts}</span>
          )}
        </div>
      )}
      
      {showReconnectButton && !status.isConnected && status.isOnline && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleReconnect}
          disabled={isReconnecting || status.isConnecting}
          className="h-6 px-2 text-xs"
        >
          {isReconnecting ? (
            <RefreshCw className="h-3 w-3 animate-spin" />
          ) : (
            'Reconnect'
          )}
        </Button>
      )}
    </div>
  );
};

export default ConnectionStatusIndicator;