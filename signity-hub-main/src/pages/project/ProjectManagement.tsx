import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Calendar, BarChart3, Users, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { CustomBarChart, CustomDonutChart } from '@/components/ui/charts';
import { useToast } from '@/hooks/use-toast';
import { projectService, Project } from '@/services/project.service';
import { useDataStore } from '@/stores/dataStore';
import { useAuthStore } from '@/stores/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ProjectDashboard } from '../../components/project/ProjectDashboard';
import { ProjectList } from '../../components/project/ProjectList';
import { ProjectTimeline } from '../../components/project/ProjectTimeline';
import { CreateProjectDialog } from '../../components/project/CreateProjectDialog';
import { ProjectDetailsDialog } from '../../components/project/ProjectDetailsDialog';

/**
 * PROJECT MANAGEMENT PAGE
 * 
 * Main interface for project management with dashboard, list view,
 * timeline view, and resource allocation tools
 */

export const ProjectManagement: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const { projects, myProjects, loading, setLoading } = useDataStore();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Load initial data
  useEffect(() => {
    console.log('ProjectManagement: Component mounted, user:', user?.role, user?.email);
    loadProjectData();
  }, []);

  useEffect(() => {
    console.log('ProjectManagement: User changed:', user?.role, user?.email);
    if (user) {
      loadProjectData();
    }
  }, [user]);

  const loadProjectData = async () => {
    if (!user) {
      console.warn('ProjectManagement: User not available, skipping project data load');
      return;
    }

    console.log('ProjectManagement: Loading project data for user:', user.role, user.email);

    try {
      setLoading('projects', true);
      
      // Load projects based on user role
      console.log('ProjectManagement: Determining API call based on role:', user.role);
      const projectsPromise = user.role === 'ADMIN' || user.role === 'HR' 
        ? projectService.getProjects()
        : projectService.getMyProjects();
      
      const dashboardPromise = projectService.getProjectDashboard();
      
      console.log('ProjectManagement: Making API calls...');
      const [projectsResult, dashboardResult] = await Promise.all([
        projectsPromise,
        dashboardPromise
      ]);

      console.log('ProjectManagement: Projects result:', projectsResult);
      console.log('ProjectManagement: Dashboard result:', dashboardResult);

      if (dashboardResult.success && dashboardResult.data) {
        console.log('ProjectManagement: Dashboard data loaded successfully:', dashboardResult.data);
        setDashboardData(dashboardResult.data);
      } else if (dashboardResult.message) {
        console.warn('ProjectManagement: Dashboard data load warning:', dashboardResult.message);
      }

      if (!projectsResult.success) {
        // Don't show error toast for permission issues, just log
        if (projectsResult.error?.response?.status === 403) {
          console.warn('ProjectManagement: Access denied for projects:', projectsResult.message);
          toast({
            title: "Limited Access",
            description: projectsResult.message || "You have limited access to project data.",
            variant: "default",
          });
        } else {
          console.error('ProjectManagement: Projects load failed:', projectsResult);
          toast({
            title: "Error",
            description: projectsResult.message || "Failed to load projects",
            variant: "destructive",
          });
        }
      } else {
        console.log('ProjectManagement: Successfully loaded projects:', projectsResult.data?.length || 0);
      }
    } catch (error: any) {
      console.error('ProjectManagement: Failed to load project data:', error);
      
      // Handle specific error cases
      if (error.response?.status === 403) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view projects. Please contact your administrator.",
          variant: "default",
        });
      } else if (error.response?.status === 401) {
        toast({
          title: "Session Expired",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to load project data. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading('projects', false);
    }
  };

  const handleCreateProject = () => {
    setShowCreateDialog(true);
  };

  const handleProjectCreated = (project: Project) => {
    console.log('ProjectManagement: Project created successfully:', project);
    setShowCreateDialog(false);
    toast({
      title: "Success",
      description: `Project "${project.name}" created successfully`,
      variant: "default",
    });
    // Refresh data to show the new project
    loadProjectData();
  };

  const handleProjectClick = (project: Project) => {
    setSelectedProject(project);
  };

  const handleProjectUpdated = (project: Project) => {
    setSelectedProject(null);
    toast({
      title: "Success",
      description: "Project updated successfully",
    });
    loadProjectData(); // Refresh data
  };

  // Filter projects based on search and filters
  const filteredProjects = React.useMemo(() => {
    if (!user) return [];
    
    const projectList = user.role === 'ADMIN' || user.role === 'HR' ? projects : myProjects;
    
    if (!projectList || projectList.length === 0) return [];
    
    return projectList.filter(project => {
      if (!project) return false;
      
      const matchesSearch = !searchQuery || 
        project.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter;
      
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [projects, myProjects, searchQuery, statusFilter, priorityFilter, user]);

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
  };

  return (
    <DashboardLayout>
      <div className="flex-1 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Project Management</h1>
            <p className="text-muted-foreground">
              Manage projects, track progress, and allocate resources
            </p>
          </div>
          
          {(user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER') && (
            <Button onClick={handleCreateProject} className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
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
              <SelectItem value="PLANNING">Planning</SelectItem>
              <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
              <SelectItem value="ON_HOLD">On Hold</SelectItem>
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
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2">
              <Users className="h-4 w-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <Calendar className="h-4 w-4" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="resources" className="gap-2">
              <Clock className="h-4 w-4" />
              Resources
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {loading.projects ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">Loading project data...</p>
                </div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Projects Found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {user?.role === 'MANAGER' 
                      ? "You don't have any projects assigned yet. Create your first project to get started."
                      : "No projects are available for your role."
                    }
                  </p>
                  {(user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER') && (
                    <Button onClick={handleCreateProject} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create First Project
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <ProjectDashboard 
                data={dashboardData}
                projects={filteredProjects}
                loading={loading.projects}
                onProjectClick={handleProjectClick}
              />
            )}
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            {loading.projects ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex flex-col items-center gap-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">Loading projects...</p>
                </div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">No Projects Found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'
                      ? "No projects match your current filters. Try adjusting your search criteria."
                      : user?.role === 'MANAGER' 
                        ? "You don't have any projects assigned yet. Create your first project to get started."
                        : "No projects are available for your role."
                    }
                  </p>
                  {(user?.role === 'ADMIN' || user?.role === 'HR' || user?.role === 'MANAGER') && (
                    <Button onClick={handleCreateProject} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Create Project
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <ProjectList
                projects={filteredProjects}
                loading={loading.projects}
                onProjectClick={handleProjectClick}
                onProjectUpdate={loadProjectData}
              />
            )}
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <ProjectTimeline
              projects={filteredProjects}
              loading={loading.projects}
              onProjectClick={handleProjectClick}
            />
          </TabsContent>

          <TabsContent value="resources" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Resource Allocation Chart */}
              <Card>
                <CardHeader>
                  <CardTitle>Resource Allocation</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.resourceAllocation ? (
                    <CustomDonutChart
                      data={dashboardData.resourceAllocation}
                      dataKey="hours"
                      nameKey="team"
                      config={chartConfig}
                      centerLabel="Total Hours"
                      centerValue={dashboardData.resourceAllocation.reduce((sum: number, item: any) => sum + item.hours, 0)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">No resource data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team Workload */}
              <Card>
                <CardHeader>
                  <CardTitle>Team Workload</CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboardData?.teamWorkload ? (
                    <CustomBarChart
                      data={dashboardData.teamWorkload}
                      xAxisKey="team"
                      yAxisKey="workload"
                      config={chartConfig}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[300px]">
                      <p className="text-muted-foreground">No workload data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <CreateProjectDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onProjectCreated={handleProjectCreated}
        />

        <ProjectDetailsDialog
          project={selectedProject}
          open={!!selectedProject}
          onOpenChange={(open) => !open && setSelectedProject(null)}
          onProjectUpdated={handleProjectUpdated}
        />
      </div>
    </DashboardLayout>
  );
};