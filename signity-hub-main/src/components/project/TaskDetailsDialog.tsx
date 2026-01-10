import React, { useState } from 'react';
import { Clock, User, Calendar, Target, Edit, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { Task, taskService } from '@/services/task.service';

interface TaskDetailsDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated: (task: Task) => void;
}

export const TaskDetailsDialog: React.FC<TaskDetailsDialogProps> = ({
  task,
  open,
  onOpenChange,
  onTaskUpdated
}) => {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [updating, setUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: Task['status']) => {
    if (!task) return;

    try {
      setUpdating(true);
      const result = await taskService.updateTaskStatus(task.id, newStatus);

      if (result.success) {
        onTaskUpdated(result.data);
        toast({
          title: "Success",
          description: `Task status updated to ${newStatus.toLowerCase()}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update task status",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to update task status:', error);
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!task) return;

    if (!confirm(`Are you sure you want to delete "${task.title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setUpdating(true);
      const result = await taskService.deleteTask(task.id);

      if (result.success) {
        onOpenChange(false);
        toast({
          title: "Success",
          description: "Task deleted successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete task",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast({
        title: "Error",
        description: "Failed to delete task",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const canManageTask = () => {
    if (!task || !user) return false;
    return user.role === 'ADMIN' || 
           user.role === 'HR' || 
           user.role === 'MANAGER' ||
           (task.assignee && task.assignee.id === user.id);
  };

  const getStatusBadgeVariant = (status: Task['status']) => {
    switch (status) {
      case 'COMPLETED':
        return 'secondary';
      case 'IN_PROGRESS':
        return 'default';
      case 'IN_REVIEW':
        return 'outline';
      case 'CANCELLED':
        return 'destructive';
      case 'TODO':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: Task['priority']) => {
    switch (priority) {
      case 'URGENT':
        return 'destructive';
      case 'HIGH':
        return 'default';
      case 'MEDIUM':
        return 'secondary';
      case 'LOW':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getStatusProgress = (status: Task['status']) => {
    switch (status) {
      case 'TODO':
        return 0;
      case 'IN_PROGRESS':
        return 50;
      case 'IN_REVIEW':
        return 80;
      case 'COMPLETED':
        return 100;
      case 'CANCELLED':
        return 0;
      default:
        return 0;
    }
  };

  if (!task) return null;

  const isOverdue = task.dueDate && 
    new Date(task.dueDate) < new Date() && 
    task.status !== 'COMPLETED';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-xl">{task.title}</DialogTitle>
              <DialogDescription className="mt-2">
                {task.description || 'No description provided'}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Badge variant={getStatusBadgeVariant(task.status)}>
                {task.status}
              </Badge>
              <Badge variant={getPriorityBadgeVariant(task.priority)}>
                {task.priority}
              </Badge>
              {isOverdue && (
                <Badge variant="destructive">
                  Overdue
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Task Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Status: {task.status}</span>
                  <span>{getStatusProgress(task.status)}%</span>
                </div>
                <Progress value={getStatusProgress(task.status)} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Task Details */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Assignee</p>
                    <p className="text-sm text-muted-foreground">
                      {task.assignee?.name || 'Unassigned'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Project</p>
                    <p className="text-sm text-muted-foreground">
                      {task.project?.name || 'Unknown Project'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Due Date</p>
                    <p className={`text-sm ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                      {task.dueDate 
                        ? new Date(task.dueDate).toLocaleDateString()
                        : 'No due date'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Time Tracking</p>
                    <p className="text-sm text-muted-foreground">
                      {task.actualHours || 0}h / {task.estimatedHours || 0}h
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Actions */}
          {canManageTask() && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status Update */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Update Status</label>
                  <Select
                    value={task.status}
                    onValueChange={handleStatusUpdate}
                    disabled={updating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TODO">To Do</SelectItem>
                      <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                      <SelectItem value="IN_REVIEW">Review</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={updating}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Edit Task
                  </Button>
                  
                  {(user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteTask}
                      disabled={updating}
                      className="gap-2 text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete Task
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Task Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created:</span>
                <span>{new Date(task.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Last Updated:</span>
                <span>{new Date(task.updatedAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Created By:</span>
                <span>{task.creator?.name || 'Unknown'}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};