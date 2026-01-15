import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Building2, UserPlus, Settings, Shield, Database, TrendingUp, Activity } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatCard } from "@/components/StatCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate } from "react-router-dom";
import { getDashboardStats } from "@/services/dashboard.service";
import { getAllDepartments } from "@/services/department.service";
import { getAllUsers } from "@/services/user.service";
import { projectService } from "@/services/project.service";
import { taskService } from "@/services/task.service";
import { getAllInvitations } from "@/services/invitation.service";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { CustomDonutChart, MultiLineChart } from "@/components/ui/charts";

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalDepartments: number;
  pendingInvitations: number;
  userGrowth: number;
  departmentGrowth: number;
}

interface CompanyHealthData {
  totalEmployees: number;
  activeProjects: number;
  activeTasks: number;
}

interface GrowthActivityData {
  newUsersJoined: Array<{
    date: string;
    count: number;
    name: string;
    email: string;
    department: string;
    designation: string;
    joinedTimestamp: string;
    joiningStatus: 'PENDING' | 'ACCEPTED' | 'EXPIRED' | 'CANCELLED';
  }>;
  projectsManaged: Array<{
    date: string;
    count: number;
    managerName: string;
    projectsAssigned: number;
  }>;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [companyHealth, setCompanyHealth] = useState<CompanyHealthData | null>(null);
  const [growthActivity, setGrowthActivity] = useState<GrowthActivityData | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAllData();
  }, [timeRange]);

  const fetchAllData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch basic admin stats
      await fetchAdminStats();
      
      // Fetch Company Health Ring data
      await fetchCompanyHealthData();
      
      // Fetch Growth & Activity Trend data
      await fetchGrowthActivityData();
      
    } catch (error: any) {
      console.error('Failed to fetch admin dashboard data:', error);
      
      if (error.message.includes('Access denied') || error.message.includes('403')) {
        toast({
          variant: "destructive",
          title: "Access Denied",
          description: "You don't have permission to view admin dashboard data.",
        });
        navigate("/dashboard");
        return;
      }
      
      toast({
        variant: "destructive",
        title: "Failed to load dashboard",
        description: "Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const [statsResult, departmentsResult, invitationsResult] = await Promise.all([
        getDashboardStats(),
        getAllDepartments(),
        getAllInvitations()
      ]);
      
      const departments = departmentsResult.departments || [];
      const invitations = invitationsResult.invitations || [];
      const pendingInvitations = invitations.filter((inv: any) => inv.status === 'PENDING').length;
      
      setStats({
        totalUsers: statsResult.stats.totalUsers,
        activeUsers: statsResult.stats.adminCount + statsResult.stats.hrCount + statsResult.stats.employeeCount,
        totalDepartments: departments.length,
        pendingInvitations: pendingInvitations,
        userGrowth: statsResult.stats.growthPercentage,
        departmentGrowth: 0, // Will be implemented when departments are added
      });
    } catch (error) {
      console.error('Failed to fetch admin stats:', error);
      throw error;
    }
  };

  const fetchCompanyHealthData = async () => {
    try {
      // Fetch data from multiple endpoints for Company Health Ring
      const [usersResult, projectDashboard, tasksResult] = await Promise.all([
        getAllUsers(), // GET /api/users (using proper service)
        projectService.getProjectDashboard(), // GET /api/projects/dashboard
        taskService.getTasks() // GET /api/tasks
      ]);

      setCompanyHealth({
        totalEmployees: usersResult.total || usersResult.users?.length || 0,
        activeProjects: projectDashboard.data?.activeProjects || 0,
        activeTasks: tasksResult.data?.filter((task: any) => 
          task.status === 'TODO' || task.status === 'IN_PROGRESS' || task.status === 'IN_REVIEW'
        ).length || 0
      });
    } catch (error) {
      console.error('Failed to fetch company health data:', error);
      // Set fallback data
      setCompanyHealth({
        totalEmployees: 0,
        activeProjects: 0,
        activeTasks: 0
      });
    }
  };

  const fetchGrowthActivityData = async () => {
    try {
      // Calculate date range based on selected time range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timeRange) {
        case '7d':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(endDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(endDate.getDate() - 90);
          break;
      }

      // Fetch invitations data for new users joined
      const invitationsResult = await getAllInvitations();
      
      // Fetch managed projects data
      const managedProjectsResult = await api.get('/projects/managed');

      // Process invitations data for growth trend
      const invitations = invitationsResult.invitations || [];
      const filteredInvitations = invitations.filter((inv: any) => {
        const invDate = new Date(inv.createdAt);
        return invDate >= startDate && invDate <= endDate && inv.status === 'ACCEPTED';
      });

      // Group invitations by date
      const newUsersData = processInvitationsData(filteredInvitations);
      
      // Process managed projects data
      const projects = managedProjectsResult.data?.projects || managedProjectsResult.data || [];
      const filteredProjects = projects.filter((project: any) => {
        const projectDate = new Date(project.createdAt);
        return projectDate >= startDate && projectDate <= endDate;
      });
      const projectsData = processProjectsData(filteredProjects);

      setGrowthActivity({
        newUsersJoined: newUsersData,
        projectsManaged: projectsData
      });
    } catch (error) {
      console.error('Failed to fetch growth activity data:', error);
      // Set fallback data
      setGrowthActivity({
        newUsersJoined: [],
        projectsManaged: []
      });
    }
  };

  const processInvitationsData = (invitations: any[]) => {
    const groupedData: { [key: string]: any[] } = {};
    
    invitations.forEach((inv: any) => {
      if (!inv.createdAt) return; // Skip invalid entries
      
      const date = new Date(inv.createdAt).toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = [];
      }
      groupedData[date].push({
        name: inv.name || 'Unknown',
        email: inv.email || 'Unknown',
        department: inv.department?.name || 'Unassigned',
        designation: inv.role || 'EMPLOYEE',
        joinedTimestamp: inv.createdAt,
        joiningStatus: inv.status || 'PENDING'
      });
    });

    return Object.entries(groupedData).map(([date, users]) => ({
      date,
      count: users.length,
      name: users.map(u => u.name).join(', '),
      email: users.map(u => u.email).join(', '),
      department: users.map(u => u.department).join(', '),
      designation: users.map(u => u.designation).join(', '),
      joinedTimestamp: date,
      joiningStatus: users[0]?.joiningStatus || 'PENDING'
    }));
  };

  const processProjectsData = (projects: any[]) => {
    const groupedData: { [key: string]: any[] } = {};
    
    projects.forEach((project: any) => {
      if (!project.createdAt) return; // Skip invalid entries
      
      const date = new Date(project.createdAt).toISOString().split('T')[0];
      if (!groupedData[date]) {
        groupedData[date] = [];
      }
      groupedData[date].push(project);
    });

    return Object.entries(groupedData).map(([date, projectList]) => ({
      date,
      count: projectList.length,
      managerName: projectList[0]?.manager?.name || 'Unknown',
      projectsAssigned: projectList.length
    }));
  };

  // Handle chart section clicks for navigation
  const handleChartClick = (data: any) => {
    if (!data || !data.name) return;
    
    switch (data.name) {
      case 'Employees':
        navigate('/members');
        break;
      case 'Active Projects':
        navigate('/projects');
        break;
      case 'Active Tasks':
        navigate('/tasks');
        break;
      default:
        break;
    }
  };

  // Generate chart data for Growth & Activity Trend
  const getGrowthTrendData = () => {
    if (!growthActivity) return [];

    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const newUsers = growthActivity.newUsersJoined.find(d => d.date === dateStr)?.count || 0;
      const projects = growthActivity.projectsManaged.find(d => d.date === dateStr)?.count || 0;
      
      data.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        newUsers,
        projects
      });
    }
    
    return data;
  };

  if (isLoading) {
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="h-96 bg-muted rounded animate-pulse" />
            <div className="h-96 bg-muted rounded animate-pulse" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Company overview and member management for easy administration
          </p>
        </motion.div>

        {/* MODULE 1: Basic Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats?.totalUsers || 0}
            trend={stats?.userGrowth ? {
              value: stats.userGrowth,
              isPositive: stats.userGrowth >= 0
            } : undefined}
            icon={Users}
            delay={0}
          />
          <StatCard
            title="Active Users"
            value={stats?.activeUsers || 0}
            icon={Shield}
            delay={0.1}
          />
          <StatCard
            title="Departments"
            value={stats?.totalDepartments || 0}
            trend={stats?.departmentGrowth ? {
              value: stats.departmentGrowth,
              isPositive: stats.departmentGrowth >= 0
            } : undefined}
            icon={Building2}
            delay={0.2}
          />
          <StatCard
            title="Pending Invitations"
            value={stats?.pendingInvitations || 0}
            icon={UserPlus}
            delay={0.3}
          />
        </div>

        {/* MODULE 2: Company Control Overview - Company Health Ring & Growth Activity Trend */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Company Health Ring (Concentric Rings) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Activity className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Company Health Ring</CardTitle>
                    <CardDescription>Real-time overview of company metrics</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <CustomDonutChart
                  data={[
                    { 
                      name: 'Employees', 
                      value: companyHealth?.totalEmployees || 0,
                      color: '#4F46E5' // Indigo - Neutral, people-related
                    },
                    { 
                      name: 'Active Projects', 
                      value: companyHealth?.activeProjects || 0,
                      color: '#10B981' // Emerald - Progress/growth
                    },
                    { 
                      name: 'Active Tasks', 
                      value: companyHealth?.activeTasks || 0,
                      color: '#F59E0B' // Amber - Workload/caution
                    }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  centerLabel="Total Health"
                  centerValue={`${(companyHealth?.totalEmployees || 0) + (companyHealth?.activeProjects || 0) + (companyHealth?.activeTasks || 0)}`}
                  innerRadius={60}
                  outerRadius={120}
                  height={300}
                  onSectionClick={handleChartClick}
                  config={{
                    employees: { label: "Employees", color: "#4F46E5" },
                    projects: { label: "Active Projects", color: "#10B981" },
                    tasks: { label: "Active Tasks", color: "#F59E0B" }
                  }}
                />
                
                {/* Health Metrics Summary */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  <div 
                    className="text-center p-3 rounded-lg hover:bg-indigo-50 transition-colors cursor-pointer"
                    onClick={() => navigate('/members')}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-[#4F46E5]" />
                      <span className="text-sm font-medium">Employees</span>
                    </div>
                    <p className="text-2xl font-bold text-[#4F46E5]">{companyHealth?.totalEmployees || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to view all</p>
                  </div>
                  <div 
                    className="text-center p-3 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
                    onClick={() => navigate('/projects')}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-[#10B981]" />
                      <span className="text-sm font-medium">Projects</span>
                    </div>
                    <p className="text-2xl font-bold text-[#10B981]">{companyHealth?.activeProjects || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to manage</p>
                  </div>
                  <div 
                    className="text-center p-3 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
                    onClick={() => navigate('/tasks')}
                  >
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-[#F59E0B]" />
                      <span className="text-sm font-medium">Tasks</span>
                    </div>
                    <p className="text-2xl font-bold text-[#F59E0B]">{companyHealth?.activeTasks || 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">Click to view all</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Growth & Activity Trend */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
          >
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <CardTitle>Growth & Activity Trend</CardTitle>
                      <CardDescription>New users and project management activity</CardDescription>
                    </div>
                  </div>
                  <Select value={timeRange} onValueChange={(value: '7d' | '30d' | '90d') => setTimeRange(value)}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">7d</SelectItem>
                      <SelectItem value="30d">30d</SelectItem>
                      <SelectItem value="90d">90d</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <MultiLineChart
                  data={getGrowthTrendData()}
                  xAxisKey="date"
                  series={[
                    {
                      key: "newUsers",
                      name: "New Users",
                      color: "#3B82F6", // Blue
                      strokeWidth: 3
                    },
                    {
                      key: "projects",
                      name: "Projects Managed",
                      color: "#22C55E", // Green
                      strokeWidth: 3
                    }
                  ]}
                  height={300}
                  showGrid={true}
                  showLegend={true}
                  showDots={true}
                  config={{
                    newUsers: { label: "New Users", color: "#3B82F6" },
                    projects: { label: "Projects Managed", color: "#22C55E" }
                  }}
                />
                
                {/* Growth Summary */}
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-[#3B82F6]" />
                      <span className="text-sm font-medium">New Users</span>
                    </div>
                    <p className="text-xl font-bold text-[#3B82F6]">
                      {growthActivity?.newUsersJoined.reduce((sum, item) => sum + item.count, 0) || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Last {timeRange}</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
                      <span className="text-sm font-medium">Projects</span>
                    </div>
                    <p className="text-xl font-bold text-[#22C55E]">
                      {growthActivity?.projectsManaged.reduce((sum, item) => sum + item.count, 0) || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Last {timeRange}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* MODULE 3: Organization Structure - Admin Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage users, roles, and permissions across the organization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={() => navigate("/members")} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Users className="w-4 h-4 mr-2" />
                  View All Members
                </Button>
                <Button 
                  onClick={() => navigate("/invite")} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite New Members
                </Button>
                <Button 
                  onClick={() => navigate("/admin/departments")} 
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Organization Structure
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  System Administration
                </CardTitle>
                <CardDescription>
                  Configure system settings and manage company data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Building2 className="w-4 h-4 mr-2" />
                  Company Settings
                </Button>
                <Button 
                  className="w-full justify-start"
                  variant="outline"
                  disabled
                >
                  <Database className="w-4 h-4 mr-2" />
                  System Logs
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}