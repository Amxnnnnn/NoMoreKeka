import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Bell, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format, formatDistanceToNow, addDays, addWeeks, addMonths, isBefore, isAfter } from 'date-fns';

/**
 * REMINDER SYSTEM COMPONENT
 * 
 * Comprehensive reminder management with:
 * - Deadline reminders
 * - Recurring reminders
 * - Custom reminder creation
 * - Snooze functionality
 * - Priority levels
 */

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'deadline' | 'meeting' | 'task' | 'leave' | 'custom';
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    endDate?: string;
  };
  completed: boolean;
  snoozedUntil?: string;
  createdAt: string;
  relatedId?: string;
  relatedType?: string;
}

interface ReminderSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReminderFormData {
  title: string;
  description: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  type: 'deadline' | 'meeting' | 'task' | 'leave' | 'custom';
  recurring: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  interval: number;
  endDate: string;
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const PRIORITY_ICONS = {
  low: '🔵',
  medium: '🟡',
  high: '🟠',
  urgent: '🔴',
};

const TYPE_ICONS = {
  deadline: '⏰',
  meeting: '👥',
  task: '📋',
  leave: '🏖️',
  custom: '📝',
};

const SNOOZE_OPTIONS = [
  { label: '15 minutes', minutes: 15 },
  { label: '1 hour', minutes: 60 },
  { label: '4 hours', minutes: 240 },
  { label: '1 day', minutes: 1440 },
  { label: '1 week', minutes: 10080 },
];

export const ReminderSystem: React.FC<ReminderSystemProps> = ({
  isOpen,
  onClose,
}) => {
  const { toast } = useToast();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed' | 'overdue'>('active');
  
  const [formData, setFormData] = useState<ReminderFormData>({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    type: 'custom',
    recurring: false,
    frequency: 'weekly',
    interval: 1,
    endDate: '',
  });

  // Load reminders on mount
  useEffect(() => {
    if (isOpen) {
      loadReminders();
    }
  }, [isOpen]);

  // Check for due reminders periodically
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      const dueReminders = reminders.filter(reminder => {
        if (reminder.completed || reminder.snoozedUntil) return false;
        
        const dueDate = new Date(reminder.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        
        // Show notification for reminders due within 15 minutes
        return timeDiff > 0 && timeDiff <= 15 * 60 * 1000;
      });

      dueReminders.forEach(reminder => {
        toast({
          title: `Reminder: ${reminder.title}`,
          description: reminder.description || `Due ${formatDistanceToNow(new Date(reminder.dueDate), { addSuffix: true })}`,
          variant: reminder.priority === 'urgent' ? 'destructive' : 'default',
        });
      });
    };

    const interval = setInterval(checkReminders, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [reminders, toast]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      // In a real app, this would be an API call
      // For now, we'll use mock data
      const mockReminders: Reminder[] = [
        {
          id: '1',
          title: 'Submit Monthly Report',
          description: 'Complete and submit the monthly performance report',
          dueDate: addDays(new Date(), 2).toISOString(),
          priority: 'high',
          type: 'deadline',
          completed: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: '2',
          title: 'Team Meeting',
          description: 'Weekly team sync meeting',
          dueDate: addDays(new Date(), 1).toISOString(),
          priority: 'medium',
          type: 'meeting',
          completed: false,
          createdAt: new Date().toISOString(),
          recurring: {
            frequency: 'weekly',
            interval: 1,
          },
        },
        {
          id: '3',
          title: 'Leave Application Deadline',
          description: 'Submit leave application for next month',
          dueDate: addWeeks(new Date(), 1).toISOString(),
          priority: 'urgent',
          type: 'leave',
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ];
      
      setReminders(mockReminders);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load reminders',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReminder = async () => {
    try {
      if (!formData.title || !formData.dueDate) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      const newReminder: Reminder = {
        id: Date.now().toString(),
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        priority: formData.priority,
        type: formData.type,
        completed: false,
        createdAt: new Date().toISOString(),
        ...(formData.recurring && {
          recurring: {
            frequency: formData.frequency,
            interval: formData.interval,
            endDate: formData.endDate || undefined,
          },
        }),
      };

      setReminders(prev => [newReminder, ...prev]);
      setShowCreateDialog(false);
      resetForm();
      
      toast({
        title: 'Success',
        description: 'Reminder created successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create reminder',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateReminder = async () => {
    try {
      if (!editingReminder || !formData.title || !formData.dueDate) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive',
        });
        return;
      }

      const updatedReminder: Reminder = {
        ...editingReminder,
        title: formData.title,
        description: formData.description,
        dueDate: formData.dueDate,
        priority: formData.priority,
        type: formData.type,
        ...(formData.recurring && {
          recurring: {
            frequency: formData.frequency,
            interval: formData.interval,
            endDate: formData.endDate || undefined,
          },
        }),
      };

      setReminders(prev => prev.map(r => r.id === editingReminder.id ? updatedReminder : r));
      setEditingReminder(null);
      resetForm();
      
      toast({
        title: 'Success',
        description: 'Reminder updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update reminder',
        variant: 'destructive',
      });
    }
  };

  const handleCompleteReminder = async (reminderId: string) => {
    try {
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? { ...r, completed: true } : r
      ));
      
      toast({
        title: 'Success',
        description: 'Reminder marked as completed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to complete reminder',
        variant: 'destructive',
      });
    }
  };

  const handleSnoozeReminder = async (reminderId: string, minutes: number) => {
    try {
      const snoozeUntil = new Date(Date.now() + minutes * 60 * 1000).toISOString();
      
      setReminders(prev => prev.map(r => 
        r.id === reminderId ? { ...r, snoozedUntil: snoozeUntil } : r
      ));
      
      toast({
        title: 'Success',
        description: `Reminder snoozed for ${SNOOZE_OPTIONS.find(o => o.minutes === minutes)?.label}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to snooze reminder',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteReminder = async (reminderId: string) => {
    try {
      setReminders(prev => prev.filter(r => r.id !== reminderId));
      
      toast({
        title: 'Success',
        description: 'Reminder deleted successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete reminder',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      dueDate: '',
      priority: 'medium',
      type: 'custom',
      recurring: false,
      frequency: 'weekly',
      interval: 1,
      endDate: '',
    });
  };

  const startEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description || '',
      dueDate: reminder.dueDate,
      priority: reminder.priority,
      type: reminder.type,
      recurring: !!reminder.recurring,
      frequency: reminder.recurring?.frequency || 'weekly',
      interval: reminder.recurring?.interval || 1,
      endDate: reminder.recurring?.endDate || '',
    });
  };

  const getFilteredReminders = () => {
    const now = new Date();
    
    return reminders.filter(reminder => {
      // Check if snoozed
      if (reminder.snoozedUntil && isBefore(now, new Date(reminder.snoozedUntil))) {
        return false;
      }
      
      switch (filter) {
        case 'active':
          return !reminder.completed;
        case 'completed':
          return reminder.completed;
        case 'overdue':
          return !reminder.completed && isBefore(new Date(reminder.dueDate), now);
        default:
          return true;
      }
    });
  };

  const filteredReminders = getFilteredReminders();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <Clock className="text-blue-600" size={24} />
            <div>
              <h2 className="text-xl font-semibold">Reminder System</h2>
              <p className="text-sm text-gray-600">
                Manage your deadlines and important dates
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button variant="default" size="sm">
                  <Plus size={16} className="mr-2" />
                  Add Reminder
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>
                    {editingReminder ? 'Edit Reminder' : 'Create New Reminder'}
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Title *</label>
                    <Input
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter reminder title"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Enter description (optional)"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Due Date *</label>
                      <Input
                        type="datetime-local"
                        value={formData.dueDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium">Priority</label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value: any) => setFormData(prev => ({ ...prev, priority: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Type</label>
                    <Select
                      value={formData.type}
                      onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="deadline">Deadline</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="task">Task</SelectItem>
                        <SelectItem value="leave">Leave</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="recurring"
                      checked={formData.recurring}
                      onChange={(e) => setFormData(prev => ({ ...prev, recurring: e.target.checked }))}
                    />
                    <label htmlFor="recurring" className="text-sm font-medium">
                      Recurring reminder
                    </label>
                  </div>
                  
                  {formData.recurring && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Frequency</label>
                        <Select
                          value={formData.frequency}
                          onValueChange={(value: any) => setFormData(prev => ({ ...prev, frequency: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium">Interval</label>
                        <Input
                          type="number"
                          min="1"
                          value={formData.interval}
                          onChange={(e) => setFormData(prev => ({ ...prev, interval: parseInt(e.target.value) || 1 }))}
                        />
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-end space-x-2 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateDialog(false);
                        setEditingReminder(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={editingReminder ? handleUpdateReminder : handleCreateReminder}
                    >
                      {editingReminder ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center space-x-4">
            <Select value={filter} onValueChange={(value: any) => setFilter(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Reminders</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="text-sm text-gray-600">
              {filteredReminders.length} reminders
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full p-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : filteredReminders.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No reminders</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create your first reminder to get started.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReminders.map(reminder => {
                  const isOverdue = !reminder.completed && isBefore(new Date(reminder.dueDate), new Date());
                  const isSnoozed = reminder.snoozedUntil && isAfter(new Date(reminder.snoozedUntil), new Date());
                  
                  return (
                    <Card 
                      key={reminder.id}
                      className={`transition-all duration-200 hover:shadow-md ${
                        isOverdue ? 'border-red-500 bg-red-50' : ''
                      } ${reminder.completed ? 'opacity-60' : ''}`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3 flex-1">
                            <div className="mt-1">
                              <span className="text-lg">{TYPE_ICONS[reminder.type]}</span>
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-1">
                                <h4 className={`text-sm font-medium ${reminder.completed ? 'line-through' : ''}`}>
                                  {reminder.title}
                                </h4>
                                <Badge className={`text-xs ${PRIORITY_COLORS[reminder.priority]}`}>
                                  {PRIORITY_ICONS[reminder.priority]} {reminder.priority.toUpperCase()}
                                </Badge>
                                {reminder.recurring && (
                                  <Badge variant="outline" className="text-xs">
                                    Recurring
                                  </Badge>
                                )}
                                {isSnoozed && (
                                  <Badge variant="secondary" className="text-xs">
                                    Snoozed
                                  </Badge>
                                )}
                              </div>
                              
                              {reminder.description && (
                                <p className="text-sm text-gray-600 mb-2">
                                  {reminder.description}
                                </p>
                              )}
                              
                              <div className="flex items-center space-x-4 text-xs text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Calendar size={12} />
                                  <span className={isOverdue ? 'text-red-600 font-medium' : ''}>
                                    Due {formatDistanceToNow(new Date(reminder.dueDate), { addSuffix: true })}
                                  </span>
                                </div>
                                
                                {isSnoozed && (
                                  <div className="flex items-center space-x-1">
                                    <Bell size={12} />
                                    <span>
                                      Snoozed until {format(new Date(reminder.snoozedUntil!), 'MMM d, HH:mm')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!reminder.completed && (
                              <>
                                <Select onValueChange={(value) => handleSnoozeReminder(reminder.id, parseInt(value))}>
                                  <SelectTrigger className="w-20 h-8 text-xs">
                                    <SelectValue placeholder="Snooze" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {SNOOZE_OPTIONS.map(option => (
                                      <SelectItem key={option.minutes} value={option.minutes.toString()}>
                                        {option.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCompleteReminder(reminder.id)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Check size={14} />
                                </Button>
                              </>
                            )}
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                startEdit(reminder);
                                setShowCreateDialog(true);
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Edit size={14} />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteReminder(reminder.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
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