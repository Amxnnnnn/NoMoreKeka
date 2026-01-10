import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, AlertCircle, Send, Mail, Smartphone, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';

/**
 * DELIVERY STATUS TRACKER
 * 
 * Tracks notification delivery status across different channels:
 * - In-app notifications
 * - Email notifications
 * - Push notifications
 * - Delivery confirmations
 * - Retry attempts
 * - Failure reasons
 */

export interface DeliveryStatus {
  id: string;
  notificationId: string;
  notificationTitle: string;
  notificationMessage: string;
  channels: {
    inApp: DeliveryChannelStatus;
    email: DeliveryChannelStatus;
    push: DeliveryChannelStatus;
  };
  createdAt: string;
  updatedAt: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId: string;
  userEmail?: string;
}

export interface DeliveryChannelStatus {
  enabled: boolean;
  status: 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'skipped';
  sentAt?: string;
  deliveredAt?: string;
  readAt?: string;
  failedAt?: string;
  error?: string;
  retryCount: number;
  maxRetries: number;
  nextRetryAt?: string;
}

interface DeliveryStatusTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CHANNEL_ICONS = {
  inApp: Send,
  email: Mail,
  push: Smartphone,
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  sent: 'bg-blue-100 text-blue-800',
  delivered: 'bg-green-100 text-green-800',
  read: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  skipped: 'bg-gray-100 text-gray-800',
};

const STATUS_ICONS = {
  pending: Clock,
  sent: Send,
  delivered: CheckCircle,
  read: CheckCircle,
  failed: AlertCircle,
  skipped: X,
};

