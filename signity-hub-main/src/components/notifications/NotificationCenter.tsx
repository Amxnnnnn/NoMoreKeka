import React, { useState, useEffect, useCallback } from 'react';
import { Bell, Filter, Search, Archive, Trash2, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { notificationService, Notification } from '@/services/notification.service';
import { useDataStore } from '@/stores/dataStore';
import { formatDistanceToNow } from 'date-fns';

/**
 * NOTIFICATION CENTER COMPONENT
 * 
 * Comprehensive notification management with:
 * - Real-time notification delivery
 * - Categorization and filtering
 * - Notification preferences
 * - History and archive system
 */

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NotificationFilters {
  type: string;
  isRead: string;
  search: string;
}

const NOTIFICATION_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'INFO', label: 'Information' },
  { value: 'SUCCESS', label: 'Success' },
  { value: 'WARNING', label: 'Warning' },
  { value: 'ERROR', label: 'Error' },
  { value: 'LEAVE_REQUEST', label: 'Leave Requests' },
  { value: 'LEAVE_APPROVED', label: 'Leave Approved' },
  { value: 'LEAVE_REJECTED', label: 'Leave Rejected' },
  { value: 'TASK_ASSIGNED', label: 'Task Assigned' },
  { value: 'PROJECT_UPDATE', label: 'Project Updates' },
];

const NOTIFICATION_ICONS = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertCircle,
  ERROR: AlertCircle,
  LEAVE_REQUEST: Bell,
  LEAVE_APPROVED: CheckCircle,
  LEAVE_REJECTED: X,
  TASK_ASSIGNED: Bell,
  PROJECT_UPDATE: Bell,
};

