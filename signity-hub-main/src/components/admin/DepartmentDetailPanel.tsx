import { motion } from "framer-motion";
import { 
  User, 
  Users, 
  UserCheck, 
  Building2,
  Target,
  Clock,
  AlertTriangle,
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Activity,
  BarChart3,
  PieChart,
  UserX
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface DepartmentDetailPanelProps {
  selectedNode: any;
  selectedNodeType: 'manager' | 'team' | 'employee' | 'unassigned' | null;
  organizationData: any;
  department: any;
}

const ManagerDetailPanel = ({ node }: { node: any }) => {
  const managedTeams = node.managedTeams || [];
  const activeProjects = node.activeProjects || [];
  const performanceAvg = node.performanceAvg || 0;

  return (
    <div className="space-y-6">
      {/* Manager Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-blue-100 rounded-lg">
          <UserCheck className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{node.name}</h3>
          <p className="text-muted-foreground">{node.role} • {node.email}</p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary">
              {managedTeams.length} Teams
            </Badge>
            <Badge variant="secondary">
              {activeProjects.length} Projects
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{performanceAvg}%</div>
          <p className="text-sm text-muted-foreground">Avg Performance</p>
        </div>
      </div>

      <Separator />

      {/* Performance Comparison Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Performance Overview</CardTitle>
          <CardDescription>Performance metrics across managed teams</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {managedTeams.map((team: any, index: number) => (
              <div key={team.id} className="flex items-center gap-4">
                <div className="w-24 text-sm font-medium truncate">{team.name}</div>
                <div className="flex-1">
                  <Progress 
                    value={team.performance || 0} 
                    className="h-2"
                  />
                </div>
                <div className="w-12 text-sm text-right">{team.performance || 0}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Risk Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Risk Indicators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span className="text-sm">Overdue Tasks: {node.overdueTasks || 0}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm">Pending Reviews: {node.pendingReviews || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const TeamDetailPanel = ({ node }: { node: any }) => {
  const memberCount = node.memberCount || 0;
  const activeProjects = node.activeProjects || [];
  const teamPerformance = node.teamPerformance || 0;

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-green-100 rounded-lg">
          <Users className="w-6 h-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{node.name}</h3>
          <p className="text-muted-foreground">{node.description || 'No description'}</p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary">
              {memberCount} Members
            </Badge>
            <Badge variant="secondary">
              {activeProjects.length} Active Projects
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{teamPerformance}%</div>
          <p className="text-sm text-muted-foreground">Team Performance</p>
        </div>
      </div>

      <Separator />

      {/* Performance Gauge */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Performance</span>
                <span>{teamPerformance}%</span>
              </div>
              <Progress value={teamPerformance} className="h-3" />
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-600">{node.completedTasks || 0}</div>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{node.inProgressTasks || 0}</div>
                <p className="text-xs text-muted-foreground">In Progress</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{node.overdueTasks || 0}</div>
                <p className="text-xs text-muted-foreground">Overdue</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Project List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Active Projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeProjects.length > 0 ? (
              activeProjects.map((project: any) => (
                <div key={project.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </div>
                  <Badge variant={project.status === 'COMPLETED' ? 'default' : 'secondary'}>
                    {project.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No active projects</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const EmployeeDetailPanel = ({ node }: { node: any }) => {
  const activeTasks = node.activeTasks || [];
  const overdueTasks = node.overdueTasks || [];
  const utilization = node.utilization || 0;

  return (
    <div className="space-y-6">
      {/* Employee Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-gray-100 rounded-lg">
          <User className="w-6 h-6 text-gray-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{node.name}</h3>
          <p className="text-muted-foreground">{node.role} • {node.email}</p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary">
              {activeTasks.length} Active Tasks
            </Badge>
            {overdueTasks.length > 0 && (
              <Badge variant="destructive">
                {overdueTasks.length} Overdue
              </Badge>
            )}
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-600">{utilization}%</div>
          <p className="text-sm text-muted-foreground">Utilization</p>
        </div>
      </div>

      <Separator />

      {/* Utilization Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Workload Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Current Utilization</span>
                <span>{utilization}%</span>
              </div>
              <Progress 
                value={utilization} 
                className="h-3"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-xl font-bold text-blue-600">{activeTasks.length}</div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <div className="text-xl font-bold text-amber-600">{overdueTasks.length}</div>
                <p className="text-sm text-muted-foreground">Overdue Tasks</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Tasks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeTasks.length > 0 ? (
              activeTasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      task.priority === 'HIGH' ? 'bg-red-500' : 
                      task.priority === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-sm text-muted-foreground">Due: {task.dueDate}</p>
                    </div>
                  </div>
                  <Badge variant={task.status === 'COMPLETED' ? 'default' : 'secondary'}>
                    {task.status}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No active tasks</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const UnassignedPoolPanel = ({ node }: { node: any }) => {
  const employees = node.employees || [];

  return (
    <div className="space-y-6">
      {/* Unassigned Pool Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-amber-100 rounded-lg">
          <UserX className="w-6 h-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">Unassigned Pool</h3>
          <p className="text-muted-foreground">Employees not assigned to any team</p>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="secondary">
              {employees.length} Employees
            </Badge>
          </div>
        </div>
      </div>

      <Separator />

      {/* Unassigned Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Pool Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-amber-50 rounded-lg">
              <div className="text-xl font-bold text-amber-600">{employees.length}</div>
              <p className="text-sm text-muted-foreground">Unassigned</p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-xl font-bold text-blue-600">
                {employees.filter((emp: any) => emp.utilization < 50).length}
              </div>
              <p className="text-sm text-muted-foreground">Underutilized</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Unassigned Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employees.length > 0 ? (
              employees.map((employee: any) => (
                <div key={employee.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <User className="w-4 h-4 text-gray-600" />
                    <div>
                      <p className="font-medium">{employee.name}</p>
                      <p className="text-sm text-muted-foreground">{employee.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={employee.utilization < 50 ? 'secondary' : 'default'}>
                      {employee.utilization || 0}% utilized
                    </Badge>
                    <Button size="sm" variant="outline">
                      Assign
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground text-center py-4">No unassigned employees</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const DepartmentOverviewPanel = ({ department, organizationData }: { department: any, organizationData: any }) => {
  const { managers, teams, employees, unassignedEmployees } = organizationData || {};
  
  return (
    <div className="space-y-6">
      {/* Department Header */}
      <div className="flex items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold">{department.name}</h3>
          <p className="text-muted-foreground">{department.description || 'No description'}</p>
        </div>
      </div>

      <Separator />

      {/* Department Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <UserCheck className="w-6 h-6 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">{managers?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Managers</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">{teams?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Teams</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <User className="w-6 h-6 text-gray-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-600">{employees?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Employees</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <UserX className="w-6 h-6 text-amber-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-amber-600">{unassignedEmployees?.length || 0}</div>
            <p className="text-sm text-muted-foreground">Unassigned</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" className="justify-start">
              <Users className="w-4 h-4 mr-2" />
              Manage Teams
            </Button>
            <Button variant="outline" className="justify-start">
              <UserCheck className="w-4 h-4 mr-2" />
              Assign Managers
            </Button>
            <Button variant="outline" className="justify-start">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
            <Button variant="outline" className="justify-start">
              <Target className="w-4 h-4 mr-2" />
              Set Goals
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const DepartmentDetailPanel: React.FC<DepartmentDetailPanelProps> = ({
  selectedNode,
  selectedNodeType,
  organizationData,
  department
}) => {
  if (!selectedNode && !selectedNodeType) {
    return (
      <DepartmentOverviewPanel 
        department={department} 
        organizationData={organizationData} 
      />
    );
  }

  return (
    <motion.div
      key={`${selectedNodeType}-${selectedNode?.id}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {selectedNodeType === 'manager' && <ManagerDetailPanel node={selectedNode} />}
      {selectedNodeType === 'team' && <TeamDetailPanel node={selectedNode} />}
      {selectedNodeType === 'employee' && <EmployeeDetailPanel node={selectedNode} />}
      {selectedNodeType === 'unassigned' && <UnassignedPoolPanel node={selectedNode} />}
    </motion.div>
  );
};