import React, { useState, useEffect } from 'react';
import { Settings, Bell, Mail, Smartphone, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { notificationService, NotificationPreferences as NotificationPreferencesType } from '@/services/notification.service';

/**
 * NOTIFICATION PREFERENCES COMPONENT
 * 
 * Allows users to manage their notification preferences including:
 * - Email notifications
 * - Push notifications
 * - Category-specific preferences
 * - Subscription management
 */

interface NotificationPreferencesProps {
  isOpen: boolean;
  onClose: () => void;
}

const PREFERENCE_CATEGORIES = [
  {
    key: 'leaveRequests' as keyof NotificationPreferencesType,
    label: 'Leave Requests',
    description: 'Notifications about leave applications and approvals',
    icon: Bell,
  },
  {
    key: 'taskAssignments' as keyof NotificationPreferencesType,
    label: 'Task Assignments',
    description: 'Notifications when tasks are assigned to you',
    icon: Bell,
  },
  {
    key: 'projectUpdates' as keyof NotificationPreferencesType,
    label: 'Project Updates',
    description: 'Notifications about project status changes',
    icon: Bell,
  },
  {
    key: 'systemAlerts' as keyof NotificationPreferencesType,
    label: 'System Alerts',
    description: 'Important system notifications and maintenance alerts',
    icon: Bell,
  },
];

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferencesType>({
    emailNotifications: true,
    pushNotifications: true,
    leaveRequests: true,
    taskAssignments: true,
    projectUpdates: true,
    systemAlerts: true,
  });

  // Load preferences on mount
  useEffect(() => {
    if (isOpen) {
      loadPreferences();
    }
  }, [isOpen]);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getPreferences();
      
      if (response.success) {
        setPreferences(response.data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notification preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePreferences = async () => {
    try {
      setSaving(true);
      const response = await notificationService.updatePreferences(preferences);
      
      if (response.success) {
        toast({
          title: 'Success',
          description: 'Notification preferences updated successfully',
        });
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notification preferences',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferencesType, value: boolean) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleResetToDefaults = () => {
    setPreferences({
      emailNotifications: true,
      pushNotifications: true,
      leaveRequests: true,
      taskAssignments: true,
      projectUpdates: true,
      systemAlerts: true,
    });
    
    toast({
      title: 'Reset',
      description: 'Preferences reset to defaults',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Settings className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold">Notification Preferences</h2>
              <p className="text-sm text-gray-600">
                Manage how you receive notifications
              </p>
            </div>
          </div>
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Delivery Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell size={20} />
                  <span>Delivery Methods</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Mail className="text-gray-500" size={20} />
                    <div>
                      <Label htmlFor="email-notifications" className="text-sm font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-xs text-gray-500">
                        Receive notifications via email
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="email-notifications"
                    checked={preferences.emailNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('emailNotifications', checked)}
                  />
                </div>
                
                <Separator />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="text-gray-500" size={20} />
                    <div>
                      <Label htmlFor="push-notifications" className="text-sm font-medium">
                        Push Notifications
                      </Label>
                      <p className="text-xs text-gray-500">
                        Receive browser push notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="push-notifications"
                    checked={preferences.pushNotifications}
                    onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell size={20} />
                  <span>Notification Categories</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {PREFERENCE_CATEGORIES.map((category, index) => (
                  <div key={category.key}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <category.icon className="text-gray-500" size={20} />
                        <div>
                          <Label htmlFor={category.key} className="text-sm font-medium">
                            {category.label}
                          </Label>
                          <p className="text-xs text-gray-500">
                            {category.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id={category.key}
                        checked={preferences[category.key]}
                        onCheckedChange={(checked) => handlePreferenceChange(category.key, checked)}
                      />
                    </div>
                    {index < PREFERENCE_CATEGORIES.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleResetToDefaults}
                className="flex items-center space-x-2"
              >
                <RefreshCw size={16} />
                <span>Reset to Defaults</span>
              </Button>
              
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSavePreferences}
                  disabled={saving}
                  className="flex items-center space-x-2"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save size={16} />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};