export const DeliveryStatusTracker: React.FC<DeliveryStatusTrackerProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [deliveryStatuses, setDeliveryStatuses] = useState<DeliveryStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'delivered' | 'failed'>('all');

  // Load delivery statuses on mount
  useEffect(() => {
    if (isOpen) {
      loadDeliveryStatuses();
    }
  }, [isOpen]);

  // Simulate real-time updates
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // Simulate status updates
      setDeliveryStatuses(prev => prev.map(status => {
        const updatedChannels = { ...status.channels };
        
        // Randomly update pending statuses
        Object.keys(updatedChannels).forEach(channelKey => {
          const channel = updatedChannels[channelKey as keyof typeof updatedChannels];
          
          if (channel.status === 'pending' && Math.random() < 0.1) {
            if (Math.random() < 0.8) {
              // Success
              channel.status = 'sent';
              channel.sentAt = new Date().toISOString();
            } else {
              // Failure
              channel.status = 'failed';
              channel.failedAt = new Date().toISOString();
              channel.error = 'Network timeout';
              channel.retryCount += 1;
              
              if (channel.retryCount < channel.maxRetries) {
                channel.nextRetryAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 minutes
              }
            }
          } else if (channel.status === 'sent' && Math.random() < 0.05) {
            channel.status = 'delivered';
            channel.deliveredAt = new Date().toISOString();
          } else if (channel.status === 'delivered' && Math.random() < 0.02) {
            channel.status = 'read';
            channel.readAt = new Date().toISOString();
          }
        });
        
        return {
          ...status,
          channels: updatedChannels,
          updatedAt: new Date().toISOString(),
        };
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const loadDeliveryStatuses = async () => {
    try {
      setLoading(true);
      
      // Mock data - in real app, this would be an API call
      const mockStatuses: DeliveryStatus[] = [
        {
          id: '1',
          notificationId: 'notif-1',
          notificationTitle: 'Leave Request Approved',
          notificationMessage: 'Your leave request for March 15-17 has been approved.',
          channels: {
            inApp: {
              enabled: true,
              status: 'read',
              sentAt: new Date(Date.now() - 3600000).toISOString(),
              deliveredAt: new Date(Date.now() - 3500000).toISOString(),
              readAt: new Date(Date.now() - 3000000).toISOString(),
              retryCount: 0,
              maxRetries: 3,
            },
            email: {
              enabled: true,
              status: 'delivered',
              sentAt: new Date(Date.now() - 3600000).toISOString(),
              deliveredAt: new Date(Date.now() - 3400000).toISOString(),
              retryCount: 0,
              maxRetries: 3,
            },
            push: {
              enabled: false,
              status: 'skipped',
              retryCount: 0,
              maxRetries: 3,
            },
          },
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          updatedAt: new Date(Date.now() - 3000000).toISOString(),
          priority: 'high',
          userId: 'user-1',
          userEmail: 'user@example.com',
        },
        {
          id: '2',
          notificationId: 'notif-2',
          notificationTitle: 'New Task Assigned',
          notificationMessage: 'You have been assigned a new task: Update user documentation.',
          channels: {
            inApp: {
              enabled: true,
              status: 'pending',
              retryCount: 0,
              maxRetries: 3,
            },
            email: {
              enabled: true,
              status: 'sent',
              sentAt: new Date(Date.now() - 300000).toISOString(),
              retryCount: 0,
              maxRetries: 3,
            },
            push: {
              enabled: true,
              status: 'failed',
              failedAt: new Date(Date.now() - 240000).toISOString(),
              error: 'Push service unavailable',
              retryCount: 1,
              maxRetries: 3,
              nextRetryAt: new Date(Date.now() + 300000).toISOString(),
            },
          },
          createdAt: new Date(Date.now() - 300000).toISOString(),
          updatedAt: new Date(Date.now() - 240000).toISOString(),
          priority: 'medium',
          userId: 'user-1',
          userEmail: 'user@example.com',
        },
        {
          id: '3',
          notificationId: 'notif-3',
          notificationTitle: 'System Maintenance',
          notificationMessage: 'Scheduled maintenance will occur tonight from 2-4 AM.',
          channels: {
            inApp: {
              enabled: true,
              status: 'delivered',
              sentAt: new Date(Date.now() - 1800000).toISOString(),
              deliveredAt: new Date(Date.now() - 1700000).toISOString(),
              retryCount: 0,
              maxRetries: 3,
            },
            email: {
              enabled: true,
              status: 'delivered',
              sentAt: new Date(Date.now() - 1800000).toISOString(),
              deliveredAt: new Date(Date.now() - 1750000).toISOString(),
              retryCount: 0,
              maxRetries: 3,
            },
            push: {
              enabled: true,
              status: 'delivered',
              sentAt: new Date(Date.now() - 1800000).toISOString(),
              deliveredAt: new Date(Date.now() - 1780000).toISOString(),
              retryCount: 0,
              maxRetries: 3,
            },
          },
          createdAt: new Date(Date.now() - 1800000).toISOString(),
          updatedAt: new Date(Date.now() - 1700000).toISOString(),
          priority: 'urgent',
          userId: 'user-1',
          userEmail: 'user@example.com',
        },
      ];
      
      setDeliveryStatuses(mockStatuses);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load delivery statuses',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryDelivery = async (statusId: string, channel: keyof DeliveryStatus['channels']) => {
    try {
      setDeliveryStatuses(prev => prev.map(status => {
        if (status.id === statusId) {
          const updatedChannels = { ...status.channels };
          const channelStatus = updatedChannels[channel];
          
          if (channelStatus.status === 'failed' && channelStatus.retryCount < channelStatus.maxRetries) {
            channelStatus.status = 'pending';
            channelStatus.error = undefined;
            channelStatus.nextRetryAt = undefined;
          }
          
          return {
            ...status,
            channels: updatedChannels,
            updatedAt: new Date().toISOString(),
          };
        }
        return status;
      }));
      
      toast({
        title: 'Retry Initiated',
        description: `Retrying ${channel} delivery...`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to retry delivery',
        variant: 'destructive',
      });
    }
  };

  const getFilteredStatuses = () => {
    return deliveryStatuses.filter(status => {
      switch (filter) {
        case 'pending':
          return Object.values(status.channels).some(channel => 
            channel.enabled && (channel.status === 'pending' || channel.status === 'sent')
          );
        case 'delivered':
          return Object.values(status.channels).some(channel => 
            channel.enabled && (channel.status === 'delivered' || channel.status === 'read')
          );
        case 'failed':
          return Object.values(status.channels).some(channel => 
            channel.enabled && channel.status === 'failed'
          );
        default:
          return true;
      }
    });
  };

  const getOverallProgress = (status: DeliveryStatus) => {
    const enabledChannels = Object.values(status.channels).filter(channel => channel.enabled);
    if (enabledChannels.length === 0) return 0;
    
    const completedChannels = enabledChannels.filter(channel => 
      channel.status === 'delivered' || channel.status === 'read'
    );
    
    return (completedChannels.length / enabledChannels.length) * 100;
  };

  const renderChannelStatus = (
    channelKey: keyof DeliveryStatus['channels'],
    channel: DeliveryChannelStatus,
    statusId: string
  ) => {
    const IconComponent = CHANNEL_ICONS[channelKey];
    const StatusIcon = STATUS_ICONS[channel.status];
    
    if (!channel.enabled) {
      return (
        <div className="flex items-center space-x-2 text-gray-400">
          <IconComponent size={16} />
          <span className="text-xs">Disabled</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-between p-3 border rounded-lg">
        <div className="flex items-center space-x-3">
          <IconComponent size={16} className="text-gray-600" />
          <div>
            <div className="flex items-center space-x-2">
              <StatusIcon size={14} />
              <Badge className={`text-xs ${STATUS_COLORS[channel.status]}`}>
                {channel.status.toUpperCase()}
              </Badge>
            </div>
            
            <div className="text-xs text-gray-500 mt-1">
              {channel.sentAt && (
                <div>Sent: {format(new Date(channel.sentAt), 'HH:mm:ss')}</div>
              )}
              {channel.deliveredAt && (
                <div>Delivered: {format(new Date(channel.deliveredAt), 'HH:mm:ss')}</div>
              )}
              {channel.readAt && (
                <div>Read: {format(new Date(channel.readAt), 'HH:mm:ss')}</div>
              )}
              {channel.error && (
                <div className="text-red-600">Error: {channel.error}</div>
              )}
              {channel.nextRetryAt && (
                <div>Next retry: {formatDistanceToNow(new Date(channel.nextRetryAt), { addSuffix: true })}</div>
              )}
            </div>
          </div>
        </div>
        
        {channel.status === 'failed' && channel.retryCount < channel.maxRetries && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRetryDelivery(statusId, channelKey)}
            className="text-xs"
          >
            Retry ({channel.retryCount}/{channel.maxRetries})
          </Button>
        )}
      </div>
    );
  };

  const filteredStatuses = getFilteredStatuses();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Send className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold">Delivery Status Tracker</h2>
              <p className="text-sm text-gray-600">
                Monitor notification delivery across all channels
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <Tabs value={filter} onValueChange={(value: any) => setFilter(value)}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All ({deliveryStatuses.length})</TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({deliveryStatuses.filter(s => 
                  Object.values(s.channels).some(c => c.enabled && (c.status === 'pending' || c.status === 'sent'))
                ).length})
              </TabsTrigger>
              <TabsTrigger value="delivered">
                Delivered ({deliveryStatuses.filter(s => 
                  Object.values(s.channels).some(c => c.enabled && (c.status === 'delivered' || c.status === 'read'))
                ).length})
              </TabsTrigger>
              <TabsTrigger value="failed">
                Failed ({deliveryStatuses.filter(s => 
                  Object.values(s.channels).some(c => c.enabled && c.status === 'failed')
                ).length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredStatuses.length === 0 ? (
              <div className="text-center py-8">
                <Send className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No delivery statuses</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Delivery statuses will appear here when notifications are sent.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredStatuses.map(status => {
                  const progress = getOverallProgress(status);
                  
                  return (
                    <Card key={status.id} className="hover:shadow-sm transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{status.notificationTitle}</CardTitle>
                            <p className="text-sm text-gray-600 mt-1">
                              {status.notificationMessage}
                            </p>
                            
                            <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                              <span>
                                Created {formatDistanceToNow(new Date(status.createdAt), { addSuffix: true })}
                              </span>
                              <span>
                                Updated {formatDistanceToNow(new Date(status.updatedAt), { addSuffix: true })}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {status.priority.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {Math.round(progress)}% Delivered
                            </div>
                            <Progress value={progress} className="w-24 h-2 mt-1" />
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {Object.entries(status.channels).map(([channelKey, channel]) => (
                            <div key={channelKey}>
                              <h4 className="text-sm font-medium mb-2 capitalize">
                                {channelKey === 'inApp' ? 'In-App' : channelKey}
                              </h4>
                              {renderChannelStatus(
                                channelKey as keyof DeliveryStatus['channels'],
                                channel,
                                status.id
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};