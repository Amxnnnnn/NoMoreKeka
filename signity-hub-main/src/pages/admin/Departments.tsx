import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Building2, 
  Users, 
  UserCheck, 
  ChevronRight, 
  ArrowLeft,
  Search,
  Filter,
  AlertTriangle,
  TrendingUp,
  Target,
  Clock
} from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getAllDepartments, Department } from "@/services/department.service";
import { getAllUsers } from "@/services/user.service";
import { teamService } from "@/services/team.service";
import { projectService } from "@/services/project.service";
import { taskService } from "@/services/task.service";
import { OrganizationTree, DepartmentDetailPanel } from "@/components/admin";

interface DepartmentStats {
  id: string;
  name: string;
  description?: string;
  totalEmployees: number;
  managersCount: number;
  isActive: boolean;
  hasAlert: boolean;
  alertMessage?: string;
}

interface OrganizationData {
  managers: any[];
  teams: any[];
  employees: any[];
  unassignedEmployees: any[];
  projects: any[];
  tasks: any[];
}

export default function Departments() {
  const { toast } = useToast();
  
  // Level 1: Department Overview State
  const [departments, setDepartments] = useState<DepartmentStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Level 2: Department Drill-down State
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentStats | null>(null);
  const [organizationData, setOrganizationData] = useState<OrganizationData | null>(null);
  const [isDrilldownLoading, setIsDrilldownLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [selectedNodeType, setSelectedNodeType] = useState<'manager' | 'team' | 'employee' | 'unassigned' | null>(null);

  // Fetch departments overview data
  useEffect(() => {
    fetchDepartmentsOverview();
  }, []);

  const fetchDepartmentsOverview = async () => {
    try {
      setIsLoading(true);
      
      // Fetch departments
      const departmentsResult = await getAllDepartments();
      const departmentsList = departmentsResult.departments || [];
      
      // Fetch all users to calculate stats
      const usersResult = await getAllUsers();
      const allUsers = usersResult.users || [];
      
      // Calculate stats for each department
      const departmentStats: DepartmentStats[] = await Promise.all(
        departmentsList.map(async (dept: Department) => {
          const deptEmployees = allUsers.filter(user => 
            user.departmentId === dept.id && user.role === 'EMPLOYEE'
          );
          const deptManagers = allUsers.filter(user => 
            user.departmentId === dept.id && user.role === 'MANAGER'
          );
          
          // Check for alerts (no managers or too many employees per manager)
          const hasAlert = deptManagers.length === 0 || (deptEmployees.length / Math.max(deptManagers.length, 1)) > 10;
          const alertMessage = deptManagers.length === 0 
            ? "No managers assigned" 
            : (deptEmployees.length / deptManagers.length) > 10 
              ? "High employee-to-manager ratio" 
              : undefined;
          
          return {
            id: dept.id,
            name: dept.name,
            description: dept.description,
            totalEmployees: deptEmployees.length,
            managersCount: deptManagers.length,
            isActive: dept.isActive,
            hasAlert,
            alertMessage
          };
        })
      );
      
      setDepartments(departmentStats);
    } catch (error: any) {
      console.error('Failed to fetch departments overview:', error);
      toast({
        variant: "destructive",
        title: "Failed to load departments",
        description: error.message || "Please try refreshing the page.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartmentDrilldown = async (departmentId: string) => {
    try {
      setIsDrilldownLoading(true);
      
      // Fetch all organizational data for the department
      const [usersResult, teamsResult, projectsResult, tasksResult] = await Promise.all([
        getAllUsers(),
        teamService.getManagedTeams(),
        projectService.getProjects(),
        taskService.getTasks()
      ]);
      
      const allUsers = usersResult.users || [];
      const allTeams = teamsResult.data || [];
      const allProjects = projectsResult.data || [];
      const allTasks = tasksResult.data || [];
      
      // Filter data for the selected department
      const departmentUsers = allUsers.filter(user => user.departmentId === departmentId);
      const managers = departmentUsers.filter(user => user.role === 'MANAGER');
      const employees = departmentUsers.filter(user => user.role === 'EMPLOYEE');
      
      // Get teams managed by department managers
      const departmentTeams = allTeams.filter(team => 
        managers.some(manager => manager.id === team.managerId)
      );
      
      // Get projects for department teams
      const departmentProjects = allProjects.filter(project =>
        departmentTeams.some(team => team.id === project.teamId)
      );
      
      // Get tasks for department projects
      const departmentTasks = allTasks.filter(task =>
        departmentProjects.some(project => project.id === task.projectId)
      );
      
      // Find unassigned employees (not in any team)
      const unassignedEmployees = employees.filter(emp => !emp.teamId);
      
      // Enhance managers with additional data
      const enhancedManagers = await Promise.all(
        managers.map(async (manager) => {
          const managedTeams = departmentTeams.filter(team => team.managerId === manager.id);
          const managerProjects = departmentProjects.filter(project =>
            managedTeams.some(team => team.id === project.teamId)
          );
          
          // Calculate average performance across managed teams
          let totalPerformance = 0;
          let performanceCount = 0;
          
          for (const team of managedTeams) {
            try {
              const performanceResult = await teamService.getTeamPerformance(team.id);
              if (performanceResult.success && performanceResult.data?.performance?.teamPerformance) {
                totalPerformance += performanceResult.data.performance.teamPerformance;
                performanceCount++;
              }
            } catch (error) {
              console.warn(`Failed to get performance for team ${team.id}:`, error);
            }
          }
          
          const performanceAvg = performanceCount > 0 ? totalPerformance / performanceCount : 0;
          
          return {
            ...manager,
            managedTeams,
            activeProjects: managerProjects,
            performanceAvg: Math.round(performanceAvg * 100) / 100
          };
        })
      );
      
      // Enhance teams with additional data
      const enhancedTeams = await Promise.all(
        departmentTeams.map(async (team) => {
          const teamEmployees = employees.filter(emp => emp.teamId === team.id);
          const teamProjects = departmentProjects.filter(project => project.teamId === team.id);
          const activeProjects = teamProjects.filter(project => project.status !== 'COMPLETED');
          
          // Get team performance
          let teamPerformance = 0;
          try {
            const performanceResult = await teamService.getTeamPerformance(team.id);
            if (performanceResult.success && performanceResult.data?.performance?.teamPerformance) {
              teamPerformance = performanceResult.data.performance.teamPerformance;
            }
          } catch (error) {
            console.warn(`Failed to get performance for team ${team.id}:`, error);
          }
          
          return {
            ...team,
            memberCount: teamEmployees.length,
            activeProjects,
            teamPerformance: Math.round(teamPerformance * 100) / 100
          };
        })
      );
      
      // Enhance employees with task and utilization data
      const enhancedEmployees = employees.map(employee => {
        const employeeTasks = departmentTasks.filter(task => task.assigneeId === employee.id);
        const activeTasks = employeeTasks.filter(task => task.status !== 'COMPLETED');
        const overdueTasks = employeeTasks.filter(task => 
          task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'COMPLETED'
        );
        
        // Simple utilization calculation based on active tasks
        const utilization = Math.min(100, activeTasks.length * 20); // Rough estimate
        
        return {
          ...employee,
          activeTasks,
          overdueTasks,
          utilization
        };
      });
      
      // Enhance unassigned employees
      const enhancedUnassignedEmployees = unassignedEmployees.map(employee => {
        const employeeTasks = departmentTasks.filter(task => task.assigneeId === employee.id);
        const activeTasks = employeeTasks.filter(task => task.status !== 'COMPLETED');
        const utilization = Math.min(100, activeTasks.length * 20);
        
        return {
          ...employee,
          activeTasks,
          utilization
        };
      });
      
      setOrganizationData({
        managers: enhancedManagers,
        teams: enhancedTeams,
        employees: enhancedEmployees,
        unassignedEmployees: enhancedUnassignedEmployees,
        projects: departmentProjects,
        tasks: departmentTasks
      });
      
    } catch (error: any) {
      console.error('Failed to fetch department drill-down data:', error);
      toast({
        variant: "destructive",
        title: "Failed to load department details",
        description: error.message || "Please try again.",
      });
    } finally {
      setIsDrilldownLoading(false);
    }
  };

  const handleInspectStructure = async (department: DepartmentStats) => {
    setSelectedDepartment(department);
    await fetchDepartmentDrilldown(department.id);
  };

  const handleBackToOverview = () => {
    setSelectedDepartment(null);
    setOrganizationData(null);
    setSelectedNode(null);
    setSelectedNodeType(null);
  };

  const handleNodeSelect = (node: any, nodeType: 'manager' | 'team' | 'employee' | 'unassigned') => {
    setSelectedNode(node);
    setSelectedNodeType(nodeType);
  };

  // Filter departments based on search
  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    dept.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-muted rounded w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-muted rounded w-96 animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-muted rounded animate-pulse" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {!selectedDepartment ? (
            // Level 1: Department Overview
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  Organization Structure
                </h1>
                <p className="text-muted-foreground">
                  Complete organizational visibility and hierarchy control at department level
                </p>
              </div>

              {/* Search and Filters */}
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search departments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  Filter
                </Button>
              </div>

              {/* Department Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDepartments.map((department, index) => (
                  <motion.div
                    key={department.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">{department.name}</CardTitle>
                              {department.description && (
                                <CardDescription className="text-sm mt-1">
                                  {department.description}
                                </CardDescription>
                              )}
                            </div>
                          </div>
                          {department.hasAlert && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="w-4 h-4 text-amber-500" />
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Employee vs Manager Bar */}
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Workforce Distribution</span>
                            <span className="font-medium">
                              {department.totalEmployees + department.managersCount} total
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full"
                                 style={{ 
                                   width: `${Math.min(100, (department.totalEmployees + department.managersCount) * 2)}%` 
                                 }} 
                            />
                          </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <Users className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-600">Employees</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-600">{department.totalEmployees}</p>
                          </div>
                          <div className="text-center p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <UserCheck className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-600">Managers</span>
                            </div>
                            <p className="text-2xl font-bold text-green-600">{department.managersCount}</p>
                          </div>
                        </div>

                        {/* Alert Message */}
                        {department.hasAlert && department.alertMessage && (
                          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
                            <p className="text-xs text-amber-700 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              {department.alertMessage}
                            </p>
                          </div>
                        )}

                        {/* CTA Button */}
                        <Button 
                          onClick={() => handleInspectStructure(department)}
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                          variant="outline"
                        >
                          Inspect Structure
                          <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>

              {filteredDepartments.length === 0 && (
                <div className="text-center py-12">
                  <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No departments found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? "Try adjusting your search criteria" : "No departments have been created yet"}
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            // Level 2: Department Drill-down
            <motion.div
              key="drilldown"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleBackToOverview}
                    className="hover:bg-muted"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Overview
                  </Button>
                  <Separator orientation="vertical" className="h-6" />
                  <div className="flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary" />
                    <h1 className="text-2xl font-bold text-foreground">{selectedDepartment.name}</h1>
                    {selectedDepartment.hasAlert && (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Alert
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-muted-foreground">
                  Organizational structure and workload insight with progressive drill-down
                </p>
              </div>

              {/* Split View Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                {/* Left Panel: Organization Tree */}
                <div className="lg:col-span-1">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">Organization Tree</CardTitle>
                      <CardDescription>
                        Interactive hierarchy view
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-full overflow-y-auto">
                      {isDrilldownLoading ? (
                        <div className="flex items-center justify-center h-64">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : organizationData ? (
                        <OrganizationTree
                          data={organizationData}
                          onNodeSelect={handleNodeSelect}
                          selectedNode={selectedNode}
                        />
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                {/* Right Panel: Contextual Detail Canvas */}
                <div className="lg:col-span-2">
                  <Card className="h-full">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {selectedNode ? `${selectedNodeType?.charAt(0).toUpperCase()}${selectedNodeType?.slice(1)} Details` : 'Department Overview'}
                      </CardTitle>
                      <CardDescription>
                        {selectedNode ? 'Detailed information and analytics' : 'Select a node from the tree to view details'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="h-full overflow-y-auto">
                      <DepartmentDetailPanel
                        selectedNode={selectedNode}
                        selectedNodeType={selectedNodeType}
                        organizationData={organizationData}
                        department={selectedDepartment}
                      />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}