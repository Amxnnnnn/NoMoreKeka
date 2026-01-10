import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, CheckCircle, AlertTriangle, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CustomDonutChart } from '@/components/ui/charts';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { projectService } from '@/services/project.service';

interface ProjectMetricsOverviewProps {
  projectId: string;
  onMemberClick?: (memberId: string) => void;
}

interface ProjectMetrics {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTasks: number;
  completionPercentage: number;
  averageTaskDuration: number;
  teamProductivity: number;
  milestones: Array<{
    name: string;
    dueDate: string;
    status: string;
    progress: number;
  }>;
}

export const ProjectMetricsOverview: React.FC<ProjectMetricsOverviewProps> = ({
  projectId,
  onMemberClick
}) => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<ProjectMetrics | null>(null);
  const [projectInfo, setProjectInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, [projectId]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both project details and metrics
      const [metricsResult, projectResult] = await Promise.all([
        projectService.getProjectMetrics(projectId),
        projectService.getProjectById(projectId)
      ]);
      
      if (metricsResult.success && metricsResult.data) {
        setMetrics(metricsResult.data);
      } else {
        setError(metricsResult.message || 'Failed to load project metrics');
      }

      if (projectResult.success && projectResult.data) {
        setProjectInfo(projectResult.data);
      }
    } catch (error: any) {
      console.error('Failed to load project metrics:', error);
      setError('Failed to load project metrics');
      toast({
        title: "Error",
        description: "Failed to load project metrics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'planning': return 'bg-yellow-500';
      case 'on_hold': return 'bg-orange-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Summary Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-20" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        
        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !metrics || !projectInfo) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{error || 'No metrics available'}</p>
        </div>
      </div>
    );
  }

  // Calculate derived values
  const todoTasks = metrics.totalTasks - metrics.completedTasks - metrics.inProgressTasks;
  const progress = projectInfo.progress || metrics.completionPercentage || 0;

  // Prepare chart data
  const taskDistributionData = [
    { name: 'Completed', value: metrics.completedTasks, color: '#22c55e' },
    { name: 'In Progress', value: metrics.inProgressTasks, color: '#3b82f6' },
    { name: 'To Do', value: todoTasks > 0 ? todoTasks : 0, color: '#f59e0b' },
  ].filter(item => item.value > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress.toFixed(1)}%</div>
            <Progress value={progress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
            <div className={`h-3 w-3 rounded-full ${getStatusColor(projectInfo.status)}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {projectInfo.status?.replace('_', ' ').toLowerCase() || 'Unknown'}
            </div>
            <Badge variant={getPriorityColor(projectInfo.priority)} className="mt-2">
              {projectInfo.priority || 'Medium'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Priority</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">
              {projectInfo.priority || 'Medium'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Project priority level
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalTasks}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {metrics.completedTasks} completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Task Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Task Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {taskDistributionData.length > 0 ? (
              <CustomDonutChart
                data={taskDistributionData}
                dataKey="value"
                nameKey="name"
                config={{
                  completed: { label: "Completed", color: "#22c55e" },
                  inProgress: { label: "In Progress", color: "#3b82f6" },
                  todo: { label: "To Do", color: "#f59e0b" },
                }}
                className="h-64"
              />
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                No task data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Team Workload Snapshot */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team Workload Snapshot
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectInfo.team?.members?.length > 0 ? (
                projectInfo.team.members.slice(0, 5).map((member: any) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => onMemberClick?.(member.id)}
                  >
                    <div className="flex-1">
                      <div className="font-medium">{member.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {member.assignedTasks?.length || 0} tasks assigned
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {member.role}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No team members assigned</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};