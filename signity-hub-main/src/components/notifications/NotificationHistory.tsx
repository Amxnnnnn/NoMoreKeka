import React, { useState, useEffect } from 'react';
import { History, Calendar, Filter, Download, Archive, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import { useToast } from '@/hooks/use-toast';
import { notificationService, Notification } from '@/services/notification.service';
import { format, startOfDay, endOfDay, subDays, subWeeks, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';

/**
 * NOTIFICATION HISTORY COMPONENT
 * 
 * Provides comprehensive notification history with:
 * - Date range filtering
 * - Category filtering
 * - Search functionality
 * - Export capabilities
 * - Archive management
 */

interface NotificationHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HistoryFilters {
  dateRange: DateRange | undefined;
  type: string;
  search: string;
  status: string;
}

const QUICK_DATE_RANGES = [
  {
    label: 'Today',
    getValue: () => ({
      from: startOfDay(new Date()),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 7 days',
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 7)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 30 days',
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 30)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: 'Last 3 months',
    getValue: () => ({
      from: startOfDay(subMonths(new Date(), 3)),
      to: endOfDay(new Date()),
    }),
  },
];

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

export const NotificationHistory: React.FC<NotificationHistoryProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filters, setFilters] = useState<HistoryFilters>({
    dateRange: {
      from: startOfDay(subDays(new Date(), 30)),
      to: endOfDay(new Date()),
    },
    type: 'all',
    search: '',
    status: 'all',
  });

  // Load notification history on mount and filter changes
  useEffect(() => {
    if (isOpen) {
      loadNotificationHistory();
    }
  }, [isOpen, filters.dateRange, filters.type]);

  const loadNotificationHistory = async () => {
    try {
      setLoading(true);
      
      const params: any = {
        page: 1,
        limit: 500, // Load more for history
      };
      
      if (filters.type !== 'all') {
        params.type = filters.type;
      }
      
      const response = await notificationService.getNotifications(params);
      
      if (response.success) {
        let historyNotifications = response.data.notifications || [];
        
        // Filter by date range
        if (filters.dateRange?.from && filters.dateRange?.to) {
          historyNotifications = historyNotifications.filter(notification => {
            const notificationDate = new Date(notification.createdAt);
            return notificationDate >= filters.dateRange!.from! && 
                   notificationDate <= filters.dateRange!.to!;
          });
        }
        
        setNotifications(historyNotifications);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notification history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDateRange = (range: DateRange) => {
    setFilters(prev => ({
      ...prev,
      dateRange: range,
    }));
  };

  const handleExportHistory = () => {
    try {
      const filteredNotifications = getFilteredNotifications();
      
      // Create CSV content
      const csvHeaders = ['Date', 'Type', 'Title', 'Message', 'Status'];
      const csvRows = filteredNotifications.map(notification => [
        format(new Date(notification.createdAt), 'yyyy-MM-dd HH:mm:ss'),
        notification.type,
        `"${notification.title.replace(/"/g, '""')}"`,
        `"${notification.message.replace(/"/g, '""')}"`,
        notification.isRead ? 'Read' : 'Unread',
      ]);
      
      const csvContent = [csvHeaders, ...csvRows]
        .map(row => row.join(','))
        .join('\n');
      
      // Download CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `notification-history-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Success',
        description: 'Notification history exported successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to export notification history',
        variant: 'destructive',
      });
    }
  };

  const getFilteredNotifications = () => {
    return notifications.filter(notification => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          notification.title.toLowerCase().includes(searchLower) ||
          notification.message.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (filters.status === 'read' && !notification.isRead) return false;
      if (filters.status === 'unread' && notification.isRead) return false;
      
      return true;
    });
  };

  const filteredNotifications = getFilteredNotifications();

  // Group notifications by date
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const date = format(new Date(notification.createdAt), 'yyyy-MM-dd');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(notification);
    return groups;
  }, {} as Record<string, Notification[]>);

  const sortedDates = Object.keys(groupedNotifications).sort((a, b) => b.localeCompare(a));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <History className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold">Notification History</h2>
              <p className="text-sm text-gray-600">
                View and manage your notification history
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportHistory}
              disabled={filteredNotifications.length === 0}
            >
              <Download size={16} className="mr-2" />
              Export
            </Button>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              ×
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date Range */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Date Range
              </label>
              <DatePickerWithRange
                date={filters.dateRange}
                onDateChange={(range) => setFilters(prev => ({ ...prev, dateRange: range }))}
              />
            </div>
            
            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Type
              </label>
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
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
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Search */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Search
              </label>
              <Input
                placeholder="Search notifications..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>
          
          {/* Quick Date Ranges */}
          <div className="flex items-center space-x-2 mt-4">
            <span className="text-sm text-gray-600">Quick ranges:</span>
            {QUICK_DATE_RANGES.map(range => (
              <Button
                key={range.label}
                variant="outline"
                size="sm"
                onClick={() => handleQuickDateRange(range.getValue())}
                className="text-xs"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="text-center py-8">
                <Archive className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters to see more results.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {sortedDates.map(date => (
                  <div key={date}>
                    <div className="flex items-center space-x-2 mb-3">
                      <Calendar size={16} className="text-gray-500" />
                      <h3 className="text-sm font-medium text-gray-900">
                        {format(new Date(date), 'EEEE, MMMM d, yyyy')}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        {groupedNotifications[date].length} notifications
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 ml-6">
                      {groupedNotifications[date].map(notification => (
                        <Card key={notification.id} className="hover:shadow-sm transition-shadow">
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h4 className="text-sm font-medium">
                                    {notification.title}
                                  </h4>
                                  <Badge 
                                    variant={notification.isRead ? "secondary" : "default"}
                                    className="text-xs"
                                  >
                                    {notification.type.replace('_', ' ')}
                                  </Badge>
                                  {!notification.isRead && (
                                    <Badge variant="destructive" className="text-xs">
                                      Unread
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">
                                  {notification.message}
                                </p>
                              </div>
                              
                              <div className="text-xs text-gray-500 ml-4">
                                {format(new Date(notification.createdAt), 'HH:mm')}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </span>
            
            {filters.dateRange?.from && filters.dateRange?.to && (
              <span>
                {format(filters.dateRange.from, 'MMM d, yyyy')} - {format(filters.dateRange.to, 'MMM d, yyyy')}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};