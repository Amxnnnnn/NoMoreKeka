import React from 'react';
import { TrendingUp, TrendingDown, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CustomDonutChart } from '@/components/ui/charts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Project } from '@/services/project.service';

interface ProjectDashboardProps {
  data: any;
  projects: Project[];
  loading: boolean;
  onProjectClick: (project: Project) => void;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  data,
  projects,
  loading,
  onProjectClick
}) => {
  // Chart configurations
  const chartConfig = {
    projects: {
      label: "Projects",
      color: "hsl(var(--chart-1))",
    },
    tasks: {
      label: "Tasks", 
      color: "hsl(var(--chart-2))",
    },
    completed: {
      label: "Completed",
      color: "hsl(var(--chart-3))",
    },
    active: {
      label: "Active",
      color: "hsl(var(--chart-4))",
    },
    overdue: {
      label: "Overdue",
      color: "hsl(var(--chart-5))",
    },
  };

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate metrics from projects data
  const metrics = React.useMemo(() => {
    if (!projects || projects.length === 0) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        overdueProjects: 0,
        totalTasks: 0,
        completedTasks: 0,
        completionRate: 0
      };
    }

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p?.status === 'IN_PROGRESS').length;
    const completedProjects = projects.filter(p => p?.status === 'COMPLETED').length;
    const overdueProjects = projects.filter(p => {
      if (!p?.endDate) return false;
      return new Date(p.endDate) < new Date() && p.status !== 'COMPLETED';
    }).length;

    const totalTasks = projects.reduce((sum, p) => sum + (p?._count?.tasks || 0), 0);
    const completedTasks = projects.reduce((sum, p) => sum + (p?._count?.completedTasks || 0), 0);
    
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      overdueProjects,
      totalTasks,
      completedTasks,
      completionRate
    };
  }, [projects]);

  // Priority weight mapping
  const priorityWeights = {
    'LOW': 0.00,
    'MEDIUM': 0.25,
    'HIGH': 0.50,
    'URGENT': 1.00
  };

  // Prepare chart data
  const statusChartData = [
    { name: 'In Progress', value: metrics.activeProjects, color: 'hsl(var(--chart-1))' },
    { name: 'Completed', value: metrics.completedProjects, color: 'hsl(var(--chart-2))' },
    { name: 'Planning', value: projects?.filter(p => p?.status === 'PLANNING').length || 0, color: 'hsl(var(--chart-3))' },
    { name: 'On Hold', value: projects?.filter(p => p?.status === 'ON_HOLD').length || 0, color: 'hsl(var(--chart-4))' },
    { name: 'Cancelled', value: projects?.filter(p => p?.status === 'CANCELLED').length || 0, color: 'hsl(var(--chart-5))' },
  ].filter(item => item.value > 0);

  const priorityChartData = [
    { 
      name: 'Urgent', 
      value: projects?.filter(p => p?.priority === 'URGENT').length || 0,
      weight: priorityWeights.URGENT,
      weightedValue: (projects?.filter(p => p?.priority === 'URGENT').length || 0) * priorityWeights.URGENT,
      color: 'hsl(var(--destructive))'
    },
    { 
      name: 'High', 
      value: projects?.filter(p => p?.priority === 'HIGH').length || 0,
      weight: priorityWeights.HIGH,
      weightedValue: (projects?.filter(p => p?.priority === 'HIGH').length || 0) * priorityWeights.HIGH,
      color: 'hsl(var(--warning))'
    },
    { 
      name: 'Medium', 
      value: projects?.filter(p => p?.priority === 'MEDIUM').length || 0,
      weight: priorityWeights.MEDIUM,
      weightedValue: (projects?.filter(p => p?.priority === 'MEDIUM').length || 0) * priorityWeights.MEDIUM,
      color: 'hsl(var(--chart-2))'
    },
    { 
      name: 'Low', 
      value: projects?.filter(p => p?.priority === 'LOW').length || 0,
      weight: priorityWeights.LOW,
      weightedValue: (projects?.filter(p => p?.priority === 'LOW').length || 0) * priorityWeights.LOW,
      color: 'hsl(var(--muted))'
    },
  ]; // Remove filter to show all priorities even with 0 values

  // Debug logging
  console.log('ProjectDashboard: Projects data:', projects);
  console.log('ProjectDashboard: Priority chart data:', priorityChartData);
  console.log('ProjectDashboard: Projects with priorities:', projects?.map(p => ({ name: p?.name, priority: p?.priority })));
  console.log('ProjectDashboard: Chart container dimensions and visibility check');
  
  // Additional debugging for chart visibility
  React.useEffect(() => {
    const chartElement = document.querySelector('[data-chart]') as HTMLElement;
    if (chartElement) {
      console.log('ProjectDashboard: Chart element found:', chartElement);
      console.log('ProjectDashboard: Chart element dimensions:', {
        width: chartElement.clientWidth,
        height: chartElement.clientHeight,
        visible: (chartElement as any).offsetParent !== null
      });
    } else {
      console.log('ProjectDashboard: Chart element not found in DOM');
    }
  }, [projects]);

  // Recent projects for quick access
  const recentProjects = projects
    ?.filter(p => p && p.updatedAt)
    ?.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    ?.slice(0, 5) || [];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-2xl font-bold">{metrics.totalProjects}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-600 flex items-center">
                <TrendingUp className="h-4 w-4 mr-1" />
                {metrics.activeProjects} active
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{metrics.completionRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-4">
              <Progress value={metrics.completionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold">{metrics.totalTasks}</p>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-blue-600">
                {metrics.completedTasks} completed
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Overdue Projects</p>
                <p className="text-2xl font-bold text-red-600">{metrics.overdueProjects}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <div className="mt-4 flex items-center text-sm">
              {metrics.overdueProjects > 0 ? (
                <span className="text-red-600 flex items-center">
                  <TrendingDown className="h-4 w-4 mr-1" />
                  Needs attention
                </span>
              ) : (
                <span className="text-green-600">All on track</span>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Project Status Distribution */}
        <CustomDonutChart
          title="Project Status Distribution"
          data={statusChartData}
          dataKey="value"
          nameKey="name"
          config={chartConfig}
          centerLabel="Total Projects"
          centerValue={metrics.totalProjects}
        />

        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Projects by Priority</CardTitle>
            <p className="text-sm text-muted-foreground">
              Priority weights: Low (0.00), Medium (0.25), High (0.50), Urgent (1.00)
            </p>
          </CardHeader>
          <CardContent>
            {projects && projects.length > 0 ? (
              <>
                {/* Debug: Simple test chart to verify Recharts is working */}
                <div className="mb-4 p-2 bg-muted/20 rounded border">
                  <p className="text-xs text-muted-foreground mb-2">Debug: Test Chart (should always show)</p>
                  <div className="h-[100px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: 'Test 1', value: 10 },
                        { name: 'Test 2', value: 20 },
                        { name: 'Test 3', value: 15 }
                      ]}>
                        <Bar dataKey="value" fill="hsl(var(--primary))" />
                        <XAxis dataKey="name" />
                        <YAxis />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Main Priority Chart */}
                <div className="h-[300px] w-full border border-dashed border-muted-foreground/20 rounded-lg p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={priorityChartData} 
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" opacity={0.3} />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12, fill: 'hsl(var(--foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--muted-foreground))' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [value, 'Projects']}
                        labelFormatter={(label) => `Priority: ${label}`}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          color: 'hsl(var(--foreground))'
                        }}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                        stroke="hsl(var(--primary))"
                        strokeWidth={1}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {priorityChartData.some(item => item.value > 0) && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium">Priority Breakdown:</h4>
                    {priorityChartData.filter(item => item.value > 0).map((item) => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span>{item.value} projects</span>
                          <span className="text-muted-foreground">
                            Weight: {item.weight.toFixed(2)}
                          </span>
                          <span className="font-medium">
                            Weighted: {item.weightedValue.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm font-medium">
                        <span>Total Weighted Priority:</span>
                        <span>
                          {priorityChartData.reduce((sum, item) => sum + item.weightedValue, 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center h-[300px] border border-dashed border-muted-foreground/20 rounded-lg">
                <div className="text-center">
                  <p className="text-muted-foreground mb-2">No projects available</p>
                  <p className="text-sm text-muted-foreground">
                    Create projects with different priorities to see the distribution
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects & Upcoming Deadlines */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => onProjectClick(project)}
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{project.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        {project.team.name} • {project.manager.name}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          project.status === 'IN_PROGRESS' ? 'default' :
                          project.status === 'COMPLETED' ? 'secondary' :
                          project.status === 'ON_HOLD' ? 'outline' : 'destructive'
                        }
                      >
                        {project.status}
                      </Badge>
                      <Badge
                        variant={
                          project.priority === 'URGENT' ? 'destructive' :
                          project.priority === 'HIGH' ? 'default' : 'outline'
                        }
                      >
                        {project.priority}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No projects found
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projects
                ?.filter(p => p?.endDate && p?.status !== 'COMPLETED')
                ?.sort((a, b) => new Date(a.endDate!).getTime() - new Date(b.endDate!).getTime())
                ?.slice(0, 5)
                ?.map((project) => {
                  const daysUntilDeadline = Math.ceil(
                    (new Date(project.endDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                  );
                  
                  return (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => onProjectClick(project)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(project.endDate!).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={
                          daysUntilDeadline < 0 ? 'destructive' :
                          daysUntilDeadline <= 7 ? 'default' : 'outline'
                        }
                      >
                        {daysUntilDeadline < 0 
                          ? `${Math.abs(daysUntilDeadline)} days overdue`
                          : daysUntilDeadline === 0 
                          ? 'Due today'
                          : `${daysUntilDeadline} days left`
                        }
                      </Badge>
                    </div>
                  );
                }) || []}
              {(!projects || projects.filter(p => p?.endDate && p?.status !== 'COMPLETED').length === 0) && (
                <p className="text-center text-muted-foreground py-8">
                  No upcoming deadlines
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};