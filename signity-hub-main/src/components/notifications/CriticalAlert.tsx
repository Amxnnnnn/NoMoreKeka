import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Check, Clock, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

/**
 * CRITICAL ALERT COMPONENT
 * 
 * Displays critical system alerts that require user acknowledgment:
 * - System maintenance notifications
 * - Security alerts
 * - Policy updates
 * - Urgent deadlines
 * - Critical system errors
 */

export interface CriticalAlertData {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: 'system' | 'security' | 'policy' | 'deadline' | 'error';
  createdAt: string;
  expiresAt?: string;
  actionRequired: boolean;
  actionUrl?: string;
  actionText?: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

interface CriticalAlertProps {
  alert: CriticalAlertData;
  onAcknowledge: (alertId: string) => Promise<void>;
  onDismiss: (alertId: string) => Promise<void>;
  className?: string;
}

const SEVERITY_COLORS = {
  low: 'border-blue-500 bg-blue-50',
  medium: 'border-yellow-500 bg-yellow-50',
  high: 'border-orange-500 bg-orange-50',
  critical: 'border-red-500 bg-red-50',
};

const SEVERITY_ICONS = {
  low: '🔵',
  medium: '🟡',
  high: '🟠',
  critical: '🔴',
};

const TYPE_ICONS = {
  system: '⚙️',
  security: '🔒',
  policy: '📋',
  deadline: '⏰',
  error: '❌',
};

export const CriticalAlert: React.FC<CriticalAlertProps> = ({
  alert,
  onAcknowledge,
  onDismiss,
  className = '',
}) => {
  const { toast } = useToast();
  const [acknowledging, setAcknowledging] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  // Update time remaining for expiring alerts
  useEffect(() => {
    if (!alert.expiresAt) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const expiresAt = new Date(alert.expiresAt!);
      
      if (now >= expiresAt) {
        setTimeRemaining('Expired');
        return;
      }
      
      const remaining = formatDistanceToNow(expiresAt, { addSuffix: true });
      setTimeRemaining(`Expires ${remaining}`);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [alert.expiresAt]);

  const handleAcknowledge = async () => {
    try {
      setAcknowledging(true);
      await onAcknowledge(alert.id);
      
      toast({
        title: 'Alert Acknowledged',
        description: 'The alert has been acknowledged successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setAcknowledging(false);
    }
  };

  const handleDismiss = async () => {
    try {
      setDismissing(true);
      await onDismiss(alert.id);
      
      toast({
        title: 'Alert Dismissed',
        description: 'The alert has been dismissed.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to dismiss alert. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDismissing(false);
    }
  };

  const handleActionClick = () => {
    if (alert.actionUrl) {
      window.open(alert.actionUrl, '_blank');
    }
  };

  return (
    <Card className={`${SEVERITY_COLORS[alert.severity]} border-l-4 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Alert Icon */}
          <div className="flex-shrink-0 mt-1">
            <div className="flex items-center space-x-1">
              <span className="text-lg">{TYPE_ICONS[alert.type]}</span>
              <span className="text-sm">{SEVERITY_ICONS[alert.severity]}</span>
            </div>
          </div>

          {/* Alert Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {alert.title}
                  </h3>
                  <Badge 
                    variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {alert.severity.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {alert.type.toUpperCase()}
                  </Badge>
                </div>

                <p className="text-gray-700 mb-3 leading-relaxed">
                  {alert.message}
                </p>

                {/* Alert Metadata */}
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                  <div className="flex items-center space-x-1">
                    <Clock size={14} />
                    <span>
                      {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  {alert.expiresAt && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center space-x-1">
                        <AlertTriangle size={14} />
                        <span className={timeRemaining === 'Expired' ? 'text-red-600 font-medium' : ''}>
                          {timeRemaining}
                        </span>
                      </div>
                    </>
                  )}
                  
                  {alert.acknowledged && alert.acknowledgedAt && (
                    <>
                      <Separator orientation="vertical" className="h-4" />
                      <div className="flex items-center space-x-1 text-green-600">
                        <Check size={14} />
                        <span>
                          Acknowledged {formatDistanceToNow(new Date(alert.acknowledgedAt), { addSuffix: true })}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                {/* Action Button */}
                {alert.actionRequired && alert.actionUrl && alert.actionText && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleActionClick}
                    className="mb-3"
                  >
                    <ExternalLink size={14} className="mr-2" />
                    {alert.actionText}
                  </Button>
                )}
              </div>
            </div>

            {/* Alert Actions */}
            {!alert.acknowledged && (
              <div className="flex items-center justify-end space-x-2 pt-3 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  disabled={dismissing}
                  className="text-gray-600 hover:text-gray-800"
                >
                  {dismissing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  ) : (
                    <X size={16} />
                  )}
                  <span className="ml-2">Dismiss</span>
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAcknowledge}
                  disabled={acknowledging}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {acknowledging ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Check size={16} />
                  )}
                  <span className="ml-2">Acknowledge</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};