const NOTIFICATION_COLORS = {
  INFO: 'text-blue-500',
  SUCCESS: 'text-green-500',
  WARNING: 'text-yellow-500',
  ERROR: 'text-red-500',
  LEAVE_REQUEST: 'text-purple-500',
  LEAVE_APPROVED: 'text-green-500',
  LEAVE_REJECTED: 'text-red-500',
  TASK_ASSIGNED: 'text-blue-500',
  PROJECT_UPDATE: 'text-indigo-500',
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const { notifications, unreadCount, setNotifications, setUnreadCount } = useDataStore();
  
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<NotificationFilters>({
    type: 'all',
    isRead: 'all',
    search: '',
  });
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('all');

  // Load notifications on mount
  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen]);

  // Subscribe to real-time notifications
  useEffect(() => {
    const unsubscribe = notificationService.subscribeToRealTime((notification) => {
      // Add new notification to store
      useDataStore.getState().addNotification(notification);
      
      // Show toast for new notifications
      toast({
        title: notification.title,
        description: notification.message,
        variant: notification.type === 'SYSTEM_ALERT' ? 'destructive' : 'default',
      });
    });

    return unsubscribe;
  }, [toast]);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications({
        page: 1,
        limit: 100,
      });
      
      if (response.success) {
        setNotifications(response.data.notifications || []);
        setUnreadCount(response.data.unreadCount || 0);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [setNotifications, setUnreadCount, toast]);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      useDataStore.getState().markNotificationAsRead(notificationId);
      
      toast({
        title: 'Success',
        description: 'Notification marked as read',
      });
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

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      useDataStore.getState().removeNotification(notificationId);
      
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const handleBulkAction = async (action: 'read' | 'delete') => {
    if (selectedNotifications.length === 0) return;

    try {
      if (action === 'read') {
        // Mark selected as read
        await Promise.all(
          selectedNotifications.map(id => notificationService.markAsRead(id))
        );
        
        selectedNotifications.forEach(id => {
          useDataStore.getState().markNotificationAsRead(id);
        });
        
        toast({
          title: 'Success',
          description: `${selectedNotifications.length} notifications marked as read`,
        });
      } else if (action === 'delete') {
        // Delete selected
        await Promise.all(
          selectedNotifications.map(id => notificationService.deleteNotification(id))
        );
        
        selectedNotifications.forEach(id => {
          useDataStore.getState().removeNotification(id);
        });
        
        toast({
          title: 'Success',
          description: `${selectedNotifications.length} notifications deleted`,
        });
      }
      
      setSelectedNotifications([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: `Failed to ${action} notifications`,
        variant: 'destructive',
      });
    }
  };

  // Filter notifications based on current filters
  const filteredNotifications = notifications.filter(notification => {
    // Type filter
    if (filters.type !== 'all' && notification.type !== filters.type) {
      return false;
    }
    
    // Read status filter
    if (filters.isRead === 'read' && !notification.isRead) {
      return false;
    }
    if (filters.isRead === 'unread' && notification.isRead) {
      return false;
    }
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        notification.title.toLowerCase().includes(searchLower) ||
        notification.message.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  // Group notifications by tab
  const groupedNotifications = {
    all: filteredNotifications,
    unread: filteredNotifications.filter(n => !n.isRead),
    read: filteredNotifications.filter(n => n.isRead),
  };

  const renderNotificationItem = (notification: Notification) => {
    const IconComponent = NOTIFICATION_ICONS[notification.type] || Bell;
    const iconColor = NOTIFICATION_COLORS[notification.type] || 'text-gray-500';
    const isSelected = selectedNotifications.includes(notification.id);

    return (
      <Card 
        key={notification.id}
        className={`mb-2 transition-all duration-200 hover:shadow-md ${
          !notification.isRead ? 'border-l-4 border-l-blue-500 bg-blue-50/50' : ''
        } ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectedNotifications(prev => [...prev, notification.id]);
                } else {
                  setSelectedNotifications(prev => prev.filter(id => id !== notification.id));
                }
              }}
              className="mt-1"
            />
            
            <div className={`mt-1 ${iconColor}`}>
              <IconComponent size={16} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className={`text-sm font-medium ${!notification.isRead ? 'font-semibold' : ''}`}>
                  {notification.title}
                </h4>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {notification.type.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mt-1">
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center space-x-2">
                  {!notification.isRead && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="text-xs"
                    >
                      <CheckCircle size={12} className="mr-1" />
                      Mark as Read
                    </Button>
                  )}
                </div>
                
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeleteNotification(notification.id)}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  <Trash2 size={12} className="mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Bell className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold">Notification Center</h2>
              <p className="text-sm text-gray-600">
                {unreadCount} unread notifications
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              <CheckCircle size={16} className="mr-2" />
              Mark All Read
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Search notifications..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full"
              />
            </div>
            
            <Select
              value={filters.type}
              onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {NOTIFICATION_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select
              value={filters.isRead}
              onValueChange={(value) => setFilters(prev => ({ ...prev, isRead: value }))}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Bulk Actions */}
          {selectedNotifications.length > 0 && (
            <div className="flex items-center justify-between mt-3 p-2 bg-blue-50 rounded">
              <span className="text-sm text-blue-700">
                {selectedNotifications.length} notifications selected
              </span>
              
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('read')}
                >
                  Mark as Read
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSelectedNotifications([])}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
              <TabsTrigger value="all">
                All ({groupedNotifications.all.length})
              </TabsTrigger>
              <TabsTrigger value="unread">
                Unread ({groupedNotifications.unread.length})
              </TabsTrigger>
              <TabsTrigger value="read">
                Read ({groupedNotifications.read.length})
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="all" className="h-full mt-4">
                <ScrollArea className="h-full px-4">
                  {loading ? (
                    <div className="flex items-center justify-center h-32">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : groupedNotifications.all.length === 0 ? (
                    <div className="text-center py-8">
                      <Bell className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        You're all caught up! No notifications to display.
                      </p>
                    </div>
                  ) : (
                    groupedNotifications.all.map(renderNotificationItem)
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="unread" className="h-full mt-4">
                <ScrollArea className="h-full px-4">
                  {groupedNotifications.unread.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        No unread notifications.
                      </p>
                    </div>
                  ) : (
                    groupedNotifications.unread.map(renderNotificationItem)
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="read" className="h-full mt-4">
                <ScrollArea className="h-full px-4">
                  {groupedNotifications.read.length === 0 ? (
                    <div className="text-center py-8">
                      <Archive className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No read notifications</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Read notifications will appear here.
                      </p>
                    </div>
                  ) : (
                    groupedNotifications.read.map(renderNotificationItem)
                  )}
                </ScrollArea>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};