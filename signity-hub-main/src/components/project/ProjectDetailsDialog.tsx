import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Target, Edit, Trash2, Plus } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DataTable } from '@/components/ui/data-table';
import { Timeline, TimelineItem } from '@/components/ui/timeline';
import { CustomBarChart, CustomDonutChart } from '@/components/ui/charts';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/stores/authStore';
import { Project, projectService } from '@/services/project.service';
import { Task, taskService } from '@/services/task.service';
import { CreateTaskDialog } from './CreateTaskDialog';
import { TaskDetailsDialog } from './TaskDetailsDialog';
import { ProjectMetricsOverview } from './ProjectMetricsOverview';
import { ProjectPerformanceAnalysis } from './ProjectPerformanceAnalysis';

interface ProjectDetailsDialogProps {
  project: Project | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectUpdated: (project: Project) => void;
}

export const ProjectDetailsDialog: React.FC<ProjectDetailsDialogProps> = ({
  project,
  open,
  onOpenChange,
  onProjectUpdated
}) => {
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any>(null);

  // Load project data when dialog opens
  useEffect(() => {
    if (open && project) {
      loadProjectData();
    }
  }, [open, project]);

  const loadProjectData = async () => {
    if (!project) return;

    try {
      setLoading(true);
      
      const [tasksResult, metricsResult] = await Promise.all([
        taskService.getTasks({ projectId: project.id }),
        projectService.getProjectMetrics(project.id)
      ]);

      if (tasksResult.success) {
        setTasks(tasksResult.data);
      }

      if (metricsResult.success) {
        setMetrics(metricsResult.data);
      }
    } catch (error) {
      console.error('Failed to load project data:', error);
      toast({
        title: "Error",
        description: "Failed to load project details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCreated = (task: Task) => {
    setShowCreateTask(false);
    setTasks(prev => [task, ...prev]);
    toast({
      title: "Success",
      description: "Task created successfully",
    });
  };

  const handleTaskUpdated = (task: Task) => {
    setSelectedTask(null);
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    toast({
      title: "Success",
      description: "Task updated successfully",
    });
  };

  const canManageProject = () => {
    if (!project || !user) return false;
    return user.role === 'ADMIN' || 
           user.role === 'HR' || 
           (user.role === 'MANAGER' && project.manager.id === user.id);
  };

  if (!project) return null;

  // Calculate progress
  const progress = project._count?.tasks 
    ? Math.round(((project._count.completedTasks || 0) / project._count.tasks) * 100)
    : 0;

  // Prepare chart data
  const chartConfig = {
    tasks: {
      label: "Tasks",
      color: "hsl(var(--chart-1))",
    },
    completed: {
      label: "Completed",
      color: "hsl(var(--chart-2))",
    },
    inProgress: {
      label: "In Progress",
      color: "hsl(var(--chart-3))",
    },
    todo: {
      label: "To Do",
      color: "hsl(var(--chart-4))",
    },
  };

  const taskStatusData = [
    { name: 'To Do', value: tasks.filter(t => t.status === 'TODO').length },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'IN_PROGRESS').length },
    { name: 'Review', value: tasks.filter(t => t.status === 'IN_REVIEW').length },
    { name: 'Completed', value: tasks.filter(t => t.status === 'COMPLETED').length },
  ].filter(item => item.value > 0);

  const taskPriorityData = [
    { name: 'Urgent', value: tasks.filter(t => t.priority === 'URGENT').length },
    { name: 'High', value: tasks.filter(t => t.priority === 'HIGH').length },
    { name: 'Medium', value: tasks.filter(t => t.priority === 'MEDIUM').length },
    { name: 'Low', value: tasks.filter(t => t.priority === 'LOW').length },
  ].filter(item => item.value > 0);

  // Task timeline items
  const taskTimelineItems: TimelineItem[] = tasks
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 10)
    .map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      timestamp: task.updatedAt,
      status: task.status === 'COMPLETED' ? 'completed' : 
              task.status === 'IN_PROGRESS' ? 'current' : 
              task.status === 'CANCELLED' ? 'cancelled' : 'upcoming',
      content: (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant={
              task.status === 'COMPLETED' ? 'secondary' :
              task.status === 'IN_PROGRESS' ? 'default' :
              task.status === 'IN_REVIEW' ? 'outline' : 'outline'
            }>
              {task.status}
            </Badge>
            <Badge variant={
              task.priority === 'URGENT' ? 'destructive' :
              task.priority === 'HIGH' ? 'default' : 'outline'
            }>
              {task.priority}
            </Badge>
          </div>
          {task.assignee && (
            <div className="text-sm text-muted-foreground">
              Assigned to: {task.assignee.name}
            </div>
          )}
          {task.dueDate && (
            <div className="text-sm text-muted-foreground">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </div>
          )}
        </div>
      ),
      actions: [
        {
          label: 'View Task',
          onClick: () => setSelectedTask(task),
        },
      ],
    }));

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div>
                <DialogTitle className="text-2xl">{project.name}</DialogTitle>
                <DialogDescription className="mt-2">
                  {project.description || 'No description provided'}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={
                  project.status === 'IN_PROGRESS' ? 'default' :
                  project.status === 'COMPLETED' ? 'secondary' :
                  project.status === 'ON_HOLD' ? 'outline' : 'destructive'
                }>
                  {project.status}
                </Badge>
                <Badge variant={
                  project.priority === 'URGENT' ? 'destructive' :
                  project.priority === 'HIGH' ? 'default' : 'outline'
                }>
                  {project.priority}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="timeline">Timeline</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <ProjectMetricsOverview projectId={project.id} />
            </TabsContent>

            <TabsContent value="performance" className="space-y-6">
              <ProjectPerformanceAnalysis projectId={project.id} />
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Project Tasks</h3>
                {canManageProject() && (
                  <Button onClick={() => setShowCreateTask(true)} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Task
                  </Button>
                )}
              </div>

              <DataTable
                columns={[
                  {
                    accessorKey: 'title',
                    header: 'Task',
                    cell: ({ row }) => {
                      const task = row.original;
                      return (
                        <div>
                          <div className="font-medium">{task.title}</div>
                          {task.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {task.description}
                            </div>
                          )}
                        </div>
                      );
                    },
                  },
                  {
                    accessorKey: 'status',
                    header: 'Status',
                    cell: ({ row }) => {
                      const task = row.original;
                      return (
                        <Badge variant={
                          task.status === 'COMPLETED' ? 'secondary' :
                          task.status === 'IN_PROGRESS' ? 'default' : 'outline'
                        }>
                          {task.status}
                        </Badge>
                      );
                    },
                  },
                  {
                    accessorKey: 'priority',
                    header: 'Priority',
                    cell: ({ row }) => {
                      const task = row.original;
                      return (
                        <Badge variant={
                          task.priority === 'URGENT' ? 'destructive' :
                          task.priority === 'HIGH' ? 'default' : 'outline'
                        }>
                          {task.priority}
                        </Badge>
                      );
                    },
                  },
                  {
                    accessorKey: 'assignee',
                    header: 'Assignee',
                    cell: ({ row }) => {
                      const task = row.original;
                      return (
                        <div>
                          {task.assignee?.name || 'Unassigned'}
                        </div>
                      );
                    },
                  },
                  {
                    accessorKey: 'dueDate',
                    header: 'Due Date',
                    cell: ({ row }) => {
                      const task = row.original;
                      return (
                        <div>
                          {task.dueDate 
                            ? new Date(task.dueDate).toLocaleDateString()
                            : 'No due date'
                          }
                        </div>
                      );
                    },
                  },
                ]}
                data={tasks}
                loading={loading}
                onRowClick={(task: Task) => setSelectedTask(task)}
                searchKey="title"
                searchPlaceholder="Search tasks..."
              />
            </TabsContent>

            <TabsContent value="timeline" className="space-y-6">
              <Timeline
                items={taskTimelineItems}
                title="Recent Task Activity"
                loading={loading}
                emptyMessage="No task activity to display"
                maxHeight={500}
              />
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6">
              {metrics ? (
                <div className="grid gap-6 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Project Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between">
                        <span>Completion Rate:</span>
                        <span className="font-medium">{metrics.completionPercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overdue Tasks:</span>
                        <span className="font-medium text-red-600">{metrics.overdueTasks}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Avg Task Duration:</span>
                        <span className="font-medium">{metrics.averageTaskDuration} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Team Productivity:</span>
                        <span className="font-medium">{metrics.teamProductivity}%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Milestones</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {metrics.milestones?.length > 0 ? (
                        <div className="space-y-3">
                          {metrics.milestones.map((milestone: any, index: number) => (
                            <div key={index} className="space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="font-medium">{milestone.name}</span>
                                <Badge variant={
                                  milestone.status === 'completed' ? 'secondary' :
                                  milestone.status === 'active' ? 'default' : 'outline'
                                }>
                                  {milestone.status}
                                </Badge>
                              </div>
                              <div className="flex justify-between text-sm text-muted-foreground">
                                <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                                <span>{milestone.progress}% complete</span>
                              </div>
                              <Progress value={milestone.progress} className="h-2" />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-muted-foreground">No milestones defined</p>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Loading metrics...</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <CreateTaskDialog
        open={showCreateTask}
        onOpenChange={setShowCreateTask}
        projectId={project.id}
        onTaskCreated={handleTaskCreated}
      />

      {/* Task Details Dialog */}
      <TaskDetailsDialog
        task={selectedTask}
        open={!!selectedTask}
        onOpenChange={(open) => !open && setSelectedTask(null)}
        onTaskUpdated={handleTaskUpdated}
      />
    </>
  );
};