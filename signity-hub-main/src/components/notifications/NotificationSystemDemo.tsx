import React, { useState } from 'react';
import { Bell, Settings, History, AlertTriangle, Clock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  NotificationBell, 
  NotificationCenter, 
  NotificationPreferences, 
  NotificationHistory,
  CriticalAlert,
  ReminderSystem,
  NotificationQueue,
  DeliveryStatusTracker,
  CriticalAlertData
} from './index';

/**
 * NOTIFICATION SYSTEM DEMO
 * 
 * Demonstrates how to integrate all notification components
 * This can be used as a reference for implementing the notification system
 * in different parts of the application
 */

export const NotificationSystemDemo: React.FC = () => {
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showReminderSystem, setShowReminderSystem] = useState(false);
  const [showNotificationQueue, setShowNotificationQueue] = useState(false);
  const [showDeliveryTracker, setShowDeliveryTracker] = useState(false);

  // Mock critical alert data
  const mockCriticalAlert: CriticalAlertData = {
    id: 'alert-1',
    title: 'System Maintenance Scheduled',
    message: 'The system will undergo maintenance tonight from 2:00 AM to 4:00 AM. Please save your work and log out before this time.',
    severity: 'high',
    type: 'system',
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    actionRequired: true,
    actionUrl: '/maintenance-info',
    actionText: 'View Details',
    acknowledged: false,
  };

  const handleAcknowledgeAlert = async (alertId: string) => {
    console.log('Acknowledging alert:', alertId);
    // In real app, this would make an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const handleDismissAlert = async (alertId: string) => {
    console.log('Dismissing alert:', alertId);
    // In real app, this would make an API call
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notification System Demo</h1>
        
        {/* Notification Bell - This would typically be in the header */}
        <NotificationBell className="relative" />
      </div>

      {/* Critical Alert Example */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Critical Alert Example</h2>
        <CriticalAlert
          alert={mockCriticalAlert}
          onAcknowledge={handleAcknowledgeAlert}
          onDismiss={handleDismissAlert}
        />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowNotificationCenter(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notification Center</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              View and manage all notifications with filtering and search
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowPreferences(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preferences</CardTitle>
            <Settings className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Configure notification delivery preferences and subscriptions
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowHistory(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">History</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Browse notification history with date filtering and export
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowReminderSystem(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reminders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Manage deadlines and important dates with recurring reminders
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowNotificationQueue(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Queue Manager</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Monitor offline notification queue and sync status
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowDeliveryTracker(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivery Status</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Track notification delivery across all channels
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Integration Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Integration Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Header Integration</h4>
            <p className="text-sm text-gray-600">
              Add the <code>NotificationBell</code> component to your header/navbar for easy access to notifications.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Real-time Updates</h4>
            <p className="text-sm text-gray-600">
              The notification service automatically subscribes to real-time updates via WebSocket/SSE when components are mounted.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Offline Support</h4>
            <p className="text-sm text-gray-600">
              Notifications are automatically queued when offline and synced when connection is restored.
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Critical Alerts</h4>
            <p className="text-sm text-gray-600">
              Use <code>CriticalAlert</code> components for system-wide alerts that require user acknowledgment.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Modal Components */}
      <NotificationCenter
        isOpen={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
      />

      <NotificationPreferences
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
      />

      <NotificationHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <ReminderSystem
        isOpen={showReminderSystem}
        onClose={() => setShowReminderSystem(false)}
      />

      <NotificationQueue
        isOpen={showNotificationQueue}
        onClose={() => setShowNotificationQueue(false)}
      />

      <DeliveryStatusTracker
        isOpen={showDeliveryTracker}
        onClose={() => setShowDeliveryTracker(false)}
      />
    </div>
  );
};