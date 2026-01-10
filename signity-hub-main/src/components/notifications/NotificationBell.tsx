import React, { useState, useEffect } from 'react';
import { Bell, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { notificationService, Notification } from '@/services/notification.service';
import { useDataStore } from '@/stores/dataStore';
import { NotificationCenter } from './NotificationCenter';
import { NotificationPreferences } from './NotificationPreferences';
import { NotificationHistory } from './NotificationHistory';
import { formatDistanceToNow } from 'date-fns';

/**
 * NOTIFICATION BELL COMPONENT
 * 
 * Header notification bell with:
 * - Unread count badge
 * - Quick preview popover
 * - Links to full notification center
 * - Real-time updates
 */

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
  className = '',
}) => {
  const { toast } = useToast();
  const { notifications, unreadCount, setNotifications, setUnreadCount } = useDataStore();
  
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [recentNotifications, setRecentNotifications] = useState<Notification[]>([]);

  // Load initial notifications and unread count
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
  }, []);

  // Subscribe to real-time notifications
  useEffect(() => {
    const unsubscribe = notificationService.subscribeToRealTime((notification) => {
      // Add new notification to store
      useDataStore.getState().addNotification(notification);
      
      // Update recent notifications for popover
      setRecentNotifications(prev => [notification, ...prev.slice(0, 4)]);
      
      // Show toast for new notifications (only if popover is not open)
      if (!isPopoverOpen) {
        toast({
          title: notification.title,
          description: notification.message,
          variant: notification.type === 'ERROR' ? 'destructive' : 'default',
        });
      }
    });

    return unsubscribe;
  }, [toast, isPopoverOpen]);

  // Update recent notifications when notifications change
  useEffect(() => {
    const recent = notifications
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
    setRecentNotifications(recent);
  }, [notifications]);

  const loadNotifications = async () => {
    try {
      const response = await notificationService.getNotifications({
        page: 1,
        limit: 10,
      });
      
      if (response.success) {
        setNotifications(response.data.notifications || []);
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const response = await notificationService.getUnreadCount();
      
      if (response.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error('Failed to load unread count:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      useDataStore.getState().markNotificationAsRead(notificationId);
      
      // Update recent notifications
      setRecentNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update all notifications in store
      const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      // Update recent notifications
      setRecentNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      
      setIsPopoverOpen(false);
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'ERROR':
        return '❌';
      case 'LEAVE_REQUEST':
        return '📅';
      case 'LEAVE_APPROVED':
        return '✅';
      case 'LEAVE_REJECTED':
        return '❌';
      case 'TASK_ASSIGNED':
        return '📋';
      case 'PROJECT_UPDATE':
        return '📊';
      default:
        return 'ℹ️';
    }
  };

  return (
    <>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`relative ${className}`}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0 min-w-[20px]"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-80 p-0" align="end">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreferences(true)}
                  className="p-1"
                >
                  <Settings size={16} />
                </Button>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleMarkAllAsRead}
                    className="text-xs"
                  >
                    Mark all read
                  </Button>
                )}
              </div>
            </div>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                {unreadCount} unread notifications
              </p>
            )}
          </div>
          
          <ScrollArea className="h-80">
            {recentNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              <div className="p-2">
                {recentNotifications.map((notification, index) => (
                  <div key={notification.id}>
                    <div
                      className={`p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.isRead ? 'bg-blue-50 border-l-2 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-lg">
                          {getNotificationIcon(notification.type)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'font-medium'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                          </p>
                        </div>
                        {!notification.isRead && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>
                        )}
                      </div>
                    </div>
                    {index < recentNotifications.length - 1 && <Separator className="my-1" />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <div className="p-3 border-t">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowHistory(true);
                  setIsPopoverOpen(false);
                }}
                className="text-xs"
              >
                View History
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowNotificationCenter(true);
                  setIsPopoverOpen(false);
                }}
                className="text-xs"
              >
                View All
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Notification Center Modal */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      {/* Notification Preferences Modal */}
      <NotificationPreferences
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />

      {/* Notification History Modal */}
      <NotificationHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </>
  );
};