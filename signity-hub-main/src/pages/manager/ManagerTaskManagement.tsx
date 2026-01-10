import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Target, 
  Plus, 
  Search, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, createActionsColumn, createStatusColumn } from '@/components/ui/data-table';
import { CreateTaskDialog } from '@/components/project/CreateTaskDialog';
import { TaskDetailsDialog } from '@/components/project/TaskDetailsDialog';
import { useToast } from '@/hooks/use-toast';
import { taskService, Task } from '@/services/task.service';
import { projectService } from '@/services/project.service';
import { ColumnDef } from '@tanstack/react-table';

interface TaskStats {
  totalTasks: number;
  todoTasks: number;
  inProgressTasks: number;
  completedTasks: number;
  overdueTasks: number;
  averageCompletionTime: number;
}

export default function ManagerTaskManagement() {
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [projects, setProjects] = useState<any[]>([]);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskDetails, setShowTaskDetails] = useState(false);

  useEffect(() => {
    loadTaskData();
  }, []);

  const loadTaskData = async () => {
    try {
      setLoading(true);
      
      const [projectsResult] = await Promise.all([
        projectService.getManagedProjects()
      ]);

      console.log('ManagerTasks: Projects result:', projectsResult);

      if (projectsResult.success && projectsResult.data) {
        const projectsData = projectsResult.data;
        setProjects(projectsData);

        // Get all tasks from all managed projects
        const allTasks: Task[] = [];
        
        for (const project of projectsData) {
          try {
            const tasksResult = await taskService.getProjectTasks(project.id);
            if (tasksResult.success && tasksResult.data) {
              const projectTasks = tasksResult.data.map((task: any) => ({
                ...task,
                isActive: task.isActive !== undefined ? task.isActive : true,
                creator: task.createdBy || task.creator || { id: '', name: 'Unknown', email: '' },
                project: {
                  id: project.id,
                  name: project.name
                }
              }));
              allTasks.push(...projectTasks);
            }
          } catch (error) {
            console.warn(`Failed to load tasks for project ${project.name}:`, error);
          }
        }

        setTasks(allTasks);

        // Calculate task stats
        const now = new Date();
        const overdueTasks = allTasks.filter(task => 
          task.dueDate && new Date(task.dueDate) < now && task.status !== 'COMPLETED'
        );

        const stats: TaskStats = {
          totalTasks: allTasks.length,
          todoTasks: allTasks.filter(t => t.status === 'TODO').length,
          inProgressTasks: allTasks.filter(t => t.status === 'IN_PROGRESS').length,
          completedTasks: allTasks.filter(t => t.status === 'COMPLETED').length,
          overdueTasks: overdueTasks.length,
          averageCompletionTime: 5 // Mock data - would be calculated from actual completion times
        };
        
        setTaskStats(stats);
      } else {
        console.warn('ManagerTasks: No project data available');
        setTasks([]);
        setTaskStats({
          totalTasks: 0,
          todoTasks: 0,
          inProgressTasks: 0,
          completedTasks: 0,
          overdueTasks: 0,
          averageCompletionTime: 0
        });
      }

    } catch (error: any) {
      console.error('ManagerTasks: Failed to load task data:', error);
      toast({
        title: "Error",
        description: "Failed to load task data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks based on search and filters
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchQuery || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.assignee?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    const matchesProject = projectFilter === 'all' || task.project.id === projectFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesProject;
  });

  // Define table columns
  const columns: ColumnDef<Task>[] = [
    {
      accessorKey: "title",
      header: "Task",
      cell: ({ row }) => {
        const task = row.original;
        return (
          <div>
            <div className="font-medium">{task.title}</div>
            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
              {task.description || 'No description'}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "project",
      header: "Project",
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.project.name}</Badge>
      ),
    },
    {
      accessorKey: "assignee",
      header: "Assignee",
      cell: ({ row }) => {
        const assignee = row.original.assignee;
        if (!assignee) {
          return <span className="text-muted-foreground">Unassigned</span>;
        }
        return (
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${assignee.name}`} />
              <AvatarFallback className="text-xs">
                {assignee.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm">{assignee.name}</span>
          </div>
        );
      },
    },
    createStatusColumn<Task>("status", "Status", {
      TODO: { label: "To Do", variant: "secondary" },
      IN_PROGRESS: { label: "In Progress", variant: "default" },
      IN_REVIEW: { label: "In Review", variant: "outline" },
      COMPLETED: { label: "Completed", variant: "default" },
      CANCELLED: { label: "Cancelled", variant: "destructive" },
    }),
    createStatusColumn<Task>("priority", "Priority", {
      LOW: { label: "Low", variant: "outline" },
      MEDIUM: { label: "Medium", variant: "secondary" },
      HIGH: { label: "High", variant: "default" },
      URGENT: { label: "Urgent", variant: "destructive" },
    }),
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const dueDate = row.original.dueDate;
        if (!dueDate) return <span className="text-muted-foreground">No due date</span>;
        
        const date = new Date(dueDate);
        const now = new Date();
        const isOverdue = date < now && row.original.status !== 'COMPLETED';
        
        return (
          <div className={`text-sm ${isOverdue ? 'text-red-600 font-medium' : ''}`}>
            {date.toLocaleDateString()}
            {isOverdue && (
              <div className="text-xs text-red-600">Overdue</div>
            )}
          </div>
        );
      },
    },
    createActionsColumn<Task>([
      {
        label: "View Details",
        onClick: (task) => {
          setSelectedTask(task);
          setShowTaskDetails(true);
        },
      },
      {
        label: "Edit Task",
        onClick: (task) => {
          setSelectedTask(task);
          setShowTaskDetails(true);
        },
      },
      {
        label: "Mark Complete",
        onClick: async (task) => {
          try {
            const result = await taskService.updateTaskStatus(task.id, 'COMPLETED');
            if (result.success) {
              setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'COMPLETED' } : t));
              toast({
                title: "Success",
                description: "Task marked as completed",
              });
              loadTaskData(); // Refresh stats
            }
          } catch (error) {
            toast({
              title: "Error",
              description: "Failed to update task status",
              variant: "destructive",
            });
          }
        },
        disabled: (task) => task.status === 'COMPLETED',
      },
    ]),
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-96 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Task Management</h1>
              <p className="text-muted-foreground">
                Manage tasks across all your projects and track team progress
              </p>
            </div>
            <Button className="gap-2" onClick={() => setShowCreateTask(true)}>
              <Plus className="h-4 w-4" />
              Create Task
            </Button>
          </div>
        </motion.div>

        {/* Task Stats */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                  <p className="text-2xl font-bold">{taskStats?.totalTasks || 0}</p>
                </div>
                <Target className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-600">{taskStats?.inProgressTasks || 0}</p>
                </div>
                <Clock className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{taskStats?.completedTasks || 0}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{taskStats?.overdueTasks || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Avg Completion</p>
                  <p className="text-2xl font-bold">{taskStats?.averageCompletionTime || 0}d</p>
                </div>
                <Calendar className="h-8 w-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="TODO">To Do</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="IN_REVIEW">In Review</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="LOW">Low</SelectItem>
              <SelectItem value="MEDIUM">Medium</SelectItem>
              <SelectItem value="HIGH">High</SelectItem>
              <SelectItem value="URGENT">Urgent</SelectItem>
            </SelectContent>
          </Select>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tasks Table */}
        <Tabs defaultValue="all" className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Tasks ({filteredTasks.length})</TabsTrigger>
            <TabsTrigger value="my-tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="overdue">Overdue ({taskStats?.overdueTasks || 0})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  All Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={filteredTasks}
                  searchKey="title"
                  searchPlaceholder="Search tasks..."
                  pageSize={10}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-tasks" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Assigned Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No tasks assigned to you</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="overdue" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  Overdue Tasks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={columns}
                  data={filteredTasks.filter(task => {
                    if (!task.dueDate || task.status === 'COMPLETED') return false;
                    return new Date(task.dueDate) < new Date();
                  })}
                  searchKey="title"
                  searchPlaceholder="Search overdue tasks..."
                  pageSize={10}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Task Creation Dialog */}
        <CreateTaskDialog
          open={showCreateTask}
          onOpenChange={setShowCreateTask}
          projectId={projectFilter !== 'all' ? projectFilter : projects[0]?.id}
          onTaskCreated={(task) => {
            setTasks(prev => [task, ...prev]);
            loadTaskData(); // Refresh data
            toast({
              title: "Success",
              description: "Task created successfully",
            });
          }}
        />

        {/* Task Details Dialog */}
        <TaskDetailsDialog
          task={selectedTask}
          open={showTaskDetails}
          onOpenChange={setShowTaskDetails}
          onTaskUpdated={(updatedTask) => {
            setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
            loadTaskData(); // Refresh data
          }}
        />
      </div>
    </DashboardLayout>
  );
}