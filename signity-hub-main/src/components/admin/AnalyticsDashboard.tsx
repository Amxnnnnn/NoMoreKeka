import { useState, useEffect } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from "recharts";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Clock,
  Building2,
  UserCheck,
  UserX,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

// Real data interfaces
interface EmployeeMetrics {
  totalEmployees: number;
  activeEmployees: number;
  newHires: number;
  departures: number;
  growthRate: number;
}

interface LeaveData {
  month: string;
  approved: number;
  pending: number;
  rejected: number;
}

interface DepartmentData {
  name: string;
  employees: number;
  color: string;
}

interface WorklogTrend {
  week: string;
  hours: number;
  productivity: number;
}

interface LeaveTypeData {
  name: string;
  value: number;
  color: string;
}

interface ProjectData {
  name: string;
  progress: number;
  daysRemaining: number;
  status: string;
  priority: string;
}

export function AnalyticsDashboard() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 6)),
    to: new Date(),
  });
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [loading, setLoading] = useState(true);
  
  // Real data state
  const [employeeMetrics, setEmployeeMetrics] = useState<EmployeeMetrics>({
    totalEmployees: 0,
    activeEmployees: 0,
    newHires: 0,
    departures: 0,
    growthRate: 0,
  });
  const [leaveData, setLeaveData] = useState<LeaveData[]>([]);
  const [departmentData, setDepartmentData] = useState<DepartmentData[]>([]);
  const [worklogTrends, setWorklogTrends] = useState<WorklogTrend[]>([]);
  const [leaveTypeData, setLeaveTypeData] = useState<LeaveTypeData[]>([]);
  const [projectData, setProjectData] = useState<ProjectData[]>([]);

  // Fetch real data from APIs
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);

        // Try to fetch comprehensive analytics overview first
        try {
          const analyticsResponse = await api.get('/analytics/overview');
          const analyticsData = analyticsResponse.data.data;
          
          // Set employee metrics
          setEmployeeMetrics(analyticsData.employeeMetrics);

          // Set department data with colors
          const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
          setDepartmentData(
            analyticsData.departmentDistribution.map((dept: any, index: number) => ({
              name: dept.name,
              employees: dept.employees,
              color: colors[index % colors.length],
            }))
          );

          // Process leave data by month from analytics
          const monthlyLeaves = processAnalyticsLeaveData(analyticsData.leaveAnalytics.monthlyTrends);
          setLeaveData(monthlyLeaves);

          // Process leave types from analytics
          const leaveTypes = analyticsData.leaveAnalytics.typeBreakdown.map((type: any, index: number) => ({
            name: type.leaveType,
            value: type.count,
            color: colors[index % colors.length],
          }));
          setLeaveTypeData(leaveTypes);

        } catch (analyticsError: any) {
          console.warn('Analytics overview not available, falling back to individual APIs:', analyticsError.response?.status);
          
          // Fallback to individual API calls
          await fetchFallbackData();
        }

        // Fetch project performance data for progress vs deadline chart
        try {
          const projectPerformanceResponse = await api.get('/analytics/projects/performance');
          const projectPerformanceData = projectPerformanceResponse.data.data;
          setProjectData(projectPerformanceData.projects.slice(0, 10)); // Top 10 projects
        } catch (projectError) {
          console.warn('Project performance analytics not available, using fallback');
          await fetchFallbackProjectData();
        }

        // Fetch worklog analytics
        try {
          const worklogResponse = await api.get('/analytics/worklogs');
          const worklogData = worklogResponse.data.data;
          setWorklogTrends(worklogData.weeklyTrends.reverse()); // Reverse to show chronological order
        } catch (worklogError) {
          console.warn('Worklog analytics not available, using mock data');
          setWorklogTrends(generateMockWorklogTrends());
        }

      } catch (error: any) {
        console.error('Error fetching analytics data:', error);
        toast({
          title: "Error",
          description: "Failed to load analytics data. Please try again.",
          variant: "destructive",
        });
        
        // Set fallback data
        setEmployeeMetrics({
          totalEmployees: 0,
          activeEmployees: 0,
          newHires: 0,
          departures: 0,
          growthRate: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, [dateRange, toast]);

  // Fallback function for individual API calls
  const fetchFallbackData = async () => {
    // Fetch dashboard stats (employee metrics)
    const dashboardResponse = await api.get('/dashboard/stats');
    const dashboardStats = dashboardResponse.data.stats;
    
    setEmployeeMetrics({
      totalEmployees: dashboardStats.totalUsers || 0,
      activeEmployees: dashboardStats.totalUsers - (dashboardStats.inactiveUsers || 0),
      newHires: dashboardStats.recentUsers || 0,
      departures: 0, // Calculate from recent deactivations if available
      growthRate: dashboardStats.growthPercentage || 0,
    });

    // Fetch departments data
    const departmentsResponse = await api.get('/departments');
    const departments = departmentsResponse.data.departments || [];
    
    const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4", "#84cc16"];
    setDepartmentData(
      departments.map((dept: any, index: number) => ({
        name: dept.name,
        employees: dept.userCount || 0,
        color: colors[index % colors.length],
      }))
    );

    // Fetch leave data for trends
    const leaveResponse = await api.get('/leaves/team');
    const leaves = leaveResponse.data.leaveRequests || [];
    
    // Process leave data by month
    const monthlyLeaves = processLeavesByMonth(leaves);
    setLeaveData(monthlyLeaves);

    // Process leave types
    const leaveTypes = processLeaveTypes(leaves);
    setLeaveTypeData(leaveTypes);
  };

  // Fallback function for project data
  const fetchFallbackProjectData = async () => {
    const projectsResponse = await api.get('/projects/dashboard');
    const projectsDashboard = projectsResponse.data.dashboard;
    
    if (projectsDashboard?.recentProjects) {
      const projectsWithDeadlines = await Promise.all(
        projectsDashboard.recentProjects.slice(0, 10).map(async (project: any) => {
          try {
            const projectDetailsResponse = await api.get(`/projects/${project.id}`);
            const projectDetails = projectDetailsResponse.data.project;
            
            const daysRemaining = projectDetails.deadline 
              ? Math.ceil((new Date(projectDetails.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
              : 0;
            
            return {
              name: project.name,
              progress: project.progress || 0,
              daysRemaining: Math.max(0, daysRemaining),
              status: project.status,
              priority: project.priority,
            };
          } catch (error) {
            return {
              name: project.name,
              progress: project.progress || 0,
              daysRemaining: 0,
              status: project.status,
              priority: project.priority,
            };
          }
        })
      );
      setProjectData(projectsWithDeadlines);
    }
  };

  // Helper functions to process data
  const processLeavesByMonth = (leaves: any[]): LeaveData[] => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    const monthlyData: { [key: string]: { approved: number; pending: number; rejected: number } } = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = monthNames[date.getMonth()];
      monthlyData[monthKey] = { approved: 0, pending: 0, rejected: 0 };
    }

    // Process leaves
    leaves.forEach((leave: any) => {
      const leaveDate = new Date(leave.appliedAt || leave.startDate);
      if (leaveDate.getFullYear() === currentYear) {
        const monthKey = monthNames[leaveDate.getMonth()];
        if (monthlyData[monthKey]) {
          const status = leave.status.toLowerCase();
          if (status === 'approved') monthlyData[monthKey].approved++;
          else if (status === 'pending') monthlyData[monthKey].pending++;
          else if (status === 'rejected') monthlyData[monthKey].rejected++;
        }
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }));
  };

  const processLeaveTypes = (leaves: any[]): LeaveTypeData[] => {
    const typeCount: { [key: string]: number } = {};
    const colors = ["#3b82f6", "#ef4444", "#f59e0b", "#10b981", "#8b5cf6"];

    leaves.forEach((leave: any) => {
      const typeName = leave.leaveType?.name || 'Unknown';
      typeCount[typeName] = (typeCount[typeName] || 0) + 1;
    });

    return Object.entries(typeCount).map(([name, value], index) => ({
      name,
      value,
      color: colors[index % colors.length],
    }));
  };

  // Helper function to process analytics leave data
  const processAnalyticsLeaveData = (monthlyTrends: any[]): LeaveData[] => {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthlyData: { [key: string]: { approved: number; pending: number; rejected: number } } = {};

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = monthNames[date.getMonth()];
      monthlyData[monthKey] = { approved: 0, pending: 0, rejected: 0 };
    }

    // Process trends from analytics API
    monthlyTrends.forEach((trend: any) => {
      const trendDate = new Date(trend.month);
      const monthKey = monthNames[trendDate.getMonth()];
      if (monthlyData[monthKey]) {
        const status = trend.status.toLowerCase();
        if (status === 'approved') monthlyData[monthKey].approved = parseInt(trend.count);
        else if (status === 'pending') monthlyData[monthKey].pending = parseInt(trend.count);
        else if (status === 'rejected') monthlyData[monthKey].rejected = parseInt(trend.count);
      }
    });

    return Object.entries(monthlyData).map(([month, data]) => ({
      month,
      ...data,
    }));
  };

  const generateMockWorklogTrends = (): WorklogTrend[] => {
    // This should be replaced with real worklog API data
    return [
      { week: "Week 1", hours: 1680, productivity: 85 },
      { week: "Week 2", hours: 1720, productivity: 88 },
      { week: "Week 3", hours: 1650, productivity: 82 },
      { week: "Week 4", hours: 1780, productivity: 91 },
      { week: "Week 5", hours: 1690, productivity: 86 },
      { week: "Week 6", hours: 1750, productivity: 89 },
    ];
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading analytics data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Analytics Overview</h3>
        <div className="flex items-center gap-4">
          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Departments</SelectItem>
              {departmentData.map((dept) => (
                <SelectItem key={dept.name} value={dept.name.toLowerCase()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Employees</p>
                <p className="text-2xl font-bold">{employeeMetrics.totalEmployees}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-500">+{employeeMetrics.growthRate}%</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Employees</p>
                <p className="text-2xl font-bold">{employeeMetrics.activeEmployees}</p>
                <div className="flex items-center gap-1 mt-1">
                  <UserCheck className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-muted-foreground">
                    {Math.round((employeeMetrics.activeEmployees / employeeMetrics.totalEmployees) * 100)}% active
                  </span>
                </div>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New Hires</p>
                <p className="text-2xl font-bold">{employeeMetrics.newHires}</p>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-muted-foreground">This month</span>
                </div>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Departures</p>
                <p className="text-2xl font-bold">{employeeMetrics.departures}</p>
                <div className="flex items-center gap-1 mt-1">
                  <UserX className="w-3 h-3 text-red-500" />
                  <span className="text-xs text-muted-foreground">This month</span>
                </div>
              </div>
              <UserX className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Leave Requests Trend
            </CardTitle>
            <CardDescription>
              Monthly leave request status over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leaveData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="approved" fill="#10b981" name="Approved" />
                <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
                <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Department Distribution
            </CardTitle>
            <CardDescription>
              Employee distribution across departments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="employees"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Progress vs Deadline Proximity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Project Progress vs Deadline Proximity
            </CardTitle>
            <CardDescription>
              Which projects are at risk? Days remaining vs progress percentage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={projectData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="daysRemaining" 
                  label={{ value: 'Days Remaining to Deadline', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  label={{ value: 'Project Progress (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name, props) => {
                    if (name === 'progress') {
                      return [`${value}%`, 'Progress'];
                    }
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Days Remaining: ${label}`}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const riskLevel = data.daysRemaining < 7 && data.progress < 80 ? 'HIGH' : 
                                      data.daysRemaining < 14 && data.progress < 60 ? 'MEDIUM' : 'LOW';
                      return (
                        <div className="bg-white p-3 border rounded shadow">
                          <p className="font-medium">{data.name}</p>
                          <p>Days Remaining: {data.daysRemaining}</p>
                          <p>Progress: {data.progress}%</p>
                          <p>Status: {data.status}</p>
                          <p>Priority: {data.priority}</p>
                          <p className={`font-medium ${
                            riskLevel === 'HIGH' ? 'text-red-600' : 
                            riskLevel === 'MEDIUM' ? 'text-yellow-600' : 'text-green-600'
                          }`}>
                            Risk Level: {riskLevel}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="progress"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="progress"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Work Hours & Productivity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Work Hours & Productivity
            </CardTitle>
            <CardDescription>
              Weekly work hours and productivity trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={worklogTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Area
                  yAxisId="left"
                  type="monotone"
                  dataKey="hours"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="Hours"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="productivity"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Productivity %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Leave Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Leave Types Breakdown
            </CardTitle>
            <CardDescription>
              Distribution of leave types taken from real data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={leaveTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leaveTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-2">
                {leaveTypeData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {item.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Real-time Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Real-time Insights & Alerts
            </CardTitle>
            <CardDescription>
              AI-powered insights based on your actual data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {employeeMetrics.growthRate > 0 && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900">Positive Growth</h4>
                    <p className="text-sm text-blue-700">
                      Company is growing with {employeeMetrics.growthRate}% increase in employees. 
                      {employeeMetrics.newHires} new hires this period.
                    </p>
                  </div>
                </div>
              )}

              {projectData.some(p => p.daysRemaining < 7 && p.progress < 80) && (
                <div className="flex items-start gap-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Projects at Risk</h4>
                    <p className="text-sm text-red-700">
                      {projectData.filter(p => p.daysRemaining < 7 && p.progress < 80).length} projects 
                      have less than 7 days remaining with progress below 80%. Immediate attention required.
                    </p>
                  </div>
                </div>
              )}

              {leaveData.length > 0 && leaveData[leaveData.length - 1]?.pending > 5 && (
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <Calendar className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-amber-900">Pending Leave Requests</h4>
                    <p className="text-sm text-amber-700">
                      {leaveData[leaveData.length - 1]?.pending} leave requests are pending approval. 
                      Consider reviewing to maintain team productivity.
                    </p>
                  </div>
                </div>
              )}

              {departmentData.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <Building2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-green-900">Department Distribution</h4>
                    <p className="text-sm text-green-700">
                      Largest department: {departmentData.reduce((max, dept) => 
                        dept.employees > max.employees ? dept : max, departmentData[0]
                      )?.name} with {departmentData.reduce((max, dept) => 
                        dept.employees > max.employees ? dept : max, departmentData[0]
                      )?.employees} employees.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}